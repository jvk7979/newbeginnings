# Design: Ideas CAPEX & Payback Fields + Dashboard Pipeline Table

**Date:** 2026-05-01
**Status:** Approved

## Summary

Add two optional financial fields (`estimatedCapex`, `estimatedPayback`) to every idea document. Surface them on the IdeaCard, in the idea form, and as a new "Ideas Pipeline" table widget on the Dashboard. Update the IdeasPage with quick-filter status tabs.

## Decisions

| Question | Decision |
|---|---|
| New fields | `estimatedCapex` (₹, number) and `estimatedPayback` (years, number) — both optional |
| When to fill | At creation time or any time via IdeaDetailPage edit mode |
| IRR field | Out of scope |
| Dashboard widget | Replace current "Recent Ideas" card grid with a pipeline table |
| IdeasPage filter | Add quick-filter tabs (All / Validating / Draft / Active) above the grid |
| Existing features | Search bar, sort dropdown, category filter, compare panel — all unchanged |

## Data Model

No schema migration needed. New fields are added to Firestore documents on next save. Existing ideas simply lack the fields; all display code treats missing/undefined as `null` and renders `—`.

```js
// New optional fields on idea documents
estimatedCapex:   number | undefined   // ₹ value, e.g. 5500000
estimatedPayback: number | undefined   // years, e.g. 7.5
```

`addIdea` and `updateIdea` in `AppContext.jsx` require no changes — they already do partial updates.

## Form Changes (NewIdeaPage + IdeaDetailPage)

Add a two-column row of number inputs after the description field (before sources/notes):

```
Estimated CAPEX (₹)    Estimated Payback (yrs)
[ number input ]       [ number input ]
```

- Both inputs are optional — no validation required
- `min={0}` on both
- Placeholder: empty (no default shown — fields are optional)
- Label styled same as existing field labels in each form
- In NewIdeaPage: include in the initial `addIdea` call
- In IdeaDetailPage edit mode: include in the `updateIdea` patch

## IdeaCard Changes

Add a metrics strip at the bottom of the card when at least one of the two fields is non-null and non-zero:

```
CAPEX          PAYBACK
₹55.0 L        7.5y
```

- Uses `fmtINR()` helper (same as Calculations page) for CAPEX formatting — import or inline
- Payback displayed as `{n}y` (e.g. `2.8y`, `7.5y`)
- If both are absent/zero, the strip is hidden — no empty space
- Strip sits below the existing card content, above the date line
- Two columns with label (10px uppercase) + value (monospace, 14px bold)

### `fmtINR` for IdeaCard

Since `fmtINR` lives in `CalculationsPage.jsx`, copy the same logic as a small local helper in `IdeaCard.jsx`:

```js
function fmtINR(n) {
  if (!n || !isFinite(n)) return '—';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)} L`;
  if (n >= 1000)     return `₹${(n / 1000).toFixed(1)} K`;
  return `₹${n.toFixed(0)}`;
}
```

## IdeasPage Changes

### Quick-filter tabs

Add a tab strip between the page header and the search bar. Tabs show only statuses that have ≥ 1 idea, with live counts:

```
All 5   Validating 2   Draft 3   Active 1  ...
```

- Tabs are pills (like the existing status filter in IdeasPage but styled as inline tabs matching the app's `C.accent` / `C.border` tokens)
- Clicking a tab sets an `activeTab` state; the grid filters to matching ideas
- "All" tab always shown; other tabs appear only when count > 0
- Statuses covered: all values in existing `IDEA_STATUSES` — draft, validating, active, archived
- The existing status **dropdown** filter is removed (the tabs replace it)
- Search and sort dropdown remain

## Dashboard Changes

### Ideas Pipeline widget

Replace the current "Recent Ideas" section (which renders up to 4 `IdeaCard` components) with a compact table widget.

**Title row:** `Ideas Pipeline` (section header style) + `View all →` action link (navigates to `'ideas'`)

**Table columns:**

| Column | Source | Format |
|---|---|---|
| IDEA | `idea.title` | Bold link text, truncated at 1 line |
| STAGE | `idea.status` | Inline status badge (• Validating, • Draft, etc.) |
| CAPEX | `idea.estimatedCapex` | `fmtINR()` or `—` |
| PAYBACK | `idea.estimatedPayback` | `{n}y` or `—` |

- Shows up to 5 ideas, sorted by most recently updated (`idea.date` descending — same sort as current Recent Ideas)
- `fmtINR` inlined in Dashboard (same pattern as IdeaCard)
- Status badge colours: amber for `validating`, grey/muted for `draft`, green for `active`, muted for `archived` — matching existing status badge usage in the app
- Row hover: subtle background change (`C.bg2`)
- If no ideas exist: show the existing empty state text

## Out of Scope

- IRR field
- Persisting CAPEX/Payback to the Calculations page
- Sorting/filtering by CAPEX or Payback
- Editing CAPEX/Payback inline on the Dashboard table
