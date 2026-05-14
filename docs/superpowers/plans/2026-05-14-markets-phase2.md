# Markets Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add automatic commodity-price fetching — a scheduled Firebase Function pulls daily AP-averaged modal prices from the data.gov.in Agmarknet API for commodities mapped via a curated picker, maintaining one price point per ISO week.

**Architecture:** Two additive optional fields on the `sharedCommodities` doc (`agmarknet` mapping, `sync` status) and a `source` field on history points — no migration. A curated client-side list (`agmarknetCommodities.js`) is the single source of truth; the commodity doc stores the resolved Agmarknet name so the Cloud Function needs no list of its own. A new `onSchedule` function in `functions/index.js` runs daily at 6am IST, fetches per mapped commodity, and updates the current ISO-week point in place.

**Tech Stack:** React 18 + Vite (client), Firebase Functions v2 (`firebase-functions` ^6, Node 22, ESM), Firebase Firestore, data.gov.in Agmarknet REST API, Playwright e2e.

**Reference spec:** `docs/superpowers/specs/2026-05-14-markets-phase2-design.md`

**Verification note:** This project has **no unit-test runner** — verification is `npm run build` (must pass) plus Playwright e2e. The Cloud Function is **not** e2e-testable (the `?e2e=1` harness has no Firestore/functions); its task uses `node --check` for a syntax gate and is verified for real via the Firebase emulator / a live deploy. There are **14 pre-existing failures** in `e2e/theming.spec.js` (retired `aura`/`lemon` themes) unrelated to this work — ignore them. Each task ends with a build check and a commit.

**`AppContext.jsx` is intentionally NOT modified** — `addCommodity` spreads the whole commodity object (so the new `agmarknet` field flows through) and `updateCommodity(id, patch)` passes the patch straight to `updateDoc`. The `sync` field is written only by the Cloud Function via `firebase-admin`.

---

### Task 1: Curated Agmarknet commodity list

**Files:**
- Create: `src/pages/Markets/agmarknetCommodities.js`

- [ ] **Step 1: Create the file** with EXACTLY this content:

```javascript
// Coconut-family commodities supported by the data.gov.in Agmarknet resource
// (9ef84268-d588-465a-a308-a864a43d0070). `key` is stored on the commodity
// doc's `agmarknet.key`; `label` is shown in the picker; `name` is the exact
// `filters[commodity]` value the scheduled Cloud Function sends to the API.
export const AGMARKNET_COMMODITIES = [
  { key: 'coconut',        label: 'Coconut',        name: 'Coconut' },
  { key: 'copra',          label: 'Copra',          name: 'Copra' },
  { key: 'coconut-oil',    label: 'Coconut Oil',    name: 'Coconut Oil' },
  { key: 'coconut-seed',   label: 'Coconut Seed',   name: 'Coconut Seed' },
  { key: 'tender-coconut', label: 'Tender Coconut', name: 'Tender Coconut' },
  { key: 'dry-coconut',    label: 'Dry Coconut',    name: 'Dry Coconut' },
];

// Resolve a stored agmarknet key to its full entry — used to re-select the
// picker when editing. Returns null for unknown / missing keys.
export function agmarknetByKey(key) {
  return AGMARKNET_COMMODITIES.find(c => c.key === key) || null;
}
```

- [ ] **Step 2: Verify the build passes**

Run: `npm run build`
Expected: build completes with no errors (the file parses; not imported yet).

- [ ] **Step 3: Commit**

```bash
git add src/pages/Markets/agmarknetCommodities.js
git commit -m "feat: add curated Agmarknet commodity list for Markets Phase 2"
```

---

### Task 2: "Auto-fetch source" picker in `AddCommodityModal`

**Files:**
- Modify: `src/pages/Markets/AddCommodityModal.jsx`

- [ ] **Step 1: Add the import**

At the top of `src/pages/Markets/AddCommodityModal.jsx`, after the line `import { useToast } from '../../context/ToastContext';`, add:

```jsx
import { AGMARKNET_COMMODITIES } from './agmarknetCommodities';
```

- [ ] **Step 2: Add the `agmarknetKey` state**

Find `const [price, setPrice] = useState('');` and add immediately after it:

```jsx
  const [agmarknetKey, setAgmarknetKey] = useState('');
```

