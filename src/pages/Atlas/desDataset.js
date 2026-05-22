// src/pages/Atlas/desDataset.js
//
// Bridges real DES (Directorate of Economics & Statistics) crop data —
// desData.json — into the shape the Atlas components already consume.
//
// The components expect STATES / AP_DISTRICTS objects whose crop rows are
//   [name, category, prod_kt, area_kha, share_pct, yield_kgha?]
// so computeStateMetric / computeDistrictMetric in geoHelpers work
// unchanged. The builders below produce exactly that shape from DES data.
//
// desData.json field order is [area_kha, prod_kt, yield_kgha].

import desData from './desData.json';
import { STATES, AP_DISTRICTS } from './cropData';

const CROP_CATEGORY = desData.cropCategory;

// buildDesStates(year) — the DES-driven equivalent of cropData's STATES,
// for one financial year. Each state keeps its curated metadata (capital,
// code, raw streams, note, districtKey) where one exists; crop rows are
// rebuilt from DES production/area/yield for the chosen year.
//
// Memoised per year — buildDesStates is called from index.jsx's render.
const _statesCache = {};
export function buildDesStates(year) {
  if (_statesCache[year]) return _statesCache[year];

  // National production per crop for the year — denominator of the share %.
  const nationalProd = {};
  for (const stateData of Object.values(desData.states)) {
    for (const [crop, byYear] of Object.entries(stateData)) {
      const rec = byYear[year];
      if (!rec) continue;
      nationalProd[crop] = (nationalProd[crop] || 0) + (rec[1] || 0);
    }
  }

  const out = {};
  for (const [name, stateData] of Object.entries(desData.states)) {
    const meta = STATES[name] || { code: '', capital: '', crops: [] };
    const crops = [];
    for (const [crop, byYear] of Object.entries(stateData)) {
      const rec = byYear[year];
      if (!rec) continue;
      const [area, prod, yld] = rec;          // desData order: [area, prod, yield]
      const category = CROP_CATEGORY[crop] || 'cereal';
      const denom = nationalProd[crop] || 0;
      const share = denom > 0 ? Math.round((prod / denom) * 1000) / 10 : 0;
      crops.push([crop, category, prod, area, share, yld]);
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
// below; kept as a named builder for symmetry with buildDesStates.
export function buildDesApDistricts() {
  const out = {};
  for (const [name, meta] of Object.entries(AP_DISTRICTS)) {
    out[name] = { ...meta, crops: desDistrictCrops(name) };
  }
  return out;
}

// mergedApDistricts — the 26 AP districts with DES crop rows attached.
// District crops are always DES (there is no curated district crop data),
// so this single object is used as the `apDistricts` dataset in BOTH the
// Snapshot and Yearly·DES modes. Built once at module load.
export const mergedApDistricts = buildDesApDistricts();
