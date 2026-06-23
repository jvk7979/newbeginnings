// src/pages/WorldMarket/comtradeDataset.js
//
// Static curated datasets for India's exports by partner country.
// Two sources:
//   'apeda' — Agricultural & Allied Products only (APEDA AgriExchange / DGFT)
//   'oec'   — All Merchandise Exports (OEC / UN Comtrade)
// ISO 3166-1 numeric partner codes match world-atlas country IDs directly.

const BASE = import.meta.env.BASE_URL || '/';

const SOURCE_URLS = {
  apeda: `${BASE}data/india-exports.json`,
  oec:   `${BASE}data/india-exports-oec.json`,
};

const _cache = {};

async function loadAll(source) {
  const key = source || 'apeda';
  if (_cache[key]) return _cache[key];
  const url = SOURCE_URLS[key] || SOURCE_URLS.apeda;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  _cache[key] = await res.json();
  return _cache[key];
}

// Returns { [partnerCode]: { name, value_usd } } for the given year + source.
export async function loadPartnerTotals(year, source = 'apeda') {
  const all = await loadAll(source);
  return all[year] || all['2025'] || all['2024'] || {};
}

// Human-readable label for source chips / attribution line.
export const SOURCE_META = {
  apeda: {
    label: 'APEDA',
    detail: 'Agricultural & Allied Products',
    attribution: 'Source: APEDA AgriExchange / DGFT · Agricultural & Allied Products',
  },
  oec: {
    label: 'OEC',
    detail: 'All Merchandise Exports',
    attribution: 'Source: OEC (oec.world) / UN Comtrade · All Merchandise Exports',
  },
};

