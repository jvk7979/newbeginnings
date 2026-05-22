# Crop Atlas — Interactive India Agriculture Map — Design

**Date:** 2026-05-22
**Status:** Approved design, ready for implementation planning

## Overview

**Goal:** A new page showing an interactive choropleth map of India where every
district is coloured by a chosen crop's production (or area, or yield). Hovering
or clicking a district reveals its full crop breakdown — which crops are grown,
how much, and on how much land.

**Why:** The app supports coconut / agri-processing venture planning in Andhra
Pradesh. A district-level crop atlas lets the user see raw-material availability
and crop patterns across India at a glance — useful for sourcing decisions,
site selection, and spotting where a commodity is concentrated.

## Decisions (from brainstorming)

| Decision | Choice |
|---|---|
| Data delivery | Bundled static snapshot **+ family overrides** in Firestore |
| Navigation | All-India district choropleth, **click a state to zoom in** |
| Coverage | **Full APY dataset** — ~700 districts, 50+ crops including coconut |
| Rendering | **Hand-rolled SVG + `d3-geo`** (matches the app's no-chart-library convention) |
| Page layout | **Split view** — map on the left, permanent detail panel on the right |

## Data sourcing

All India district-level crop data traces to one government source (the
Directorate of Economics & Statistics). The bundled snapshot is built from the
**APY dataset** (Area, Production, Yield) via data.gov.in / India Data Portal —
chosen over the cleaner ICRISAT database because ICRISAT omits coconut and
plantation crops, which this app specifically needs.

District boundary GeoJSON comes from a genuinely separate open source —
DataMeet community maps or the `india-geodata` project.

Crop statistics are annual government data with a 1–2 year lag; there is no
real-time source. The snapshot is refreshed roughly yearly by re-running the
build script.

## Architecture — three layers

### Layer 1 — Build-time pipeline

`scripts/build-crop-atlas.mjs` — a standalone Node script, **not part of the app
bundle**. Run manually when refreshing the dataset.

- **Inputs:** raw APY CSV (district × crop × year); raw India district GeoJSON.
- **Steps:**
  1. Filter APY to the latest year with good national coverage.
  2. Normalise district names — an alias table reconciles APY district names
     against GeoJSON district names (APY uses older names; districts created
     after 2014 — Telangana split etc. — need mapping). Unmatched districts are
     printed in a report.
  3. Aggregate per district per crop: total production (tonnes), total area
     (hectares). Yield is derived at runtime (production ÷ area).
  4. Simplify the GeoJSON geometry (coordinate-precision reduction /
     Douglas-Peucker) to drop the file from ~5–10 MB to ~0.6–1 MB.
  5. Join both datasets on a stable `districtId`.
- **Outputs (committed to git as static assets):**
  - `public/india-districts.geo.json`
  - `public/crop-atlas.json`

**Key isolation boundary:** the build script is fully separate from the app.
The app only consumes two clean JSON files and never parses CSV or matches names.

### Layer 2 — Runtime (the app)

- A new **lazy-loaded** page so its ~1 MB of assets stay out of the initial bundle.
- On open, `fetch()` the two static JSON files from `public/` (then cached by
  the service worker — instant on repeat visits).
- `d3-geo` projects the GeoJSON into SVG `<path>` data.
- Each district is filled by a sequential green colour scale keyed to the
  selected **crop + metric**.
- Hover/click drives the detail panel; clicking a state animates the SVG
  `viewBox` to that state's bounding box.

### Layer 3 — Family overrides (Firestore)

- New shared collection `sharedCropOverrides`, one doc per corrected district.
- A `useCropOverrides` context subscribes live via `onSnapshot`.
- At render the app merges overrides **on top of** the bundled baseline.
- The detail panel offers "Correct this data" to editors → `OverrideModal` →
  writes to Firestore. Overridden districts show a subtle "edited" marker.
- One new rule in `firestore.rules`.

**Data flow:**
`gov CSV + GeoJSON → build script → 2 static JSON files → lazy page fetches them
→ d3-geo renders choropleth → Firestore overrides merged on top → hover updates
the panel.`

## Data model

### `public/crop-atlas.json`

```json
{
  "meta": { "source": "data.gov.in APY", "year": "2021-22", "generatedAt": "2026-05-22" },
  "crops": ["Arecanut", "Coconut", "Rice", "Sugarcane", "..."],
  "districts": {
    "andhra-pradesh__east-godavari": {
      "district": "East Godavari",
      "state": "Andhra Pradesh",
      "crops": {
        "Coconut": { "production": 2100000, "area": 95000 },
        "Rice":    { "production": 1200000, "area": 300000 }
      }
    }
  }
}
```

- `production` in tonnes, `area` in hectares. Yield = production ÷ area (t/ha),
  computed at runtime.
- `districtId` is a deterministic slug: `<state-slug>__<district-slug>`.

### `public/india-districts.geo.json`

Standard GeoJSON `FeatureCollection`; each feature's `properties` carries
`{ districtId, district, state }`; geometry simplified.

### Firestore `sharedCropOverrides/{districtId}`

```json
{
  "districtId": "andhra-pradesh__east-godavari",
  "district": "East Godavari",
  "state": "Andhra Pradesh",
  "crops": { "Coconut": { "production": 2250000, "area": 98000 } },
  "note": "Updated from 2024 district horticulture report",
  "updatedBy": "user@example.com",
  "updatedAt": 1779455261000
}
```

The merge replaces baseline crop entries by crop name:
`effectiveCrops = { ...baseline.crops, ...override.crops }`.

## Components

```
src/pages/CropAtlas/
  index.jsx            Page shell: header, control bar (crop selector +
                       Production/Area/Yield toggle), selection state, split layout
  IndiaChoropleth.jsx  SVG map: d3-geo projection, ~700 district paths, hover,
                       click-to-zoom (viewBox animation), colour legend
  DistrictPanel.jsx    Right panel: district + state, selected crop's
                       production/area/yield, full crop breakdown, "Correct this
                       data" button
  OverrideModal.jsx    Correction form for editors
  cropAtlas.js         Pure helpers: asset loading, baseline+override merge,
                       colour-scale function, number formatting
public/
  india-districts.geo.json
  crop-atlas.json
scripts/
  build-crop-atlas.mjs  Build-time pipeline
```

### Wiring into the existing app

- `AppContext.jsx` — add `sharedCropOverrides` as a 6th shared collection +
  a `useCropOverrides` hook; the `tick` loaded-count threshold goes 5 → 6.
- `App.jsx` — lazy import + a `crop-atlas` route.
- `SideNav.jsx` — a new **"Crop Atlas"** nav item placed next to Markets.
- `firestore.rules` — one `sharedCropOverrides` rule (same family-shared access
  model as the other shared collections).
- New dependency: `d3-geo`.

## UX detail

- **Layout:** split view — choropleth on the left (~62%), permanent detail
  panel on the right (~38%).
- **Control bar:** a searchable crop selector (50+ crops) and a
  Production / Area / Yield segmented toggle.
- **Choropleth:** sequential green scale, quantile bins (~6 steps) so a few
  very large districts don't flatten the rest. Districts with no data for the
  selected crop render neutral grey. A horizontal legend (Low → High).
- **Hover:** a floating tooltip — district, state, selected crop's figure.
- **Detail panel:** updates on hover and click — district + state, the selected
  crop's production / area / yield, then the full crop breakdown for that
  district (all crops, sortable), then "Correct this data" for editors.
- **Zoom:** clicking a state animates the `viewBox` to that state's bounding
  box; a "Back to India" control resets it.
- **Palette:** the warm "Godavari Heritage" theme; green choropleth via the
  `C` design tokens.

## Edge cases & error handling

- Asset fetch fails → friendly error card with a Retry button (no white screen).
- District polygon with no crop data → neutral grey; tooltip says "No data."
- Crop with zero production in a district → scale-minimum colour.
- Yield when area is 0 → shown as "—" (no divide-by-zero).
- Override pointing at an unknown `districtId` → ignored silently.
- Touch devices → no hover; tap selects a district; on narrow screens the
  detail panel stacks **below** the map.

## Testing

- Build script's district-name normaliser → pure function, unit-tested against
  a fixture of known tricky names (renamed / split districts).
- `cropAtlas.js` (baseline+override merge, colour scale) → pure functions,
  unit-tested.
- Playwright e2e via the existing `?e2e=1` harness: the page renders the map,
  changing the crop recolours it, hovering updates the panel.

## Risks

- **District-name matching** is the biggest implementation risk: APY and the
  GeoJSON disagree on names, and ~70 districts created since 2014 may not line
  up. Mitigation: the alias table + an unmatched-districts report. Districts
  that still don't match render grey — acceptable and visible, not a crash.
- **Unit inconsistency in APY** — some crops (notably coconut) are reported in
  nuts vs tonnes depending on state/year. The build script must normalise units
  per crop; flagged for attention during the build step.
- **Asset weight** — ~1 MB of JSON. Mitigated by lazy-loading the page and
  service-worker caching.

## Out of scope (v1)

- Multi-year time series / year selector — snapshot is the latest year only.
- Crop comparison (two crops side by side).
- Exporting the map or data.
- Sub-district (taluk / village) granularity.