- [ ] **Step 3: Build the `agmarknet` field in `handleSubmit`**

In `handleSubmit`, replace the commodity-object construction:

```jsx
      const commodity = {
        name: name.trim(),
        unit: unit.trim(),
        mandi: mandi.trim(),
        color,
        notes: '',
        history: [],
      };
```

with:

```jsx
      const ag = AGMARKNET_COMMODITIES.find(c => c.key === agmarknetKey);
      const commodity = {
        name: name.trim(),
        unit: unit.trim(),
        mandi: mandi.trim(),
        color,
        notes: '',
        agmarknet: ag ? { key: ag.key, name: ag.name } : null,
        history: [],
      };
```

- [ ] **Step 4: Add the picker field to the form**

Find the "Colour" field block (the `<div>` containing `<label style={labelStyle}>Colour</label>`). Immediately AFTER that block's closing `</div>` and BEFORE the "Current price (optional)" `<div>`, insert:

```jsx
          <div>
            <label style={labelStyle}>Auto-fetch source (optional)</label>
            <select style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
              value={agmarknetKey} onChange={e => setAgmarknetKey(e.target.value)}>
              <option value="">Manual only</option>
              {AGMARKNET_COMMODITIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, marginTop: 4 }}>
              Mapped commodities auto-update weekly from Agmarknet (Andhra Pradesh average).
            </div>
          </div>
```

- [ ] **Step 5: Verify the build passes**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Markets/AddCommodityModal.jsx
git commit -m "feat: add Agmarknet auto-fetch source picker to AddCommodityModal"
```

---

### Task 3: "Auto-fetch source" picker in `PriceEntryModal` (edit mode)

**Files:**
- Modify: `src/pages/Markets/PriceEntryModal.jsx`

- [ ] **Step 1: Add the import**

At the top of `src/pages/Markets/PriceEntryModal.jsx`, after `import { useToast } from '../../context/ToastContext';`, add:

```jsx
import { AGMARKNET_COMMODITIES } from './agmarknetCommodities';
```

- [ ] **Step 2: Add the `agmarknetKey` state**

Find `const [notes, setNotes] = useState(commodity?.notes || '');` and add immediately after it:

```jsx
  const [agmarknetKey, setAgmarknetKey] = useState(commodity?.agmarknet?.key || '');
```

- [ ] **Step 3: Include `agmarknet` in the edit patch**

In `handleSubmit`, replace the `else` branch's call:

```jsx
        await onSubmitEdit({ name: name.trim(), unit: unit.trim(), mandi: mandi.trim(), color, notes: notes.trim() });
```

with:

```jsx
        const ag = AGMARKNET_COMMODITIES.find(c => c.key === agmarknetKey);
        await onSubmitEdit({ name: name.trim(), unit: unit.trim(), mandi: mandi.trim(), color, notes: notes.trim(), agmarknet: ag ? { key: ag.key, name: ag.name } : null });
```

- [ ] **Step 4: Add the picker field to the edit form**

In the edit-mode JSX branch (the `) : (` block), find the "Colour" field `<div>` block (the one containing `<label style={labelStyle}>Colour</label>`). Immediately AFTER that block's closing `</div>` and BEFORE the "Notes (optional)" `<div>`, insert:

```jsx
              <div>
                <label style={labelStyle}>Auto-fetch source</label>
                <select style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
                  value={agmarknetKey} onChange={e => setAgmarknetKey(e.target.value)}>
                  <option value="">Manual only</option>
                  {AGMARKNET_COMMODITIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, marginTop: 4 }}>
                  Mapped commodities auto-update weekly from Agmarknet (Andhra Pradesh average).
                </div>
              </div>
```

- [ ] **Step 5: Verify the build passes**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Markets/PriceEntryModal.jsx
git commit -m "feat: add Agmarknet auto-fetch source picker to PriceEntryModal edit mode"
```

---

### Task 4: Sync indicator + "auto" entry tag in `CommodityDetailPage`

**Files:**
- Modify: `src/pages/Markets/CommodityDetailPage.jsx`

- [ ] **Step 1: Add a relative-time helper**

In `src/pages/Markets/CommodityDetailPage.jsx`, immediately after the `fmtPrice` helper (the `const fmtPrice = (n) => { ... };` block, before `export default function`), add:

