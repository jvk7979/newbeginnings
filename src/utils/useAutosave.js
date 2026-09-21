import { useEffect, useRef, useState, useCallback } from 'react';

// Stable JSON shape for "dirty" comparisons. Sorting keys at EVERY depth keeps
// key reordering from registering as a change while still seeing nested edits.
//
// Do not pass an array as JSON.stringify's replacer here: an array replacer is
// a key whitelist applied at all nesting levels, so `{ calc: { price: 100 } }`
// serialised as `{"calc":{}}` and any edit inside a nested object (every
// Calculations input row) was invisible to change detection.
function sortKeys(_key, value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const sorted = {};
    for (const k of Object.keys(value).sort()) sorted[k] = value[k];
    return sorted;
  }
  return value;
}
export function stableJson(o) {
  if (o === null || o === undefined) return 'null';
  return JSON.stringify(o, sortKeys);
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
 *   as user-typed dirty edits. Unsaved edits to the PREVIOUS record are
 *   flushed first, using the previous onSave (bound to the old record).
 *
 * Returned status transitions:
 *   idle -> saving -> saved -> idle (after a brief flash)
 *   idle -> saving -> error
 *
 * The hook never auto-saves on the *initial* mount: the first effect
 * run records the value as the current saved snapshot, so loading a
 * record doesn't immediately rewrite it.
 *
 * Nothing waits out the debounce to be saved: edits still pending are flushed
 * when the component unmounts (navigating away) and when the page is hidden
 * or closed. Edits that arrive while a save is in flight are saved as soon as
 * it finishes, instead of being dropped.
 */
export function useAutosave(value, onSave, { delay = 1500, enabled = true, key } = {}) {
  const [status, setStatus] = useState('idle');     // 'idle' | 'saving' | 'saved' | 'error'
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const savedSnapshotRef = useRef(stableJson(value));
  const pendingValueRef = useRef(value);
  const lastJsonRef = useRef(stableJson(value));   // last value seen, for change tracking
  const timerRef = useRef(null);
  const inflightRef = useRef(false);
  const lastKeyRef = useRef(key);
  const generationRef = useRef(0);    // bumps on every key change; stale saves check it
  const cancelledRef = useRef(false); // an explicit Save took over — don't autosave this value
  // Latest onSave / enabled. Refreshed AFTER the key-change effect below, so
  // when that effect runs these still hold the PREVIOUS render's values.
  const onSaveRef = useRef(onSave);
  const enabledRef = useRef(enabled);

  // Reset snapshot when the underlying record changes (e.g. project switch).
  // This must run before the diff effect so it doesn't fire a false-positive save.
  useEffect(() => {
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;
    generationRef.current += 1;
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }

    // Persist unsaved edits made to the record we are leaving. `onSaveRef` and
    // `pendingValueRef` still belong to that record here, so they cannot leak
    // its data into the new one.
    const leavingValue = pendingValueRef.current;
    if (enabledRef.current && !cancelledRef.current && stableJson(leavingValue) !== savedSnapshotRef.current) {
      const leavingSave = onSaveRef.current;
      Promise.resolve()
        .then(() => leavingSave(leavingValue))
        .catch(err => console.error('[useAutosave] flush on record switch', err));
    }

    savedSnapshotRef.current = stableJson(value);
    lastJsonRef.current = savedSnapshotRef.current;
    cancelledRef.current = false;
    setStatus('idle');
  }, [key, value]);

  useEffect(() => {
    onSaveRef.current = onSave;
    enabledRef.current = enabled;
  });

  const doSave = useCallback(async () => {
    // A save is already running: it re-checks for newer edits when it finishes
    // (the loop below), so this call doesn't need to do anything.
    if (inflightRef.current) return;
    inflightRef.current = true;
    const generation = generationRef.current;
    try {
      // Loop so edits made DURING a slow save are saved next, rather than the
      // hook reporting "saved" while still dirty.
      while (generation === generationRef.current) {
        const snapshot = pendingValueRef.current;
        const snapJson = stableJson(snapshot);
        if (snapJson === savedSnapshotRef.current) break; // nothing (more) to save
        setStatus('saving');
        try {
          await onSaveRef.current(snapshot);
        } catch (err) {
          console.error('[useAutosave]', err);
          if (generation === generationRef.current) setStatus('error');
          return;
        }
        // The record was switched while saving: this result belongs to the old
        // record, so it must not touch the new record's saved snapshot.
        if (generation !== generationRef.current) return;
        savedSnapshotRef.current = snapJson;
        setLastSavedAt(Date.now());
        setStatus('saved');
        // Drop back to idle after a beat so the "Saved" flash doesn't
        // linger forever on a quiet form.
        setTimeout(() => setStatus(s => (s === 'saved' ? 'idle' : s)), 2500);
      }
    } finally {
      inflightRef.current = false;
    }
  }, []);

  // Schedule a save when value changes (and is dirty).
  useEffect(() => {
    pendingValueRef.current = value;
    const json = stableJson(value);
    if (json !== lastJsonRef.current) {
      lastJsonRef.current = json;
      cancelledRef.current = false; // a real edit after an explicit Save re-arms autosave
    }
    if (!enabled || cancelledRef.current) return;
    if (json === savedSnapshotRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      doSave();
    }, delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, enabled, delay, doSave]);

  // Flush pending edits instead of waiting out the debounce when the user
  // leaves: unmount (in-app navigation), tab hidden, or page closing. The
  // pages use a 30s debounce, so without this an edit followed by navigation
  // within 30s was never saved.
  useEffect(() => {
    const flush = () => {
      if (!enabledRef.current || cancelledRef.current) return;
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
      doSave();
    };
    const onVisibility = () => { if (document.visibilityState === 'hidden') flush(); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [doSave]);

  const retry = useCallback(() => { doSave(); }, [doSave]);
  const flushNow = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    return doSave();
  }, [doSave]);
  // Cancel any pending debounced save without firing it. Used when an
  // explicit Save handler takes over so the in-flight autosave can't
  // race with the explicit write. Also stops the leave-page flush from
  // re-writing the same value; a genuine later edit re-arms autosave.
  const cancelPending = useCallback(() => {
    cancelledRef.current = true;
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }, []);

  const isDirty = stableJson(value) !== savedSnapshotRef.current;

  return { status, lastSavedAt, retry, flushNow, cancelPending, isDirty };
}
