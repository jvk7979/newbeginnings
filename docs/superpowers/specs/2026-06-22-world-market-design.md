# World Market Page — Design Spec

**Date:** 2026-06-22
**Status:** Approved — ready for implementation

---

## Overview

A new top-level page ("World Market") that shows India's agricultural exports to the world, with a second tab narrowing to Andhra Pradesh's specific export commodities. The page gives an editorial overview of what India (and AP) exports, which countries buy it, and how values break down by commodity.

---

## Architecture Approach

**Option C — Split tabs, each optimised for its data.**

- **World tab:** choropleth world map (countries shaded by import value from India) + click → commodity breakdown panel.
- **AP tab:** commodity leaderboard (AP's top export crops ranked by USD value) + click → destination country breakdown panel. No world map forced where AP data doesn't support it.

---

## Navigation

Add "World Market" as a new item in the app sidebar nav, same level as Crop Atlas and Markets. Route: `#/world-market`.

---

## World Tab

**Layout:** mirrors the Crop Atlas 3-column pattern.
- Left sidebar (190px): Year selector (2021 / 2022 / 2023), commodity category filter (All / Cereals / Spices / Plantation / etc.)
- Centre (flex:3): SVG choropleth world map. Countries shaded by total agricultural import value from India in the selected year. Hover shows country name + total value tooltip. Click selects a country.
- Right panel (flex:2): when a country is selected, shows its top commodities from India ranked by USD value, each with a proportional bar and category-coloured left border. Default state (no selection) shows top 10 importer countries globally.

**Data source:** UN Comtrade API — `comtradeplus.un.org`
- Reporter: India (code 356), Flow: Export, Partners: All countries
- Commodities: HS chapters 01–24 (food, agriculture, raw materials)
- Period: 2021, 2022, 2023 (3 years, fetched on mount)
- Free tier: 500 req/hr, no API key required
- Cache: LocalStorage with 24-hour TTL keyed by `wm-comtrade-{year}`
- Graceful degradation: if API is unreachable, show last cached data with a staleness badge

**World map:** SVG choropleth built from Natural Earth 110m TopoJSON via `world-atlas` npm package. Same `preserveAspectRatio="xMidYMid meet"` approach as IndiaMap.jsx.

---

## AP Tab

**Layout:** full-width commodity leaderboard + right detail panel.
- Left (flex:3): ranked table of AP's top export commodities. Columns: rank, commodity name + category badge, USD value, volume (MT/KT), top destination country. Category-coloured left border per row (matches Atlas colour tokens).
- Right (flex:2): clicking a row shows destination country breakdown — each country's share of that commodity's exports with a proportional bar. Bottom note shows AP's production share (from existing Atlas DES data) as context.

**AP's key commodities (initial dataset):** Rice (Non-Basmati), Chillies, Seafood (Shrimp/Prawn), Tobacco, Mango (Fresh + Pulp), Cotton, Maize, Groundnut.

**Data source:** `public/data/ap-exports.json` — curated from APEDA AgriExchange state-wise export tables. Updated manually each season. Format:
```json
{
  "meta": { "year": "2023-24", "source": "APEDA AgriExchange" },
  "commodities": [
    {
      "name": "Rice (Non-Basmati)",
      "category": "cereal",
      "value_usd_m": 1200,
      "volume_kt": 4100,
      "destinations": [
        { "country": "Bangladesh", "value_usd_m": 480, "share_pct": 40 }
      ]
    }
  ]
}
```

Future enhancement: replace with live APEDA AgriExchange API once endpoint is confirmed.

---

## New Files

```
src/pages/WorldMarket/
  index.jsx                  — page router, tab state, data loading
  WorldMarketNavBar.jsx      — "01 World / 02 Andhra Pradesh" tab bar + KPI header strip
  WorldTab.jsx               — sidebar + world map + detail panel
  WorldMap.jsx               — SVG choropleth world map component
  CountryPanel.jsx           — commodity breakdown for a clicked country
  APTab.jsx                  — commodity leaderboard + destination panel layout
  CommodityLeaderboard.jsx   — ranked AP export commodity rows
  DestinationPanel.jsx       — destination country breakdown for selected commodity
  comtradeDataset.js         — UN Comtrade fetch + LocalStorage cache (mirrors desDataset.js)

public/data/
  ap-exports.json            — curated AP commodity export data

src/world-market.css         — page styles (mirrors atlas-v2.css patterns and CSS tokens)
```

---

## Routing

Add `WorldMarketPage` to the app router alongside `AtlasPage`. New nav item "World Market" in the sidebar.

---

## Atlas Data Validation Findings

- Current APEDA data is **production** data — correct for the Atlas's production choropleth. Not a bug.
- Data is clean: 8,654 records, zero missing values, 99 crops × 37 states × 5 years.
- 3 crop name aliases (APEDA↔DES) already handled in `desDataset.js`. No data loss.
- Source is APEDA's public portal, not live-fetched — can drift from latest official figures. No action needed unless a live Atlas data refresh is requested separately.

---

## Out of Scope (this iteration)

- Live AP data via APEDA API (static JSON for now)
- Year-over-year trend sparklines in the World tab detail panel
- Mobile-optimised world map (responsive layout handled by CSS but map interaction is desktop-first)
