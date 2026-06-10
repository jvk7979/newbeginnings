# UX Enhancements — Core Loop, Polish, Mobile & Accessibility

**Date:** 2026-06-09 · **Status:** Approved (user selected all three packs; e2e testing explicitly skipped)

## Goal

Improve the daily experience of Venture Log across its core loop
(idea → project → calculation → comparison), perceived performance,
collaboration visibility, and mobile/accessibility quality.

## Phase 1 — Core-loop fixes

### 1.1 Global search in the command palette
`CommandPalette.jsx` gains data-backed results from `useIdeas` /
`usePlans` / `useCommodities` / `useSuppliers`. Results appear at 2+
typed characters, capped at 5 per group, matched on title/name +
category-ish fields, and navigate straight to the item's detail page
(suppliers → Suppliers page, no detail route). Default (empty-query)
view stays the short command list.

### 1.2 Promote idea → project
`IdeaDetailPage` hero toolbar gets a "Promote to project" button: one
click creates a draft plan carrying title, description→summary,
category, sources, and `linkedIdeaId`, then navigates to the new
project detail (fully editable there — no intermediate form).
`addPlan` now returns the generated id. If a linked project already
exists the button reads "View project" and opens it — no duplicates.

### 1.3 Scenarios synced to Firestore
`utils/scenarios.js` rewritten from localStorage to the
`sharedPlans/{planId}/scenarios/{scenarioId}` subcollection (same
pattern as Research Vault clips): live `onSnapshot` subscription,
`savedBy` attribution, blur-committed renames (no per-keystroke
writes). One-time silent migration uploads legacy local snapshots iff
the collection is empty, then clears the local key (kept on failure so
a later visit retries). New rules block mirrors the clips rule.

## Phase 2 — Polish pack

- **2.1 Skeletons** — shared `Skeleton` component (theme-aware shimmer,
  static under `prefers-reduced-motion`); Atlas first-load renders a
  map + sidebar skeleton instead of a lone status line. Adds `.sr-only`
  utility for the announced loading status.
- **2.2 Upload progress** — `fileStorage` upload helpers accept an
  `onProgress(0..1)` callback; the 30s timeout becomes a *stall*
  timeout (re-arms on progress). `UploadZone` shows a live progress bar
  (ARIA progressbar) during upload across NewIdea, NewPlan,
  IdeaDetail, PlanDetail (via `AttachmentEditor`), and AddClipModal.
- **2.3 Activity feed** — `AppContext.logActivity` writes lightweight
  events (create/delete for ideas, projects, commodities, suppliers;
  project status changes; idea promotions — never autosave patches) to
  a new `sharedActivity` collection (editor-create-only rules).
  `ActivityFeed` on the Dashboard shows the latest 8 with relative
  times; renders nothing until the first event exists.

## Phase 3 — Mobile & accessibility

- **3.1 Bottom-sheet modals** — `useDialogA11y` adds a shared
  `nb-dialog` class; at ≤768px every hook-managed dialog becomes a
  bottom sheet (fixed to viewport bottom, full width, top-rounded,
  slide-up, grab handle, safe-area padding). Desktop untouched.
- **3.2 Atlas touch** — `useMapZoom` tracks multiple pointers:
  two-finger pinch zooms toward the midpoint, one finger pans;
  `touch-action: none` on the SVG so the browser doesn't hijack
  gestures. Pointer capture keeps fast flicks tracked.
- **3.3 Portfolio table** — `aria-sort` on column headers; headers are
  real `<button>`s (keyboard-operable) with `scope="col"`.
- **3.4 Status badges** — `Badge` carries a distinct glyph per status
  family (● ✓ ◆ ▸ ‖ ○ ▲ ■) so state is never colour-only.

## Testing & rollout

Unit tests (Vitest): new `scenarios.test.js` covers migration branches,
snapshot ordering, and write helpers; existing calcEngine + useAutosave
suites unchanged. E2E intentionally skipped per user direction (the
deploy workflow's e2e gate is already disabled). Deploy = push to main
(GitHub Pages workflow) + `firebase deploy --only firestore:rules` for
the two new rules blocks.
