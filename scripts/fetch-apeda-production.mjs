// Fetch state-wise crop production from APEDA AgriExchange.
//
// Source: https://agriexchange.apeda.gov.in/Production/Indiacat/Index
// — its "India Production State Wise" view is backed by a public JSON
// endpoint, GetIndiaProductionCatObject, which takes a product + year and
// returns production (in '000 tonnes) and % share per state.
//
// This covers 113 products across Fruits, Vegetables, Spices, Plantations,
// Floriculture, Livestock and field crops — the horticulture breadth the
// DES dataset lacks. 113 products x 5 years = 565 requests, run with a
// polite delay so the government server is never hammered.
//
// Output (git-ignored raw): data-raw/apeda/apeda-production-raw.json
//   { "Mango": { "2024-25": [[state, production, sharePct], ...], ... }, ... }
//
// Run via:  node scripts/fetch-apeda-production.mjs

import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '..', 'data-raw', 'apeda');
const ENDPOINT = 'https://agriexchange.apeda.gov.in/Production/IndiaCat/GetIndiaProductionCatObject';
const YEARS = ['2020-21', '2021-22', '2022-23', '2023-24', '2024-25'];
const DELAY_MS = 400;        // polite gap between requests

// All 113 products from the APEDA Product dropdown (the "All" option is skipped).
const PRODUCTS = [
  ['1001', 'Tobacco'], ['1092', 'Arecanut'], ['1038', 'Almond'], ['1027', 'Anthurium'],
  ['1023', 'Milk'], ['1096', 'Pepper'], ['1067', 'Beans'], ['1069', 'Bottlegourd'],
  ['1093', 'Cashewnut'], ['1097', 'Ginger'], ['1022', 'Meat'], ['1004', 'Jowar'],
  ['1040', 'Apple'], ['1029', 'Chrysanthemum'], ['1006', 'Gram'], ['1098', 'Chillies'],
  ['1094', 'Cocoa'], ['1018', 'Buffalo Meat'], ['1071', 'Cabbage'], ['1042', 'Banana'],
  ['1031', 'Gladiolus'], ['1099', 'Turmeric'], ['1044', 'Custard Apple'], ['1008', 'Lentil (Masur)'],
  ['1033', 'Marigold'], ['1019', 'Cattle Meat'], ['1073', 'Carrot'], ['1095', 'Coconut'],
  ['1100', 'Garlic'], ['1002', 'Bajra'], ['1025', 'Sheep Meat'], ['1039', 'Aonla/ Gooseberry'],
  ['1068', 'Bittergourd'], ['1028', 'Carnation'], ['1021', 'Goat Meat'], ['1005', 'Sunflower'],
  ['1041', 'Bael'], ['1101', 'Cardamom'], ['1030', 'Gerbera'], ['1070', 'Brinjal'],
  ['1043', 'Ber'], ['1007', 'Groundnut'], ['1024', 'Poultry Meat'], ['1032', 'Jasmine'],
  ['1072', 'Capsicum'], ['1102', 'Coriander'], ['1103', 'Cumin'], ['1034', 'Orchids'],
  ['1009', 'Maize'], ['1020', 'Egg'], ['1045', 'Grapes'], ['1074', 'Cauliflower'],
  ['1053', 'Peach'], ['1054', 'Pear'], ['1055', 'Picanut'], ['1056', 'Pineapple'],
  ['1057', 'Plum'], ['1058', 'Pomegranate'], ['1059', 'Sapota'], ['1060', 'Strawberry'],
  ['1061', 'Walnut'], ['1062', 'Other Fruits'], ['1063', 'Lime/Lemon'],
  ['1064', 'Mandarin(M.Orang,Kinnow,Orange)'], ['1065', 'Sweet Orange(Malta , Mosambi)'],
  ['1066', 'Other Citrus'], ['1037', 'Tulip'], ['1036', 'Tube Rose'], ['1035', 'Rose'],
  ['1026', 'Swine Meat'], ['1112', 'Saffron / Vanilla'], ['1075', 'Cucumber'],
  ['1076', 'Chillies (Green)'], ['1077', 'Elephant Foot Yam'], ['1078', 'Muskmelon'],
  ['1079', 'Okra/ Ladyfinger'], ['1080', 'Onion'], ['1081', 'Parwal/Pointed Gourd'],
  ['1082', 'Peas'], ['1083', 'Potato'], ['1084', 'Radish'], ['1085', 'Sitaphal/Pumpkin'],
  ['1086', 'Sweet Potato'], ['1087', 'Tapioca'], ['1088', 'Tomato'], ['1089', 'Watermelon'],
  ['1090', 'Mushroom'], ['1091', 'Others Vegetables'], ['1017', 'Rapeseed & Mustard'],
  ['1016', 'Cotton'], ['1015', 'Sugarcane'], ['1014', 'Soyabean'], ['1013', 'Wheat'],
  ['1012', 'Tur (Arhar)'], ['1011', 'Rice'], ['1010', 'Pulses'], ['1003', 'Cereals'],
  ['1113', 'Honey'], ['1104', 'Fennel'], ['1105', 'Fenugreek'], ['1106', 'Ajwan'],
  ['1107', 'Dill / Poppy /Celery'], ['1108', 'Cinnamon /Tejpat'], ['1109', 'Nutmeg'],
  ['1110', 'Clove'], ['1111', 'Tamarind'], ['1047', 'Jack Fruit'], ['1046', 'Guava'],
  ['1048', 'Kiwi'], ['1049', 'Litchi'], ['1050', 'Mango'], ['1051', 'Papaya'],
  ['1052', 'Passion Fruit'],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchOne(code, year) {
  const resp = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ Category: 'All', Financial_Year: year, product_code: code, ReportType: '1' }),
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const data = await resp.json();
  // Products with no data for a year return a non-array — that is a valid
  // "empty" answer, not an error, so don't waste retries on it.
  return Array.isArray(data) ? data : [];
}

const out = {};
let ok = 0, failed = 0;

for (const [code, name] of PRODUCTS) {
  out[name] = {};
  for (const year of YEARS) {
    let rows = null;
    for (let attempt = 1; attempt <= 3 && rows === null; attempt++) {
      try {
        const data = await fetchOne(code, year);
        rows = data.map((r) => [r.state, r.production, r['Percent Share']]);
      } catch (e) {
        if (attempt === 3) { console.warn(`  ! ${name} ${year}: ${e.message}`); rows = []; failed++; }
        else await sleep(1500);
      }
    }
    out[name][year] = rows;
    if (rows.length) ok++;
    await sleep(DELAY_MS);
  }
  console.log(`done ${name} (${YEARS.map((y) => out[name][y].length).join('/')})`);
}

mkdirSync(OUT_DIR, { recursive: true });
const outPath = resolve(OUT_DIR, 'apeda-production-raw.json');
writeFileSync(outPath, JSON.stringify(out, null, 1));
console.log(`\nwrote ${outPath}`);
console.log(`${PRODUCTS.length} products x ${YEARS.length} years — ${ok} populated, ${failed} failed`);
