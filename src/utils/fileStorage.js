import { storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL, getBlob, deleteObject } from 'firebase/storage';

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

// Upload a File → Firebase Storage → return metadata object with download URL.
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

  const url = await getDownloadURL(fileRef);
  return { blobId, url, name: file.name, type, size: file.size, uploadedAt: todayLabel() };
}

// Download an attached file's bytes through the Firebase SDK (no CORS hit).
// `attachedFile` is the metadata object stored on the plan/idea
// ({ blobId, url, name, type, size, uploadedAt }). Returns a Blob.
export async function fetchFileBlob(attachedFile) {
  if (!attachedFile?.blobId) throw new Error('Missing file reference.');
  const fileRef = ref(storage, `uploads/${attachedFile.blobId}`);
  return await getBlob(fileRef);
}

// Delete a stored file from Firebase Storage.
export async function deleteFileFromDB(blobId) {
  if (!blobId) return;
  try { await deleteObject(ref(storage, `uploads/${blobId}`)); } catch { /* ignore */ }
}

// Legacy no-ops — no longer needed with direct Storage URLs.
export async function loadFileFromDB() { return null; }
export function makeBlobUrl() { return null; }
