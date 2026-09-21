/**
 * Pure rules used inside the Agmarknet Cloud Function transactions
 * (functions/logic.js). The transactions themselves need the Firestore
 * emulator; the decisions they make do not.
 */
import { describe, it, expect } from 'vitest';
import { appendHistoryPoint, cooldownRemainingMs } from '../../functions/logic.js';

describe('appendHistoryPoint', () => {
  it('appends to the history it is given, keeping entries already there', () => {
    // A manual entry saved after the sync started must survive the append.
    const fresh = [{ ts: 10, price: 1 }, { ts: 20, price: 2, source: 'manual' }];
    const out = appendHistoryPoint(fresh, { ts: 30, price: 3 }, 100);
    expect(out.map(p => p.price)).toEqual([1, 2, 3]);
  });

  it('keeps points ordered by timestamp', () => {
    const out = appendHistoryPoint([{ ts: 50 }], { ts: 20 }, 100);
    expect(out.map(p => p.ts)).toEqual([20, 50]);
  });

  it('trims to the most recent `max` points', () => {
    const history = [{ ts: 1 }, { ts: 2 }, { ts: 3 }];
    const out = appendHistoryPoint(history, { ts: 4 }, 3);
    expect(out.map(p => p.ts)).toEqual([2, 3, 4]);
  });

  it('treats a missing history as empty and does not mutate its input', () => {
    expect(appendHistoryPoint(undefined, { ts: 1 }, 5)).toEqual([{ ts: 1 }]);
    const history = [{ ts: 1 }];
    appendHistoryPoint(history, { ts: 2 }, 5);
    expect(history).toEqual([{ ts: 1 }]);
  });
});

describe('cooldownRemainingMs', () => {
  it('blocks inside the window and reports how long is left', () => {
    expect(cooldownRemainingMs(1000, 1000 + 20_000, 60_000)).toBe(40_000);
  });

  it('allows a call once the window has passed', () => {
    expect(cooldownRemainingMs(1000, 1000 + 60_000, 60_000)).toBe(0);
  });

  it('allows the first ever call (no previous timestamp)', () => {
    expect(cooldownRemainingMs(undefined, 5_000_000, 60_000)).toBe(0);
    expect(cooldownRemainingMs(0, 5_000_000, 60_000)).toBe(0);
  });
});