```jsx
// Short relative-time label for the sync indicator. `ms` is an epoch.
const relTime = (ms) => {
  if (!ms) return '';
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 3600)  return `${Math.max(1, Math.floor(s / 60))}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

// Derives the sync-indicator text + colour from a commodity's `sync` field.
// Only called for commodities with an `agmarknet` mapping.
const syncIndicator = (commodity, dangerColor, mutedColor) => {
  const sync = commodity.sync;
  if (!sync)                    return { text: 'Auto-fetch enabled — first sync pending', color: mutedColor };
  if (sync.status === 'ok')     return { text: `Auto-synced from Agmarknet · ${relTime(sync.at)}`, color: mutedColor };
  if (sync.status === 'no-data') return { text: 'No Andhra Pradesh market data this week', color: mutedColor };
  return { text: `Sync error — ${sync.message || 'check the API key'}`, color: dangerColor };
};
```

- [ ] **Step 2: Render the sync indicator in the header**

Find the unit/mandi line in the header:

```jsx
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3 }}>
            {commodity.unit}{commodity.mandi ? ` · ${commodity.mandi}` : ''}
          </div>
```

Immediately AFTER that `</div>`, insert:

```jsx
          {commodity.agmarknet && (() => {
            const ind = syncIndicator(commodity, C.danger, C.fg3);
            return (
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: ind.color, marginTop: 4 }}>
                {ind.text}
              </div>
            );
          })()}
```

- [ ] **Step 3: Tag `agmarknet`-source rows in the entries table**

Find the entries-table row's date `<span>`:

```jsx
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2 }}>{e.date}</span>
```

Replace it with:

```jsx
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {e.date}
                  {e.source === 'agmarknet' && (
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.accent, background: alpha(C.accent, 11), border: `1px solid ${alpha(C.accent, 33)}`, borderRadius: 3, padding: '1px 5px' }}>auto</span>
                  )}
                </span>
```

- [ ] **Step 4: Verify the build passes**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Markets/CommodityDetailPage.jsx
git commit -m "feat: add Agmarknet sync indicator + auto entry tag to CommodityDetailPage"
```

---

### Task 5: The scheduled Agmarknet fetch Cloud Function

**Files:**
- Modify: `functions/index.js`

- [ ] **Step 1: Add the imports and secret**

In `functions/index.js`, find the import line `import { onCall, HttpsError } from 'firebase-functions/v2/https';` and add immediately after it:

```javascript
import { onSchedule } from 'firebase-functions/v2/scheduler';
```

Then find the line `const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');` and add immediately after it:

```javascript
// data.gov.in API key for the Agmarknet price feed — set via
// `firebase functions:secrets:set DATA_GOV_IN_API_KEY`. Never shipped to clients.
const DATA_GOV_IN_API_KEY = defineSecret('DATA_GOV_IN_API_KEY');
```

- [ ] **Step 2: Add the scheduled function at the end of the file**

Append the following to the END of `functions/index.js` (after the last existing export, `summariseDocumentText`):

```javascript

// ── Agmarknet auto-fetch (Markets Phase 2) ──────────────────────────────
// A scheduled function pulls daily mandi prices from the data.gov.in
// Agmarknet API for every commodity the user has mapped (via the curated
// picker) to an Agmarknet source, keeping one price point per ISO week in
// the commodity's `history`. It only touches commodities with an
// `agmarknet` mapping — a no-op until the user maps one, so Phase 1 seed
// and manual commodities are never modified.

const AGMARKNET_RESOURCE = '9ef84268-d588-465a-a308-a864a43d0070';

// Monday 00:00 (server-local) of the week containing `now`. Used as the
// stable `ts` for the current week's auto-fetched point so a daily re-run
// updates that point in place instead of appending duplicates.
function startOfWeek(now = Date.now()) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7; // Mon=0 .. Sun=6
  d.setDate(d.getDate() - day);
  return d.getTime();
}

const agmarknetDateLabel = () =>
  new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// Fetch the Andhra-Pradesh-averaged modal price for one Agmarknet commodity
// name. Returns a number, or null when no AP records are available.
async function fetchAgmarknetPrice(apiKey, commodityName) {
  const url = new URL(`https://api.data.gov.in/resource/${AGMARKNET_RESOURCE}`);
  url.searchParams.set('api-key', apiKey);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1000');
  url.searchParams.set('filters[commodity]', commodityName);
  url.searchParams.set('filters[state]', 'Andhra Pradesh');

  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`Agmarknet API responded ${res.status}`);
  const data = await res.json();
  const records = Array.isArray(data?.records) ? data.records : [];

  // The modal-price field in the data.gov.in JSON is `modal_price`.
  const modals = records
    .map(r => parseFloat(r.modal_price))
    .filter(n => Number.isFinite(n) && n > 0);
  if (modals.length === 0) return null;
  return modals.reduce((a, b) => a + b, 0) / modals.length;
}

