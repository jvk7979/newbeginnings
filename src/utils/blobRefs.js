// Uploaded-file reference helpers for the orphan scan — pure, unit tested in
// blobRefs.test.js.
//
// The scan used to look only at `attachedFile` on ideas and plans, so PDFs and
// photos attached to Research Vault CLIPS (sharedPlans/{id}/clips/*) looked
// unreferenced and "Clean up" would delete live files. Every shape that can
// point at an uploaded blob is listed here, in one place.

// Blob ids referenced by one Firestore document's data:
//   ideas / plans / projects  -> attachedFile.blobId
//   vault clips               -> attachedFile.blobId (pdf) and photo.blobId (photo)
export function extractBlobIds(data) {
  const ids = [];
  const a = data?.attachedFile?.blobId;
  const p = data?.photo?.blobId;
  if (a) ids.push(String(a));
  if (p) ids.push(String(p));
  return ids;
}

// Uploads happen BEFORE the document that references them is saved (new idea,
// new project, new clip), so a just-uploaded file is briefly unreferenced. Files
// younger than this are never treated as orphans.
export const ORPHAN_MIN_AGE_MS = 60 * 60 * 1000; // 1 hour

/**
 * Blobs that nothing references and that are old enough to be safe to remove.
 *   allBlobs:   [{ blobId, size, createdAt? }]   createdAt = epoch ms, may be unknown
 *   referenced: Set<string> of blob ids in use
 * A blob whose age is unknown is kept out of the list (fail safe).
 */
export function findOrphans(allBlobs, referenced, now = Date.now(), minAgeMs = ORPHAN_MIN_AGE_MS) {
  return allBlobs.filter(b => {
    if (referenced.has(b.blobId)) return false;
    if (!b.createdAt || !Number.isFinite(b.createdAt)) return false;
    return now - b.createdAt >= minAgeMs;
  });
}
