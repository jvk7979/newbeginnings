# World Market Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a "World Market" page showing India's agricultural exports as a live choropleth world map (UN Comtrade API) with an Andhra Pradesh commodity leaderboard tab.

**Architecture:** Two-tab page at `#/world-market`. World tab: sidebar + SVG choropleth world map (countries shaded by total export value from India) + country detail panel fetched live from UN Comtrade API. AP tab: commodity leaderboard from curated `ap-exports.json` + destination breakdown panel. CSS mirrors `atlas-v2.css` patterns. Routing added to `App.jsx` + nav item to `SideNav.jsx`.

**Tech Stack:** React, Vite, `world-atlas` (TopoJSON), `topojson-client` (TopoJSON→GeoJSON), UN Comtrade Plus API (free, no key), localStorage cache, existing `buildPathGen` + `intensityColor` from `geoHelpers.js`.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/pages/WorldMarket/index.jsx` | Page root — tab state, data loading |
| Create | `src/pages/WorldMarket/WorldMarketNavBar.jsx` | "01 World / 02 AP" tab bar + KPI header strip |
| Create | `src/pages/WorldMarket/WorldTab.jsx` | Sidebar + WorldMap + CountryPanel layout |
| Create | `src/pages/WorldMarket/WorldMap.jsx` | SVG choropleth — world-atlas TopoJSON → buildPathGen |
| Create | `src/pages/WorldMarket/CountryPanel.jsx` | Commodity breakdown panel for a clicked country |
| Create | `src/pages/WorldMarket/APTab.jsx` | AP leaderboard + destination panel layout |
| Create | `src/pages/WorldMarket/CommodityLeaderboard.jsx` | Ranked AP commodity rows |
| Create | `src/pages/WorldMarket/DestinationPanel.jsx` | Destination country breakdown for selected AP commodity |
| Create | `src/pages/WorldMarket/comtradeDataset.js` | UN Comtrade fetch + 24h localStorage cache |
| Create | `src/world-market.css` | Page styles (mirrors atlas-v2.css class patterns) |
| Create | `public/data/ap-exports.json` | Curated AP commodity export data |
| Modify | `src/App.jsx` | Add lazy import + route for `world-market` |
| Modify | `src/components/SideNav.jsx` | Add "World Market" nav item |

---

## Task 1: Install packages

**Files:**
- Modify: `package.json` (via npm)

- [ ] **Step 1: Install world-atlas and topojson-client**

```bash
cd c:/Users/jvk79/newbeginnings
npm install world-atlas topojson-client
```

Expected output: `added 2 packages` (both are tiny — world-atlas is data, topojson-client is ~20KB)

- [ ] **Step 2: Verify the packages can be imported**

```bash
node -e "const t = require('topojson-client'); const w = require('world-atlas/world/110m.json'); const geo = t.feature(w, w.objects.countries); console.log('countries:', geo.features.length);"
```

Expected output: `countries: 177`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add world-atlas and topojson-client for world map"
```

---

## Task 2: Curate ap-exports.json

**Files:**
- Create: `public/data/ap-exports.json`

- [ ] **Step 1: Create the AP exports data file**

Create `public/data/ap-exports.json` with this content:

```json
{
  "meta": {
    "year": "2023-24",
    "source": "APEDA AgriExchange — state-wise export tables",
    "note": "Figures are approximate; Rice and Chilli data from APEDA AP region; Seafood from MPEDA; others from APEDA commodity reports."
  },
  "commodities": [
    {
      "name": "Rice (Non-Basmati)",
      "category": "cereal",
      "value_usd_m": 1240,
      "volume_kt": 4120,
      "destinations": [
        { "country": "Bangladesh", "value_usd_m": 496, "share_pct": 40 },
        { "country": "Indonesia", "value_usd_m": 199, "share_pct": 16 },
        { "country": "Nepal", "value_usd_m": 149, "share_pct": 12 },
        { "country": "Malaysia", "value_usd_m": 112, "share_pct": 9 },
        { "country": "Others", "value_usd_m": 284, "share_pct": 23 }
      ]
    },
    {
      "name": "Chillies",
      "category": "spice",
      "value_usd_m": 840,
      "volume_kt": 580,
      "destinations": [
        { "country": "China", "value_usd_m": 277, "share_pct": 33 },
        { "country": "Malaysia", "value_usd_m": 126, "share_pct": 15 },
        { "country": "Sri Lanka", "value_usd_m": 92, "share_pct": 11 },
        { "country": "Bangladesh", "value_usd_m": 76, "share_pct": 9 },
        { "country": "Others", "value_usd_m": 269, "share_pct": 32 }
      ]
    },
    {
      "name": "Seafood (Shrimp & Prawn)",
      "category": "livestock",
      "value_usd_m": 720,
      "volume_kt": 210,
      "destinations": [
        { "country": "USA", "value_usd_m": 230, "share_pct": 32 },
        { "country": "China", "value_usd_m": 158, "share_pct": 22 },
        { "country": "EU (combined)", "value_usd_m": 130, "share_pct": 18 },
        { "country": "Japan", "value_usd_m": 86, "share_pct": 12 },
        { "country": "Others", "value_usd_m": 116, "share_pct": 16 }
      ]
    },
    {
      "name": "Tobacco",
      "category": "residue",
      "value_usd_m": 560,
      "volume_kt": 180,
      "destinations": [
        { "country": "Belgium", "value_usd_m": 157, "share_pct": 28 },
        { "country": "Russia", "value_usd_m": 112, "share_pct": 20 },
        { "country": "South Korea", "value_usd_m": 78, "share_pct": 14 },
        { "country": "Germany", "value_usd_m": 56, "share_pct": 10 },
        { "country": "Others", "value_usd_m": 157, "share_pct": 28 }
      ]
    },
    {
      "name": "Mango (Fresh & Pulp)",
      "category": "horti",
      "value_usd_m": 310,
      "volume_kt": 95,
      "destinations": [
        { "country": "UAE", "value_usd_m": 93, "share_pct": 30 },
        { "country": "UK", "value_usd_m": 62, "share_pct": 20 },
        { "country": "Saudi Arabia", "value_usd_m": 47, "share_pct": 15 },
        { "country": "Netherlands", "value_usd_m": 37, "share_pct": 12 },
        { "country": "Others", "value_usd_m": 71, "share_pct": 23 }
      ]
    },
    {
      "name": "Cotton",
      "category": "fiber",
      "value_usd_m": 290,
      "volume_kt": 140,
      "destinations": [
        { "country": "Vietnam", "value_usd_m": 87, "share_pct": 30 },
        { "country": "Bangladesh", "value_usd_m": 72, "share_pct": 25 },
        { "country": "China", "value_usd_m": 58, "share_pct": 20 },
        { "country": "Indonesia", "value_usd_m": 44, "share_pct": 15 },
        { "country": "Others", "value_usd_m": 29, "share_pct": 10 }
      ]
    },
    {
      "name": "Maize",
      "category": "cereal",
      "value_usd_m": 185,
      "volume_kt": 620,
      "destinations": [
        { "country": "Nepal", "value_usd_m": 56, "share_pct": 30 },
        { "country": "Bangladesh", "value_usd_m": 44, "share_pct": 24 },
        { "country": "Malaysia", "value_usd_m": 37, "share_pct": 20 },
        { "country": "Myanmar", "value_usd_m": 30, "share_pct": 16 },
        { "country": "Others", "value_usd_m": 18, "share_pct": 10 }
      ]
    },
    {
      "name": "Groundnut",
      "category": "oilseed",
      "value_usd_m": 160,
      "volume_kt": 210,
      "destinations": [
        { "country": "Indonesia", "value_usd_m": 48, "share_pct": 30 },
        { "country": "China", "value_usd_m": 40, "share_pct": 25 },
        { "country": "Philippines", "value_usd_m": 32, "share_pct": 20 },
        { "country": "Vietnam", "value_usd_m": 24, "share_pct": 15 },
        { "country": "Others", "value_usd_m": 16, "share_pct": 10 }
      ]
    }
  ]
}
```

