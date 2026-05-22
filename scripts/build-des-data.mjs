// Build a single bundled JSON for the Crop Atlas from two official
// Directorate of Economics & Statistics (DES) crop-statistics CSVs.
//
// Source files (download once, not committed — see .gitignore) live in
// data-raw/des/ :
//   state-crops.csv     — State-wise Area/Production/Yield of all crops,
//                         5 years (2021-22 to 2025-26)
//   district-crops.csv  — District-wise Area/Production/Yield, 2024-25 only
//
// Transform (applied to both files):
//   - keep only Season === "Total" rows
//   - drop aggregate "crops" that would double-count (Cereals, totals, …)
//   - drop the "All India" state row
//   - Area lakh-ha → kilo-ha, Production lakh-t → kilo-t  (×100, 1 dp)
//     Yield kept as kg/ha (rounded to integer)
//   - blank year cells are omitted entirely (no zeros emitted)
//   - districts: only Andhra Pradesh is kept (the only state the Atlas
//     drills into)
//
// Output (committed — this is an app asset):
//   src/pages/Atlas/desData.json
//
// Run via:  node scripts/build-des-data.mjs

import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync, statSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const RAW = resolve(root, 'data-raw', 'des');
const OUT = resolve(root, 'src', 'pages', 'Atlas', 'desData.json');

// ---- config -----------------------------------------------------------

const STATE_YEARS = ['2021-22', '2022-23', '2023-24', '2024-25', '2025-26'];
const DISTRICT_YEAR = '2024-25';

// Aggregate rows that are sums of other crops — excluded to avoid
// double-counting. "Other Pulses" is a real residual line and is kept.
const AGGREGATE_CROPS = new Set([
  'Cereals',
  'Total Food Grains',
  'Total Pulses',
  'Total Oil Seeds',
  'Nutri/Coarse Cereals',
  'Shree Anna /Nutri Cereals',
  'Jute & Mesta',
]);

// Crop → app category key.
const CROP_CATEGORY = {
  // cereal
  Rice: 'cereal', Wheat: 'cereal', Maize: 'cereal', Bajra: 'cereal',
  Jowar: 'cereal', Ragi: 'cereal', Barley: 'cereal', 'Small Millets': 'cereal',
  // pulse
  Gram: 'pulse', Tur: 'pulse', Urad: 'pulse', Moong: 'pulse', Lentil: 'pulse',
  'Other Pulses': 'pulse', Guarseed: 'pulse',
  // oilseed
  Groundnut: 'oilseed', 'Rapeseed & Mustard': 'oilseed', Soybean: 'oilseed',
  Sunflower: 'oilseed', Sesamum: 'oilseed', Castorseed: 'oilseed',
  Linseed: 'oilseed', Nigerseed: 'oilseed', Safflower: 'oilseed',
  // fiber
  Cotton: 'fiber', Jute: 'fiber', Mesta: 'fiber', Sannhemp: 'fiber',
  // sugar
  Sugarcane: 'sugar',
  // horti
  Tobacco: 'horti',
};

// ---- helpers ----------------------------------------------------------

// Quote-aware CSV line split. The DES files use simple double-quoted
// fields with no embedded commas, so we just strip the surrounding
// quotes and split on `","`. Empty quoted fields `""` become "".
function parseLine(line) {
  // Strip leading `"` and trailing `"` then split on `","`.
  const trimmed = line.replace(/\r$/, '');
  if (!trimmed.startsWith('"') || !trimmed.endsWith('"')) {
    return trimmed.split(',');
  }
  return trimmed.slice(1, -1).split('","');
}

function readCsv(file) {
  // Strip a leading UTF-8 BOM if present — the DES exports carry one,
  // and it would otherwise corrupt the first header cell name.
  const text = readFileSync(file, 'utf8').replace(/^﻿/, '');
  const lines = text.split('\n').filter((l) => l.trim() !== '');
  const header = parseLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = parseLine(line);
    const row = {};
    header.forEach((col, i) => { row[col] = cells[i] ?? ''; });
    return row;
  });
}

