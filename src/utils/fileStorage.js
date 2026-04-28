import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// No hard cap — Firebase Storage handles files of any size.
// We still expose these so UploadZone can show a sensible UI limit (10 MB).
export const FILE_MAX_BYTES = 10 * 1024 * 1024; // 10 MB
export const FILE_MAX_LABEL = '10 MB';

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

// Upload a File object → Firebase Storage → return metadata object with downloadURL.
export async function uploadFileToDB(file) {
  const type    = detectType(file);
  const blobId  = `uploads/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const fileRef = ref(storage, blobId);
  await uploadBytes(fileRef, file, { contentType: mimeForType(type) });
  const url = await getDownloadURL(fileRef);
  return { blobId, name: file.name, type, size: file.size, uploadedAt: todayLabel(), url };
}

// Load is no longer needed — files are served directly via url from metadata.
export async function loadFileFromDB() {
  return null;
}

// Delete a file from Firebase Storage.
export async function deleteFileFromDB(blobId) {
  if (!blobId) return;
  try { await deleteObject(ref(storage, blobId)); } catch { /* ignore if already gone */ }
}

// Open or download a file — just use the url from metadata directly.
export function makeBlobUrl() {
  return null;
}
