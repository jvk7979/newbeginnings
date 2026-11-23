import { useCallback, useEffect, useRef, useState } from 'react';
import { feedUrl, latestPrice, isStale, FALLBACK_STATES } from '../../utils/agmarknetFeed';

// Live mandi prices, fetched from the visitor's own browser.
//
// data.gov.in refuses requests from cloud servers, so the scheduled Cloud
// Function sync can no longer reach it. A family member's device in India is
// an ordinary visitor: when an Editor opens Markets, this hook checks every
// tracked commodity that hasn't been checked in the last few hours, and saves
// any new price for everyone (AppContext.saveFeedResult).
//
// status.state:
//   'idle'        nothing due (everything checked recently)
//   'checking'    requests in flight
//   'done'        finished; see updated / unchanged / noData counts
//   'unavailable' the feed could not be reached from this device at all
//                 (blocked, offline, or the browser was refused) — nothing
//                 was changed and the last saved prices stay on screen

const REQUEST_TIMEOUT_MS = 15000;

const dateLabel = (ts) => new Date(ts).toLocaleString('en-US', {
  timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
});

async function fetchState(name, state) {
  const res = await fetch(feedUrl(name, state), { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!res.ok) {
    const err = new Error(`The price feed answered ${res.status}`);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  return latestPrice(data?.records);
}

// First state with usable data wins. Returns { found, state } or { found: null }.
async function fetchCommodity(name) {
  for (const state of FALLBACK_STATES) {
    const found = await fetchState(name, state);
    if (found) return { found, state };
  }
  return { found: null };
}

export function useLivePrices({ commodities, canEdit, saveFeedResult }) {
  const [status, setStatus] = useState({ state: 'idle' });
  const running = useRef(false);

  const refresh = useCallback(async ({ force = false } = {}) => {
    if (!canEdit || running.current) return;
    const now = Date.now();
    const due = commodities.filter(c => c?.agmarknet?.name && (force || isStale(c, now)));
    if (!due.length) { setStatus({ state: 'idle' }); return; }

    running.current = true;
    setStatus({ state: 'checking', total: due.length });
    let updated = 0, unchanged = 0, noData = 0, reached = false, lastError = null;
    for (const c of due) {
      try {
        const { found, state } = await fetchCommodity(c.agmarknet.name);
        reached = true;
        const fetchedAt = Date.now();
        if (!found) {
          noData++;
          await saveFeedResult(c.id, { fetchedAt, status: 'no-data', message: 'No mandi reported this commodity in AP, TN, KA or KL.' });
          continue;
        }
        const point = {
          ts: fetchedAt, date: dateLabel(fetchedAt), price: found.price,
          source: 'agmarknet', trigger: 'browser', state,
          arrivalISO: found.arrivalISO, markets: found.markets,
        };
        const { added } = await saveFeedResult(c.id, {
          point, fetchedAt, status: 'ok',
          message: `₹${found.price} average of ${found.markets} mandi${found.markets === 1 ? '' : 's'} in ${state}, reported ${found.arrivalISO}.`,
        });
        if (added) updated++; else unchanged++;
      } catch (err) {
        // A refusal or network failure for the first commodity almost always
        // means the feed is unreachable from this device; stop instead of
        // timing out once per commodity.
        lastError = err;
        if (!reached) break;
      }
    }
    running.current = false;
    if (!reached) {
      setStatus({ state: 'unavailable', reason: lastError?.status ? `The government price feed answered ${lastError.status}.` : 'The government price feed could not be reached from this device.' });
    } else {
      setStatus({ state: 'done', updated, unchanged, noData, at: Date.now() });
    }
  }, [commodities, canEdit, saveFeedResult]);

  // Check once when the page opens (only commodities that are due).
  const ranOnOpen = useRef(false);
  useEffect(() => {
    if (ranOnOpen.current || !canEdit || !commodities.length) return;
    ranOnOpen.current = true;
    refresh();
  }, [commodities.length, canEdit, refresh]);

  return { status, refresh };
}
