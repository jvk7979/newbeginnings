# Design: Move Activity Heatmap from Dashboard to About Page

**Date:** 2026-05-01  
**Status:** Approved

## Summary

The `ActivityHeatmap` component currently lives in `Dashboard.jsx` and is rendered between the stats cards and quick-actions sections. This feature moves it to the bottom of `AboutPage.jsx` and removes it from the Dashboard entirely.

## Decisions

| Question | Decision |
|---|---|
| Remove from Dashboard or keep on both? | Remove from Dashboard entirely |
| Placement on About page | Bottom — after CTA buttons, as the last section |
| Component file strategy | Inline into `AboutPage.jsx` (no new file) |
| Section heading | Unchanged: "Activity — last 12 weeks" |

## Changes

### `src/pages/Dashboard.jsx`

1. **Remove** the `buildActivityMap` helper function and the `ActivityHeatmap` component definition (currently ~lines 53–134).
2. **Remove** the `<ActivityHeatmap ideas={ideas} plans={plans} />` render call from the JSX (currently between stats and quick-actions).
3. No other Dashboard changes — stats cards and quick-actions close the gap naturally.

### `src/pages/AboutPage.jsx`

1. **Add imports:** `useMemo` from `'react'`; `useIdeas` and `usePlans` from `'../context/AppContext'`.
2. **Paste** `buildActivityMap` helper and `ActivityHeatmap` component at the top of the file, above the `AboutPage` default export.
3. **Add hook calls** inside the `AboutPage` component body:
   ```js
   const { ideas } = useIdeas();
   const { plans } = usePlans();
   ```
4. **Render** `<ActivityHeatmap ideas={ideas} plans={plans} />` as the final JSX element, after the existing CTA buttons block.

## Data Flow

`ActivityHeatmap` is a pure presentational component — it receives `ideas` and `plans` as props and processes them entirely via `useMemo` internally. No Firestore queries are added to AboutPage; the data arrives through the existing `useIdeas` and `usePlans` context hooks that are already loaded app-wide.

## Out of Scope

- Renaming or restyling the heatmap component
- Adding the heatmap to any other page
- Changing how ideas/plans data is fetched
