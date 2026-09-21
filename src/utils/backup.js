// Backup import helpers — pure, no Firebase, unit tested in backup.test.js.
//
// importData() used to delete every idea / project / plan FIRST and only then
// touch the backup contents, so a malformed file (e.g. `{ "ideas": [null] }`,
// which passed the UI's Array.isArray check) failed halfway through and left
// the workspace empty. The flow is now: validate everything -> snapshot what
// exists -> write the new records -> delete stale ones -> roll back to the
// snapshot if anything throws.

export const BACKUP_COLLECTIONS = ['ideas', 'projects', 'plans'];

// Firestore document ids can't contain '/', and '.' / '..' are reserved.
function isUsableId(id) {
  if (typeof id === 'number') return Number.isFinite(id);
  if (typeof id !== 'string') return false;
  const s = id.trim();
  return s !== '' && s !== '.' && s !== '..' && !s.includes('/');
}

/**
 * Validate a parsed backup file completely before anything is touched.
 * Returns { ok: true, records, counts, total } or { ok: false, error }.
 * Collections absent from the file are treated as empty (the import replaces
 * the whole workspace), but a backup with no records at all is rejected — it
 * is almost certainly the wrong file, and importing it would wipe everything.
 */
export function validateBackup(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { ok: false, error: 'This is not a backup file exported from this app.' };
  }
  const present = BACKUP_COLLECTIONS.filter(n => data[n] !== undefined);
  if (present.length === 0) {
    return { ok: false, error: 'This file has no ideas, projects or plans — it is not a backup from this app.' };
  }
  const records = {};
  const counts = {};
  for (const name of BACKUP_COLLECTIONS) {
    const list = data[name] === undefined ? [] : data[name];
    if (!Array.isArray(list)) {
      return { ok: false, error: `"${name}" in this backup must be a list.` };
    }
    const seen = new Set();
    for (let i = 0; i < list.length; i++) {
      const rec = list[i];
      if (!rec || typeof rec !== 'object' || Array.isArray(rec)) {
        return { ok: false, error: `${name}[${i}] is not a valid record.` };
      }
      if (!isUsableId(rec.id)) {
        return { ok: false, error: `${name}[${i}] has a missing or unusable id.` };
      }
      const key = String(rec.id);
      if (seen.has(key)) {
        return { ok: false, error: `${name} contains the id "${key}" more than once.` };
      }
      seen.add(key);
    }
    records[name] = list;
    counts[name] = list.length;
  }
  const total = BACKUP_COLLECTIONS.reduce((n, name) => n + counts[name], 0);
  if (total === 0) {
    return { ok: false, error: 'This backup contains no records, so importing it would only erase your data.' };
  }
  return { ok: true, records, counts, total };
}

/**
 * Work out what an import must do, given what currently exists.
 *   existing: { ideas: [{ id, data }], projects: [...], plans: [...] }  (doc ids as strings)
 *   records:  validated backup records per collection
 * Per collection returns:
 *   writes  — every record to set, as { id, data }
 *   stale   — existing ids the backup does not contain (deleted last)
 *   created — ids that did not exist before (deleted again on rollback)
 */
export function planImport(existing, records) {
  const out = {};
  for (const name of BACKUP_COLLECTIONS) {
    const before = new Set((existing[name] || []).map(e => String(e.id)));
    const writes = (records[name] || []).map(rec => ({ id: String(rec.id), data: rec }));
    const incoming = new Set(writes.map(w => w.id));
    out[name] = {
      writes,
      stale:   [...before].filter(id => !incoming.has(id)),
      created: [...incoming].filter(id => !before.has(id)),
    };
  }
  return out;
}

/** Split a list into chunks — Firestore batches are capped at 500 operations. */
export function chunk(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}
