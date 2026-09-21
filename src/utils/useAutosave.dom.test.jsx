// @vitest-environment happy-dom
/**
 * useAutosave unit tests — the P0 review flagged that retry / error /
 * cancelPending / key-change branches had ZERO coverage. This suite
 * exercises every branch with fake timers + a manually-controlled
 * onSave promise so we can assert the exact transition sequence
 * (idle → saving → saved → idle) and confirm the dirty-tracking,
 * key-reset, and retry-after-error paths all behave.
 *
 * The pragma above tells Vitest to load happy-dom for this file only;
 * the rest of the suite (pure calcEngine math) stays on the node
 * environment which is ~3× faster.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutosave, stableJson } from './useAutosave.js';

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

// Regression: stableJson used an array replacer (a key whitelist applied at
// every depth), so nested values serialised as `{}` and edits inside them —
// every Calculations input row — never registered as dirty.
describe('stableJson — nested change detection', () => {
  it('sees an edit inside a nested object', () => {
    expect(stableJson({ calc: { price: 100 } }))
      .not.toBe(stableJson({ calc: { price: 200 } }));
  });

  it('sees an edit inside an array of row objects', () => {
    const a = { products: [{ name: 'Coir', price: 100, qty: 5 }] };
    const b = { products: [{ name: 'Coir', price: 200, qty: 5 }] };
    expect(stableJson(a)).not.toBe(stableJson(b));
  });

  it('ignores key order at every depth', () => {
    const a = { z: 1, calc: { b: 2, a: { y: 1, x: 2 } } };
    const b = { calc: { a: { x: 2, y: 1 }, b: 2 }, z: 1 };
    expect(stableJson(a)).toBe(stableJson(b));
  });

  it('keeps array order significant', () => {
    expect(stableJson({ rows: [1, 2] })).not.toBe(stableJson({ rows: [2, 1] }));
  });

  it('treats null and undefined alike, and handles primitives', () => {
    expect(stableJson(null)).toBe('null');
    expect(stableJson(undefined)).toBe('null');
    expect(stableJson(5)).toBe('5');
  });
});

describe('useAutosave — nested edits (Calculations-shaped value)', () => {
  it('marks dirty and saves when a nested row value changes', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const initial = { capex: { items: [{ label: 'Machine', price: 100 }] }, note: 'x' };
    const { result, rerender } = renderHook(
      ({ v }) => useAutosave(v, onSave, { delay: 100, key: 'k1' }),
      { initialProps: { v: initial } }
    );
    const edited = { capex: { items: [{ label: 'Machine', price: 200 }] }, note: 'x' };
    rerender({ v: edited });
    expect(result.current.isDirty).toBe(true);
    await advance(100);
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(edited);
  });
});

// Helper — drives time forward AND lets the microtask queue drain. Vitest's
// fake timer needs the awaited act() so promise resolutions inside the
// hook (onSave then setStatus) settle before the next assertion.
async function advance(ms) {
  await act(async () => { await vi.advanceTimersByTimeAsync(ms); });
}

describe('useAutosave — initial state', () => {
  it('starts idle and does NOT fire onSave on first mount', async () => {
    const onSave = vi.fn();
    const { result } = renderHook(() =>
      useAutosave({ a: 1 }, onSave, { delay: 100, enabled: true, key: 'k1' })
    );
    expect(result.current.status).toBe('idle');
    expect(result.current.isDirty).toBe(false);
    await advance(500);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('disabled hook never fires onSave', async () => {
    const onSave = vi.fn();
    const { rerender } = renderHook(
      ({ v }) => useAutosave(v, onSave, { delay: 50, enabled: false, key: 'k1' }),
      { initialProps: { v: { a: 1 } } }
    );
    rerender({ v: { a: 2 } });
    await advance(500);
    expect(onSave).not.toHaveBeenCalled();
  });
});

describe('useAutosave — debounced save on value change', () => {
  it('fires onSave with the latest value after `delay` ms', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result, rerender } = renderHook(
      ({ v }) => useAutosave(v, onSave, { delay: 100, key: 'k1' }),
      { initialProps: { v: { a: 1 } } }
    );
    rerender({ v: { a: 2 } });
    expect(result.current.isDirty).toBe(true);
    expect(onSave).not.toHaveBeenCalled();
    await advance(100);
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({ a: 2 });
  });

  it('coalesces back-to-back changes into a single save', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(
      ({ v }) => useAutosave(v, onSave, { delay: 100, key: 'k1' }),
      { initialProps: { v: { a: 1 } } }
    );
    rerender({ v: { a: 2 } });
    await advance(50);
    rerender({ v: { a: 3 } });   // restarts the debounce
    await advance(50);
    rerender({ v: { a: 4 } });
    await advance(100);          // now the timer finally fires
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({ a: 4 });
  });
});

describe('useAutosave — status transitions', () => {
  it('idle → saving → saved → idle', async () => {
    let resolve;
    const onSave = vi.fn(() => new Promise(r => { resolve = r; }));
    const { result, rerender } = renderHook(
      ({ v }) => useAutosave(v, onSave, { delay: 50, key: 'k1' }),
      { initialProps: { v: { a: 1 } } }
    );
    rerender({ v: { a: 2 } });
    await advance(50);
    expect(result.current.status).toBe('saving');
    await act(async () => { resolve(); });
    expect(result.current.status).toBe('saved');
    expect(result.current.lastSavedAt).not.toBeNull();
    // 'saved' clears after a 2.5s flash window
    await advance(2600);
    expect(result.current.status).toBe('idle');
  });

  it('onSave rejection lands status=error and retry re-tries', async () => {
    let attempt = 0;
    const onSave = vi.fn(() => {
      attempt++;
      if (attempt === 1) return Promise.reject(new Error('network down'));
      return Promise.resolve();
    });
    // Suppress the expected console.error from useAutosave.
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result, rerender } = renderHook(
      ({ v }) => useAutosave(v, onSave, { delay: 50, key: 'k1' }),
      { initialProps: { v: { a: 1 } } }
    );
    rerender({ v: { a: 2 } });
    await advance(60);
    expect(result.current.status).toBe('error');
    // Retry — should succeed this time
    await act(async () => { result.current.retry(); });
    expect(result.current.status).toBe('saved');
    errSpy.mockRestore();
  });
});

describe('useAutosave — key change resets snapshot', () => {
  it('changing key + value at the same time does NOT fire onSave for the new value', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result, rerender } = renderHook(
      ({ v, k }) => useAutosave(v, onSave, { delay: 100, key: k }),
      { initialProps: { v: { a: 1 }, k: 'k1' } }
    );
    // Switch to a different record AND a different value at the same time
    // (the common path: user picks a different project, the calc input
    // hydrates from the new doc).
    rerender({ v: { a: 99 }, k: 'k2' });
    await advance(300);
    // The critical guarantee: the new value is NOT treated as dirty
    // edits of the old doc, so no autosave fires for it.
    expect(onSave).not.toHaveBeenCalled();
    // After a follow-up edit on the new doc, the hook should auto-save
    // against the new key — confirms the snapshot reset actually
    // took (and isn't just "everything is broken after key change").
    rerender({ v: { a: 99, extra: 'edit' }, k: 'k2' });
    await advance(150);
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({ a: 99, extra: 'edit' });
    expect(result.current.isDirty).toBe(false); // after save lands
  });
});

describe('useAutosave — flushNow + cancelPending', () => {
  it('flushNow fires the pending save immediately', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result, rerender } = renderHook(
      ({ v }) => useAutosave(v, onSave, { delay: 5000, key: 'k1' }),
      { initialProps: { v: { a: 1 } } }
    );
    rerender({ v: { a: 2 } });
    // Don't wait for the 5s debounce — flush right now.
    await act(async () => { await result.current.flushNow(); });
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({ a: 2 });
  });

  it('cancelPending drops the queued save without firing it', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result, rerender } = renderHook(
      ({ v }) => useAutosave(v, onSave, { delay: 200, key: 'k1' }),
      { initialProps: { v: { a: 1 } } }
    );
    rerender({ v: { a: 2 } });
    act(() => { result.current.cancelPending(); });
    await advance(500);
    expect(onSave).not.toHaveBeenCalled();
  });
});

describe('useAutosave — change detection', () => {
  it('re-rendering with the SAME value (different ref, identical content) does NOT fire onSave', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(
      ({ v }) => useAutosave(v, onSave, { delay: 50, key: 'k1' }),
      { initialProps: { v: { a: 1, b: 2 } } }
    );
    rerender({ v: { a: 1, b: 2 } });  // new object, identical content
    rerender({ v: { b: 2, a: 1 } });  // same keys, different order
    await advance(200);
    expect(onSave).not.toHaveBeenCalled();
  });
});

// ── Data-loss regressions from the second review ────────────────────────────
describe('useAutosave — edit during a slow save', () => {
  it('saves the newer edit after the in-flight save finishes and ends clean', async () => {
    // First save stays pending until we release it.
    let releaseFirst;
    const onSave = vi.fn()
      .mockImplementationOnce(() => new Promise(res => { releaseFirst = res; }))
      .mockResolvedValue(undefined);
    const { result, rerender } = renderHook(
      ({ v }) => useAutosave(v, onSave, { delay: 100, key: 'k1' }),
      { initialProps: { v: { a: 1 } } }
    );

    rerender({ v: { a: 2 } });
    await advance(100);                       // first save starts and hangs
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('saving');

    rerender({ v: { a: 3 } });                // edit while the save is in flight
    await advance(100);                       // debounce fires while still in flight
    expect(onSave).toHaveBeenCalledTimes(1);  // not started twice concurrently

    await act(async () => { releaseFirst(); });
    await advance(0);

    expect(onSave).toHaveBeenCalledTimes(2);
    expect(onSave).toHaveBeenLastCalledWith({ a: 3 });   // the second edit was NOT dropped
    expect(result.current.isDirty).toBe(false);
  });

  it('does not loop forever when a save fails', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('boom'));
    const { result, rerender } = renderHook(
      ({ v }) => useAutosave(v, onSave, { delay: 50, key: 'k1' }),
      { initialProps: { v: { a: 1 } } }
    );
    rerender({ v: { a: 2 } });
    await advance(50);
    await advance(1000);
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('error');
  });
});

describe('useAutosave — leaving the page before the debounce fires', () => {
  it('flushes the pending edit on unmount (in-app navigation)', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { rerender, unmount } = renderHook(
      ({ v }) => useAutosave(v, onSave, { delay: 30000, key: 'k1' }),
      { initialProps: { v: { a: 1 } } }
    );
    rerender({ v: { a: 2 } });
    await advance(1000);                       // well inside the 30s debounce
    expect(onSave).not.toHaveBeenCalled();
    unmount();
    await advance(0);
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({ a: 2 });
  });

  it('saves nothing on unmount when nothing changed', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { unmount } = renderHook(() => useAutosave({ a: 1 }, onSave, { delay: 30000, key: 'k1' }));
    unmount();
    await advance(0);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('does not save on unmount while disabled (e.g. a Viewer, or edit mode cancelled)', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { rerender, unmount } = renderHook(
      ({ v }) => useAutosave(v, onSave, { delay: 30000, enabled: false, key: 'k1' }),
      { initialProps: { v: { a: 1 } } }
    );
    rerender({ v: { a: 2 } });
    unmount();
    await advance(0);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('does not re-save on unmount after an explicit Save took over (cancelPending)', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result, rerender, unmount } = renderHook(
      ({ v }) => useAutosave(v, onSave, { delay: 30000, key: 'k1' }),
      { initialProps: { v: { a: 1 } } }
    );
    rerender({ v: { a: 2 } });
    act(() => { result.current.cancelPending(); });
    unmount();
    await advance(0);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('a genuine edit after cancelPending re-arms autosave', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result, rerender, unmount } = renderHook(
      ({ v }) => useAutosave(v, onSave, { delay: 30000, key: 'k1' }),
      { initialProps: { v: { a: 1 } } }
    );
    rerender({ v: { a: 2 } });
    act(() => { result.current.cancelPending(); });
    rerender({ v: { a: 3 } });
    unmount();
    await advance(0);
    expect(onSave).toHaveBeenCalledWith({ a: 3 });
  });

  it('flushes when the tab is hidden', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(
      ({ v }) => useAutosave(v, onSave, { delay: 30000, key: 'k1' }),
      { initialProps: { v: { a: 1 } } }
    );
    rerender({ v: { a: 2 } });
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')); });
    await advance(0);
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    expect(onSave).toHaveBeenCalledWith({ a: 2 });
  });
});

describe('useAutosave — switching records with unsaved edits', () => {
  it('saves the old record\'s edit with the OLD save fn, never into the new record', async () => {
    const saveOld = vi.fn().mockResolvedValue(undefined);
    const saveNew = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(
      ({ v, s, k }) => useAutosave(v, s, { delay: 30000, key: k }),
      { initialProps: { v: { name: 'A' }, s: saveOld, k: 'projA' } }
    );
    rerender({ v: { name: 'A edited' }, s: saveOld, k: 'projA' }); // unsaved edit on A
    rerender({ v: { name: 'B' }, s: saveNew, k: 'projB' });        // user switches to B
    await advance(0);

    expect(saveOld).toHaveBeenCalledTimes(1);
    expect(saveOld).toHaveBeenCalledWith({ name: 'A edited' });
    expect(saveNew).not.toHaveBeenCalled();                        // B is untouched
  });

  it('does not save anything on a switch when there were no unsaved edits', async () => {
    const saveOld = vi.fn().mockResolvedValue(undefined);
    const saveNew = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(
      ({ v, s, k }) => useAutosave(v, s, { delay: 30000, key: k }),
      { initialProps: { v: { name: 'A' }, s: saveOld, k: 'projA' } }
    );
    rerender({ v: { name: 'B' }, s: saveNew, k: 'projB' });
    await advance(0);
    expect(saveOld).not.toHaveBeenCalled();
    expect(saveNew).not.toHaveBeenCalled();
  });
});