// Runs daily at 6am IST.
export const syncAgmarknetPrices = onSchedule(
  {
    schedule: '0 6 * * *',
    timeZone: 'Asia/Kolkata',
    secrets: [DATA_GOV_IN_API_KEY],
    timeoutSeconds: 300,
    memory: '256MiB',
  },
  async () => {
    const apiKey = DATA_GOV_IN_API_KEY.value();
    const snap = await db.collection('sharedCommodities').get();
    const mapped = snap.docs.filter(d => d.data()?.agmarknet?.name);

    const weekTs = startOfWeek();
    const weekDate = agmarknetDateLabel();

    for (const docSnap of mapped) {
      const commodity = docSnap.data();
      const ref = docSnap.ref;
      try {
        const price = await fetchAgmarknetPrice(apiKey, commodity.agmarknet.name);
        if (price == null) {
          await ref.update({
            sync: { at: Date.now(), status: 'no-data', message: 'No Andhra Pradesh market data this week.' },
          });
          continue;
        }
        const rounded = Math.round(price * 100) / 100;
        // One point per ISO week, updated in place: drop any existing
        // agmarknet point for this week, append the fresh one, re-sort.
        const history = Array.isArray(commodity.history) ? commodity.history : [];
        const kept = history.filter(p => !(p.source === 'agmarknet' && p.ts === weekTs));
        kept.push({ ts: weekTs, date: weekDate, price: rounded, source: 'agmarknet' });
        kept.sort((a, b) => (a.ts || 0) - (b.ts || 0));
        await ref.update({
          history: kept,
          sync: { at: Date.now(), status: 'ok', message: `Synced ₹${rounded} from Agmarknet (AP average).` },
        });
      } catch (err) {
        console.error('[syncAgmarknetPrices]', commodity.name, err);
        await ref.update({
          sync: { at: Date.now(), status: 'error', message: String(err?.message || err).slice(0, 200) },
        });
      }
    }
    console.log(`[syncAgmarknetPrices] processed ${mapped.length} mapped commodit${mapped.length === 1 ? 'y' : 'ies'}`);
  }
);
```

- [ ] **Step 3: Syntax-check the function module**

Run: `node --check functions/index.js`
Expected: no output, exit code 0 (the ES module parses cleanly).

- [ ] **Step 4: Verify the frontend build still passes**

Run: `npm run build`
Expected: build completes with no errors (the frontend build does not include `functions/`; this confirms nothing else broke).

- [ ] **Step 5: Commit**

```bash
git add functions/index.js
git commit -m "feat: add scheduled Agmarknet price-sync Cloud Function"
```

---

### Task 6: e2e coverage for the auto-fetch source field

**Files:**
- Modify: `e2e/markets.spec.js`

- [ ] **Step 1: Add the test**

In `e2e/markets.spec.js`, append this test at the end of the file (after the last existing test):

```javascript