// Returns [{ hsCode, name, value_usd }] for a clicked country (APEDA only).
// Static breakdown for major partners; empty array for others / OEC source.
const COMMODITY_DETAIL = {
  // Bangladesh — rice, sugar, vegetables, cotton, spices (FY2025 base)
  '50':  [
    { hsCode: '10', name: 'Cereals (Rice)',         value_usd: 1820000000 },
    { hsCode: '17', name: 'Sugar',                  value_usd:  630000000 },
    { hsCode: '07', name: 'Vegetables',             value_usd:  420000000 },
    { hsCode: '52', name: 'Cotton',                 value_usd:  295000000 },
    { hsCode: '09', name: 'Spices',                 value_usd:  135000000 },
  ],
  // USA — marine products, spices, rice, processed foods, vegetables (FY2025 base $5.62B)
  '840': [
    { hsCode: '03', name: 'Marine Products',        value_usd: 1960000000 },
    { hsCode: '09', name: 'Spices',                 value_usd:  850000000 },
    { hsCode: '10', name: 'Cereals (Rice)',          value_usd:  720000000 },
    { hsCode: '20', name: 'Processed Foods',        value_usd:  680000000 },
    { hsCode: '07', name: 'Vegetables',             value_usd:  460000000 },
  ],
  // UAE — rice, meat, vegetables, fruits, spices
  '784': [
    { hsCode: '10', name: 'Cereals (Rice)',          value_usd:  650000000 },
    { hsCode: '02', name: 'Meat & Poultry',         value_usd:  490000000 },
    { hsCode: '07', name: 'Vegetables',             value_usd:  380000000 },
    { hsCode: '08', name: 'Fruits',                 value_usd:  280000000 },
    { hsCode: '09', name: 'Spices',                 value_usd:  200000000 },
  ],
  // China — cotton, sugar, castor oil, spices, oil seeds
  '156': [
    { hsCode: '52', name: 'Cotton',                 value_usd:  610000000 },
    { hsCode: '17', name: 'Sugar',                  value_usd:  360000000 },
    { hsCode: '15', name: 'Oils & Fats (Castor)',   value_usd:  310000000 },
    { hsCode: '09', name: 'Spices',                 value_usd:  224000000 },
    { hsCode: '12', name: 'Oil Seeds',              value_usd:  160000000 },
  ],
  // Nepal — cereals, vegetables, processed food, sugar, beverages
  '524': [
    { hsCode: '10', name: 'Cereals',                value_usd:  595000000 },
    { hsCode: '07', name: 'Vegetables',             value_usd:  362000000 },
    { hsCode: '20', name: 'Processed Foods',        value_usd:  277000000 },
    { hsCode: '17', name: 'Sugar',                  value_usd:  202000000 },
    { hsCode: '22', name: 'Beverages',              value_usd:  117000000 },
  ],
  // Vietnam — cotton, spices, cashews, cereals, oil seeds
  '704': [
    { hsCode: '52', name: 'Cotton',                 value_usd:  617000000 },
    { hsCode: '09', name: 'Spices',                 value_usd:  330000000 },
    { hsCode: '08', name: 'Cashew',                 value_usd:  256000000 },
    { hsCode: '10', name: 'Cereals',                value_usd:  170000000 },
    { hsCode: '12', name: 'Oil Seeds',              value_usd:  117000000 },
  ],
  // Saudi Arabia — rice, meat, vegetables, spices, fruits
  '682': [
    { hsCode: '10', name: 'Cereals (Rice)',          value_usd:  458000000 },
    { hsCode: '02', name: 'Meat & Poultry',         value_usd:  404000000 },
    { hsCode: '07', name: 'Vegetables',             value_usd:  255000000 },
    { hsCode: '09', name: 'Spices',                 value_usd:  128000000 },
    { hsCode: '08', name: 'Fruits',                 value_usd:   85000000 },
  ],
  // Indonesia — cotton, sugar, marine, spices, cereals
  '360': [
    { hsCode: '52', name: 'Cotton',                 value_usd:  362000000 },
    { hsCode: '17', name: 'Sugar',                  value_usd:  298000000 },
    { hsCode: '03', name: 'Marine Products',        value_usd:  191000000 },
    { hsCode: '09', name: 'Spices',                 value_usd:  117000000 },
    { hsCode: '10', name: 'Cereals',                value_usd:   96000000 },
  ],
  // UK — marine, spices, rice, misc preparations, vegetables
  '826': [
    { hsCode: '03', name: 'Marine Products',        value_usd:  192000000 },
    { hsCode: '09', name: 'Spices',                 value_usd:  160000000 },
    { hsCode: '10', name: 'Cereals (Rice)',          value_usd:  128000000 },
    { hsCode: '21', name: 'Misc. Preparations',     value_usd:  101000000 },
    { hsCode: '07', name: 'Vegetables',             value_usd:   74000000 },
  ],
  // Japan — marine, sesame, spices, vegetables, processed foods
  '392': [
    { hsCode: '03', name: 'Marine Products',        value_usd:  234000000 },
    { hsCode: '12', name: 'Oil Seeds (Sesame)',     value_usd:  149000000 },
    { hsCode: '09', name: 'Spices',                 value_usd:  117000000 },
    { hsCode: '07', name: 'Vegetables',             value_usd:   74000000 },
    { hsCode: '20', name: 'Processed Foods',        value_usd:   53000000 },
  ],
};

// Scale factors by year relative to 2025 base values in COMMODITY_DETAIL.
const YEAR_SCALE = { '2025': 1.0, '2024': 0.94, '2023': 0.88, '2022': 0.82 };

// Returns commodity breakdown for clicked country (APEDA only), or empty array.
export async function loadCountryCommodities(partnerCode, year, source = 'apeda') {
  if (source !== 'apeda') return [];
  const rows = COMMODITY_DETAIL[String(partnerCode)];
  if (!rows) return [];
  const scale = YEAR_SCALE[year] ?? 1.0;
  return rows.map(r => ({ ...r, value_usd: Math.round(r.value_usd * scale) }));
}

// Format USD value: "$1.24B", "$840M", "$12K"
export function fmtUsd(usd) {
  if (!usd || isNaN(usd)) return '—';
  if (usd >= 1e9) return `$${(usd / 1e9).toFixed(2)}B`;
  if (usd >= 1e6) return `$${Math.round(usd / 1e6)}M`;
  return `$${Math.round(usd / 1e3)}K`;
}
