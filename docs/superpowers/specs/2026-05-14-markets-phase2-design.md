# Markets — Phase 2 Design (Agmarknet Auto-Fetch)

**Date:** 2026-05-14
**Status:** Approved (pending written-spec review)

## Summary

Add automatic commodity-price fetching to the Markets feature: a scheduled
Firebase Function pulls daily mandi prices from the data.gov.in **Agmarknet**
API for commodities the user has mapped to an Agmarknet source, and maintains
one price point per ISO week in each commodity's `history`. Manual price entry
(Phase 1) continues to work alongside it.

This is **Phase 2 of 3**. Phase 1 (the Markets core — `sharedCommodities`
collection, manual entry, overview grid, detail page) is shipped. Phase 3
(the "Commodity Watch" analytics tab + binding Calculations variable-cost rows
to Markets prices) remains out of scope and gets its own cycle.

## Goals

- A scheduled Cloud Function that fetches Agmarknet prices daily and writes
  them into the existing `sharedCommodities` price history.
- A way for the user to map a commodity to an Agmarknet source via a curated
  picker — no free-text, no typos.
- One auto-fetched price point per ISO week per mapped commodity, updated in
  place; manual and auto-fetched points coexist.
- A visible "last synced" indicator so a silently-failing fetch is noticeable.
- Zero disruption to Phase 1: existing commodities and manual entry are
  untouched until the user explicitly maps a commodity.

## Non-goals (Phase 2)

- No manual "Sync now" trigger — the scheduled run is the only trigger
  (a callable "Sync now" is a clean, deferrable follow-on if wanted later).
- No admin sync-history log — the per-commodity indicator is the only sync
  surface.
- No "Commodity Watch" analytics tab, no Calculations integration (Phase 3).
- No commodities beyond the coconut family the Agmarknet resource supports;
  anything else stays manual-entry.

## Decisions (from brainstorming)

| Question | Decision |
|---|---|
| Trigger model | **A — scheduled function only**, daily 6am IST. No manual trigger |
| Commodity ↔ Agmarknet link | **Curated picker** — a small built-in list; commodities not on it stay manual-only |
| Fetch cadence / granularity | **One point per ISO week**, updated in place (function runs daily, keeps the latest reading for the current week) |
| Region scope | **Andhra Pradesh, averaged** — average the modal price across all reporting AP markets |
| Sync visibility | **"Last synced" indicator** on the commodity detail page |

## Architecture

### Data model changes

Two additive, optional fields on `sharedCommodities/{id}` — existing
commodities (the Phase 1 seeds, anything user-added) keep working untouched, so
**no migration is needed**:

- **`agmarknet`** — `null` (manual-only, the default) or `{ key, name }` when
  mapped. `key` is the curated-picker value (e.g. `'copra'`); `name` is the
  exact data.gov.in `filters[commodity]` string (e.g. `'Copra'`). Because the
  resolved `name` is stored on the doc, the **function needs no commodity list
  of its own** — the client's curated list is the single source of truth.
- **`sync`** — `null`, or `{ at, status, message }` written by the function on
  each run. `at` is an epoch ms; `status` is `'ok'` / `'no-data'` / `'error'`;
  `message` is a short human-readable string.

**History points gain a `source` field** — `'manual'` or `'agmarknet'`.
History points written before Phase 2 (no `source`) are treated as `'manual'`
everywhere they're read. The scheduled function only ever writes or replaces
`'agmarknet'` points; manual entry (Phase 1's `PriceEntryModal` mode `'price'`)
is unchanged and writes `'manual'` points. The two coexist in the same
ascending-by-`ts` `history` array.

`currentPrice` / `pctChange` / `range52w` / `Sparkline` already operate on the
whole `history` array regardless of `source` — they need no changes.

### Curated Agmarknet list

New module **`src/pages/Markets/agmarknetCommodities.js`** — exports
`AGMARKNET_COMMODITIES`, the coconut-family commodities the data.gov.in
Agmarknet resource (`9ef84268-d588-465a-a308-a864a43d0070`) supports:
Coconut, Copra, Coconut Oil, Coconut Seed, Tender Coconut, Dry Coconut. Each
entry is `{ key, label, name }` — `key` stored on the commodity doc, `label`
shown in the picker, `name` the exact API `filters[commodity]` value.

### UI changes

- **`AddCommodityModal.jsx`** and **`PriceEntryModal.jsx` (edit mode)** gain an
  "Auto-fetch source" `<select>`: a "Manual only" option (default) plus the
  `AGMARKNET_COMMODITIES` entries. Choosing one sets the commodity's
  `agmarknet` field to `{ key, name }`; "Manual only" sets it to `null`.
- **`CommodityDetailPage.jsx`** — for a commodity with `agmarknet` set, a
  "last synced" indicator near the header / price-history card, driven by
  `commodity.sync`:
  - `status: 'ok'` → "Auto-synced from Agmarknet · <relative time>"
  - `status: 'no-data'` → "No Andhra Pradesh market data this week"
  - `status: 'error'` → "Sync error — <message>"
  - `sync == null` (mapped but never run yet) → "Auto-fetch enabled — first sync pending"
- **`CommodityDetailPage.jsx`** entries table — `'agmarknet'`-source rows get a
  small "auto" tag so manual vs fetched points are visually distinguishable.

### The scheduled Cloud Function

A new `onSchedule` export in `functions/index.js`, reusing the file's existing
`firebase-functions/v2` + `defineSecret` patterns.

- **Import:** `onSchedule` from `firebase-functions/v2/scheduler`.
- **Secret:** `DATA_GOV_IN_API_KEY` via `defineSecret` — same mechanism as the
  existing `GEMINI_API_KEY`, never shipped to the client.
- **Schedule:** cron `'0 6 * * *'`, `timeZone: 'Asia/Kolkata'` — daily 6am IST.
- **Per run:**
  1. Read all `sharedCommodities` docs; keep the ones with `agmarknet` set
     (there are few commodities — filter in code, no special index needed).
  2. For each mapped commodity, `GET` the data.gov.in Agmarknet resource with
     `api-key`, `format=json`, a generous `limit`, `filters[commodity]=<agmarknet.name>`,
     and `filters[state]=Andhra Pradesh`.
  3. Average the **modal price** across the returned AP market records → the
     week's price. (The exact modal-price JSON key — typically `modal_price` —
     is confirmed against a live sample response during implementation; it is a
     documented public API.)
  4. Compute the current ISO week's Monday at 00:00 IST as the point's `ts`.
     Remove any existing `source: 'agmarknet'` point with that same `ts` from
     `history`, push `{ ts, date, price, source: 'agmarknet' }`, re-sort
     ascending by `ts` — this is the "one point per week, updated in place".
  5. `updateDoc` the commodity with the new `history` plus
     `sync: { at: Date.now(), status: 'ok', message }`.
