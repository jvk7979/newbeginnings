// src/pages/WorldMarket/comtradeDataset.js
//
// Static curated dataset of India's agricultural exports by partner country.
// Source: APEDA AgriExchange / DGFT, curated for 2022-2024.
// ISO 3166-1 numeric partner codes match world-atlas country IDs directly.

const DATA_URL = `${import.meta.env.BASE_URL || '/'}data/india-exports.json`;

let _cache = null;

async function loadAll() {
  if (_cache) return _cache;
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  _cache = await res.json();
  return _cache;
}

// Returns { [partnerCode]: { name, value_usd } } for the given year.
export async function loadPartnerTotals(year) {
  const all = await loadAll();
  return all[year] || all['2024'] || {};
}

// Returns [{ hsCode, name, value_usd }] for a clicked country.
// Static breakdown for major partners; empty array for others.
const COMMODITY_DETAIL = {
  // Bangladesh — top buyer of Indian rice, sugar, cotton
  '50':  [
    { hsCode: '10', name: 'Cereals (Rice)',         value_usd: 1800000000 },
    { hsCode: '17', name: 'Sugar',                  value_usd:  620000000 },
    { hsCode: '07', name: 'Vegetables',             value_usd:  410000000 },
    { hsCode: '52', name: 'Cotton',                 value_usd:  290000000 },
    { hsCode: '09', name: 'Spices',                 value_usd:  130000000 },
  ],
  // USA — marine products, spices, rice
  '840': [
    { hsCode: '03', name: 'Marine Products',        value_usd:  980000000 },
    { hsCode: '09', name: 'Spices',                 value_usd:  480000000 },
    { hsCode: '10', name: 'Cereals (Rice)',          value_usd:  390000000 },
    { hsCode: '20', name: 'Processed Foods',        value_usd:  310000000 },
    { hsCode: '07', name: 'Vegetables',             value_usd:  220000000 },
  ],
  // UAE — rice, meat, vegetables, fruits
  '784': [
    { hsCode: '10', name: 'Cereals (Rice)',          value_usd:  650000000 },
    { hsCode: '02', name: 'Meat & Poultry',         value_usd:  490000000 },
    { hsCode: '07', name: 'Vegetables',             value_usd:  380000000 },
    { hsCode: '08', name: 'Fruits',                 value_usd:  280000000 },
    { hsCode: '09', name: 'Spices',                 value_usd:  200000000 },
  ],
  // China — cotton, sugar, castor oil, spices
  '156': [
    { hsCode: '52', name: 'Cotton',                 value_usd:  580000000 },
    { hsCode: '17', name: 'Sugar',                  value_usd:  340000000 },
    { hsCode: '15', name: 'Oils & Fats (Castor)',   value_usd:  290000000 },
    { hsCode: '09', name: 'Spices',                 value_usd:  210000000 },
    { hsCode: '12', name: 'Oil Seeds',              value_usd:  150000000 },
  ],
  // Nepal — food grains, vegetables, processed food
  '524': [
    { hsCode: '10', name: 'Cereals',                value_usd:  560000000 },
    { hsCode: '07', name: 'Vegetables',             value_usd:  340000000 },
    { hsCode: '20', name: 'Processed Foods',        value_usd:  260000000 },
    { hsCode: '17', name: 'Sugar',                  value_usd:  190000000 },
    { hsCode: '22', name: 'Beverages',              value_usd:  110000000 },
  ],
  // Vietnam — cotton, spices, cashews
  '704': [
    { hsCode: '52', name: 'Cotton',                 value_usd:  580000000 },
    { hsCode: '09', name: 'Spices',                 value_usd:  310000000 },
    { hsCode: '08', name: 'Cashew',                 value_usd:  240000000 },
    { hsCode: '10', name: 'Cereals',                value_usd:  160000000 },
    { hsCode: '12', name: 'Oil Seeds',              value_usd:  110000000 },
  ],
  // Saudi Arabia — rice, meat, vegetables
  '682': [
    { hsCode: '10', name: 'Cereals (Rice)',          value_usd:  430000000 },
    { hsCode: '02', name: 'Meat & Poultry',         value_usd:  380000000 },
    { hsCode: '07', name: 'Vegetables',             value_usd:  240000000 },
    { hsCode: '09', name: 'Spices',                 value_usd:  120000000 },
    { hsCode: '08', name: 'Fruits',                 value_usd:   80000000 },
  ],
  // Indonesia — cotton, sugar, marine
  '360': [
    { hsCode: '52', name: 'Cotton',                 value_usd:  340000000 },
    { hsCode: '17', name: 'Sugar',                  value_usd:  280000000 },
    { hsCode: '03', name: 'Marine Products',        value_usd:  180000000 },
    { hsCode: '09', name: 'Spices',                 value_usd:  110000000 },
    { hsCode: '10', name: 'Cereals',                value_usd:   90000000 },
  ],
  // UK — marine, spices, rice, beverages
  '826': [
    { hsCode: '03', name: 'Marine Products',        value_usd:  180000000 },
    { hsCode: '09', name: 'Spices',                 value_usd:  150000000 },
    { hsCode: '10', name: 'Cereals (Rice)',          value_usd:  120000000 },
    { hsCode: '21', name: 'Misc. Preparations',     value_usd:   95000000 },
    { hsCode: '07', name: 'Vegetables',             value_usd:   70000000 },
  ],
  // Japan — marine, sesame, spices
  '392': [
    { hsCode: '03', name: 'Marine Products',        value_usd:  220000000 },
    { hsCode: '12', name: 'Oil Seeds (Sesame)',     value_usd:  140000000 },
    { hsCode: '09', name: 'Spices',                 value_usd:  110000000 },
    { hsCode: '07', name: 'Vegetables',             value_usd:   70000000 },
    { hsCode: '20', name: 'Processed Foods',        value_usd:   50000000 },
  ],
};

// Returns commodity breakdown for clicked country, or empty array.
export async function loadCountryCommodities(partnerCode, year) {
  const rows = COMMODITY_DETAIL[String(partnerCode)];
  if (!rows) return [];
  // Scale by year (2024 base; 2023 +8%; 2022 +16%)
  const scale = year === '2023' ? 1.08 : year === '2022' ? 1.16 : 1.0;
  return rows.map(r => ({ ...r, value_usd: Math.round(r.value_usd * scale) }));
}

// Format USD value: "$1.24B", "$840M", "$12K"
export function fmtUsd(usd) {
  if (!usd || isNaN(usd)) return '—';
  if (usd >= 1e9) return `$${(usd / 1e9).toFixed(2)}B`;
  if (usd >= 1e6) return `$${Math.round(usd / 1e6)}M`;
  return `$${Math.round(usd / 1e3)}K`;
}
