// src/pages/Atlas/cropData.js
//
// India crops & raw-materials atlas — indicative dataset compiled from
// open-source agriculture handbooks (APEDA, Coir Board, Spices Board,
// Cotton Corp, Sugarcane Federation 2022–24). Use directionally; verify
// before commercial decisions.
//
// Schema:
//   STATES[name] = { code, capital, area_sqkm, farmers (M), netSown_kha,
//                    irrigated_pct, crops: [[name, category, prod_kt,
//                    area_kha, share_pct], ...], raw: [[name, use, vol,
//                    location], ...], note, flagship, districtKey? }
//   AP_DISTRICTS[name] = { raw: [[name, use, note], ...], flagshipMaterial,
//                    note, highlight? }
//   District crops are no longer curated here — they come from DES data
//   (desData.json) and are attached by desDataset.js's mergedApDistricts.
//   The 26 keys below match the official 2022-reorganisation districts and
//   desData.json / the Survey of India geojson exactly.

export const CATEGORIES = {
  plantation: { label: 'Plantation',   color: '#2F6B4F', short: 'PLN' },
  cereal:     { label: 'Cereals',      color: '#B88A3B', short: 'CRL' },
  pulse:      { label: 'Pulses',       color: '#8E6E3C', short: 'PUL' },
  oilseed:    { label: 'Oilseeds',     color: '#C97435', short: 'OIL' },
  spice:      { label: 'Spices',       color: '#B33A2F', short: 'SPC' },
  fiber:      { label: 'Fiber',        color: '#7FA9B8', short: 'FBR' },
  sugar:      { label: 'Sugarcane',    color: '#4A8F70', short: 'SGR' },
  horti:      { label: 'Horticulture', color: '#D5A85A', short: 'HRT' },
  livestock:  { label: 'Livestock',    color: '#A6584B', short: 'LVS' },
  residue:    { label: 'Raw Material', color: '#8E8470', short: 'RAW' },
};


// STATES + AP_DISTRICTS moved to public/data/atlas-meta.json (loaded
// at runtime by desDataset.js loadAtlasData()). They were ~810 LOC of
// static metadata that bloated the JS bundle for no perf benefit —
// the data only ships when Atlas mounts, and Workbox runtime caches
// it after the first load.

export const STATE_CENTROIDS = {
  "Jammu and Kashmir": [380, 110], "Himachal Pradesh": [430, 165], "Punjab": [390, 210],
  "Haryana": [430, 255], "Uttarakhand": [490, 215], "Rajasthan": [330, 320],
  "Uttar Pradesh": [510, 305], "Bihar": [635, 320], "Sikkim": [705, 295],
  "Arunachal Pradesh": [820, 290], "Assam": [770, 335], "Nagaland": [830, 345],
  "Manipur": [820, 380], "Mizoram": [800, 410], "Tripura": [770, 385],
  "Meghalaya": [745, 335], "West Bengal": [690, 380], "Jharkhand": [620, 380],
  "Odisha": [610, 460], "Chhattisgarh": [550, 430], "Madhya Pradesh": [440, 380],
  "Gujarat": [240, 410], "Maharashtra": [380, 510], "Telangana": [490, 555],
  "Andhra Pradesh": [540, 640], "Karnataka": [430, 670], "Goa": [360, 645],
  "Kerala": [410, 800], "Tamil Nadu": [495, 770],
};

// AP district centroids on 1000×1000 zoomed canvas — used only by the
// fallback bubble map. Keyed by the 26 official district names; positions
// are approximate, grouped roughly by their pre-2022 parent district.
export const AP_DISTRICT_CENTROIDS = {
  "Srikakulam":                  [840, 110], "Parvathipuram Manyam":  [770, 150],
  "Vizianagaram":                [780, 210], "Visakhapatnam":         [700, 230],
  "Anakapalli":                  [620, 270], "Alluri Sitharama Raju": [600, 180],
  "Kakinada":                    [640, 350], "East Godavari":         [560, 360],
  "Dr. B.R. Ambedkar Konaseema": [680, 430], "West Godavari":         [490, 380],
  "Eluru":                       [430, 330], "Krishna":               [440, 470],
  "Ntr":                         [360, 430], "Guntur":                [380, 550],
  "Palnadu":                     [300, 510], "Bapatla":               [420, 620],
  "Prakasam":                    [400, 680], "Sri Potti Sriramulu Nellore": [470, 790],
  "Tirupati":                    [400, 880], "Chittoor":              [300, 880],
  "Annamayya":                   [310, 790], "Y.S.R. Kadapa":         [310, 700],
  "Ananthapuramu":               [180, 800], "Sri Sathya Sai":        [180, 690],
  "Kurnool":                     [250, 600], "Nandyal":               [300, 640],
};

// Every distinct crop name across all curated states — powers the
// "recolour the map by one crop" dropdown in the filter bar. AP districts
// no longer carry curated crops (their rows come from DES data), so only
// the curated STATES are scanned here.