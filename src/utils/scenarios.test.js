// @vitest-environment happy-dom
/**
 * scenarios.js unit tests — the store moved from localStorage to a
 * Firestore subcollection, with a one-time legacy migration. This suite
 * covers the branches that matter:
 *   - no projectId → empty subscription, no Firestore traffic
 *   - legacy localStorage + empty collection → migrate then clear local
 *   - legacy localStorage + NON-empty collection → no migrate, still clear
 *   - snapshot ordering by savedAt
 *   - write helpers target the per-scenario doc ref
 *
 * happy-dom pragma: the migration reads window.localStorage.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  onSnapshot: vi.fn(),
  setDoc: vi.fn(() => Promise.resolve()),
  deleteDoc: vi.fn(() => Promise.resolve()),
  updateDoc: vi.fn(() => Promise.resolve()),
  getDocs: vi.fn(() => Promise.resolve({ empty: true, docs: [] })),
}));

vi.mock('firebase/firestore', () => mocks);
vi.mock('../firebase', () => ({ db: { __fake: true } }));
vi.mock('../data/paths', () => ({
  planScenariosCol: (db, planId) => ({ path: `sharedPlans/${planId}/scenarios` }),
  planScenarioRef: (db, planId, id) => ({ path: `sharedPlans/${planId}/scenarios/${id}` }),
}));

import { subscribeScenarios, addScenario, deleteScenario, renameScenario } from './scenarios.js';

// subscribeScenarios runs its migration in an async IIFE before attaching
// the listener — drain the microtask queue so assertions see the result.
const flush = () => new Promise(r => setTimeout(r, 0));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mocks.getDocs.mockResolvedValue({ empty: true, docs: [] });
});

describe('subscribeScenarios', () => {
  it('no projectId → immediately reports [] and touches nothing', () => {
    const onChange = vi.fn();
    const unsub = subscribeScenarios(null, onChange);
    expect(onChange).toHaveBeenCalledWith([]);
    expect(mocks.onSnapshot).not.toHaveBeenCalled();
    expect(typeof unsub).toBe('function');
    unsub(); // must be a safe no-op
  });

  it('attaches an onSnapshot listener and sorts docs by savedAt ascending', async () => {
    const onChange = vi.fn();
    subscribeScenarios(7, onChange);
    await flush();
    expect(mocks.onSnapshot).toHaveBeenCalledTimes(1);
    expect(mocks.onSnapshot.mock.calls[0][0]).toEqual({ path: 'sharedPlans/7/scenarios' });

    const snapCb = mocks.onSnapshot.mock.calls[0][1];
    snapCb({ docs: [
      { data: () => ({ id: 2, name: 'b', savedAt: 200 }) },
      { data: () => ({ id: 1, name: 'a', savedAt: 100 }) },
    ] });
    expect(onChange).toHaveBeenLastCalledWith([
      { id: 1, name: 'a', savedAt: 100 },
      { id: 2, name: 'b', savedAt: 200 },
    ]);
  });

  it('migrates legacy localStorage snapshots when the collection is empty, then clears the key', async () => {
    const legacy = [{ id: 1, name: 'old', savedAt: 50, input: { x: 1 } }];
    localStorage.setItem('calc-scenarios-7', JSON.stringify(legacy));
    subscribeScenarios(7, vi.fn());
    await flush();
    expect(mocks.setDoc).toHaveBeenCalledWith(
      { path: 'sharedPlans/7/scenarios/1' },
      legacy[0]
    );
    expect(localStorage.getItem('calc-scenarios-7')).toBeNull();
  });

  it('does NOT migrate when Firestore already has scenarios (another device won), but still clears local', async () => {
    localStorage.setItem('calc-scenarios-7', JSON.stringify([{ id: 1, savedAt: 50 }]));
    mocks.getDocs.mockResolvedValue({ empty: false, docs: [{}] });
    subscribeScenarios(7, vi.fn());
    await flush();
    expect(mocks.setDoc).not.toHaveBeenCalled();
    expect(localStorage.getItem('calc-scenarios-7')).toBeNull();
  });

  it('keeps the local copy when the migration write fails (offline) so a later visit retries', async () => {
    localStorage.setItem('calc-scenarios-7', JSON.stringify([{ id: 1, savedAt: 50 }]));
    mocks.getDocs.mockRejectedValue(new Error('offline'));
    subscribeScenarios(7, vi.fn());
    await flush();
    expect(localStorage.getItem('calc-scenarios-7')).not.toBeNull();
  });

  it('unsubscribe before the listener attaches prevents attachment', async () => {
    const unsub = subscribeScenarios(7, vi.fn());
    unsub(); // cancel while the migration await is still pending
    await flush();
    expect(mocks.onSnapshot).not.toHaveBeenCalled();
  });
});

describe('write helpers', () => {
  it('addScenario writes the full scenario to its doc ref', async () => {
    const s = { id: 5, name: 'n', savedAt: 1, input: {}, savedBy: 'V' };
    await addScenario(7, s);
    expect(mocks.setDoc).toHaveBeenCalledWith({ path: 'sharedPlans/7/scenarios/5' }, s);
  });

  it('deleteScenario deletes the doc ref', async () => {
    await deleteScenario(7, 5);
    expect(mocks.deleteDoc).toHaveBeenCalledWith({ path: 'sharedPlans/7/scenarios/5' });
  });

  it('renameScenario patches only the name', async () => {
    await renameScenario(7, 5, 'renamed');
    expect(mocks.updateDoc).toHaveBeenCalledWith({ path: 'sharedPlans/7/scenarios/5' }, { name: 'renamed' });
  });
});
