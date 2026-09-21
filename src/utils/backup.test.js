import { describe, it, expect } from 'vitest';
import { validateBackup, planImport, chunk } from './backup.js';

const idea = (id, extra = {}) => ({ id, title: `Idea ${id}`, ...extra });

describe('validateBackup', () => {
  it('accepts a normal backup and counts records', () => {
    const r = validateBackup({ ideas: [idea(1), idea(2)], projects: [], plans: [{ id: 9 }] });
    expect(r.ok).toBe(true);
    expect(r.counts).toEqual({ ideas: 2, projects: 0, plans: 1 });
    expect(r.total).toBe(3);
  });

  it('rejects the reported repro { ideas: [null] } instead of failing after deletes', () => {
    const r = validateBackup({ ideas: [null] });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/ideas\[0\]/);
  });

  it('rejects non-records, missing ids and unusable ids', () => {
    expect(validateBackup({ ideas: [42] }).ok).toBe(false);
    expect(validateBackup({ ideas: [[]] }).ok).toBe(false);
    expect(validateBackup({ ideas: [{ title: 'no id' }] }).ok).toBe(false);
    expect(validateBackup({ ideas: [{ id: 'a/b' }] }).ok).toBe(false);
    expect(validateBackup({ ideas: [{ id: '..' }] }).ok).toBe(false);
    expect(validateBackup({ ideas: [{ id: '' }] }).ok).toBe(false);
    expect(validateBackup({ ideas: [{ id: NaN }] }).ok).toBe(false);
  });

  it('rejects duplicate ids within a collection', () => {
    const r = validateBackup({ ideas: [idea(1), idea(1)] });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/more than once/);
  });

  it('allows the same id in different collections', () => {
    expect(validateBackup({ ideas: [idea(1)], projects: [{ id: 1 }] }).ok).toBe(true);
  });

  it('rejects a collection that is not a list', () => {
    expect(validateBackup({ ideas: { 0: idea(1) } }).ok).toBe(false);
  });

  it('rejects things that are not a backup at all', () => {
    expect(validateBackup(null).ok).toBe(false);
    expect(validateBackup([]).ok).toBe(false);
    expect(validateBackup('text').ok).toBe(false);
    expect(validateBackup({ hello: 'world' }).ok).toBe(false);
  });

  it('rejects an all-empty backup, which would only erase the workspace', () => {
    const r = validateBackup({ ideas: [], projects: [], plans: [] });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/no records/);
  });

  it('treats collections absent from the file as empty', () => {
    const r = validateBackup({ ideas: [idea(1)] });
    expect(r.ok).toBe(true);
    expect(r.records.projects).toEqual([]);
  });
});

describe('planImport', () => {
  const existing = {
    ideas:    [{ id: '1', data: {} }, { id: '2', data: {} }],
    projects: [],
    plans:    [{ id: '7', data: {} }],
  };

  it('writes every record, and separates stale from newly created ids', () => {
    const p = planImport(existing, { ideas: [idea(2), idea(3)], projects: [{ id: 5 }], plans: [] });
    expect(p.ideas.writes.map(w => w.id)).toEqual(['2', '3']);
    expect(p.ideas.stale).toEqual(['1']);      // in workspace, not in backup
    expect(p.ideas.created).toEqual(['3']);    // new — removed again on rollback
    expect(p.projects.created).toEqual(['5']);
    expect(p.plans.stale).toEqual(['7']);
  });

  it('normalises numeric ids to the string doc ids Firestore uses', () => {
    const p = planImport({ ideas: [{ id: '1', data: {} }], projects: [], plans: [] }, { ideas: [idea(1)], projects: [], plans: [] });
    expect(p.ideas.stale).toEqual([]);
    expect(p.ideas.created).toEqual([]);
  });
});

describe('chunk', () => {
  it('splits into batches no larger than the size', () => {
    const parts = chunk(Array.from({ length: 1001 }, (_, i) => i), 400);
    expect(parts.map(p => p.length)).toEqual([400, 400, 201]);
  });
  it('returns no chunks for an empty list', () => {
    expect(chunk([], 400)).toEqual([]);
  });
});