// Convert lakh ha / lakh t → kilo-ha / kilo-t (×100, 1 dp).
function toKilo(lakhValue) {
  const n = Number(lakhValue);
  return Math.round(n * 100 * 10) / 10;
}

// Yield is already kg/ha — round to integer.
function toYield(value) {
  return Math.round(Number(value));
}

// True when a cell carries no data.
function isBlank(value) {
  return value === undefined || value === null || value.trim() === '';
}

const unmapped = new Set();

function categoryOf(crop) {
  if (CROP_CATEGORY[crop]) return CROP_CATEGORY[crop];
  unmapped.add(crop);
  return 'cereal'; // fallback
}

// ---- transform: state file -------------------------------------------

const stateRows = readCsv(resolve(RAW, 'state-crops.csv'));
const states = {};
const cropsSeen = new Set();

for (const row of stateRows) {
  if (row.Season !== 'Total') continue;
  const crop = row.Crop;
  const state = row.State;
  if (AGGREGATE_CROPS.has(crop)) continue;
  if (state === 'All India') continue;

  const yearData = {};
  for (const year of STATE_YEARS) {
    const area = row[`Area-${year}`];
    const prod = row[`Production-${year}`];
    const yld = row[`Yield-${year}`];
    // Omit a year entirely if any of its three values is blank.
    if (isBlank(area) || isBlank(prod) || isBlank(yld)) continue;
    yearData[year] = [toKilo(area), toKilo(prod), toYield(yld)];
  }
  if (Object.keys(yearData).length === 0) continue;

  cropsSeen.add(crop);
  if (!states[state]) states[state] = {};
  states[state][crop] = yearData;
}

// ---- transform: district file ----------------------------------------

const districtRows = readCsv(resolve(RAW, 'district-crops.csv'));
const districts = { 'Andhra Pradesh': {} };

for (const row of districtRows) {
  if (row.Season !== 'Total') continue;
  if (row.State !== 'Andhra Pradesh') continue;
  const crop = row.Crop;
  if (AGGREGATE_CROPS.has(crop)) continue;

  const area = row[`Area-${DISTRICT_YEAR}`];
  const prod = row[`Production-${DISTRICT_YEAR}`];
  const yld = row[`Yield-${DISTRICT_YEAR}`];
  if (isBlank(area) || isBlank(prod) || isBlank(yld)) continue;

  cropsSeen.add(crop);
  const district = row.District;
  if (!districts['Andhra Pradesh'][district]) {
    districts['Andhra Pradesh'][district] = {};
  }
  districts['Andhra Pradesh'][district][crop] =
    [toKilo(area), toKilo(prod), toYield(yld)];
}

// ---- crop category map (only crops that actually appear) -------------

const cropCategory = {};
for (const crop of [...cropsSeen].sort()) {
  cropCategory[crop] = categoryOf(crop);
}

if (unmapped.size > 0) {
  console.warn(
    `WARNING: ${unmapped.size} crop(s) not in the category map ` +
    `(fell back to "cereal"): ${[...unmapped].join(', ')}`
  );
}

// ---- write ------------------------------------------------------------

const output = {
  meta: {
    source: 'Directorate of Economics & Statistics (DES), Govt of India',
    stateYears: STATE_YEARS,
    districtYear: DISTRICT_YEAR,
  },
  cropCategory,
  states,
  districts,
};

writeFileSync(OUT, JSON.stringify(output, null, 2) + '\n');

const kb = (statSync(OUT).size / 1024).toFixed(1);
console.log(`wrote desData.json  (${kb} KB)`);
console.log(`  crops:     ${Object.keys(cropCategory).length}`);
console.log(`  states:    ${Object.keys(states).length}`);
console.log(
  `  AP districts: ${Object.keys(districts['Andhra Pradesh']).length}`
);
