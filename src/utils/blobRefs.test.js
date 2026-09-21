import { describe, it, expect } from 'vitest';
import { extractBlobIds, findOrphans, ORPHAN_MIN_AGE_MS } from './blobRefs.js';

describe('extractBlobIds', () => {
  it('reads an idea / plan attachment', () => {
    expect(extractBlobIds({ attachedFile: { blobId: 'abc' } })).toEqual(['abc']);
  });

  it('reads a Research Vault PDF clip attachment', () => {
    expect(extractBlobIds({ type: 'pdf', attachedFile: { blobId: 'pdf1', name: 'r.pdf' } })).toEqual(['pdf1']);
  });

  it('reads a Research Vault PHOTO clip — the case the old scan missed', () => {
    expect(extractBlobIds({ type: 'photo', photo: { blobId: 'img9' } })).toEqual(['img9']);
  });

  it('returns nothing for documents without attachments', () => {
    expect(extractBlobIds({ title: 'x' })).toEqual([]);
    expect(extractBlobIds(null)).toEqual([]);
    expect(extractBlobIds(undefined)).toEqual([]);
  });
});

describe('findOrphans', () => {
  const now = 10 * ORPHAN_MIN_AGE_MS;
  const old = now - 2 * ORPHAN_MIN_AGE_MS;

  it('does not flag a live vault photo as an orphan when its id is referenced', () => {
    const referenced = new Set(['img9']);
    const blobs = [{ blobId: 'img9', createdAt: old }, { blobId: 'gone', createdAt: old }];
    expect(findOrphans(blobs, referenced, now).map(b => b.blobId)).toEqual(['gone']);
  });

  it('spares recently uploaded files — their document may not be saved yet', () => {
    const blobs = [{ blobId: 'fresh', createdAt: now - 60_000 }];
    expect(findOrphans(blobs, new Set(), now)).toEqual([]);
  });

  it('spares files whose age is unknown', () => {
    expect(findOrphans([{ blobId: 'x' }], new Set(), now)).toEqual([]);
    expect(findOrphans([{ blobId: 'x', createdAt: NaN }], new Set(), now)).toEqual([]);
  });

  it('flags old unreferenced files', () => {
    expect(findOrphans([{ blobId: 'x', createdAt: old }], new Set(), now)).toHaveLength(1);
  });
});
