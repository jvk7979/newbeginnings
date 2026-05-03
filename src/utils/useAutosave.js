import { useEffect, useRef, useState, useCallback } from 'react';

// Stable JSON shape for "dirty" comparisons. Sorting keys keeps key
// reordering from registering as a change.
function stableJson(o) {
  if (o === null || o === undefined) return 'null';
  if (typeof o !== 'object') return JSON.stringify(o);
  return JSON.stringify(o, Object.keys(o).sort());
}

/**
 * Debounced autosave hook.
 *
 *   const { status, lastSavedAt, retry, flushNow, isDirty } = useAutosave(
 *     value, async (val) => updatePlan(id, { calc: val }),
 *     { delay: 1500, enabled: !!id, key: id }
 *   );
 *
 * - `value`: the data to persist; serialised via JSON for change detection.
 * - `onSave`: async fn invoked with the latest value after the debounce.
 *   Must throw on failure so the hook can flip to error state.
 * - `delay`: ms to wait after the last change before firing. Default 1500.
 * - `enabled`: when false, the hook is a no-op (resets dirty tracking).
 * - `key`: when changed, the saved-snapshot resets without triggering a
 *   save. Use this when switching the underlying record (e.g. selecting
 *   a different project) so the new doc's loaded state isn't treated
 *   as user-typed dirty edits.
 *
 * Returned status transitions:
 *   idle -> saving -> saved -> idle (after a brief flash)
 *   idle -> saving -> error
 *
 * The hook never auto-saves on the *initial* mount: the first effect
 * run records the value as the current saved snapshot, so loading a
 * record doesn't immediately rewrite it.
 */
export function useAutosave(value, onSave, { delay = 1500, enabled = true, key } = {}) {
  const [status, setStatus] = useState('idle');     // 'idle' | 'saving' | 'saved' | 'error'
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const savedSnapshotRef = useRef(stableJson(value));
  const pendingValueRef = useRef(value);
  const timerRef = useRef(null);
  const inflightRef = useRef(false);
  const lastKeyRef = useRef(key);

  // Reset snapshot when the underlying record changes (e.g. project switch).
  // This must run before the diff effect so it doesn't fire a false-positive save.
  useEffect(() => {
    if (lastKeyRef.current !== key) {
      lastKeyRef.current = key;
      savedSnapshotRef.current = stableJson(value);
      setStatus('idle');
      // Cancel any pending save tied to the old key.
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    }
  }, [key, value]);

  const doSave = useCallback(async () => {
    if (inflightRef.current) return; // simple guard; debounce coalesces back-to-back changes
    const snapshot = pendingValueRef.current;
    const snapJson = stableJson(snapshot);
    if (snapJson === savedSnapshotRef.current) return; // nothing actually changed
    inflightRef.current = true;
    setStatus('saving');
    try {
      await onSave(snapshot);
      savedSnapshotRef.current = snapJson;
      setLastSavedAt(Date.now());
      setStatus('saved');
      // Drop back to idle after a beat so the "Saved" flash doesn't
      // linger forever on a quiet form.
      setTimeout(() => setStatus(s => (s === 'saved' ? 'idle' : s)), 2500);
    } catch (err) {
      console.error('[useAutosave]', err);
      setStatus('error');
    } finally {
      inflightRef.current = false;
    }
  }, [onSave]);

  // Schedule a save when value changes (and is dirty).
  useEffect(() => {
    pendingValueRef.current = value;
    if (!enabled) return;
    const dirty = stableJson(value) !== savedSnapshotRef.current;
    if (!dirty) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      doSave();
    }, delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, enabled, delay, doSave]);

  const retry = useCallback(() => { doSave(); }, [doSave]);
  const flushNow = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    return doSave();
  }, [doSave]);

  const isDirty = stableJson(value) !== savedSnapshotRef.current;

  return { status, lastSavedAt, retry, flushNow, isDirty };
}
