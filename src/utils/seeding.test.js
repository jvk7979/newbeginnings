import { describe, it, expect } from 'vitest';
import { seedDecision } from './seeding.js';

describe('seedDecision', () => {
  it('seeds only a genuinely fresh, never-seeded, readable workspace', () => {
    expect(seedDecision({ markerReadable: true, markerSeeded: false, hasData: false })).toBe('seed');
  });

  it('never seeds once the marker says it already happened — even if everything was deleted', () => {
    // The reported bug: user deletes every idea, reload re-seeds and overwrites projects.
    expect(seedDecision({ markerReadable: true, markerSeeded: true, hasData: false })).toBe('skip');
    expect(seedDecision({ markerReadable: true, markerSeeded: true, hasData: true })).toBe('skip');
  });

  it('marks (writes nothing) when data exists but no marker yet', () => {
    expect(seedDecision({ markerReadable: true, markerSeeded: false, hasData: true })).toBe('mark');
  });

  it('fails safe — never seeds when the marker cannot be read', () => {
    expect(seedDecision({ markerReadable: false, markerSeeded: false, hasData: false })).toBe('skip');
    expect(seedDecision({ markerReadable: false, markerSeeded: false, hasData: true })).toBe('skip');
  });
});
