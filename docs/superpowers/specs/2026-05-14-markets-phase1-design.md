# Markets — Phase 1 Design (Remove Documents + Markets Core)

**Date:** 2026-05-14
**Status:** Approved (pending written-spec review)

## Summary

Replace the **Documents** page with a new **Markets** feature for tracking
commodity / raw-material prices. Phase 1 delivers the core: remove the
Documents page entirely, and add a `sharedCommodities` collection with manual
weekly price entry, a "Today's Mandi" overview grid, and a per-commodity detail
view.

This is **Phase 1 of 3**. Phases 2 and 3 are out of scope here and get their
own spec → plan → build cycles:

- **Phase 2 — Auto-fetch:** a scheduled Firebase Function pulling
  data.gov.in Agmarknet prices for API-covered commodities (Copra, Coconut).
- **Phase 3 — Analytics & Calculations integration:** the "Commodity Watch"
  indexed-trend tab, Input Cost / Output Tailwind callout cards, and binding
  Calculations variable-cost rows to a Markets commodity so a project picks its
  raw-material price from the available Mandi data.

## Goals

- Remove the Documents page and its data layer cleanly, without touching the
  file-upload plumbing shared by Plans / Ideas / Research Vault.
- Add a per-commodity price tracker: anyone signed in can add a commodity and
  enter dated price points.
- An overview grid showing every commodity's current price, unit, mandi,
  12-week % change, sparkline, and 52-week low/high.
- A per-commodity detail view with the full price history, a chart, and price
  entry / edit / delete.
- Stay within the app's existing architecture, routing, and permission
  patterns.

## Non-goals (Phase 1)

- No external price API / scheduled function (Phase 2).
- No indexed multi-commodity trend chart, no Input Cost / Output Tailwind
  callout cards (Phase 3).
- No "my plan" target line and no Calculations ↔ Markets binding (Phase 3).
- No market/mandi filter control ("All Markets" pill from the mockup) — not
  needed at Phase 1 commodity counts.

## Decisions (from brainstorming)

| Question | Decision |
|---|---|
| Data source | **Hybrid** overall; Phase 1 is manual entry only. "Live price" = latest manually-entered value |
| Commodity list | **Anyone signed in can add** commodities; new ones are manual-entry |
| Page structure | **Overview grid + drill-in detail.** Analytics tab is Phase 3 |
| "my plan" target line | **Deferred to Phase 3** — Calculations will pull prices *from* Markets |
| Documents data | **Delete the files too** — UI removed in code; `sharedFiles` docs and *only the `uploads/` blobs those docs reference* deleted as a one-time manual step |
| Price-history model | **A — embedded `history` array** on the commodity doc |

## Architecture

### Part 1 — Removing Documents

**Files deleted:**
- `src/pages/FilesPage.jsx`
- `src/pages/FileDetailPage.jsx`

**`src/context/AppContext.jsx`:** remove the `sharedFiles` collection entirely —
`FilesContext`, the `files` state, the `sharedFiles` `onSnapshot` subscription,
`addFile` / `updateFile` / `deleteFile`, `filesValue`, the
`FilesContext.Provider` wrapper, the `useFiles` hook, and the `...useFiles()`
line in `useAppData`. The `loadedCount.current >= 4` ready-gate becomes `>= 3`
(three remaining subscriptions: ideas, projects, plans).

**`src/App.jsx`:** remove the `FilesPage` / `FileDetailPage` lazy imports, the
`useFiles()` call and `files` resolution, `'documents'` from `LINKABLE`,
`'document-detail'` from `DETAIL`, and the `case 'documents'` /
`case 'document-detail'` branches in `renderPage`. (Replaced by the Markets
route wiring in Part 2.)

**`src/components/SideNav.jsx`:** remove the `documents` `NAV_ITEMS` entry and
the `'document-detail': 'documents'` line in `ACTIVE_MAP`. (Replaced by the
Markets nav item in Part 2.)

**`src/components/CommandPalette.jsx`:** remove the `go-documents` command.
(Replaced by `go-markets` in Part 2.)

**`src/pages/AboutPage.jsx`:** remove the Documents references — the
`dest: 'documents'` entry and the "Keep the documents in one place" paragraph
with its inline link.

**`src/pages/Dashboard.jsx`:** remove the `useFiles` import + call, the `files`
usage, and the recent-files / "Documents" card and its actions.

**`firestore.rules`:** remove the now-dead `match /sharedFiles/{fileId}` block
(rules redeploy required).

**Kept untouched** — still used by Plan/Idea attachments and Research Vault:
`src/utils/fileStorage.js`, `src/components/UploadZone.jsx`,
`src/components/AttachmentEditor.jsx`, `src/components/AttachedFileViewer.jsx`,
`src/components/PdfPageRenderer.jsx`.

