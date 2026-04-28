import { db } from '../firebase';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

// 700 KB source → ~933 KB base64, safely under Firestore's 1 MiB per-document limit.
export const FILE_MAX_BYTES = 716800;
export const FILE_MAX_LABEL = '700 KB';

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
    reader.onload = e => resolve(e.target.result.split(',')[1]); // strip data-URL prefix
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Upload a File object → store base64 in Firestore sharedFileBlobs → return metadata object.
export async function uploadFileToDB(file) {
  const base64  = await readBase64(file);
  const type    = detectType(file);
  const blobId  = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  await setDoc(doc(db, 'sharedFileBlobs', blobId), {
    data:    base64,
    mimeType: mimeForType(type),
    savedAt: new Date().toISOString(),
  });
  return { blobId, name: file.name, type, size: file.size, uploadedAt: todayLabel() };
}

// Load a previously stored blob from Firestore.
export async function loadFileFromDB(blobId) {
  const snap = await getDoc(doc(db, 'sharedFileBlobs', blobId));
  return snap.exists() ? snap.data() : null;
}

// Delete a stored blob (e.g. when a file is replaced or its parent is deleted).
export async function deleteFileFromDB(blobId) {
  if (!blobId) return;
  try { await deleteDoc(doc(db, 'sharedFileBlobs', blobId)); } catch { /* ignore */ }
}

// Create a temporary object URL from base64 data for in-browser viewing / download.
export function makeBlobUrl(base64, mimeType) {
  const binary = atob(base64);
  const bytes  = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: mimeType }));
}
