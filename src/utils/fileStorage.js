import { storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL, getBlob, deleteObject, listAll, getMetadata } from 'firebase/storage';

export const FILE_MAX_BYTES = 50 * 1024 * 1024; // 50 MB
export const FILE_MAX_LABEL = '50 MB';

export function detectType(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  return { pdf: 'PDF', doc: 'DOC', docx: 'DOCX' }[ext] || ext.toUpperCase();
}

export function mimeForType(type) {
  return (
    {
      PDF:  'application/pdf',
      DOC:  'application/msword',
      DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }[type] || 'application/octet-stream'
  );
}

export function fmtSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function todayLabel() {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Upload a File → Firebase Storage → return metadata object.
// Note: the unauthenticated download URL is NOT persisted — callers must
// fetch it on demand via getFileUrl(blobId) so that revoking access (or
// deleting the file) actually denies further reads. Persisting a download
// URL inside Firestore would leak a permanent public token.
export async function uploadFileToDB(file) {
  const type    = detectType(file);
  const blobId  = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const fileRef = ref(storage, `uploads/${blobId}`);

  await new Promise((resolve, reject) => {
    const task  = uploadBytesResumable(fileRef, file, { contentType: mimeForType(type) });
    const timer = setTimeout(() => { task.cancel(); reject(new Error('Upload timed out — check your connection and try again.')); }, 30000);
    task.on('state_changed', null,
      err  => { clearTimeout(timer); console.error('[Storage upload error]', err?.code, err); reject(err); },
      ()   => { clearTimeout(timer); resolve(); }
    );
  });

  return { blobId, name: file.name, type, size: file.size, uploadedAt: todayLabel() };
}

// Resolve an authenticated download URL on demand. Callers should treat
// the returned URL as ephemeral and never persist it.
export async function getFileUrl(blobId) {
  if (!blobId) throw new Error('Missing blobId.');
  return await getDownloadURL(ref(storage, `uploads/${blobId}`));
}

// Download an attached file's bytes through the Firebase SDK (no CORS hit).
// `attachedFile` is the metadata object stored on the plan/idea
// ({ blobId, url, name, type, size, uploadedAt }). Returns a Blob.
export async function fetchFileBlob(attachedFile) {
  if (!attachedFile?.blobId) throw new Error('Missing file reference.');
  const fileRef = ref(storage, `uploads/${attachedFile.blobId}`);
  return await getBlob(fileRef);
}

// List every blob currently stored under uploads/ in Firebase Storage.
// Returns an array of { blobId, size, fullPath } describing each object.
// Used by the admin orphan-cleanup tool — `size` lets the UI show how much
// space would be reclaimed before the user confirms deletion.
export async function listAllUploadedBlobs() {
  const folder = ref(storage, 'uploads');
  const res = await listAll(folder);
  const items = await Promise.all(
    res.items.map(async (it) => {
      let size = 0;
      try { size = (await getMetadata(it)).size || 0; } catch { /* ignore */ }
      return { blobId: it.name, size, fullPath: it.fullPath };
    })
  );
  return items;
}

// Delete a stored file from Firebase Storage.
export async function deleteFileFromDB(blobId) {
  if (!blobId) return;
  try { await deleteObject(ref(storage, `uploads/${blobId}`)); } catch { /* ignore */ }
}