**Data deletion (operational, not code):** deleting the existing `sharedFiles`
Firestore documents is a one-time **manual** step performed via the Firebase
console — documented as a follow-up action, the same way the Firestore-rules
deploy is. No auto-running destructive code ships.

**Important — `uploads/` is shared storage.** The `uploads/` Storage folder
holds blobs for `sharedFiles` *and* for Plan/Idea attachments *and* for Research
Vault clips. Only the blobs referenced by `sharedFiles` documents may be
deleted — each `sharedFiles` doc carries the `blobId` (or `attachedFile.blobId`)
identifying its specific `uploads/<blobId>` object. The follow-up step must
delete those specific blobs, **not** the whole `uploads/` folder, or it will
destroy attachments and clips still in use.

### Part 2 — Markets core

#### Data model & subscription

New top-level collection `sharedCommodities/{id}` (id = `Date.now()`, matching
the app convention). Subscribed in `AppContext` in the slot vacated by
`sharedFiles` — net-zero change to the subscription count — and exposed via a
`useCommodities()` hook.

Commodity document shape:

```
{
  id,            // Date.now()
  name,          // "Coconut Husk"
  unit,          // "₹/piece"
  mandi,         // market label, e.g. "Rajahmundry mandi"
  color,         // palette token chosen on create — stable per commodity
                 //   (needed for the Phase 3 multi-commodity trend chart)
  notes,         // optional free text
  addedBy,       // user.email — matches sharedFiles / clips convention
  createdAt,     // Date.now()
  history: [     // ascending by ts; the last entry is the current price
    { ts, date, price },   // ts = epoch of the price date; date = display string; price = number
    …
  ],
}
```

All derived values are computed client-side from `history` — there are no
stored aggregates. Pure helpers live in `src/pages/Markets/marketsMath.js`:

- `currentPrice(history)` — price of the latest entry, or `null` if empty.
- `pctChange(history, weeks)` — % change of the latest price vs the entry
  closest to `weeks` ago; falls back to the earliest entry when there is less
  than `weeks` of data; `null` if fewer than 2 entries.
- `range52w(history)` — `{ low, high }` over entries within the last 52 weeks
  (all entries if less than 52 weeks of data); `null` if empty.
- `sortHistory(history)` — returns a copy sorted ascending by `ts`.

`AppContext` CRUD callbacks, mirroring the existing collections:

- `addCommodity(commodity)` — `setDoc` with `id = Date.now()`, `createdAt`,
  `addedBy`.
- `updateCommodity(id, patch)` — `updateDoc`.
- `deleteCommodity(id)` — `deleteDoc`.
- `restoreCommodity(commodity)` — `setDoc` of the full object (for undo).

#### Seed data

`ensureSharedData` in `AppContext` is extended to also seed `sharedCommodities`
on first load (when the collection is empty), with the four mockup commodities,
each carrying a single initial `history` point so the overview grid renders
meaningfully from day one:

| name | unit | mandi | initial price |
|---|---|---|---|
| Coconut Husk | ₹/piece | Rajahmundry mandi | 0.95 |
| Coir Fiber | ₹/kg | Rajahmundry mandi | 24.5 |
| Copra (Milling) | ₹/quintal | Rajahmundry mandi | 11850 |
| Shell Charcoal | ₹/kg | Rajahmundry mandi | 38.0 |

#### Routing & nav

- `LINKABLE` in `App.jsx`: `'documents'` → `'markets'`.
- `DETAIL` in `App.jsx`: `'document-detail'` → `'commodity-detail'`
  (hash `#/commodity-detail/<id>`).
- `renderPage`: a `case 'markets'` rendering a lazy-loaded `MarketsPage`, and a
  `case 'commodity-detail'` that resolves the commodity from the in-memory
  `commodities` array (`commodities.find(c => c.id == itemId)`) and renders
  `CommodityDetailPage`, reusing the existing `NotFound` component when the id
  is absent or unmatched — the same pattern as `project-detail`.
- `SideNav.jsx`: a "Markets" `NAV_ITEMS` entry with a line-chart icon, in the
  slot Documents occupied; `ACTIVE_MAP` gets `'commodity-detail': 'markets'`.
- `CommandPalette.jsx`: a `go-markets` command ("Go to Markets").

#### Page structure & components

New folder `src/pages/Markets/`:

| File | Responsibility |
|---|---|
| `index.jsx` | `MarketsPage` — the "Today's Mandi" overview: header (title, date line, **+ Track** button), a responsive grid of `CommodityCard`s, empty state. Reads `useCommodities()`. |
| `CommodityCard.jsx` | Overview card — name + color dot, current price, unit, mandi, 12-week % change (↑ green / ↓ red), `Sparkline`, 52-week low/high. Click navigates to `commodity-detail`. |
| `Sparkline.jsx` | Tiny inline-SVG line chart drawn from a commodity's `history`. |
| `CommodityDetailPage.jsx` | Per-commodity detail — breadcrumb `MARKETS / <name>`, large current price + 12-week change, a full price-history line chart, a price-history table, **+ Add price**, and edit / delete for the commodity. Receives the `commodity` object resolved in `App.jsx`. |
| `AddCommodityModal.jsx` | Create flow — name, unit, mandi, color picker, optional first price. |
| `PriceEntryModal.jsx` | Add a dated price point (date defaults to today; positive-number validation). Also backs the commodity edit form (name / unit / mandi / color / notes). |
| `EmptyState.jsx` | No-commodities state, reusing an existing illustration. |
| `marketsMath.js` | The pure helpers described above. |

