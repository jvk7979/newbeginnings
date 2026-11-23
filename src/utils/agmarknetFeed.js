// Agmarknet mandi-price feed (data.gov.in) — pure helpers, unit tested in
// agmarknetFeed.test.js.
//
// Why this runs in the browser: since late 2026 data.gov.in refuses requests
// from cloud servers (our Cloud Function sync gets "connection refused" from
// Google's US region and "403 Forbidden" from its Mumbai region, for every
// key and dataset). A family member's own device in India is a normal
// visitor, so the Markets page fetches from there and saves the result for
// everyone.
//
// Key: data.gov.in publishes a sample API key for exactly this kind of
// open-data use (it returns at most 10 records per request, which is plenty
// for one commodity in one state). It is public by design, not a secret.

export const FEED_RESOURCE = '9ef84268-d588-465a-a308-a864a43d0070';
export const PUBLIC_SAMPLE_KEY = '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b';
// Andhra Pradesh first (the family's region); its reporting is patchy, so
// fall back to the other big coconut/copra states.
export const FALLBACK_STATES = ['Andhra Pradesh', 'Tamil Nadu', 'Karnataka', 'Kerala'];
export const STALE_AFTER_HOURS = 3;
export const MAX_HISTORY = 2000;

export function feedUrl(commodityName, state, key = PUBLIC_SAMPLE_KEY) {
  const url = new URL(`https://api.data.gov.in/resource/${FEED_RESOURCE}`);
  url.searchParams.set('api-key', key);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '10');
  url.searchParams.set('filters[commodity]', commodityName);
  url.searchParams.set('filters[state]', state);
  return url.toString();
}

// Agmarknet dates are "dd/mm/yyyy". Returns { iso: 'yyyy-mm-dd', ts } or null.
export function parseArrivalDate(s) {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(s || '').trim());
  if (!m) return null;
  const [, d, mo, y] = m.map(Number);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const iso = `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const ts = Date.parse(`${iso}T12:00:00Z`);
  return Number.isFinite(ts) ? { iso, ts } : null;
}

// Average modal price (₹ per quintal) across markets that reported on the
// LATEST date in the response. Older records are ignored, so one stale
// mandi can't drag today's figure. Returns null when nothing usable.
export function latestPrice(records) {
  const rows = (Array.isArray(records) ? records : [])
    .map(r => ({ price: parseFloat(r?.modal_price), date: parseArrivalDate(r?.arrival_date), market: r?.market }))
    .filter(r => Number.isFinite(r.price) && r.price > 0 && r.date);
  if (!rows.length) return null;
  const latestIso = rows.reduce((best, r) => (r.date.iso > best ? r.date.iso : best), rows[0].date.iso);
  const today = rows.filter(r => r.date.iso === latestIso);
  const avg = today.reduce((s, r) => s + r.price, 0) / today.length;
  return {
    price: Math.round(avg * 100) / 100,
    arrivalISO: latestIso,
    markets: today.length,
    marketNames: today.map(r => r.market).filter(Boolean),
  };
}

// The newest Agmarknet point in a history, or null.
export function lastFeedPoint(history) {
  const feed = (history || []).filter(p => p && p.source === 'agmarknet');
  if (!feed.length) return null;
  return feed.reduce((a, b) => ((b.ts || 0) > (a.ts || 0) ? b : a));
}

// Due for a refresh: never fetched, or last fetched more than `hours` ago.
// Uses `fetchedAt` (when we asked) rather than the mandi date, because a
// mandi that hasn't reported today keeps the same date all day.
export function isStale(commodity, now = Date.now(), hours = STALE_AFTER_HOURS) {
  const last = commodity?.feed?.fetchedAt;
  return !last || now - last > hours * 3600 * 1000;
}

// Add a feed point unless the same mandi day + price is already recorded.
// Keeps history sorted and trimmed. Never mutates the input.
export function appendFeedPoint(history, point, max = MAX_HISTORY) {
  const base = Array.isArray(history) ? history : [];
  const dup = base.some(p => p && p.source === 'agmarknet'
    && p.arrivalISO === point.arrivalISO && Number(p.price) === Number(point.price));
  if (dup) return { next: base, added: false };
  const next = [...base, point].sort((a, b) => (a.ts || 0) - (b.ts || 0));
  return { next: next.length > max ? next.slice(next.length - max) : next, added: true };
}

// Short label for where a commodity's latest price came from.
export function freshnessLabel(history, now = Date.now()) {
  const sorted = [...(history || [])].sort((a, b) => (a.ts || 0) - (b.ts || 0));
  const last = sorted[sorted.length - 1];
  if (!last) return null;
  const day = last.arrivalISO
    ? new Date(`${last.arrivalISO}T12:00:00Z`)
    : new Date(last.ts || 0);
  const ageDays = Math.floor((now - day.getTime()) / 86400000);
  const when = ageDays <= 0 ? 'today'
    : ageDays === 1 ? 'yesterday'
    : day.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });
  if (last.source === 'agmarknet') {
    return { text: `Mandi price reported ${when}${last.state ? `, ${last.state} average` : ''}`, fresh: ageDays <= 1 };
  }
  return { text: `Entered by hand, ${when}`, fresh: ageDays <= 1 };
}
