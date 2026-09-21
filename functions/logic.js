// Pure decision logic for the Agmarknet callables, kept free of firebase imports
// so it can be unit tested from the root vitest suite
// (src/utils/functionsLogic.test.js). index.js calls these inside Firestore
// transactions; the transaction supplies atomicity, this supplies the rules.

// Append one dated price point to a commodity's history: keep it ordered by
// timestamp and trimmed to the most-recent `max` points so the Firestore doc
// stays well under 1 MB. Never mutates the input array.
export function appendHistoryPoint(history, point, max) {
  const base = Array.isArray(history) ? history : [];
  const next = [...base, point];
  next.sort((a, b) => (a.ts || 0) - (b.ts || 0));
  return next.length > max ? next.slice(next.length - max) : next;
}

// Milliseconds the caller must still wait, or 0 when the call may proceed.
export function cooldownRemainingMs(lastCallAt, now, cooldownMs) {
  const elapsed = now - (Number(lastCallAt) || 0);
  return elapsed < cooldownMs ? cooldownMs - elapsed : 0;
}
