// src/pages/Atlas/desDataset.js
//
// Bridges real government crop data into the shape the Atlas components
// already consume.
//
//  - State-level Yearly data comes from APEDA (public/data/apeda.json), a
//    broad dataset (99 crops incl. all horticulture/livestock) for production.
//    Sown-area is merged in from DES.
//  - AP district drill-down uses DES (Directorate of Economics &
//    Statistics) data — public/data/des.json — because APEDA has no
//    district data.
//
// The components expect STATES / AP_DISTRICTS objects whose crop rows are
//   [name, category, prod_kt, area_kha, share_pct, yield_kgha?]
// so computeStateMetric / computeDistrictMetric in geoHelpers work
// unchanged. The builders below produce exactly that shape.
//
// des.json field order is [area_kha, prod_kt, yield_kgha].
//
// Both JSON files used to be imported statically from src/pages/Atlas/,
// which baked ~780 KB of static data into the JS bundle. That slowed
// every deploy by ~80 seconds because Vite had to parse, tree-shake,
// chunk, and Workbox-precache the data on every build. Moving them to
// public/data/ means they're served raw from the CDN, fetched at
// runtime by the Atlas page on first mount, and cached aggressively by
// the browser thereafter.

// STATES + AP_DISTRICTS were imported here statically before — they
// now live in public/data/atlas-meta.json (51 KB) so the static-data
// bulk doesn't bloat the Atlas JS chunk. cropData.js retains only the
// small lookup constants (CATEGORIES + the two centroid maps).
const APEDA_URL = `${import.meta.env.BASE_URL || '/'}data/apeda.json`;
const DES_URL   = `${import.meta.env.BASE_URL || '/'}data/des.json`;
const META_URL  = `${import.meta.env.BASE_URL || '/'}data/atlas-meta.json`;

// A few APEDA crop names differ from the DES spelling — map them so the
// DES area lookup resolves for the field crops that exist in both sets.
const DES_ALIAS = { 'Soyabean': 'Soybean', 'Tur (Arhar)': 'Tur', 'Lentil (Masur)': 'Lentil' };

// Module-global cache so repeated mounts of AtlasPage / mode switches /
// route remounts re-use the parsed data without re-fetching. Resolves to
// `{ apeda, des, meta }` once all three fetches complete. `meta` carries
// the curated STATES + AP_DISTRICTS metadata (51 KB) that used to be
// statically imported from cropData.js.
let _dataPromise = null;
export function loadAtlasData() {
  if (_dataPromise) return _dataPromise;
  const fetchJson = (url, label) => fetch(url).then(r => {
    if (!r.ok) throw new Error(`Atlas ${label} fetch failed: ${r.status}`);
    return r.json();
  });
  _dataPromise = Promise.all([
    fetchJson(APEDA_URL, 'apeda.json'),
    fetchJson(DES_URL,   'des.json'),
    fetchJson(META_URL,  'atlas-meta.json'),
  ]).then(([apeda, des, meta]) => ({ apeda, des, meta }))
    .catch(err => {
      // Reset the cache on failure so the next call retries instead of
      // serving the rejected Promise forever.
      _dataPromise = null;
      throw err;
    });
  return _dataPromise;
}

// buildUnifiedStates(year, apeda, des) — the year-driven equivalent of
// cropData's STATES, for one financial year. Each state keeps its
// curated metadata (capital, code, raw streams, note, districtKey) where
// one exists; crop rows are rebuilt from APEDA production for the chosen
// year, with sown area merged in from the DES state dataset.
//
// APEDA carries production only, so area comes from DES (real year-wise
// area for the field crops). Each crop row is
//   [name, category, production, area, sharePct]
// (area is 0 where DES has no figure for that crop/state/year — e.g. the
// 2020-21 APEDA year, which DES does not cover).
//
// Memoised per (year, dataset identity). Callers pass the loaded apeda /
// des objects in so this stays a pure function.
const _statesCache = new WeakMap();
export function buildUnifiedStates(year, apeda, des, atlasMeta) {
  if (!apeda || !des) return {};
  const STATES = atlasMeta?.states || {};
  let perDataset = _statesCache.get(apeda);
  if (!perDataset) { perDataset = {}; _statesCache.set(apeda, perDataset); }
  if (perDataset[year]) return perDataset[year];

  const out = {};
  for (const [name, stateData] of Object.entries(apeda.states)) {
    const meta = STATES[name] || { code: '', capital: '', crops: [] };
    const crops = [];
    for (const [crop, byYear] of Object.entries(stateData)) {
      const rec = byYear[year];
      if (!rec) continue;
      const [prod, share] = rec;              // apeda order: [production, sharePct]
      const category = apeda.cropCategory[crop] || 'cereal';
      // DES area lookup — DES crop-year values are [area_kha, prod_kt, yield].
      const desName = DES_ALIAS[crop] || crop;
      const area = des.states?.[name]?.[desName]?.[year]?.[0] ?? 0;
      crops.push([crop, category, prod, area, share]);
    }
    out[name] = { ...meta, crops };
  }

  perDataset[year] = out;
  return out;
}

// District crop rows from DES (districtYear only — DES has just one year of
// district data). District rows carry no national-share column, so the 5th
// element is 0; the 6th is yield. Mirrors computeDistrictMetric's contract.
function desDistrictCrops(districtName, des) {
  const src = des.districts['Andhra Pradesh']?.[districtName];
  if (!src) return [];
  const CROP_CATEGORY = des.cropCategory;
  const crops = [];
  for (const [crop, rec] of Object.entries(src)) {
    const [area, prod, yld] = rec;            // des order: [area, prod, yield]
    const category = CROP_CATEGORY[crop] || 'cereal';
    crops.push([crop, category, prod, area, 0, yld]);
  }
  return crops;
}

// buildDesApDistricts(des, atlasMeta) — the 26 AP districts, each
// curated raw-materials metadata merged with DES district crop rows.
// AP_DISTRICTS now comes from atlas-meta.json (loaded at runtime),
// not from a static import.
export function buildDesApDistricts(des, atlasMeta) {
  if (!des || !atlasMeta?.apDistricts) return {};
  const out = {};
  for (const [name, meta] of Object.entries(atlasMeta.apDistricts)) {
    out[name] = { ...meta, crops: desDistrictCrops(name, des) };
  }
  return out;
}