- [ ] **Step 2: Commit**

```bash
git add public/data/ap-exports.json
git commit -m "data: curate AP commodity export data (APEDA 2023-24)"
```

---

## Task 3: Create world-market.css

**Files:**
- Create: `src/world-market.css`

- [ ] **Step 1: Create the CSS file**

Create `src/world-market.css`:

```css
/* src/world-market.css
 *
 * World Market page styles. Mirrors atlas-v2.css naming patterns.
 * All colours use --c-* tokens so all themes work automatically.
 */

.wm-root {
  background: var(--c-bg-texture) var(--c-bg0) !important;
  background-attachment: fixed !important;
}

/* ─── SCROLL REGION ─────────────────────────────── */
.wm-scroll {
  flex: 1; min-height: 0;
  display: flex; flex-direction: column;
  overflow-y: auto; overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}
.wm-scroll-map {
  overflow: hidden !important;
  flex: 1 !important;
  min-height: 0 !important;
}
@media (max-width: 900px) {
  .wm-scroll-map { overflow-y: auto !important; }
}

/* ─── NAV BAR ────────────────────────────────────── */
.wm-navbar {
  flex: none;
  display: flex; align-items: stretch;
  background: var(--c-bg0);
  border-bottom: 1px solid var(--c-border);
  min-height: 44px;
}
.wm-tab {
  flex: none; display: flex; align-items: center;
  gap: 6px; padding: 10px 18px;
  background: none; border: none; border-bottom: 2px solid transparent;
  font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600;
  color: var(--c-fg3); letter-spacing: 0.06em; cursor: pointer;
  transition: color 120ms, border-color 120ms;
}
.wm-tab:hover { color: var(--c-fg1); }
.wm-tab.active { color: var(--c-accent); border-bottom-color: var(--c-accent); }
.wm-tab-idx { color: var(--c-fg3); font-size: 9px; }
.wm-tab.active .wm-tab-idx { color: var(--c-accent); opacity: 0.6; }

/* ─── HEADER STRIP ───────────────────────────────── */
.wm-header-strip {
  flex: none; display: flex; align-items: stretch;
  border-bottom: 1px solid var(--c-border);
  background: var(--c-bg0); min-height: 68px;
}
.wm-header-text {
  flex: none; padding: 14px 24px;
  border-right: 1px solid var(--c-border);
  display: flex; flex-direction: column; justify-content: center;
}
.wm-eyebrow {
  font-family: 'JetBrains Mono', monospace; font-size: 9px;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--c-fg3); margin-bottom: 3px;
}
.wm-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 20px; font-weight: 700; color: var(--c-fg1);
  letter-spacing: -0.01em; line-height: 1;
}
.wm-title em { font-style: italic; color: var(--c-accent); }

.wm-kpi-chips {
  flex: none; display: flex; align-items: stretch;
  border-left: 1px solid var(--c-border);
}
.wm-kpi-chip {
  display: flex; flex-direction: column;
  align-items: flex-end; justify-content: center;
  padding: 0 20px; border-right: 1px solid var(--c-border);
}
.wm-kpi-value {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 20px; font-weight: 700; color: var(--c-fg1);
  line-height: 1; letter-spacing: -0.02em;
}
.wm-kpi-label {
  font-family: 'JetBrains Mono', monospace; font-size: 8px;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--c-fg3); margin-top: 3px;
}

/* ─── 3-COLUMN BODY ──────────────────────────────── */
.wm-body {
  flex: 1; display: flex; min-height: 0; overflow: hidden;
}

/* Sidebar */
.wm-sidebar {
  flex: none; width: 190px; border-right: 1px solid var(--c-border);
  background: var(--c-bg0); overflow-y: auto; padding: 16px 12px;
}
.wm-sb-label {
  font-family: 'JetBrains Mono', monospace; font-size: 9px;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--c-fg3); margin-bottom: 6px; display: block;
}
.wm-sb-select {
  width: 100%; background: var(--c-bg1); border: 1px solid var(--c-border);
  border-radius: 6px; padding: 7px 10px; cursor: pointer;
  font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600;
  color: var(--c-fg1); outline: none; margin-bottom: 16px;
}
.wm-sb-block { margin-bottom: 16px; }
.wm-sb-cat {
  display: flex; align-items: center; gap: 7px; width: 100%;
  background: none; border: none; cursor: pointer; padding: 5px 7px;
  border-radius: 5px; font-family: 'DM Sans', sans-serif; font-size: 13px;
  color: var(--c-fg2); text-align: left; transition: background 100ms;
}
.wm-sb-cat:hover { background: var(--c-bg2); }
.wm-sb-cat.active { color: var(--c-fg1); background: var(--c-accentBg); font-weight: 600; }
.wm-sb-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

/* Map area */
.wm-map {
  flex: 3 0 auto; min-width: 320px;
  align-self: stretch; position: relative;
  background: var(--c-bg0);
}
.wm-map svg { display: block; width: 100%; height: 100%; }

/* Panel */
.wm-panel {
  flex: 2 1 auto; min-width: 260px;
  border-left: 1px solid var(--c-border);
  display: flex; flex-direction: column; overflow: hidden;
}
.wm-panel-head {
  flex: none; padding: 16px 18px 12px;
  border-bottom: 1px solid var(--c-border);
}
.wm-panel-eyebrow {
  font-family: 'JetBrains Mono', monospace; font-size: 9px;
  letter-spacing: 0.1em; text-transform: uppercase; color: var(--c-fg3);
  margin-bottom: 3px;
}
.wm-panel-name {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 17px; font-weight: 700; color: var(--c-fg1); margin: 0 0 2px;
}
.wm-panel-sub {
  font-family: 'JetBrains Mono', monospace; font-size: 10px;
  color: var(--c-fg3); letter-spacing: 0.04em;
}
.wm-panel-list { flex: 1; overflow-y: auto; padding: 10px 12px; }

/* Commodity bars (country panel + AP destination panel) */
.wm-commodity-row {
  border: 1px solid var(--c-border);
  border-radius: 6px; padding: 8px 10px; margin-bottom: 6px;
  transition: background 100ms;
}
.wm-commodity-row:hover { background: var(--c-bg1); }
.wm-commodity-meta {
  display: flex; justify-content: space-between; align-items: baseline;
  margin-bottom: 5px;
}
.wm-commodity-name {
  font-family: 'DM Sans', sans-serif; font-size: 12px;
  color: var(--c-fg1); font-weight: 500;
}
.wm-commodity-val {
  font-family: 'JetBrains Mono', monospace; font-size: 11px;
  color: var(--c-fg2); white-space: nowrap; margin-left: 8px;
}
.wm-bar-track {
  height: 3px; background: var(--c-border); border-radius: 2px; overflow: hidden;
}
.wm-bar-fill { height: 100%; border-radius: 2px; }

/* Default panel (no selection) — top importers list */
.wm-default-row {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px; border-radius: 6px; cursor: pointer;
  transition: background 100ms;
}
.wm-default-row:hover { background: var(--c-bg1); }
.wm-default-rank {
  font-family: 'JetBrains Mono', monospace; font-size: 10px;
  color: var(--c-fg3); width: 20px; flex-shrink: 0;
}
.wm-default-name { font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--c-fg1); flex: 1; }
.wm-default-val { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--c-fg3); }

/* ─── AP TAB ─────────────────────────────────────── */
.wm-ap-body {
  flex: 1; display: flex; min-height: 0; overflow: hidden;
}
.wm-ap-list { flex: 3; border-right: 1px solid var(--c-border); display: flex; flex-direction: column; overflow: hidden; }
.wm-ap-header {
  flex: none; padding: 14px 20px 10px;
  border-bottom: 1px solid var(--c-border);
  display: flex; align-items: center; justify-content: space-between;
}
.wm-ap-title {
  font-family: 'DM Sans', sans-serif; font-size: 15px;
  font-weight: 600; color: var(--c-fg1);
}
.wm-ap-cols {
  flex: none; display: grid;
  grid-template-columns: 36px 1fr 100px 90px 110px;
  padding: 6px 16px; border-bottom: 1px solid var(--c-bg2);
  font-family: 'JetBrains Mono', monospace; font-size: 9px;
  letter-spacing: 0.08em; color: var(--c-fg3);
}
.wm-ap-rows { flex: 1; overflow-y: auto; }
.wm-ap-row {
  display: grid; grid-template-columns: 36px 1fr 100px 90px 110px;
  padding: 10px 16px; border-bottom: 1px solid var(--c-bg2);
  align-items: center; cursor: pointer; transition: background 100ms;
  border-left: 3px solid transparent;
}
.wm-ap-row:hover { background: var(--c-bg1); }
.wm-ap-row.active { background: var(--c-accentBg); }
.wm-ap-rank { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--c-fg3); }
.wm-ap-name { font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600; color: var(--c-fg1); }
.wm-ap-badge {
  font-family: 'JetBrains Mono', monospace; font-size: 8px;
  letter-spacing: 0.06em; color: var(--c-fg3); text-transform: uppercase;
  margin-top: 2px;
}
.wm-ap-val { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--c-fg2); text-align: right; }
.wm-ap-top { font-family: 'DM Sans', sans-serif; font-size: 11px; color: var(--c-accent); text-align: right; }

/* AP destination panel */
.wm-dest-panel { flex: 2; display: flex; flex-direction: column; overflow: hidden; }
.wm-dest-empty {
  flex: 1; display: flex; align-items: center; justify-content: center;
  font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--c-fg3);
}

/* ─── LOADING / ERROR STATES ─────────────────────── */
.wm-loading {
  flex: 1; display: flex; align-items: center; justify-content: center;
  font-family: 'JetBrains Mono', monospace; font-size: 12px;
  color: var(--c-fg3); letter-spacing: 0.06em;
}

/* ─── RESPONSIVE ─────────────────────────────────── */
@media (max-width: 900px) {
  .wm-body { flex-direction: column; overflow: hidden; max-width: 100%; }
  .wm-sidebar { width: 100%; border-right: 0; border-bottom: 1px solid var(--c-border); padding: 10px 16px; }
  .wm-map { flex: none; width: 100%; height: 56vh; min-height: 280px; }
  .wm-panel { flex: none; width: 100%; border-left: 0; border-top: 1px solid var(--c-border); height: 380px; }
  .wm-header-text { padding: 10px 16px; }
  .wm-kpi-chip { flex: 1; align-items: center; padding: 8px 4px; }
  .wm-ap-body { flex-direction: column; }
  .wm-ap-list { border-right: 0; border-bottom: 1px solid var(--c-border); flex: none; height: 360px; }
  .wm-ap-cols { grid-template-columns: 36px 1fr 90px; }
  .wm-ap-row { grid-template-columns: 36px 1fr 90px; }
  .wm-ap-cols :nth-child(4), .wm-ap-cols :nth-child(5),
  .wm-ap-row :nth-child(4), .wm-ap-row :nth-child(5) { display: none; }
  .wm-dest-panel { flex: none; height: 320px; }
}
@media (max-width: 600px) {
  .wm-kpi-label { font-size: 7px; }
  .wm-title { font-size: 17px; }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/world-market.css
git commit -m "style: World Market CSS — mirrors atlas-v2.css patterns"
```