test('add-commodity modal has the auto-fetch source field', async ({ page }) => {
  await goto(page, 'markets');
  await page.locator('button').filter({ hasText: /Track/ }).first().click();
  await page.waitForTimeout(200);
  await expect(page.locator('text=Auto-fetch source').first()).toBeVisible();
});
```

- [ ] **Step 2: Run the markets spec**

Run: `npm run test:e2e -- markets`
Expected: all tests pass across the 3 Playwright projects (web / ipad / mobile) — the existing 6 tests plus this new one.

- [ ] **Step 3: Run the full e2e suite for regressions**

Run: `npm run test:e2e`
Expected: the suite passes except the **14 pre-existing `theming.spec.js` failures** (retired `aura`/`lemon` themes). No other failures.

- [ ] **Step 4: Verify the build passes**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 5: Commit**

```bash
git add e2e/markets.spec.js
git commit -m "test: cover the Agmarknet auto-fetch source field in AddCommodityModal"
```

---

## Self-Review

**1. Spec coverage:**

| Spec requirement | Task |
|---|---|
| `agmarknet` field on the commodity doc (`{ key, name }` / `null`) | Tasks 2, 3 (modals write it) |
| `sync` field written by the function | Task 5 |
| `source` field on history points; pre-Phase-2 points treated as manual | Task 5 writes `source: 'agmarknet'`; Task 4 reads `e.source` (absent ⇒ not tagged "auto") |
| `agmarknetCommodities.js` curated list (key/label/name) | Task 1 |
| "Auto-fetch source" picker in AddCommodityModal | Task 2 |
| "Auto-fetch source" picker in PriceEntryModal edit mode | Task 3 |
| "last synced" indicator on CommodityDetailPage (ok / no-data / error / pending) | Task 4 |
| "auto" tag on agmarknet entries in the table | Task 4 |
| `onSchedule` function, daily 6am IST, `DATA_GOV_IN_API_KEY` secret | Task 5 |
| Read mapped commodities, fetch AP-averaged modal price, one point per ISO week updated in place | Task 5 |
| Per-commodity error isolation (`error` / `no-data` status, history untouched) | Task 5 (`try/catch` per commodity; `no-data` branch `continue`s without touching history) |
| Idempotent (re-run updates the week's point) | Task 5 (`kept` filters out the existing same-week agmarknet point) |
| Backward compatible — function no-ops until a commodity is mapped | Task 5 (`mapped` filter on `agmarknet?.name`) |
| `AppContext.jsx` not modified | Confirmed in the plan header — no task touches it |
| e2e: AddCommodityModal shows the auto-fetch source field | Task 6 |

All spec requirements map to a task. No gaps.

**2. Placeholder scan:** No "TBD"/"TODO"/"handle edge cases"/"similar to Task N" — every step has complete code or an exact command. The data.gov.in `modal_price` JSON key is committed to as the actual field name (it is the documented schema for resource `9ef84268-...`); if it were ever wrong the function degrades safely to `no-data`, visible via the sync indicator. The only deferred items are operational (API-key registration, secret-set, function deploy) — flagged, not code placeholders.

**3. Type consistency:** Verified across tasks —
- `agmarknet` shape `{ key, name }` — written identically in `AddCommodityModal` (Task 2) and `PriceEntryModal` (Task 3) via `ag ? { key: ag.key, name: ag.name } : null`; read by the function as `commodity.agmarknet.name` and `.agmarknet?.name` (Task 5) and by `CommodityDetailPage` as `commodity.agmarknet` truthiness (Task 4).
- `AGMARKNET_COMMODITIES` entries are `{ key, label, name }` (Task 1) — consumed as `c.key`/`c.label` in the pickers (Tasks 2, 3) and `ag.key`/`ag.name` when building the field.
- History point shape `{ ts, date, price, source }` — the function writes `source: 'agmarknet'` (Task 5); `CommodityDetailPage` reads `e.source` (Task 4); manual points from `PriceEntryModal` mode `'price'` have no `source` and are treated as non-auto. The existing `marketsMath` helpers operate on `ts`/`price` only — unaffected.
- `sync` shape `{ at, status, message }` — written by the function (Task 5) with `status` ∈ `'ok'`/`'no-data'`/`'error'`; read by `syncIndicator` in `CommodityDetailPage` (Task 4) which branches on exactly those three values plus the `null` case.
- `startOfWeek` (function, Task 5) produces the point `ts`; the same Monday-00:00 convention as the client's `marketsMath` so manual and auto points sort coherently in one array.

No inconsistencies found.

## Follow-up operational steps (not code)

- Register for a free data.gov.in API key (data.gov.in account).
- Set the secret: `firebase functions:secrets:set DATA_GOV_IN_API_KEY`.
- Deploy the functions: `firebase deploy --only functions` — the first deploy of `syncAgmarknetPrices` auto-provisions Cloud Scheduler (Blaze plan, already active).
- Optionally verify against the emulator first: `cd functions && npm run serve`, then map a test commodity (e.g. Copra) and trigger the scheduled function from the emulator UI.
