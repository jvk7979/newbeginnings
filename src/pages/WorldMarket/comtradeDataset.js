// src/pages/WorldMarket/comtradeDataset.js
//
// Datasets for India's exports by partner country.
// Primary: Firestore (live, synced by Cloud Functions).
// Fallback: static curated JSON files.
// Two sources:
//   'apeda' — Agricultural & Allied Products only (APEDA AgriExchange / DGFT)
//   'oec'   — All Merchandise Exports (OEC / UN Comtrade)
// ISO 3166-1 numeric partner codes match world-atlas country IDs directly.

import { db } from '../../firebase.js';
import { doc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../../firebase.js';

const BASE = import.meta.env.BASE_URL || '/';

const SOURCE_URLS = {
  apeda: `${BASE}data/india-exports.json`,
  oec:   `${BASE}data/india-exports-oec.json`,
};

const _jsonCache = {};    // static JSON fallback cache
const _fsCache   = {};    // Firestore doc cache keyed by docId

async function loadStaticAll(source) {
  const key = source || 'apeda';
  if (_jsonCache[key]) return _jsonCache[key];
  const url = SOURCE_URLS[key] || SOURCE_URLS.apeda;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  _jsonCache[key] = await res.json();
  return _jsonCache[key];
}

// Firestore doc ID conventions:
//   apeda-{year}    → curated agricultural data seeded by admin
//   comtrade-{year} → live merchandise data from scheduled sync
function fsDocId(source, year) {
  return source === 'oec' ? `comtrade-${year}` : `apeda-${year}`;
}

// Returns { [partnerCode]: { name, value_usd } } for the given year + source.
// Tries Firestore first (with a per-doc in-memory cache), falls back to static JSON.
export async function loadPartnerTotals(year, source = 'apeda') {
  const docId = fsDocId(source, year);
  if (!_fsCache[docId]) {
    try {
      const snap = await getDoc(doc(db, 'worldMarketExports', docId));
      if (snap.exists()) {
        const data = snap.data();
        _fsCache[docId] = { partners: data.partners || {}, syncedAt: data.syncedAt || null };
      }
    } catch (err) {
      console.warn('[loadPartnerTotals] Firestore unavailable, using static fallback:', err.message);
    }
  }
  if (_fsCache[docId]) return _fsCache[docId].partners;

  // Static JSON fallback
  const all = await loadStaticAll(source);
  return all[year] || all['2025'] || all['2024'] || {};
}

// Returns { syncedAt: number|null, fromFirestore: boolean } for UI badge.
export async function getWorldMarketSyncInfo(year, source = 'apeda') {
  const docId = fsDocId(source, year);
  if (_fsCache[docId]) return { syncedAt: _fsCache[docId].syncedAt, fromFirestore: true };
  try {
    const snap = await getDoc(doc(db, 'worldMarketExports', docId));
    if (snap.exists()) {
      const syncedAt = snap.data().syncedAt || null;
      _fsCache[docId] = { partners: snap.data().partners || {}, syncedAt };
      return { syncedAt, fromFirestore: true };
    }
  } catch (_) { /* ignore */ }
  return { syncedAt: null, fromFirestore: false };
}

// Admin helper: reads the static JSON for a source+year and pushes it to
// Firestore via the seedWorldMarketData Cloud Function.
export async function seedYearToFirestore(year, source = 'apeda') {
  const all = await loadStaticAll(source);
  const partners = all[year];
  if (!partners || Object.keys(partners).length === 0) {
    throw new Error(`No static data for ${source}/${year}`);
  }
  const fns = getFunctions(app, 'us-central1');
  const seed = httpsCallable(fns, 'seedWorldMarketData');
  const result = await seed({ source, year: String(year), partners });
  // Invalidate Firestore cache so next loadPartnerTotals re-reads the fresh doc
  delete _fsCache[fsDocId(source, year)];
  return result.data;
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
  '50': [
    { hsCode: '10', name: 'Cereals (Rice)',        value_usd: 1820000000 },
    { hsCode: '17', name: 'Sugar',                 value_usd:  630000000 },
    { hsCode: '07', name: 'Vegetables',            value_usd:  420000000 },
    { hsCode: '52', name: 'Cotton',                value_usd:  295000000 },
    { hsCode: '09', name: 'Spices',                value_usd:  135000000 },
  ],
  // USA — marine products, spices, rice, processed foods, vegetables (FY2025 base $5.62B)
  '840': [
    { hsCode: '03', name: 'Marine Products',       value_usd: 1960000000 },
    { hsCode: '09', name: 'Spices',                value_usd:  850000000 },
    { hsCode: '10', name: 'Cereals (Rice)',         value_usd:  720000000 },
    { hsCode: '20', name: 'Processed Foods',       value_usd:  680000000 },
    { hsCode: '07', name: 'Vegetables',            value_usd:  460000000 },
  ],
  // UAE — rice, meat, vegetables, fruits, spices
  '784': [
    { hsCode: '10', name: 'Cereals (Rice)',         value_usd:  650000000 },
    { hsCode: '02', name: 'Meat & Poultry',        value_usd:  490000000 },
    { hsCode: '07', name: 'Vegetables',            value_usd:  380000000 },
    { hsCode: '08', name: 'Fruits',                value_usd:  280000000 },
    { hsCode: '09', name: 'Spices',                value_usd:  200000000 },
  ],
  // China — cotton, sugar, castor oil, spices, oil seeds
  '156': [
    { hsCode: '52', name: 'Cotton',                value_usd:  610000000 },
    { hsCode: '17', name: 'Sugar',                 value_usd:  360000000 },
    { hsCode: '15', name: 'Oils & Fats (Castor)',  value_usd:  310000000 },
    { hsCode: '09', name: 'Spices',                value_usd:  224000000 },
    { hsCode: '12', name: 'Oil Seeds',             value_usd:  160000000 },
  ],
  // Nepal — cereals, vegetables, processed food, sugar, beverages
  '524': [
    { hsCode: '10', name: 'Cereals',               value_usd:  595000000 },
    { hsCode: '07', name: 'Vegetables',            value_usd:  362000000 },
    { hsCode: '20', name: 'Processed Foods',       value_usd:  277000000 },
    { hsCode: '17', name: 'Sugar',                 value_usd:  202000000 },
    { hsCode: '22', name: 'Beverages',             value_usd:  117000000 },
  ],
  // Vietnam — cotton, spices, cashews, cereals, oil seeds
  '704': [
    { hsCode: '52', name: 'Cotton',                value_usd:  617000000 },
    { hsCode: '09', name: 'Spices',                value_usd:  330000000 },
    { hsCode: '08', name: 'Cashew',                value_usd:  256000000 },
    { hsCode: '10', name: 'Cereals',               value_usd:  170000000 },
    { hsCode: '12', name: 'Oil Seeds',             value_usd:  117000000 },
  ],
  // Saudi Arabia — rice, meat, vegetables, spices, fruits
  '682': [
    { hsCode: '10', name: 'Cereals (Rice)',         value_usd:  458000000 },
    { hsCode: '02', name: 'Meat & Poultry',        value_usd:  404000000 },
    { hsCode: '07', name: 'Vegetables',            value_usd:  255000000 },
    { hsCode: '09', name: 'Spices',                value_usd:  128000000 },
    { hsCode: '08', name: 'Fruits',                value_usd:   85000000 },
  ],
  // Indonesia — cotton, sugar, marine, spices, cereals
  '360': [
    { hsCode: '52', name: 'Cotton',                value_usd:  362000000 },
    { hsCode: '17', name: 'Sugar',                 value_usd:  298000000 },
    { hsCode: '03', name: 'Marine Products',       value_usd:  191000000 },
    { hsCode: '09', name: 'Spices',                value_usd:  117000000 },
    { hsCode: '10', name: 'Cereals',               value_usd:   96000000 },
  ],
  // Malaysia — rice, marine, spices, cotton, sugar, vegetables
  '458': [
    { hsCode: '10', name: 'Cereals (Rice)',         value_usd:  285000000 },
    { hsCode: '03', name: 'Marine Products',       value_usd:  190000000 },
    { hsCode: '09', name: 'Spices',                value_usd:  142000000 },
    { hsCode: '52', name: 'Cotton',                value_usd:  142000000 },
    { hsCode: '17', name: 'Sugar',                 value_usd:   95000000 },
    { hsCode: '07', name: 'Vegetables',            value_usd:   93000000 },
  ],
  // Sri Lanka — rice, vegetables, spices, sugar, dairy, fruits
  '144': [
    { hsCode: '10', name: 'Cereals (Rice)',         value_usd:  315000000 },
    { hsCode: '07', name: 'Vegetables',            value_usd:  166000000 },
    { hsCode: '09', name: 'Spices',                value_usd:  133000000 },
    { hsCode: '17', name: 'Sugar',                 value_usd:   83000000 },
    { hsCode: '04', name: 'Dairy Products',        value_usd:   66000000 },
    { hsCode: '08', name: 'Fruits',                value_usd:   67000000 },
  ],
  // UK — marine, spices, rice, misc preparations, vegetables
  '826': [
    { hsCode: '03', name: 'Marine Products',       value_usd:  192000000 },
    { hsCode: '09', name: 'Spices',                value_usd:  160000000 },
    { hsCode: '10', name: 'Cereals (Rice)',         value_usd:  128000000 },
    { hsCode: '21', name: 'Misc. Preparations',    value_usd:  101000000 },
    { hsCode: '07', name: 'Vegetables',            value_usd:   74000000 },
  ],
  // Japan — marine, sesame, spices, vegetables, processed foods
  '392': [
    { hsCode: '03', name: 'Marine Products',       value_usd:  234000000 },
    { hsCode: '12', name: 'Oil Seeds (Sesame)',    value_usd:  149000000 },
    { hsCode: '09', name: 'Spices',                value_usd:  117000000 },
    { hsCode: '07', name: 'Vegetables',            value_usd:   74000000 },
    { hsCode: '20', name: 'Processed Foods',       value_usd:   53000000 },
  ],
  // Iran — rice, fresh fruits, spices, cotton, tea
  '364': [
    { hsCode: '10', name: 'Cereals (Rice)',         value_usd:  230000000 },
    { hsCode: '08', name: 'Fresh Fruits',          value_usd:  115000000 },
    { hsCode: '09', name: 'Spices',                value_usd:   92000000 },
    { hsCode: '52', name: 'Cotton',                value_usd:   69000000 },
    { hsCode: '09', name: 'Tea',                   value_usd:   69000000 },
  ],
  // South Korea — marine, sesame, spices, processed foods, fruits
  '410': [
    { hsCode: '03', name: 'Marine Products',       value_usd:  187000000 },
    { hsCode: '12', name: 'Oil Seeds (Sesame)',    value_usd:   94000000 },
    { hsCode: '09', name: 'Spices',                value_usd:   75000000 },
    { hsCode: '20', name: 'Processed Foods',       value_usd:   47000000 },
    { hsCode: '08', name: 'Fruits & Nuts',         value_usd:   65000000 },
  ],
  // Germany — spices, marine, cereals (organic), processed, vegetables
  '276': [
    { hsCode: '09', name: 'Spices',                value_usd:  165000000 },
    { hsCode: '03', name: 'Marine Products',       value_usd:  105000000 },
    { hsCode: '10', name: 'Cereals (Organic)',     value_usd:   73000000 },
    { hsCode: '20', name: 'Processed Foods',       value_usd:   69000000 },
    { hsCode: '07', name: 'Vegetables',            value_usd:   46000000 },
  ],
  // Philippines — rice, marine, vegetables, oil seeds, spices
  '608': [
    { hsCode: '10', name: 'Cereals (Rice)',         value_usd:  166000000 },
    { hsCode: '03', name: 'Marine Products',       value_usd:   83000000 },
    { hsCode: '07', name: 'Vegetables',            value_usd:   62000000 },
    { hsCode: '12', name: 'Oil Seeds',             value_usd:   62000000 },
    { hsCode: '09', name: 'Spices',                value_usd:   42000000 },
  ],
  // Qatar — rice, meat, vegetables, spices, dairy
  '634': [
    { hsCode: '10', name: 'Cereals (Rice)',         value_usd:  130000000 },
    { hsCode: '02', name: 'Meat & Poultry',        value_usd:   90000000 },
    { hsCode: '07', name: 'Vegetables',            value_usd:   72000000 },
    { hsCode: '09', name: 'Spices',                value_usd:   36000000 },
    { hsCode: '04', name: 'Dairy Products',        value_usd:   34000000 },
  ],
  // Netherlands — spices, marine, processed, vegetables, fruits
  '528': [
    { hsCode: '09', name: 'Spices',                value_usd:  113000000 },
    { hsCode: '03', name: 'Marine Products',       value_usd:   70000000 },
    { hsCode: '20', name: 'Processed Foods',       value_usd:   42000000 },
    { hsCode: '07', name: 'Vegetables',            value_usd:   34000000 },
    { hsCode: '08', name: 'Fruits & Nuts',         value_usd:   23000000 },
  ],
  // Singapore — marine, spices, rice, processed, vegetables
  '702': [
    { hsCode: '03', name: 'Marine Products',       value_usd:  113000000 },
    { hsCode: '09', name: 'Spices',                value_usd:   78000000 },
    { hsCode: '10', name: 'Cereals (Rice)',         value_usd:   63000000 },
    { hsCode: '20', name: 'Processed Foods',       value_usd:   31000000 },
    { hsCode: '07', name: 'Vegetables',            value_usd:   29000000 },
  ],
  // Canada — marine, spices, processed, cereals, vegetables
  '124': [
    { hsCode: '03', name: 'Marine Products',       value_usd:   92000000 },
    { hsCode: '09', name: 'Spices',                value_usd:   69000000 },
    { hsCode: '20', name: 'Processed Foods',       value_usd:   34000000 },
    { hsCode: '10', name: 'Cereals',               value_usd:   23000000 },
    { hsCode: '07', name: 'Vegetables',            value_usd:   11000000 },
  ],
};

// Scale factors by year relative to 2025 base values in COMMODITY_DETAIL.
const YEAR_SCALE = { '2025': 1.0, '2024': 0.94, '2023': 0.88, '2022': 0.82 };

// Per-country trade context: YoY growth (vs prior year) and a trade note.
export const COUNTRY_META = {
  '840': { growth_pct:  12.4, note: 'Shrimp & prawn demand surging post-pandemic; rice shipments recovered after 2023 export restriction.' },
  '50':  { growth_pct:  -3.2, note: 'Rice volumes normalizing after 2022 surge; non-basmati demand remains structurally strong.' },
  '784': { growth_pct:   6.8, note: 'Re-export hub for Gulf region; Basmati rice and halal meat drive steady year-on-year growth.' },
  '156': { growth_pct:  -8.1, note: 'Cotton and castor oil face stiff competition; spice exports rebounding from 2023 lows.' },
  '524': { growth_pct:   9.2, note: 'Open land border drives high-volume cereals & FMCG trade; cross-border dependency remains strong.' },
  '704': { growth_pct:  14.7, note: 'Cotton for textile manufacturing is the dominant driver; cashew processing corridor growing fast.' },
  '682': { growth_pct:   4.3, note: 'Halal certification now mandatory for all meat; rice and poultry remain anchor commodities.' },
  '360': { growth_pct:   7.1, note: 'Cotton for garment factories is the primary corridor; domestic sugar policy limits India\'s scope.' },
  '458': { growth_pct:   5.5, note: 'Spice trade centuries old; marine exports benefit from proximity and cold-chain logistics links.' },
  '144': { growth_pct:  -5.8, note: 'Import restrictions on rice in 2024 hit volumes; economic recovery expected to lift demand in 2025.' },
  '826': { growth_pct:   8.9, note: 'Post-Brexit trade continuity maintained; large South Asian diaspora sustains spice & rice demand.' },
  '392': { growth_pct:   3.6, note: 'Strict quality standards; sesame oil and premium marine products lead in overall value.' },
  '364': { growth_pct: -11.2, note: 'Sanctions environment restricts formal banking channels; informal trade partially compensates.' },
  '410': { growth_pct:   6.2, note: 'K-cuisine boom driving sesame imports; marine products seeing strong premium-grade demand.' },
  '276': { growth_pct:   9.7, note: 'Organic and specialty spice segment growing; EU import regulations drive quality compliance.' },
  '608': { growth_pct:   2.1, note: 'Rice import volumes constrained by domestic production policy and high import duties.' },
  '634': { growth_pct:   5.9, note: 'Infrastructure projects attracting large South Asian workforce; per-capita food imports high.' },
  '528': { growth_pct:  11.3, note: 'Rotterdam serves as gateway for European distribution; specialty spice blending hub for EU.' },
  '702': { growth_pct:   4.4, note: 'Transit hub for Southeast Asia; high per-capita consumption of Indian spices and marine products.' },
  '124': { growth_pct:   7.8, note: 'Diverse South Asian diaspora; marine products and spices are the two largest import corridors.' },
};

// Sync: returns top-N product names for tooltip (APEDA only, no network call).
export function getQuickProducts(partnerCode, n = 3) {
  const rows = COMMODITY_DETAIL[String(partnerCode)];
  if (!rows) return [];
  return rows.slice(0, n).map(r => r.name);
}

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