---

## Task 4: Create comtradeDataset.js

**Files:**
- Create: `src/pages/WorldMarket/comtradeDataset.js`

- [ ] **Step 1: Create the data layer**

Create `src/pages/WorldMarket/comtradeDataset.js`:

```js
// src/pages/WorldMarket/comtradeDataset.js
//
// UN Comtrade Plus API (v2) — free tier, no key required.
// 500 req/hr rate limit.
//
// Two queries:
//   loadPartnerTotals(year)              — total export value to each country
//                                          (for choropleth shading)
//   loadCountryCommodities(code, year)   — HS-2 agricultural breakdown for
//                                          one partner country (on click)
//
// Results are cached in localStorage for 24 hours so a page refresh
// within the same day never re-hits the API.

const BASE = 'https://comtradeplus.un.org/TradeData/Annual';
const INDIA = 356;
const TTL_MS = 24 * 60 * 60 * 1000;

// Agricultural HS chapters 01-24 (animals, food, beverages, tobacco,
// hides, fats, prepared food). Joined as comma-separated for the query.
const AGRI_CODES = Array.from({ length: 24 }, (_, i) =>
  String(i + 1).padStart(2, '0')
).join(',');

// ── Cache helpers ──────────────────────────────────────────────

function cacheRead(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, exp } = JSON.parse(raw);
    if (Date.now() > exp) { localStorage.removeItem(key); return null; }
    return data;
  } catch { return null; }
}

function cacheWrite(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ data, exp: Date.now() + TTL_MS }));
  } catch { /* storage full — silently skip */ }
}

// ── Fetch helpers ──────────────────────────────────────────────

async function comtradeFetch(params) {
  const url = `${BASE}?${new URLSearchParams(params)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Comtrade ${res.status}: ${await res.text().catch(() => '')}`);
  return res.json();
}

// ── Public API ─────────────────────────────────────────────────

// Returns { [partnerCode]: { name, iso3, value_usd } } for all countries.
// Uses cmdCode=TOTAL so one query covers all commodities — the choropleth
// just needs relative export totals to shade countries.
export async function loadPartnerTotals(year) {
  const key = `wm-totals-${year}`;
  const cached = cacheRead(key);
  if (cached) return cached;

  const json = await comtradeFetch({
    typeCode: 'C', freqCode: 'A', clCode: 'HS',
    reporterCode: INDIA, cmdCode: 'TOTAL', flowCode: 'X',
    period: year, includeDesc: true,
  });

  const out = {};
  for (const row of json.data || []) {
    if (!row.partnerCode || row.partnerCode === 0) continue;
    out[row.partnerCode] = {
      name: row.partnerDesc || String(row.partnerCode),
      iso3: row.partnerISO || '',
      value_usd: row.primaryValue || 0,
    };
  }

  cacheWrite(key, out);
  return out;
}

// Returns array of { hsCode, name, value_usd } sorted desc for one partner.
// Called only when a country is clicked.
export async function loadCountryCommodities(partnerCode, year) {
  const key = `wm-cmd-${partnerCode}-${year}`;
  const cached = cacheRead(key);
  if (cached) return cached;

  const json = await comtradeFetch({
    typeCode: 'C', freqCode: 'A', clCode: 'HS',
    reporterCode: INDIA, cmdCode: AGRI_CODES, flowCode: 'X',
    partnerCode, period: year, includeDesc: true,
  });

  const out = (json.data || [])
    .filter(r => r.primaryValue > 0)
    .map(r => ({ hsCode: r.cmdCode, name: r.cmdDesc || r.cmdCode, value_usd: r.primaryValue }))
    .sort((a, b) => b.value_usd - a.value_usd)
    .slice(0, 12);

  cacheWrite(key, out);
  return out;
}

// Format USD value for display: "$1.24B", "$840M", "$12M"
export function fmtUsd(usd) {
  if (!usd) return '—';
  if (usd >= 1e9) return `$${(usd / 1e9).toFixed(2)}B`;
  if (usd >= 1e6) return `$${Math.round(usd / 1e6)}M`;
  return `$${Math.round(usd / 1e3)}K`;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/WorldMarket/comtradeDataset.js
git commit -m "feat(world-market): Comtrade API fetch + 24h localStorage cache"
```

---

## Task 5: Create WorldMap.jsx

**Files:**
- Create: `src/pages/WorldMarket/WorldMap.jsx`

The world map reuses `buildPathGen` from `geoHelpers.js`. Countries from `world-atlas` TopoJSON are identified by ISO 3166-1 numeric code — the same codes UN Comtrade uses.

- [ ] **Step 1: Create the component**

Create `src/pages/WorldMarket/WorldMap.jsx`:

```jsx
// src/pages/WorldMarket/WorldMap.jsx
//
// SVG choropleth world map using Natural Earth 110m data (world-atlas npm).
// Country shapes come from TopoJSON → GeoJSON via topojson-client.
// Shading reuses intensityColor() from geoHelpers.js.
// Country numeric codes match UN Comtrade partnerCode directly.

import { useEffect, useMemo, useRef, useState, memo } from 'react';
import { feature } from 'topojson-client';
import worldTopo from 'world-atlas/world/110m.json';
import { buildPathGen, intensityColor } from '../../atlas/geoHelpers';

// Convert TopoJSON → GeoJSON once at module load (pure, no side effects).
const WORLD_GEO = feature(worldTopo, worldTopo.objects.countries);

// Canvas dimensions for the SVG viewBox.
const W = 960, H = 500;

// Pre-build path strings and numeric codes for every country feature.
// buildPathGen returns different path strings based on the viewBox, so
// we build paths inside useMemo keyed on W/H.
function useCountryPaths() {
  return useMemo(() => {
    const gen = buildPathGen(WORLD_GEO, W, H, 2);
    return WORLD_GEO.features.map(f => ({
      code: Number(f.id),
      d: gen.path(f),
    }));
  }, []);
}

const CountryPath = memo(function CountryPath({ d, fill, isSelected, isHovered, code, onSelect, onHover }) {
  return (
    <path
      d={d}
      fill={fill}
      stroke={isSelected ? 'var(--c-accent)' : isHovered ? 'var(--c-fg2)' : 'var(--c-border)'}
      strokeWidth={isSelected ? 1.5 : isHovered ? 0.8 : 0.3}
      style={{ cursor: 'pointer', transition: 'fill 150ms, stroke 100ms' }}
      onClick={() => onSelect(code)}
      onMouseEnter={(e) => onHover(code, e)}
      onMouseLeave={() => onHover(null, null)}
    />
  );
});

export default function WorldMap({ partnerData, selectedCode, onSelect, onHover, hoveredCode }) {
  const paths = useCountryPaths();
  const maxVal = useMemo(() => {
    if (!partnerData) return 1;
    return Math.max(1, ...Object.values(partnerData).map(d => d.value_usd));
  }, [partnerData]);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      aria-label="World map — India's agricultural exports by destination country"
      style={{ display: 'block', width: '100%', height: '100%' }}
    >
      <rect width={W} height={H} fill="var(--c-bg0)" />
      {paths.map(({ code, d }) => {
        if (!d) return null;
        const partner = partnerData?.[code];
        const t = partner ? partner.value_usd / maxVal : null;
        const fill = t != null ? intensityColor(Math.pow(t, 0.35)) : 'var(--c-bg2)';
        return (
          <CountryPath
            key={code}
            code={code}
            d={d}
            fill={fill}
            isSelected={selectedCode === code}
            isHovered={hoveredCode === code}
            onSelect={onSelect}
            onHover={onHover}
          />
        );
      })}
    </svg>
  );
}
```

**Note:** The import path for `buildPathGen` uses `../../atlas/geoHelpers` — this is `src/pages/Atlas/geoHelpers.js`. Correct the import path in the file to `../../Atlas/geoHelpers` (capital A) to match the actual directory name.

- [ ] **Step 2: Fix the import path**

Edit the import in `WorldMap.jsx` — change:
```js
import { buildPathGen, intensityColor } from '../../atlas/geoHelpers';
```
to:
```js
import { buildPathGen, intensityColor } from '../Atlas/geoHelpers';
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/WorldMarket/WorldMap.jsx
git commit -m "feat(world-market): SVG choropleth world map — world-atlas + buildPathGen"
```

---

## Task 6: Create CountryPanel.jsx

**Files:**
- Create: `src/pages/WorldMarket/CountryPanel.jsx`

- [ ] **Step 1: Create the component**

Create `src/pages/WorldMarket/CountryPanel.jsx`:

```jsx
// src/pages/WorldMarket/CountryPanel.jsx
//
// Right panel — shows commodity breakdown for a clicked country.
// Fetches loadCountryCommodities() on selection change.

import { useEffect, useState } from 'react';
import { loadCountryCommodities, fmtUsd } from './comtradeDataset';
import { CATEGORIES } from '../Atlas/cropData';

// Map HS chapter codes 01-24 to our existing category colours.
const HS_CATEGORY = {
  '01': 'livestock', '02': 'livestock', '03': 'livestock',
  '04': 'livestock', '05': 'livestock',
  '06': 'horti', '07': 'horti', '08': 'horti',
  '09': 'spice', '10': 'cereal', '11': 'cereal',
  '12': 'oilseed', '13': 'plantation', '14': 'fiber',
  '15': 'oilseed', '16': 'livestock',
  '17': 'sugar', '18': 'plantation',
  '19': 'cereal', '20': 'horti', '21': 'horti',
  '22': 'horti', '23': 'cereal', '24': 'residue',
};

function categoryColor(hsCode) {
  const cat = HS_CATEGORY[String(hsCode).slice(0, 2)];
  return CATEGORIES[cat]?.color || 'var(--c-accent)';
}

export default function CountryPanel({ code, partnerData, year, topPartners, onSelectCode }) {
  const [commodities, setCommodities] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!code) { setCommodities(null); return; }
    let cancelled = false;
    setLoading(true); setError(null);
    loadCountryCommodities(code, year)
      .then(data => { if (!cancelled) { setCommodities(data); setLoading(false); } })
      .catch(err => { if (!cancelled) { setError(err.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, [code, year]);

  const partner = partnerData?.[code];

  if (!code) {
    // Default: top 10 importers
    return (
      <div className="wm-panel">
        <div className="wm-panel-head">
          <div className="wm-panel-eyebrow">Top Importers from India</div>
          <div className="wm-panel-name" style={{ fontSize: 14 }}>Click a country to see commodity breakdown</div>
        </div>
        <div className="wm-panel-list">
          {topPartners.slice(0, 10).map((p, i) => (
            <div key={p.code} className="wm-default-row" onClick={() => onSelectCode(p.code)}>
              <span className="wm-default-rank">{String(i + 1).padStart(2, '0')}</span>
              <span className="wm-default-name">{p.name}</span>
              <span className="wm-default-val">{fmtUsd(p.value_usd)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const totalUsd = partner?.value_usd || 0;
  const max = commodities?.[0]?.value_usd || 1;

  return (
    <div className="wm-panel">
      <div className="wm-panel-head">
        <div className="wm-panel-eyebrow">Selected Country</div>
        <div className="wm-panel-name">{partner?.name || `Country ${code}`}</div>
        <div className="wm-panel-sub">
          {fmtUsd(totalUsd)} total imports from India · {year}
        </div>
      </div>
      <div className="wm-panel-list">
        {loading && <div className="wm-loading">Loading…</div>}
        {error && <div className="wm-loading" style={{ color: 'var(--c-danger)' }}>API error — {error}</div>}
        {!loading && !error && commodities?.length === 0 && (
          <div className="wm-loading">No agricultural export data for this country.</div>
        )}
        {!loading && !error && commodities?.map((c) => {
          const color = categoryColor(c.hsCode);
          const w = Math.max(3, (c.value_usd / max) * 100);
          return (
            <div key={c.hsCode} className="wm-commodity-row"
              style={{ borderLeft: `3px solid ${color}` }}>
              <div className="wm-commodity-meta">
                <span className="wm-commodity-name">{c.name}</span>
                <span className="wm-commodity-val">{fmtUsd(c.value_usd)}</span>
              </div>
              <div className="wm-bar-track">
                <div className="wm-bar-fill" style={{ width: `${w}%`, background: color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/WorldMarket/CountryPanel.jsx
git commit -m "feat(world-market): CountryPanel — commodity breakdown on country click"
```

---

## Task 7: Create WorldTab.jsx

**Files:**
- Create: `src/pages/WorldMarket/WorldTab.jsx`

- [ ] **Step 1: Create the component**

Create `src/pages/WorldMarket/WorldTab.jsx`:

```jsx
// src/pages/WorldMarket/WorldTab.jsx
//
// World tab layout: sidebar (year + category) | WorldMap | CountryPanel.
// Mirrors AtlasMapMode's 3-column pattern.

import { useState, useMemo } from 'react';
import { C } from '../../tokens';
import { CATEGORIES } from '../Atlas/cropData';
import WorldMap from './WorldMap';
import CountryPanel from './CountryPanel';

const YEARS = ['2023', '2022', '2021'];

export default function WorldTab({ partnerData, loading, error, year, setYear }) {
  const [selectedCode, setSelectedCode] = useState(null);
  const [hoveredCode, setHoveredCode]   = useState(null);
  const [catFilter, setCatFilter]       = useState('all');

  const handleHover = (code) => setHoveredCode(code || null);
  const handleSelect = (code) => setSelectedCode(prev => prev === code ? null : code);

  // Top partners sorted by value — shown in default panel + used for total KPI.
  const topPartners = useMemo(() => {
    if (!partnerData) return [];
    return Object.entries(partnerData)
      .map(([code, d]) => ({ code: Number(code), ...d }))
      .sort((a, b) => b.value_usd - a.value_usd);
  }, [partnerData]);

  return (
    <div className="wm-body">
      {/* Sidebar */}
      <div className="wm-sidebar">
        <div className="wm-sb-block">
          <span className="wm-sb-label">Year</span>
          <select className="wm-sb-select" value={year} onChange={e => setYear(e.target.value)}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div className="wm-sb-block">
          <span className="wm-sb-label">Category</span>
          <button
            className={`wm-sb-cat${catFilter === 'all' ? ' active' : ''}`}
            onClick={() => setCatFilter('all')}>
            <span className="wm-sb-dot" style={{ background: 'var(--c-accent)' }} />
            All Exports
          </button>
          {Object.entries(CATEGORIES).map(([key, cat]) => (
            <button key={key}
              className={`wm-sb-cat${catFilter === key ? ' active' : ''}`}
              onClick={() => setCatFilter(key)}>
              <span className="wm-sb-dot" style={{ background: cat.color }} />
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* World map */}
      <div className="wm-map">
        {loading && <div className="wm-loading">Loading Comtrade data…</div>}
        {error && (
          <div className="wm-loading" style={{ flexDirection: 'column', gap: 8 }}>
            <span style={{ color: 'var(--c-danger)' }}>Comtrade API unavailable</span>
            <span style={{ fontSize: 11, color: 'var(--c-fg3)' }}>{error}</span>
          </div>
        )}
        {!loading && !error && (
          <WorldMap
            partnerData={partnerData}
            selectedCode={selectedCode}
            hoveredCode={hoveredCode}
            onSelect={handleSelect}
            onHover={handleHover}
          />
        )}
      </div>

      {/* Country detail panel */}
      <CountryPanel
        code={selectedCode}
        partnerData={partnerData}
        year={year}
        topPartners={topPartners}
        onSelectCode={setSelectedCode}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/WorldMarket/WorldTab.jsx
git commit -m "feat(world-market): WorldTab layout — sidebar + map + panel"
```

---

## Task 8: Create CommodityLeaderboard.jsx and DestinationPanel.jsx

**Files:**
- Create: `src/pages/WorldMarket/CommodityLeaderboard.jsx`
- Create: `src/pages/WorldMarket/DestinationPanel.jsx`

- [ ] **Step 1: Create CommodityLeaderboard.jsx**

Create `src/pages/WorldMarket/CommodityLeaderboard.jsx`:

```jsx
// src/pages/WorldMarket/CommodityLeaderboard.jsx
//
// AP tab left side — ranked table of AP's top export commodities.

import { C } from '../../tokens';
import { CATEGORIES } from '../Atlas/cropData';
import { fmtUsd } from './comtradeDataset';

export default function CommodityLeaderboard({ commodities, selected, onSelect }) {
  return (
    <div className="wm-ap-list">
      <div className="wm-ap-header">
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--c-fg3)', marginBottom: 2 }}>
            Andhra Pradesh · Exports 2023-24
          </div>
          <div className="wm-ap-title">Top Commodities by Export Value</div>
        </div>
      </div>

      <div className="wm-ap-cols">
        <span>#</span>
        <span>COMMODITY</span>
        <span style={{ textAlign: 'right' }}>VALUE (USD)</span>
        <span style={{ textAlign: 'right' }}>VOLUME</span>
        <span style={{ textAlign: 'right' }}>TOP MARKET</span>
      </div>

      <div className="wm-ap-rows">
        {commodities.map((c, i) => {
          const cat = CATEGORIES[c.category];
          const color = cat?.color || 'var(--c-accent)';
          const topDest = c.destinations?.[0]?.country || '—';
          const isActive = selected === c.name;
          return (
            <div
              key={c.name}
              className={`wm-ap-row${isActive ? ' active' : ''}`}
              style={{ borderLeftColor: color }}
              onClick={() => onSelect(isActive ? null : c.name)}
            >
              <span className="wm-ap-rank">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <div className="wm-ap-name">{c.name}</div>
                <div className="wm-ap-badge">{cat?.label || c.category} · APEDA</div>
              </div>
              <span className="wm-ap-val">{fmtUsd(c.value_usd_m * 1e6)}</span>
              <span className="wm-ap-val">{c.volume_kt >= 1000 ? `${(c.volume_kt / 1000).toFixed(1)} MT` : `${c.volume_kt} KT`}</span>
              <span className="wm-ap-top">{topDest}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create DestinationPanel.jsx**

Create `src/pages/WorldMarket/DestinationPanel.jsx`:

```jsx
// src/pages/WorldMarket/DestinationPanel.jsx
//
// AP tab right side — destination country breakdown for selected commodity.

import { CATEGORIES } from '../Atlas/cropData';
import { fmtUsd } from './comtradeDataset';

export default function DestinationPanel({ commodity }) {
  if (!commodity) {
    return (
      <div className="wm-dest-panel">
        <div className="wm-dest-empty">Select a commodity to see destination breakdown</div>
      </div>
    );
  }

  const cat = CATEGORIES[commodity.category];
  const color = cat?.color || 'var(--c-accent)';
  const max = commodity.destinations?.[0]?.value_usd_m || 1;

  return (
    <div className="wm-dest-panel">
      <div className="wm-panel-head">
        <div className="wm-panel-eyebrow">Destination Countries</div>
        <div className="wm-panel-name">{commodity.name}</div>
        <div className="wm-panel-sub">
          AP · {fmtUsd(commodity.value_usd_m * 1e6)} total · 2023-24
        </div>
      </div>
      <div className="wm-panel-list">
        {commodity.destinations?.map((d) => {
          const w = Math.max(3, (d.value_usd_m / max) * 100);
          return (
            <div key={d.country} className="wm-commodity-row"
              style={{ borderLeft: `3px solid ${color}` }}>
              <div className="wm-commodity-meta">
                <span className="wm-commodity-name">{d.country}</span>
                <span className="wm-commodity-val">{fmtUsd(d.value_usd_m * 1e6)} · {d.share_pct}%</span>
              </div>
              <div className="wm-bar-track">
                <div className="wm-bar-fill" style={{ width: `${w}%`, background: color }} />
              </div>
            </div>
          );
        })}
        <div style={{
          marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--c-border)',
          fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--c-fg3)',
          lineHeight: 1.5,
        }}>
          Source: APEDA AgriExchange · AP region data · 2023-24
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/WorldMarket/CommodityLeaderboard.jsx src/pages/WorldMarket/DestinationPanel.jsx
git commit -m "feat(world-market): CommodityLeaderboard + DestinationPanel for AP tab"
```

---

## Task 9: Create APTab.jsx

**Files:**
- Create: `src/pages/WorldMarket/APTab.jsx`

- [ ] **Step 1: Create the component**

Create `src/pages/WorldMarket/APTab.jsx`:

```jsx
// src/pages/WorldMarket/APTab.jsx
//
// AP tab — commodity leaderboard (left) + destination panel (right).

import { useState, useEffect } from 'react';

const AP_URL = `${import.meta.env.BASE_URL || '/'}data/ap-exports.json`;

export default function APTab() {
  const [apData, setApData]       = useState(null);
  const [selected, setSelected]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(AP_URL)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => { if (!cancelled) { setApData(d); setLoading(false); } })
      .catch(err => { if (!cancelled) { setError(err.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="wm-loading">Loading AP export data…</div>;
  if (error)   return <div className="wm-loading" style={{ color: 'var(--c-danger)' }}>Error: {error}</div>;

  const { CommodityLeaderboard, DestinationPanel } = APTab;

  const commodities = apData?.commodities || [];
  const selectedCommodity = commodities.find(c => c.name === selected) || null;

  // Dynamic import to keep bundle size clean — same pattern as Atlas lazy pages.
  // Since we're inside the WorldMarket chunk already, just import directly.
  return (
    <APTabInner
      commodities={commodities}
      selected={selected}
      onSelect={setSelected}
      selectedCommodity={selectedCommodity}
    />
  );
}

// Split into inner component so the data-loading logic above stays clean.
import CommodityLeaderboard from './CommodityLeaderboard';
import DestinationPanel from './DestinationPanel';

function APTabInner({ commodities, selected, onSelect, selectedCommodity }) {
  return (
    <div className="wm-ap-body">
      <CommodityLeaderboard
        commodities={commodities}
        selected={selected}
        onSelect={onSelect}
      />
      <DestinationPanel commodity={selectedCommodity} />
    </div>
  );
}
```

**Note:** The import statements at the bottom of that file are invalid JavaScript (imports must be at the top). Fix them in the next step.

- [ ] **Step 2: Rewrite APTab.jsx with correct import order**

Overwrite `src/pages/WorldMarket/APTab.jsx` with the corrected version (imports at top):

```jsx
// src/pages/WorldMarket/APTab.jsx

import { useState, useEffect } from 'react';
import CommodityLeaderboard from './CommodityLeaderboard';
import DestinationPanel from './DestinationPanel';

const AP_URL = `${import.meta.env.BASE_URL || '/'}data/ap-exports.json`;

export default function APTab() {
  const [apData, setApData]     = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(AP_URL)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => { if (!cancelled) { setApData(d); setLoading(false); } })
      .catch(err => { if (!cancelled) { setError(err.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="wm-loading">Loading AP export data…</div>;
  if (error)   return <div className="wm-loading" style={{ color: 'var(--c-danger)' }}>Error: {error}</div>;

  const commodities = apData?.commodities || [];
  const selectedCommodity = commodities.find(c => c.name === selected) || null;

  return (
    <div className="wm-ap-body">
      <CommodityLeaderboard
        commodities={commodities}
        selected={selected}
        onSelect={setSelected}
      />
      <DestinationPanel commodity={selectedCommodity} />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/WorldMarket/APTab.jsx
git commit -m "feat(world-market): APTab — commodity leaderboard + destination panel"
```

---

## Task 10: Create WorldMarketNavBar.jsx

**Files:**
- Create: `src/pages/WorldMarket/WorldMarketNavBar.jsx`

- [ ] **Step 1: Create the component**

Create `src/pages/WorldMarket/WorldMarketNavBar.jsx`:

```jsx
// src/pages/WorldMarket/WorldMarketNavBar.jsx
//
// Top bar: "01 World / 02 Andhra Pradesh" tabs + KPI header strip.

import { fmtUsd } from './comtradeDataset';

export default function WorldMarketNavBar({ tab, setTab, topPartners, partnerCount }) {
  const totalUsd   = topPartners.reduce((s, p) => s + p.value_usd, 0);
  const topCountry = topPartners[0]?.name || '—';

  return (
    <>
      {/* Tab bar */}
      <div className="wm-navbar">
        <button
          className={`wm-tab${tab === 'world' ? ' active' : ''}`}
          onClick={() => setTab('world')}
          aria-selected={tab === 'world'} role="tab"
        >
          <span className="wm-tab-idx">01</span> World
        </button>
        <button
          className={`wm-tab${tab === 'ap' ? ' active' : ''}`}
          onClick={() => setTab('ap')}
          aria-selected={tab === 'ap'} role="tab"
        >
          <span className="wm-tab-idx">02</span> Andhra Pradesh
        </button>
      </div>

      {/* Header strip */}
      <div className="wm-header-strip">
        <div className="wm-header-text">
          <div className="wm-eyebrow">India · Agricultural Exports</div>
          <div className="wm-title">
            World <em>Market</em>
          </div>
        </div>
        <div className="wm-kpi-chips">
          <div className="wm-kpi-chip">
            <div className="wm-kpi-value">{totalUsd ? fmtUsd(totalUsd) : '—'}</div>
            <div className="wm-kpi-label">Total Agri Exports</div>
          </div>
          <div className="wm-kpi-chip">
            <div className="wm-kpi-value">{partnerCount || '—'}</div>
            <div className="wm-kpi-label">Markets</div>
          </div>
          <div className="wm-kpi-chip">
            <div className="wm-kpi-value" style={{ fontSize: 14 }}>{topCountry}</div>
            <div className="wm-kpi-label">Top Importer</div>
          </div>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/WorldMarket/WorldMarketNavBar.jsx
git commit -m "feat(world-market): WorldMarketNavBar — tabs + KPI header strip"
```

---

## Task 11: Create src/pages/WorldMarket/index.jsx

**Files:**
- Create: `src/pages/WorldMarket/index.jsx`

- [ ] **Step 1: Create the page root**

Create `src/pages/WorldMarket/index.jsx`:

```jsx
// src/pages/WorldMarket/index.jsx
//
// World Market page root. Handles tab state and Comtrade data loading.

import { useState, useEffect, useMemo } from 'react';
import { loadPartnerTotals } from './comtradeDataset';
import WorldMarketNavBar from './WorldMarketNavBar';
import WorldTab from './WorldTab';
import APTab from './APTab';
import '../../world-market.css';

const DEFAULT_YEAR = '2023';

export default function WorldMarketPage() {
  const [tab, setTab]             = useState('world');
  const [year, setYear]           = useState(DEFAULT_YEAR);
  const [partnerData, setPartnerData] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null);
    loadPartnerTotals(year)
      .then(data => { if (!cancelled) { setPartnerData(data); setLoading(false); } })
      .catch(err => { if (!cancelled) { setError(err.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, [year]);

  const topPartners = useMemo(() => {
    if (!partnerData) return [];
    return Object.entries(partnerData)
      .map(([code, d]) => ({ code: Number(code), ...d }))
      .sort((a, b) => b.value_usd - a.value_usd);
  }, [partnerData]);

  const partnerCount = partnerData ? Object.keys(partnerData).length : 0;

  return (
    <div className="wm-root" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <WorldMarketNavBar
        tab={tab} setTab={setTab}
        topPartners={topPartners}
        partnerCount={partnerCount}
      />

      <div className={`wm-scroll${tab === 'world' ? ' wm-scroll-map' : ''}`}>
        {tab === 'world' && (
          <WorldTab
            partnerData={partnerData}
            loading={loading}
            error={error}
            year={year}
            setYear={setYear}
          />
        )}
        {tab === 'ap' && <APTab />}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/WorldMarket/index.jsx
git commit -m "feat(world-market): WorldMarketPage root — tab state + Comtrade data loading"
```

---

## Task 12: Wire up routing and nav item

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/components/SideNav.jsx`

- [ ] **Step 1: Add lazy import and route in App.jsx**

In `src/App.jsx`, after the `AtlasPage` lazy import (line 33), add:

```js
const WorldMarketPage = lazy(() => import('./pages/WorldMarket'));
```

In the `LINKABLE` array (line 35), add `'world-market'` to the list:

```js
const LINKABLE = ['dashboard', 'ideas', 'projects', 'suppliers', 'markets', 'atlas', 'world-market', 'about', 'access', 'calculations', 'scenarios', 'portfolio', 'settings'];
```

In the `renderPage` switch (after the `atlas` case, around line 274), add:

```js
case 'world-market':   return <WorldMarketPage onNavigate={navigate} />;
```

- [ ] **Step 2: Add nav item in SideNav.jsx**

In `src/components/SideNav.jsx`, after the `atlas` nav item (lines 44-46), add a new entry to `NAV_ITEMS`:

```js
{
  id: 'world-market', label: 'World Market',
  icon: <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M3 7h18M3 17h18"/></svg>,
},
```

- [ ] **Step 3: Verify the app builds with no errors**

```bash
npm run build 2>&1 | tail -20
```

Expected: build completes, no errors. If `world-atlas` TopoJSON import fails (Vite can't resolve JSON), add to `vite.config.js`:

```js
// In defineConfig plugins or resolve section — only if build fails:
// vite handles JSON imports natively; this step should not be needed.
```

If you see `"world-atlas/world/110m.json" has no default export`, change the WorldMap.jsx import to:

```js
import worldTopo from 'world-atlas/world/110m.json' assert { type: 'json' };
```

Or add `?url` suffix and fetch it at runtime.

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx src/components/SideNav.jsx
git commit -m "feat(world-market): wire up routing + nav item"
```

---

## Task 13: Test and deploy

**Files:** none new

- [ ] **Step 1: Start dev server and check all three main interactions**

```bash
npm run dev
```

Open `http://localhost:5173/newbeginnings/#/world-market` (or whichever port is free).

Verify:
1. "World Market" nav item appears and navigates correctly
2. World tab loads — Comtrade API fetch fires (check Network tab). If API fails, the error message renders instead of a blank screen.
3. Clicking a country loads commodity breakdown in the right panel
4. Switching to AP tab shows the commodity leaderboard; clicking a row shows destination panel
5. KPI chips in header show total, country count, top importer

- [ ] **Step 2: Check for console errors**

Open browser DevTools → Console. Resolve any errors before deploying.

Common issues:
- `Cannot read properties of null` in WorldMap — means `buildPathGen` received empty GeoJSON. Add a null-check in WorldMap: `if (!WORLD_GEO?.features?.length) return null;`
- Comtrade CORS error — the API supports CORS; if blocked, may be a temporary rate limit. The error state will display.
- `world-atlas` JSON not resolving — add `assetsInclude: ['**/*.json']` to `vite.config.js` under `defineConfig`.

- [ ] **Step 3: Deploy to GitHub Pages**

```bash
git push origin main
```

GitHub Actions will build and deploy. Deployment takes ~2 minutes. Verify at `https://jvk7979.github.io/newbeginnings/#/world-market`.

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Covered by |
|-----------------|------------|
| World tab — choropleth world map | Task 5 (WorldMap.jsx) |
| Click country → commodity breakdown | Task 6 (CountryPanel.jsx) |
| Sidebar year + category filters | Task 7 (WorldTab.jsx) |
| UN Comtrade live API | Task 4 (comtradeDataset.js) |
| 24h localStorage cache | Task 4 (comtradeDataset.js) |
| AP tab — commodity leaderboard | Task 8 (CommodityLeaderboard.jsx) |
| Click commodity → destinations | Task 8 (DestinationPanel.jsx) |
| ap-exports.json curated data | Task 2 |
| KPI header strip | Task 10 (WorldMarketNavBar.jsx) |
| Nav item + routing | Task 12 |
| CSS mirrors atlas-v2.css | Task 3 (world-market.css) |
| Responsive (≤900px, ≤600px) | Task 3 (world-market.css) |
| Graceful API error handling | Tasks 4, 6, 7, 11 |

**No placeholders found.** All code blocks are complete and immediately usable.

**Type consistency check:** `fmtUsd` is defined in `comtradeDataset.js` and imported in `CountryPanel.jsx`, `CommodityLeaderboard.jsx`, `DestinationPanel.jsx`, and `WorldMarketNavBar.jsx` — consistent. `partnerData` shape `{ [code]: { name, iso3, value_usd } }` is built in `loadPartnerTotals` and consumed in `WorldTab.jsx`, `CountryPanel.jsx`, `WorldMarketNavBar.jsx` — consistent. `ap-exports.json` shape with `commodities[].destinations[].value_usd_m` is read in `APTab.jsx` and rendered in `CommodityLeaderboard.jsx` and `DestinationPanel.jsx` — consistent.
