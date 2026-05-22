// src/pages/Atlas/desDataset.js
//
// Bridges real government crop data into the shape the Atlas components
// already consume.
//
//  - State-level Yearly data comes from APEDA (apedaData.json), a broad
//    dataset (99 crops incl. all horticulture/livestock) for production —
//    see buildUnifiedStates below. Sown-area is merged in from DES.
//  - AP district drill-down uses DES (Directorate of Economics &
//    Statistics) data — desData.json — because APEDA has no district data.
//
// The components expect STATES / AP_DISTRICTS objects whose crop rows are
//   [name, category, prod_kt, area_kha, share_pct, yield_kgha?]
// so computeStateMetric / computeDistrictMetric in geoHelpers work
// unchanged. The builders below produce exactly that shape.
//
// desData.json field order is [area_kha, prod_kt, yield_kgha].

import desData from './desData.json';
import apedaData from './apedaData.json';
import { STATES, AP_DISTRICTS } from './cropData';

const CROP_CATEGORY = desData.cropCategory;

// A few APEDA crop names differ from the DES spelling — map them so the
// DES area lookup resolves for the field crops that exist in both sets.
const DES_ALIAS = { 'Soyabean': 'Soybean', 'Tur (Arhar)': 'Tur', 'Lentil (Masur)': 'Lentil' };

// buildUnifiedStates(year) — the year-driven equivalent of cropData's
// STATES, for one financial year. Each state keeps its curated metadata
// (capital, code, raw streams, note, districtKey) where one exists; crop
// rows are rebuilt from APEDA production for the chosen year, with sown
// area merged in from the DES state dataset.
//
// APEDA carries production only, so area comes from DES (real year-wise
// area for the field crops). Each crop row is
//   [name, category, production, area, sharePct]
// (area is 0 where DES has no figure for that crop/state/year — e.g. the
// 2020-21 APEDA year, which DES does not cover).
//
// Memoised per year — buildUnifiedStates is called from index.jsx's render.
const _statesCache = {};
export function buildUnifiedStates(year) {
  if (_statesCache[year]) return _statesCache[year];

  const out = {};
  for (const [name, stateData] of Object.entries(apedaData.states)) {
    const meta = STATES[name] || { code: '', capital: '', crops: [] };
    const crops = [];
    for (const [crop, byYear] of Object.entries(stateData)) {
      const rec = byYear[year];
      if (!rec) continue;
      const [prod, share] = rec;              // apedaData order: [production, sharePct]
      const category = apedaData.cropCategory[crop] || 'cereal';
      // DES area lookup — DES crop-year values are [area_kha, prod_kt, yield].
      const desName = DES_ALIAS[crop] || crop;
      const area = desData.states?.[name]?.[desName]?.[year]?.[0] ?? 0;
      crops.push([crop, category, prod, area, share]);
    }
    out[name] = { ...meta, crops };
  }

  _statesCache[year] = out;
  return out;
}

// District crop rows from DES (districtYear only — DES has just one year of
// district data). District rows carry no national-share column, so the 5th
// element is 0; the 6th is yield. Mirrors computeDistrictMetric's contract.
function desDistrictCrops(districtName) {
  const src = desData.districts['Andhra Pradesh']?.[districtName];
  if (!src) return [];
  const crops = [];
  for (const [crop, rec] of Object.entries(src)) {
    const [area, prod, yld] = rec;            // desData order: [area, prod, yield]
    const category = CROP_CATEGORY[crop] || 'cereal';
    crops.push([crop, category, prod, area, 0, yld]);
  }
  return crops;
}

// buildDesApDistricts() — the 26 AP districts, each curated raw-materials
// metadata merged with DES district crop rows. Identical to mergedApDistricts
// below; kept as a named builder for symmetry with buildUnifiedStates.
export function buildDesApDistricts() {
  const out = {};
  for (const [name, meta] of Object.entries(AP_DISTRICTS)) {
    out[name] = { ...meta, crops: desDistrictCrops(name) };
  }
  return out;
}

// mergedApDistricts — the 26 AP districts with DES crop rows attached.
// District crops are always DES (there is no curated district crop data).
// Built once at module load.
export const mergedApDistricts = buildDesApDistricts();
