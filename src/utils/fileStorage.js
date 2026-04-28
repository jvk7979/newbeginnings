import { rtdb } from '../firebase';
import { ref, set, get, remove } from 'firebase/database';

// 7.5 MB source → ~10 MB base64, within RTDB's 10 MB per-node limit.
export const FILE_MAX_BYTES = 7 * 1024 * 1024; // 7 MB (safe margin)
export const FILE_MAX_LABEL = '7 MB';

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

async function readBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = e => resolve(e.target.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Upload a File → store base64 in RTDB fileBlobs/ → return metadata object.
export async function uploadFileToDB(file) {
  const base64 = await readBase64(file);
  const type   = detectType(file);
  const blobId = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  try {
    await set(ref(rtdb, `fileBlobs/${blobId}`), {
      data:     base64,
      mimeType: mimeForType(type),
      savedAt:  new Date().toISOString(),
    });
  } catch (err) {
    console.error('[RTDB upload error]', err?.code, err?.message, err);
    throw err;
  }
  return { blobId, name: file.name, type, size: file.size, uploadedAt: todayLabel() };
}

// Load a stored blob from RTDB.
export async function loadFileFromDB(blobId) {
  const snap = await get(ref(rtdb, `fileBlobs/${blobId}`));
  return snap.exists() ? snap.val() : null;
}

// Delete a stored blob from RTDB.
export async function deleteFileFromDB(blobId) {
  if (!blobId) return;
  try { await remove(ref(rtdb, `fileBlobs/${blobId}`)); } catch { /* ignore */ }
}

// Create a temporary object URL from base64 data for in-browser viewing / download.
export function makeBlobUrl(base64, mimeType) {
  const binary = atob(base64);
  const bytes  = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: mimeType }));
}
