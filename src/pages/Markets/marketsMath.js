// Pure helpers for deriving display values from a commodity's price history.
// `history` is an array of { ts, date, price }; callers must treat it as
// possibly unsorted and possibly empty.

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// A copy of history sorted ascending by ts.
export function sortHistory(history) {
  return [...(history || [])].sort((a, b) => (a.ts || 0) - (b.ts || 0));
}

// The latest price, or null when there is no history.
export function currentPrice(history) {
  const sorted = sortHistory(history);
  return sorted.length ? sorted[sorted.length - 1].price : null;
}

// Percentage change of the latest price vs the most recent entry at or
// before `weeks` ago. Falls back to the earliest entry when there is less
// than `weeks` of data. Returns null when there are fewer than 2 entries
// or the baseline price is zero.
export function pctChange(history, weeks) {
  const sorted = sortHistory(history);
  if (sorted.length < 2) return null;
  const latest = sorted[sorted.length - 1];
  const cutoff = latest.ts - weeks * WEEK_MS;
  let baseline = sorted[0];
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].ts <= cutoff) { baseline = sorted[i]; break; }
  }
  if (!baseline.price) return null;
  return ((latest.price - baseline.price) / baseline.price) * 100;
}

// { low, high } over entries within the last 52 weeks (all entries when
// there is less than 52 weeks of data). Null when history is empty.
export function range52w(history) {
  const sorted = sortHistory(history);
  if (!sorted.length) return null;
  const latestTs = sorted[sorted.length - 1].ts;
  const cutoff = latestTs - 52 * WEEK_MS;
  const within = sorted.filter(e => e.ts >= cutoff);
  const pool = within.length ? within : sorted;
  const prices = pool.map(e => e.price);
  return { low: Math.min(...prices), high: Math.max(...prices) };
}