- **Per-commodity isolation:** a fetch error, non-200 response, or empty result
  set is caught per commodity — it writes `sync.status` `'error'` or
  `'no-data'` (with `message`) and leaves that commodity's `history` untouched.
  One commodity failing never blocks the others.
- **Idempotent:** running twice in one day just re-updates the current week's
  point. Uses `firebase-admin` (already a dependency) for Firestore; Node 22's
  global `fetch` for the HTTP call. A small inline "Monday of this week" helper
  lives in the function (it cannot import from `src/`).

## Error handling & edge cases

- **Missing / invalid `DATA_GOV_IN_API_KEY`** — the function logs the failure
  and writes `sync.status: 'error'` on the commodities it attempted, rather
  than throwing and aborting the whole batch silently.
- **Agmarknet down / timeout / non-200** — caught per commodity →
  `sync.status: 'error'`, `history` untouched.
- **No AP records for a commodity that week** — `sync.status: 'no-data'`,
  `history` untouched (the previous week's point simply remains the latest).
- **Backward compatibility** — the function only touches commodities with
  `agmarknet` set. Until the user maps one via the UI, the function is a
  harmless no-op; Phase 1 seed and manual commodities are never modified.
- **Doc size** — weekly `'agmarknet'` points plus manual points stay far under
  the Firestore 1 MB doc limit for many years.
- **Manual + auto for the same week** — both points can exist (different
  `source`); `currentPrice` (latest by `ts`) shows whichever was written last.
  This is acceptable: a user manually correcting a week's price after an
  auto-fetch is a legitimate override.

## Testing

The project has no unit-test runner — verification is `npm run build` (must
pass) plus Playwright e2e. The scheduled function is **not** e2e-testable (the
`?e2e=1` harness has no Firestore data and no Cloud Functions); it is verified
via the Firebase emulator (`firebase emulators:start --only functions`) and a
live test commodity against a real deploy.

e2e coverage (added to `e2e/markets.spec.js`): the `AddCommodityModal` shows
the "Auto-fetch source" field. The function's behaviour — fetch, averaging,
ISO-week update-in-place, per-commodity error isolation, the detail-page sync
indicator — is verified via emulator + runtime use.

Each implementation task ends with a successful `npm run build`.

## Files touched

**New:**
- `src/pages/Markets/agmarknetCommodities.js`

**Modified:**
- `functions/index.js` — the `onSchedule` Agmarknet fetch function + the
  `DATA_GOV_IN_API_KEY` secret
- `src/pages/Markets/AddCommodityModal.jsx` — "Auto-fetch source" picker
- `src/pages/Markets/PriceEntryModal.jsx` — "Auto-fetch source" picker in edit mode
- `src/pages/Markets/CommodityDetailPage.jsx` — "last synced" indicator + "auto"
  tag on agmarknet entries
- `e2e/markets.spec.js` — assertion that the auto-fetch source field renders

**Not modified:** `src/context/AppContext.jsx` needs no change — `addCommodity`
spreads the whole commodity object (so the new `agmarknet` field flows through)
and `updateCommodity(id, patch)` passes the patch straight to `updateDoc`. The
`sync` field is written only by the Cloud Function via `firebase-admin`, never
through `AppContext`.

## Follow-up operational steps (not code)

- Register for a free data.gov.in API key (data.gov.in account).
- Set the secret: `firebase functions:secrets:set DATA_GOV_IN_API_KEY`.
- Deploy: `firebase deploy --only functions` — the first deploy of the
  scheduled function auto-provisions Cloud Scheduler (Blaze plan, already
  active).
