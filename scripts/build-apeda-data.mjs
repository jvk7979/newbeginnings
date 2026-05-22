// Transform the raw APEDA production extract into a bundled dataset for the
// Crop Atlas's Yearly mode.
//
// Input  (git-ignored): data-raw/apeda/apeda-production-raw.json
//          { product: { year: [[state, production, sharePct], ...] } }
// Output (committed):    src/pages/Atlas/apedaData.json
//          { meta, cropCategory, states: { state: { crop: { year: [prod, share] } } } }
//
// Floriculture products (no production data) and aggregate rows (Cereals,
// Pulses, Meat) are dropped. State names are normalised to the Atlas's
// canonical spellings. Production is in '000 tonnes.
//
// Run via:  node scripts/build-apeda-data.mjs

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const RAW = resolve(root, 'data-raw', 'apeda', 'apeda-production-raw.json');
const OUT = resolve(root, 'src', 'pages', 'Atlas', 'apedaData.json');
const YEARS = ['2020-21', '2021-22', '2022-23', '2023-24', '2024-25'];

// APEDA product → Atlas category. Products absent from this map (the 11
// floriculture crops with no production data, and the Cereals/Pulses/Meat
// aggregates) are dropped.
const CATEGORY = {
  // plantation
  Arecanut: 'plantation', Cashewnut: 'plantation', Cocoa: 'plantation', Coconut: 'plantation',
  // cereal
  Rice: 'cereal', Wheat: 'cereal', Maize: 'cereal', Jowar: 'cereal', Bajra: 'cereal',
  // pulse
  Gram: 'pulse', 'Tur (Arhar)': 'pulse', 'Lentil (Masur)': 'pulse',
  // oilseed
  Groundnut: 'oilseed', Sunflower: 'oilseed', Soyabean: 'oilseed', 'Rapeseed & Mustard': 'oilseed',
  // fiber
  Cotton: 'fiber',
  // sugar
  Sugarcane: 'sugar',
  // spice
  Pepper: 'spice', Ginger: 'spice', Chillies: 'spice', Turmeric: 'spice', Garlic: 'spice',
  Cardamom: 'spice', Coriander: 'spice', Cumin: 'spice', 'Saffron / Vanilla': 'spice',
  Fennel: 'spice', Fenugreek: 'spice', Ajwan: 'spice', 'Dill / Poppy /Celery': 'spice',
  'Cinnamon /Tejpat': 'spice', Nutmeg: 'spice', Clove: 'spice', Tamarind: 'spice',
  // livestock
  Milk: 'livestock', 'Buffalo Meat': 'livestock', 'Cattle Meat': 'livestock',
  'Sheep Meat': 'livestock', 'Goat Meat': 'livestock', 'Poultry Meat': 'livestock',
  'Swine Meat': 'livestock', Egg: 'livestock', Honey: 'livestock',
  // horticulture — fruits, vegetables, nuts, tobacco
  Tobacco: 'horti', Almond: 'horti', Apple: 'horti', Banana: 'horti', 'Custard Apple': 'horti',
  Beans: 'horti', Bottlegourd: 'horti', Cabbage: 'horti', Carrot: 'horti',
  'Aonla/ Gooseberry': 'horti', Bittergourd: 'horti', Bael: 'horti', Brinjal: 'horti',
  Ber: 'horti', Capsicum: 'horti', Grapes: 'horti', Cauliflower: 'horti', Peach: 'horti',
  Pear: 'horti', Picanut: 'horti', Pineapple: 'horti', Plum: 'horti', Pomegranate: 'horti',
  Sapota: 'horti', Strawberry: 'horti', Walnut: 'horti', 'Other Fruits': 'horti',
  'Lime/Lemon': 'horti', 'Mandarin(M.Orang,Kinnow,Orange)': 'horti',
  'Sweet Orange(Malta , Mosambi)': 'horti', 'Other Citrus': 'horti', Cucumber: 'horti',
  'Chillies (Green)': 'horti', 'Elephant Foot Yam': 'horti', Muskmelon: 'horti',
  'Okra/ Ladyfinger': 'horti', Onion: 'horti', 'Parwal/Pointed Gourd': 'horti', Peas: 'horti',
  Potato: 'horti', Radish: 'horti', 'Sitaphal/Pumpkin': 'horti', 'Sweet Potato': 'horti',
  Tapioca: 'horti', Tomato: 'horti', Watermelon: 'horti', Mushroom: 'horti',
  'Others Vegetables': 'horti', 'Jack Fruit': 'horti', Guava: 'horti', Kiwi: 'horti',
  Litchi: 'horti', Mango: 'horti', Papaya: 'horti', 'Passion Fruit': 'horti',
};

// APEDA state spellings → the Atlas's canonical state names.
const STATE_FIX = {
  Orissa: 'Odisha', Pondicherry: 'Puducherry', 'Jammu And Kashmir': 'Jammu and Kashmir',
  'Andaman And Nicobar': 'Andaman & Nicobar', 'Dadra And Nagar Haveli': 'Dadra & Nagar Haveli',
  'Daman And Diu': 'Daman & Diu',
};

const round = (n) => Math.round(n * 100) / 100;

const raw = JSON.parse(readFileSync(RAW, 'utf8'));
const states = {};
const cropCategory = {};
let dropped = [];

for (const [product, byYear] of Object.entries(raw)) {
  const cat = CATEGORY[product];
  if (!cat) { dropped.push(product); continue; }
  let used = false;
  for (const year of YEARS) {
    for (const [stateRaw, prod, share] of byYear[year] || []) {
      if (stateRaw === 'Other' || prod == null || prod <= 0) continue;
      const state = STATE_FIX[stateRaw] || stateRaw;
      (states[state] ||= {});
      (states[state][product] ||= {});
      states[state][product][year] = [round(prod), round(share)];
      used = true;
    }
  }
  if (used) cropCategory[product] = cat;
}

writeFileSync(OUT, JSON.stringify({
  meta: { years: YEARS, source: 'APEDA AgriExchange (agriexchange.apeda.gov.in)' },
  cropCategory,
  states,
}, null, 1));

const kb = (readFileSync(OUT).length / 1024).toFixed(0);
console.log(`wrote apedaData.json (${kb} KB)`);
console.log(`crops: ${Object.keys(cropCategory).length} | states: ${Object.keys(states).length}`);
console.log(`dropped (floriculture / aggregates): ${dropped.join(', ')}`);