Reused UI: `C` design tokens, `ConfirmModal`, `useToast`, an illustration from
`src/components/illustrations`.

#### Interactions

- **+ Track** → `AddCommodityModal` → `addCommodity` (the optional first price
  becomes `history[0]`).
- **Click a card** → `#/commodity-detail/<id>`.
- **Detail page** — add a dated price (appends to `history`, re-sorted ascending
  by `ts` via `updateCommodity`); edit the commodity's name / unit / mandi /
  color / notes; delete the commodity via `ConfirmModal` with an **Undo** toast
  that calls `restoreCommodity` — the same delete/undo pattern as Research Vault
  clips.
- **Permissions** — `isViewer` hides **+ Track**, add-price, edit, and delete;
  viewers see all prices read-only. "Anyone can add" means any non-viewer
  signed-in user.

## Error handling & edge cases

- **`onSnapshot` error** — commodities degrade to an empty list rather than
  crashing, the same defensive pattern used across `AppContext` and Research
  Vault.
- **Bad `commodity-detail` route** — id absent or no matching commodity → the
  existing `NotFound` component with a "← Go back" link to Markets.
- **Empty `history`** — the card shows an "awaiting first price" state with no
  sparkline / % / range; the detail page shows an empty-chart state. `pctChange`
  and `range52w` return `null`, and consumers render the fallback.
- **Short history** — `pctChange(history, 12)` and `range52w` fall back to the
  available range when there is less than 12 / 52 weeks of data.
- **Price entry validation** — rejects empty / non-numeric / non-positive
  values; the date defaults to today and cannot be in the future.

## Testing

The project has no unit-test runner — verification is `npm run build` (must
pass) plus Playwright e2e. The e2e harness (`?e2e=1`) bypasses auth and runs
with **empty Firestore data**, so e2e covers UI presence; data CRUD is trusted
via runtime use — the same approach as `e2e/research-vault.spec.js`.

New `e2e/markets.spec.js`, navigating directly via `#/markets`:

- Markets page renders: title, date line, **+ Track** button.
- Empty state renders (no commodities in the e2e harness).
- **+ Track** opens `AddCommodityModal` with the name / unit / mandi fields.
- `#/commodity-detail` with no id renders the `NotFound` component.

Updated `e2e/navigation.spec.js`: `NAV_PAGES` swaps `'documents'` for
`'markets'`. Any other e2e references to the Documents route are removed.

Full commodity CRUD (add / edit / delete / undo, price entry, sparkline and
range math, viewer permissions) is verified via runtime use against real
Firestore.

## Files touched

**New:**
- `src/pages/Markets/index.jsx`
- `src/pages/Markets/CommodityCard.jsx`
- `src/pages/Markets/Sparkline.jsx`
- `src/pages/Markets/CommodityDetailPage.jsx`
- `src/pages/Markets/AddCommodityModal.jsx`
- `src/pages/Markets/PriceEntryModal.jsx`
- `src/pages/Markets/EmptyState.jsx`
- `src/pages/Markets/marketsMath.js`
- `e2e/markets.spec.js`

**Modified:**
- `src/context/AppContext.jsx` — drop `sharedFiles`; add `sharedCommodities` +
  `useCommodities` + CRUD + seed
- `src/App.jsx` — route rewiring (Documents out, Markets in)
- `src/components/SideNav.jsx` — nav item + `ACTIVE_MAP`
- `src/components/CommandPalette.jsx` — `go-documents` → `go-markets`
- `src/pages/AboutPage.jsx` — remove Documents references
- `src/pages/Dashboard.jsx` — remove the recent-files card + `useFiles`
- `firestore.rules` — remove `sharedFiles`; add `sharedCommodities`
- `e2e/navigation.spec.js` — `NAV_PAGES` documents → markets

**Deleted:**
- `src/pages/FilesPage.jsx`
- `src/pages/FileDetailPage.jsx`

## Follow-up operational steps (not code)

- Deploy the updated `firestore.rules` (`firebase deploy --only firestore:rules`).
- One-time: delete the `sharedFiles` Firestore collection via the Firebase
  console, plus the specific `uploads/<blobId>` Storage objects referenced by
  those docs. Do **not** delete the whole `uploads/` folder — it is shared with
  Plan/Idea attachments and Research Vault clips.
