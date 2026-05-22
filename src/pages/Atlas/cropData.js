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

export const STATES = {
  "Andhra Pradesh": {
    code: 'AP', capital: 'Amaravati', area_sqkm: 162970,
    farmers: 6.2, netSown_kha: 6240, irrigated_pct: 62,
    crops: [
      ['Rice',        'cereal',  13200, 2210, 9.4],
      ['Coconut',     'plantation', 1380, 121, 6.1],
      ['Chili',       'spice',     780,  248, 43.0],
      ['Mango',       'horti',    3210,  394, 14.7],
      ['Sugarcane',   'sugar',   12400,  155, 3.2],
      ['Groundnut',   'oilseed',   620,  680, 6.8],
      ['Cotton',      'fiber',     740,  604, 3.9],
      ['Tobacco',     'horti',     130,   95, 21.0],
      ['Turmeric',    'spice',      52,   18, 4.5],
      ['Banana',      'horti',    5300,  108, 16.0],
    ],
    raw: [
      ['Coconut husk',  'Coir / cocopeat feedstock', '1.1B husks/yr', 'Konaseema, E&W Godavari'],
      ['Rice husk',     'Bio-fuel / silica',         '2.4 MT/yr',     'Krishna, Godavari belt'],
      ['Bagasse',       'Bio-fuel / paper pulp',     '3.8 MT/yr',     'Chittoor, Krishna'],
      ['Cotton stalks', 'Particle board / biochar',  '0.9 MT/yr',     'Guntur, Kurnool'],
      ['Mango stones',  'Starch / kernel fat',       '0.32 MT/yr',    'Chittoor, Krishna'],
    ],
    note: "India's coconut belt #2 by production; Konaseema husk is the cheapest in India (₹0.60–1.50/pc).",
    flagship: 'coconut',
    districtKey: 'ap',
  },
  "Tamil Nadu": {
    code: 'TN', capital: 'Chennai', area_sqkm: 130060,
    farmers: 8.1, netSown_kha: 4990, irrigated_pct: 56,
    crops: [
      ['Rice',         'cereal',    8200, 1810, 5.8],
      ['Coconut',      'plantation',7240,  467, 31.8],
      ['Banana',       'horti',     5100,   85, 15.4],
      ['Sugarcane',    'sugar',    17800,  198, 4.6],
      ['Turmeric',     'spice',      220,   28, 19.1],
      ['Cotton',       'fiber',      180,  140, 0.9],
      ['Groundnut',    'oilseed',    790,  340, 8.6],
      ['Mango',        'horti',      820,   78, 3.7],
      ['Tapioca',      'horti',     3200,   75, 73.0],
      ['Tea',          'plantation', 175,   65, 13.0],
    ],
    raw: [
      ['Coconut shell',  'Activated carbon / charcoal','1.6 MT/yr', 'Pollachi, Coimbatore, Theni'],
      ['Coir fiber',     'Brushes, mats, geotextiles', '180 KT/yr', 'Pollachi, Erode'],
      ['Bagasse',        'Cogeneration / paper',       '5.4 MT/yr', 'Cuddalore, Salem'],
      ['Tannery sludge', 'Construction additive',      'restricted','Vellore (caution)'],
    ],
    note: "India's coconut #1; Pollachi is the densest coir cluster — competitive but mature market.",
    flagship: 'coconut',
  },
  "Kerala": {
    code: 'KL', capital: 'Thiruvananthapuram', area_sqkm: 38863,
    farmers: 5.4, netSown_kha: 2030, irrigated_pct: 18,
    crops: [
      ['Coconut',      'plantation', 5460, 763, 24.0],
      ['Rubber',       'plantation',  650, 545, 75.0],
      ['Black Pepper', 'spice',        47,  85, 80.0],
      ['Cardamom',     'spice',        18,  41, 87.0],
      ['Banana',       'horti',       540,  62, 1.6],
      ['Tea',          'plantation',   62,  35, 4.6],
      ['Cashew',       'plantation',   75,  39, 9.0],
      ['Ginger',       'spice',        42,   4, 3.0],
      ['Tapioca',      'horti',      1820,  62, 17.1],
      ['Areca nut',    'plantation',  104,  98, 14.0],
    ],
    raw: [
      ['Coir fiber',    'Geotextiles, mats, ropes',     '420 KT/yr', 'Alappuzha, Kollam'],
      ['Coconut shell', 'Charcoal / activated carbon',  '850 KT/yr', 'Kozhikode, Ernakulam'],
      ['Rubber latex',  'Tyres, gloves, foam',          '650 KT/yr', 'Kottayam, Pathanamthitta'],
      ['Spent spice',   'Oleoresin extraction residue', '40 KT/yr',  'Kochi'],
    ],
    note: "Coir capital of India (Alappuzha). Pricing power but high labour costs vs. AP/TN.",
    flagship: 'coconut',
  },
  "Karnataka": {
    code: 'KA', capital: 'Bengaluru', area_sqkm: 191791,
    farmers: 7.8, netSown_kha: 9540, irrigated_pct: 36,
    crops: [
      ['Coconut',      'plantation', 4900, 615, 21.6],
      ['Coffee',       'plantation',  240, 233, 71.0],
      ['Areca nut',    'plantation',  340, 261, 46.0],
      ['Rice',         'cereal',     3800, 990, 2.7],
      ['Sugarcane',    'sugar',     35600, 470, 9.3],
      ['Maize',        'cereal',     5400,1320, 16.0],
      ['Ragi',         'cereal',      900, 650, 58.0],
      ['Cotton',       'fiber',       590, 650, 3.1],
      ['Chili',        'spice',       128,  55, 7.0],
      ['Silk',         'horti',        12,  95, 75.0],
    ],
    raw: [
      ['Coffee pulp',    'Compost / cascara / biogas','180 KT/yr', 'Chikkamagaluru, Kodagu'],
      ['Coconut shell',  'Charcoal / handicrafts',    '720 KT/yr', 'Tumakuru, Hassan'],
      ['Silk cocoons',   'Reeling / waste silk',      '95 KT/yr',  'Ramanagara, Mysuru'],
      ['Bagasse',        'Cogeneration / ethanol',    '9.8 MT/yr', 'Belagavi, Mandya'],
      ['Areca husk',     'Plates / packaging',        '510 KT/yr', 'Shivamogga'],
    ],
    note: "India's coffee belt + areca cluster. Sugarcane megastate.",
    flagship: 'plantation',
  },
  "Maharashtra": {
    code: 'MH', capital: 'Mumbai', area_sqkm: 307713,
    farmers: 13.7, netSown_kha: 17480, irrigated_pct: 22,
    crops: [
      ['Cotton',           'fiber',    2150, 4180, 11.3],
      ['Sugarcane',        'sugar',   88500, 1240, 23.0],
      ['Soybean',          'oilseed',  4400, 4280, 33.0],
      ['Onion',            'horti',    8200,  680, 38.7],
      ['Grapes',           'horti',    2400,  130, 78.0],
      ['Banana',           'horti',    5000,   85, 15.1],
      ['Tur (Pigeon Pea)', 'pulse',    1200, 1230, 27.0],
      ['Pomegranate',      'horti',     820,  165, 67.0],
      ['Mango (Alphonso)', 'horti',     560,  140, 2.5],
      ['Jowar',            'cereal',   2100, 2960, 38.0],
    ],
    raw: [
      ['Bagasse',       "India's largest pool",   '23 MT/yr',   'Kolhapur, Sangli, Pune'],
      ['Cotton stalks', 'Particle board / fuel',  '5.2 MT/yr',  'Vidarbha (Yavatmal, Nagpur)'],
      ['Onion waste',   'Dehydration units',      '0.6 MT/yr',  'Nashik, Lasalgaon'],
      ['Grape pomace',  'Tartaric acid / wine',   '110 KT/yr',  'Nashik'],
    ],
    note: "India's sugar megastate. Cotton & soybean of Vidarbha. Mature processing ecosystem.",
    flagship: 'sugar',
  },
  "Punjab": {
    code: 'PB', capital: 'Chandigarh', area_sqkm: 50362,
    farmers: 1.1, netSown_kha: 4140, irrigated_pct: 99,
    crops: [
      ['Wheat',     'cereal',  18200, 3520, 16.7],
      ['Rice',      'cereal',  13900, 3160, 9.9],
      ['Cotton',    'fiber',     620,  280, 3.2],
      ['Maize',     'cereal',    520,  100, 1.5],
      ['Potato',    'horti',    2900,   97, 5.5],
      ['Sugarcane', 'sugar',    7800,  100, 2.0],
      ['Mustard',   'oilseed',    80,   35, 0.7],
    ],
    raw: [
      ['Paddy straw',   'Major stubble pool (burning crisis)','20 MT/yr','Sangrur, Patiala, Ludhiana'],
      ['Wheat straw',   'Fodder / pulp',         '17 MT/yr', 'Bathinda, Moga'],
      ['Cotton stalks', 'Briquettes / biochar',  '1.4 MT/yr','Bathinda, Mansa'],
    ],
    note: "India's breadbasket. Stubble availability massive but logistically scattered.",
    flagship: 'cereal',
  },
  "Uttar Pradesh": {
    code: 'UP', capital: 'Lucknow', area_sqkm: 240928,
    farmers: 23.8, netSown_kha: 16550, irrigated_pct: 78,
    crops: [
      ['Sugarcane', 'sugar',   175000, 2470, 45.4],
      ['Wheat',     'cereal',   34000, 9760, 31.2],
      ['Rice',      'cereal',   15800, 5910, 11.3],
      ['Potato',    'horti',    15800,  600, 30.1],
      ['Mango',     'horti',     4400,  280, 20.1],
      ['Mustard',   'oilseed',   1100,  680, 9.4],
      ['Maize',     'cereal',    1200,  720, 3.5],
      ['Mentha',    'spice',       30,  300, 80.0],
    ],
    raw: [
      ['Bagasse',      "India's largest sugarcane pool",'46 MT/yr', 'Muzaffarnagar, Meerut, Lakhimpur'],
      ['Molasses',     'Ethanol blending feedstock',    '7.8 MT/yr','All sugar belt'],
      ['Mango stones', 'Kernel fat (mango butter)',     '0.42 MT/yr','Saharanpur, Lucknow, Malihabad'],
      ['Mentha distil','Menthol crystals',              '24 KT/yr', 'Barabanki, Sambhal'],
    ],
    note: "Sugar megastate. World's largest mango cluster (Malihabad). Mentha monopoly.",
    flagship: 'sugar',
  },
  "Gujarat": {
    code: 'GJ', capital: 'Gandhinagar', area_sqkm: 196024,
    farmers: 5.7, netSown_kha: 10410, irrigated_pct: 51,
    crops: [
      ['Cotton',    'fiber',   2600, 2540, 13.7],
      ['Groundnut', 'oilseed', 3900, 1820, 42.9],
      ['Wheat',     'cereal',  3400,  900, 3.1],
      ['Castor',    'oilseed', 1400,  650, 86.0],
      ['Cumin',     'spice',    400,  450, 60.0],
      ['Banana',    'horti',   4700,   65, 14.2],
      ['Mango',     'horti',    920,   88, 4.2],
      ['Fennel',    'spice',     90,   60, 91.0],
      ['Tobacco',   'horti',    160,   90, 26.0],
    ],
    raw: [
      ['Cotton stalks',    'Particle board cluster',  '4.8 MT/yr', 'Rajkot, Surendranagar'],
      ['Castor cake',      'Fertilizer / oil residue','1.1 MT/yr', 'Banaskantha, Mehsana'],
      ['Groundnut shells', 'Briquettes / silica',     '1.3 MT/yr', 'Junagadh, Saurashtra'],
      ['Salt bittern',     'Magnesium / bromine',     'massive',   'Kutch'],
    ],
    note: "Saurashtra groundnut & castor monopoly. Kutch spice cluster.",
    flagship: 'oilseed',
  },
  "Madhya Pradesh": {
    code: 'MP', capital: 'Bhopal', area_sqkm: 308252,
    farmers: 10.0, netSown_kha: 15990, irrigated_pct: 49,
    crops: [
      ['Wheat',     'cereal',   22500, 6700, 20.6],
      ['Soybean',   'oilseed',   5800, 5300, 43.5],
      ['Rice',      'cereal',    4900, 2100, 3.5],
      ['Chickpea',  'pulse',     5300, 3010, 47.0],
      ['Mustard',   'oilseed',    900,  840, 7.7],
      ['Cotton',    'fiber',      330,  640, 1.7],
      ['Sugarcane', 'sugar',     6100,   95, 1.6],
      ['Garlic',    'spice',     1800,  175, 60.0],
      ['Coriander', 'spice',      230,  300, 41.0],
    ],
    raw: [
      ['Soy meal',      'Protein meal export', '4.4 MT/yr', 'Indore, Ujjain, Dewas'],
      ['Wheat straw',   'Fodder / pulp',       '21 MT/yr',  'Hoshangabad, Bhopal'],
      ['Chickpea husk', 'Animal feed',         '1.1 MT/yr', 'Vidisha, Sehore'],
    ],
    note: "Soybean & chickpea megastate. Wheat #2 nationally.",
    flagship: 'oilseed',
  },
  "Rajasthan": {
    code: 'RJ', capital: 'Jaipur', area_sqkm: 342239,
    farmers: 8.5, netSown_kha: 18430, irrigated_pct: 42,
    crops: [
      ['Mustard',   'oilseed',  4500, 2900, 38.7],
      ['Wheat',     'cereal',  10800, 3000, 9.9],
      ['Bajra',     'cereal',   4900, 4200, 47.0],
      ['Chickpea',  'pulse',    2200, 1900, 19.6],
      ['Cumin',     'spice',     240,  490, 36.0],
      ['Coriander', 'spice',     200,  290, 35.6],
      ['Fenugreek', 'spice',      75,  140, 90.0],
      ['Guar seed', 'pulse',    1900, 4800, 82.0],
      ['Henna',     'horti',      85,   55, 95.0],
    ],
    raw: [
      ['Guar gum splits', 'Oilfield drilling export','780 KT/yr', 'Bikaner, Sri Ganganagar'],
      ['Mustard cake',    'Cattle feed / biodiesel', '3.1 MT/yr', 'Alwar, Bharatpur'],
      ['Henna leaves',    'Dye / cosmetic export',   '60 KT/yr',  'Pali (Sojat)'],
    ],
    note: "Guar gum & henna monopolies. Mustard belt #1.",
    flagship: 'oilseed',
  },
  "West Bengal": {
    code: 'WB', capital: 'Kolkata', area_sqkm: 88752,
    farmers: 7.1, netSown_kha: 5240, irrigated_pct: 65,
    crops: [
      ['Rice',     'cereal',     16200, 5210, 11.5],
      ['Jute',     'fiber',       8800,  500, 73.0],
      ['Potato',   'horti',      12000,  430, 22.9],
      ['Tea',      'plantation',   414,  140, 31.0],
      ['Pineapple','horti',        320,   20, 18.0],
      ['Banana',   'horti',        960,   45, 2.9],
      ['Mango',    'horti',        820,   95, 3.7],
    ],
    raw: [
      ['Jute fiber', 'Bags / geotextile / pulp', '1.6 MT/yr', 'Hooghly, North 24-Parganas'],
      ['Tea waste',  'Caffeine / pharma',        '85 KT/yr',  'Darjeeling, Dooars'],
      ['Rice husk',  'Boiler fuel / silica',     '3.1 MT/yr', 'Burdwan, Hooghly'],
    ],
    note: "India's jute monopoly. Darjeeling tea GI.",
    flagship: 'fiber',
  },
  "Odisha": {
    code: 'OD', capital: 'Bhubaneswar', area_sqkm: 155707,
    farmers: 4.8, netSown_kha: 4520, irrigated_pct: 35,
    crops: [
      ['Rice',     'cereal',     8400, 3960, 6.0],
      ['Coconut',  'plantation',  290,   51, 1.3],
      ['Cashew',   'plantation',  102,  175, 12.0],
      ['Turmeric', 'spice',        60,   25, 5.2],
      ['Ginger',   'spice',        85,    9, 6.0],
      ['Pulses',   'pulse',       980, 1840, 3.5],
      ['Jute',     'fiber',       250,   45, 2.1],
    ],
    raw: [
      ['Bamboo',         'Pulp / construction','large',     'Kandhamal, Koraput'],
      ['Cashew shells',  'CNSL extraction',     '32 KT/yr',  'Ganjam, Puri'],
      ['Rice husk',      'Boiler fuel',         '1.6 MT/yr', 'Ganjam, Cuttack'],
    ],
    note: "Underdeveloped horticulture potential. Tribal belts rich in NTFP & bamboo.",
    flagship: 'cereal',
  },
  "Telangana": {
    code: 'TG', capital: 'Hyderabad', area_sqkm: 112077,
    farmers: 5.5, netSown_kha: 5870, irrigated_pct: 48,
    crops: [
      ['Rice',     'cereal',  12400, 2780, 8.8],
      ['Cotton',   'fiber',    1700, 1810, 8.9],
      ['Maize',    'cereal',   3300,  680, 9.8],
      ['Chili',    'spice',     290,   73, 16.0],
      ['Turmeric', 'spice',     320,   53, 27.5],
      ['Mango',    'horti',     750,   88, 3.4],
      ['Sugarcane','sugar',    1900,   23, 0.5],
    ],
    raw: [
      ['Cotton stalks', 'Particle board',      '2.6 MT/yr', 'Adilabad, Warangal'],
      ['Rice husk',     'Silica / boiler',     '2.3 MT/yr', 'Karimnagar, Nizamabad'],
      ['Turmeric stems','Curcumin extraction', '45 KT/yr',  'Nizamabad'],
    ],
    note: "Nizamabad turmeric GI cluster. Cotton + rice base.",
    flagship: 'cereal',
  },
  "Bihar": {
    code: 'BR', capital: 'Patna', area_sqkm: 94163,
    farmers: 9.7, netSown_kha: 5310, irrigated_pct: 65,
    crops: [
      ['Rice',    'cereal', 7800, 3220, 5.6],
      ['Wheat',   'cereal', 5400, 2050, 5.0],
      ['Maize',   'cereal', 4500,  720, 13.4],
      ['Litchi',  'horti',   300,   38, 67.0],
      ['Makhana', 'horti',    65,   35, 90.0],
      ['Mango',   'horti',  1450,  150, 6.6],
      ['Pulses',  'pulse',   500,  750, 1.8],
    ],
    raw: [
      ['Makhana shells', 'Fox-nut processing waste','10 KT/yr', 'Darbhanga, Madhubani'],
      ['Litchi seeds',   'Tannin / oil',            '24 KT/yr', 'Muzaffarpur'],
      ['Rice husk',      'Boiler fuel',             '1.5 MT/yr','Patna, Bhagalpur'],
    ],
    note: "Makhana monopoly (Madhubani GI). Shahi litchi GI.",
    flagship: 'horti',
  },
  "Assam": {
    code: 'AS', capital: 'Dispur', area_sqkm: 78438,
    farmers: 2.7, netSown_kha: 2790, irrigated_pct: 22,
    crops: [
      ['Tea',       'plantation',  720,  304, 53.0],
      ['Rice',      'cereal',     5200, 2470, 3.7],
      ['Mustard',   'oilseed',     160,  290, 1.4],
      ['Jute',      'fiber',        75,   65, 0.6],
      ['Banana',    'horti',       920,   58, 2.8],
      ['Pineapple', 'horti',       180,   12, 10.0],
      ['Areca nut', 'plantation',   76,   77, 10.0],
    ],
    raw: [
      ['Tea waste',  'Caffeine / fertilizer','180 KT/yr','Dibrugarh, Tinsukia'],
      ['Bamboo',     'Massive pool',         'large',    'Karbi Anglong, Cachar'],
      ['Areca husk', 'Plates / fiberboard',  '92 KT/yr', 'Nagaon, Tezpur'],
    ],
    note: "India's tea megastate. Bamboo policy push under NBM.",
    flagship: 'plantation',
  },
  "Haryana": {
    code: 'HR', capital: 'Chandigarh', area_sqkm: 44212,
    farmers: 1.5, netSown_kha: 3650, irrigated_pct: 87,
    crops: [
      ['Wheat',     'cereal',  12500, 2570, 11.5],
      ['Rice',      'cereal',   4800, 1480, 3.4],
      ['Mustard',   'oilseed',  1300,  680, 11.2],
      ['Cotton',    'fiber',     580,  610, 3.0],
      ['Sugarcane', 'sugar',    8500,   95, 2.2],
      ['Bajra',     'cereal',   1100,  470, 10.5],
    ],
    raw: [
      ['Paddy straw', 'Stubble pool', '9.2 MT/yr', 'Karnal, Kaithal'],
      ['Wheat straw', 'Fodder',       '11 MT/yr',  'All districts'],
    ],
    note: "Granary state. Stubble management challenge.",
    flagship: 'cereal',
  },
  "Chhattisgarh": {
    code: 'CG', capital: 'Raipur', area_sqkm: 135194,
    farmers: 3.7, netSown_kha: 4670, irrigated_pct: 34,
    crops: [
      ['Rice',     'cereal',  6500, 3870, 4.6],
      ['Maize',    'cereal',   460,  150, 1.4],
      ['Pulses',   'pulse',    920, 1140, 3.3],
      ['Oilseeds', 'oilseed',  300,  290, 0.9],
      ['Mahua',    'horti',     80,   45, 75.0],
      ['Tamarind', 'horti',    140,   28, 22.0],
    ],
    raw: [
      ['Mahua flowers', 'Bio-ethanol / liquor','120 KT/yr', 'Bastar, Kanker'],
      ['Tendu leaves',  'Bidi roll',           '210 KT/yr', 'Sarguja, Bastar'],
      ['Rice husk',     'Boiler fuel',         '1.2 MT/yr', 'Raipur, Durga'],
    ],
    note: "NTFP-rich tribal belt. Mahua & tendu monopoly.",
    flagship: 'horti',
  },
  "Jharkhand": {
    code: 'JH', capital: 'Ranchi', area_sqkm: 79716,
    farmers: 2.6, netSown_kha: 1810, irrigated_pct: 12,
    crops: [
      ['Rice',      'cereal', 3800, 1450, 2.7],
      ['Pulses',    'pulse',   550,  680, 2.0],
      ['Lac',       'horti',    14,    8, 56.0],
      ['Tasar Silk','horti',   4.5,   8, 65.0],
    ],
    raw: [
      ['Lac',        'Shellac / dye',    '14 KT/yr','Ranchi, Khunti'],
      ['Tasar silk', 'Tribal silk yarn', '3 KT/yr', 'Saraikela, Chaibasa'],
      ['Bamboo',     'Construction',     'large',   'Singhbhum, Latehar'],
    ],
    note: "Lac & tasar silk monopoly. Tribal NTFP economy.",
    flagship: 'horti',
  },
  "Himachal Pradesh": {
    code: 'HP', capital: 'Shimla', area_sqkm: 55673,
    farmers: 0.9, netSown_kha: 540, irrigated_pct: 19,
    crops: [
      ['Apple',     'horti',   750, 113, 80.0],
      ['Wheat',     'cereal',  460, 340, 0.4],
      ['Maize',     'cereal',  720, 280, 2.1],
      ['Stone fruit','horti',  180,  45, 22.0],
      ['Ginger',    'spice',    38,   6, 2.7],
    ],
    raw: [
      ['Apple pomace', 'Pectin / cider',  '180 KT/yr', 'Shimla, Kinnaur'],
      ['Walnut shells','Activated carbon','12 KT/yr',  'Kullu, Mandi'],
    ],
    note: "India's apple monopoly. Pomace & cider opportunity.",
    flagship: 'horti',
  },
  "Jammu and Kashmir": {
    code: 'JK', capital: 'Srinagar', area_sqkm: 222236,
    farmers: 1.4, netSown_kha: 760, irrigated_pct: 42,
    crops: [
      ['Apple',    'horti',  1850, 158, 78.5],
      ['Saffron',  'spice',   2.6,   3,100.0],
      ['Walnut',   'horti',   270,  89, 90.0],
      ['Cherry',   'horti',    25,   4, 78.0],
      ['Rice',     'cereal',  490, 138, 0.4],
      ['Almond',   'horti',     7,   5, 30.0],
    ],
    raw: [
      ['Saffron stigma', 'Pharma / FMCG export','2.6 MT/yr', 'Pampore, Pulwama'],
      ['Apple pomace',   'Pectin / juice',      '420 KT/yr', 'Sopore, Shopian'],
      ['Walnut shells',  'Activated carbon',    '38 KT/yr',  'Anantnag, Baramulla'],
    ],
    note: "Saffron monopoly (Kashmiri GI). Apple #1 historically.",
    flagship: 'spice',
  },
  "Uttarakhand": {
    code: 'UK', capital: 'Dehradun', area_sqkm: 53483,
    farmers: 0.9, netSown_kha: 670, irrigated_pct: 38,
    crops: [
      ['Wheat',         'cereal',  870, 320, 0.8],
      ['Rice',          'cereal',  610, 245, 0.4],
      ['Basmati',       'cereal',  170,  80, 8.0],
      ['Apple',         'horti',    65,  25, 7.0],
      ['Litchi',        'horti',    35,   6, 7.8],
      ['Aromatic Herbs','spice',    18,  12, 30.0],
    ],
    raw: [
      ['Aromatic oil', 'Lemongrass, mint, rose','8 KT/yr',  'Pauri, Nainital'],
      ['Pine needles', 'Bio-briquettes',        '300 KT/yr','Almora, Tehri'],
    ],
    note: "Aromatic herb policy thrust. Pine briquette pilot.",
    flagship: 'cereal',
  },
  "Goa": {
    code: 'GA', capital: 'Panaji', area_sqkm: 3702,
    farmers: 0.1, netSown_kha: 142, irrigated_pct: 30,
    crops: [
      ['Coconut',  'plantation', 130, 25, 0.6],
      ['Cashew',   'plantation',  31, 56, 3.7],
      ['Rice',     'cereal',     130, 38, 0.1],
      ['Areca nut','plantation',   8,  3, 1.0],
    ],
    raw: [
      ['Cashew Feni',  'Heritage liquor','8 KT/yr', 'Bicholim, Bardez'],
      ['Coconut shell','Charcoal',       '18 KT/yr','South Goa'],
    ],
    note: "Cashew Feni GI. Niche scale.",
    flagship: 'plantation',
  },
  "Meghalaya": {
    code: 'ML', capital: 'Shillong', area_sqkm: 22429,
    farmers: 0.3, netSown_kha: 260, irrigated_pct: 25,
    crops: [
      ['Lakadong Turmeric','spice',     6,   2.4, 0.5],
      ['Ginger',           'spice',    65,     9, 4.6],
      ['Pineapple',        'horti',   180,    12, 10.0],
      ['Rice',             'cereal',  360,   105, 0.3],
      ['Areca nut',        'plantation',45,    14, 6.0],
    ],
    raw: [
      ['Lakadong curcumin','Highest curcumin globally (7-9%)','6 KT/yr','Jaintia Hills'],
      ['Bay leaf',         'Spices Board export',             '8 KT/yr','East Khasi Hills'],
    ],
    note: "Lakadong turmeric — highest curcumin globally. GI niche.",
    flagship: 'spice',
  },
  "Sikkim": {
    code: 'SK', capital: 'Gangtok', area_sqkm: 7096,
    farmers: 0.05, netSown_kha: 75, irrigated_pct: 12,
    crops: [
      ['Large Cardamom','spice',  7, 16, 80.0],
      ['Ginger',        'spice', 38,6.5, 2.7],
      ['Buckwheat',     'cereal',12,  3, 35.0],
      ['Orange',        'horti', 22,  6,  1.0],
    ],
    raw: [
      ['Cardamom capsules','Pharma & spice export','7 KT/yr','North Sikkim'],
    ],
    note: "India's first 100% organic state. Large cardamom monopoly.",
    flagship: 'spice',
  },
  "Manipur": {
    code: 'MN', capital: 'Imphal', area_sqkm: 22327,
    farmers: 0.4, netSown_kha: 230, irrigated_pct: 35,
    crops: [
      ['Rice',     'cereal',  580, 195, 0.4],
      ['Pineapple','horti',   120,   9, 6.7],
      ['Orange',   'horti',    32,   6, 1.5],
      ['Cabbage',  'horti',    50,   4, 0.5],
    ],
    raw: [
      ['Pineapple leaf fiber','Sustainable textile','minor','Imphal valley'],
    ],
    note: "Pineapple cluster.",
    flagship: 'horti',
  },
  "Tripura": {
    code: 'TR', capital: 'Agartala', area_sqkm: 10486,
    farmers: 0.4, netSown_kha: 280, irrigated_pct: 28,
    crops: [
      ['Rice',     'cereal',     820, 245, 0.6],
      ['Rubber',   'plantation',  86,  88, 10.0],
      ['Tea',      'plantation',   9,   7, 0.7],
      ['Pineapple','horti',      165,  10, 9.2],
      ['Bamboo',   'horti',      220, 320, 28.0],
    ],
    raw: [
      ['Rubber latex',  'Tyres / latex products','86 KT/yr','Mohanpur, Bishalgarh'],
      ['Bamboo shoots', 'Food / bamboo products','large',  'Across state'],
    ],
    note: "Queen Pineapple GI. Bamboo policy state.",
    flagship: 'plantation',
  },
  "Nagaland": {
    code: 'NL', capital: 'Kohima', area_sqkm: 16579,
    farmers: 0.3, netSown_kha: 380, irrigated_pct: 18,
    crops: [
      ['Naga King Chili','spice',  2,  1.5, 0.1],
      ['Rice',           'cereal',420, 175, 0.3],
      ['Maize',          'cereal',120,  65, 0.4],
      ['Pineapple',      'horti',  65,   6, 3.6],
    ],
    raw: [
      ['King chili powder','Naga GI, highest SHU','2 KT/yr','Mon district'],
    ],
    note: "Naga King Chili (Bhut Jolokia) GI.",
    flagship: 'spice',
  },
  "Arunachal Pradesh": {
    code: 'AR', capital: 'Itanagar', area_sqkm: 83743,
    farmers: 0.2, netSown_kha: 240, irrigated_pct: 22,
    crops: [
      ['Rice',          'cereal',280, 110, 0.2],
      ['Kiwi',          'horti', 6.5, 4.5,60.0],
      ['Orange',        'horti',  38,   9, 1.8],
      ['Apple',         'horti',   4,   6, 0.4],
      ['Large Cardamom','spice',   1,   4,12.0],
    ],
    raw: [
      ['Kiwi pulp','Pharma / juice','6 KT/yr','Ziro, Lower Subansiri'],
    ],
    note: "India's kiwi monopoly.",
    flagship: 'horti',
  },
  "Mizoram": {
    code: 'MZ', capital: 'Aizawl', area_sqkm: 21081,
    farmers: 0.13, netSown_kha: 100, irrigated_pct: 18,
    crops: [
      ["Bird's Eye Chili",'spice', 1.8, 1.2, 0.1],
      ['Rice',            'cereal', 76,  44, 0.05],
      ['Ginger',          'spice',  16,   3, 1.1],
      ['Anthurium',       'horti', 0.4, 0.5,70.0],
    ],
    raw: [
      ['Anthurium cut flower','Export floriculture','niche','Aizawl, Lunglei'],
    ],
    note: "Bird's Eye Chili GI cluster.",
    flagship: 'spice',
  },
};

// 26 official Andhra Pradesh districts (2022 reorganisation). Each carries
// only curated raw-materials metadata — district crop rows now come from
// DES data via desDataset.js. The `raw`/`flagshipMaterial`/`note` of each
// pre-2022 district is carried onto its modern sub-districts.
export const AP_DISTRICTS = {
  // old East Godavari → East Godavari, Kakinada
  "East Godavari": {
    raw: [
      ['Coconut husk','420M husks/yr — ₹0.60–1.20/pc','cheapest in India'],
      ['Rice husk',   '440 KT/yr — boiler fuel pool', 'aggregated by traders'],
      ['Bagasse',     '320 KT/yr',                    'sugar mill captive'],
    ],
    flagshipMaterial: 'coconut husk',
    note: 'Godavari left-bank delta — coconut husk is the cheapest in India.',
  },
  "Kakinada": {
    raw: [
      ['Coconut husk','420M husks/yr — ₹0.60–1.20/pc','cheapest in India'],
      ['Rice husk',   '440 KT/yr — boiler fuel pool', 'aggregated by traders'],
      ['Bagasse',     '320 KT/yr',                    'sugar mill captive'],
    ],
    flagshipMaterial: 'coconut husk',
    note: 'Godavari delta port district — coconut husk and rice-husk pool.',
  },
  // old Konaseema → Dr. B.R. Ambedkar Konaseema (highlight)
  "Dr. B.R. Ambedkar Konaseema": {
    raw: [
      ['Coconut husk', '520M husks/yr — densest cluster','₹0.60–1.50/pc — cheapest'],
      ['Coconut shell','190 KT/yr',                      'charcoal-grade'],
      ['Coir pith',    'untapped — feedstock available', 'venture opportunity'],
    ],
    flagshipMaterial: 'coconut husk',
    note: "India's densest coconut belt — Konaseema husk is the cheapest in India.",
    highlight: true, // user's home district
  },
  // old West Godavari → West Godavari, Eluru
  "West Godavari": {
    raw: [
      ['Coconut husk', '340M husks/yr',           'Tanuku-Bhimavaram axis'],
      ['Shrimp waste', '60 KT/yr — chitin pool',  'unique processing opp'],
      ['Palm bunches', 'EFB residue',             'oil palm mill region'],
    ],
    flagshipMaterial: 'coconut husk',
    note: 'Godavari right-bank rice basket — shrimp and oil-palm cluster.',
  },
  "Eluru": {
    raw: [
      ['Coconut husk', '340M husks/yr',           'Tanuku-Bhimavaram axis'],
      ['Shrimp waste', '60 KT/yr — chitin pool',  'unique processing opp'],
      ['Palm bunches', 'EFB residue',             'oil palm mill region'],
    ],
    flagshipMaterial: 'coconut husk',
    note: 'Inland Godavari district — aqua and oil-palm processing belt.',
  },
  // old Krishna → Krishna, Ntr
  "Krishna": {
    raw: [
      ['Mango stones','60 KT/yr — kernel fat opp','Nuzvid, Tiruvuru'],
      ['Rice husk',   '510 KT/yr',                 'large mill cluster'],
      ['Bagasse',     '420 KT/yr',                 'Lakshmi mill captive'],
    ],
    flagshipMaterial: 'mango',
    note: 'Krishna delta — mango kernel-fat and large rice-mill cluster.',
  },
  "Ntr": {
    raw: [
      ['Mango stones','60 KT/yr — kernel fat opp','Nuzvid, Tiruvuru'],
      ['Rice husk',   '510 KT/yr',                 'large mill cluster'],
      ['Bagasse',     '420 KT/yr',                 'Lakshmi mill captive'],
    ],
    flagshipMaterial: 'mango',
    note: 'Vijayawada region — mango kernel-fat and rice-mill cluster.',
  },
  // old Guntur → Guntur, Bapatla, Palnadu
  "Guntur": {
    raw: [
      ['Chili stems',   '32 KT/yr — capsaicin extraction','Guntur mandi'],
      ['Tobacco scrap', '12 KT/yr — nicotine extract',    'export-controlled'],
      ['Cotton stalks', '270 KT/yr',                       'particle board feed'],
    ],
    flagshipMaterial: 'chili',
    note: "India's chili capital — Guntur red and FCV tobacco belt.",
  },
  "Bapatla": {
    raw: [
      ['Chili stems',   '32 KT/yr — capsaicin extraction','Guntur mandi'],
      ['Tobacco scrap', '12 KT/yr — nicotine extract',    'export-controlled'],
      ['Cotton stalks', '270 KT/yr',                       'particle board feed'],
    ],
    flagshipMaterial: 'chili',
    note: 'Coastal Guntur belt — chili, tobacco and cotton-stalk pool.',
  },
  "Palnadu": {
    raw: [
      ['Chili stems',   '32 KT/yr — capsaicin extraction','Guntur mandi'],
      ['Tobacco scrap', '12 KT/yr — nicotine extract',    'export-controlled'],
      ['Cotton stalks', '270 KT/yr',                       'particle board feed'],
    ],
    flagshipMaterial: 'chili',
    note: 'Inland Guntur belt — chili and cotton on black cotton soil.',
  },
  // old Chittoor → Chittoor, Tirupati, Annamayya
  "Chittoor": {
    raw: [
      ['Mango stones','180 KT/yr — kernel fat',     'pulp processing cluster'],
      ['Tomato waste','60 KT/yr — pectin / lycopene','Madanapalle, Punganur'],
      ['Bagasse',     '480 KT/yr',                   'Renigunta sugar mill'],
    ],
    flagshipMaterial: 'mango',
    note: 'Totapuri mango pulp belt — Coca-Cola/Pepsi sourcing region.',
  },
  "Tirupati": {
    raw: [
      ['Mango stones','180 KT/yr — kernel fat',     'pulp processing cluster'],
      ['Tomato waste','60 KT/yr — pectin / lycopene','Madanapalle, Punganur'],
      ['Bagasse',     '480 KT/yr',                   'Renigunta sugar mill'],
    ],
    flagshipMaterial: 'mango',
    note: 'Coastal Rayalaseema district — mango pulp and Renigunta sugar mill.',
  },
  "Annamayya": {
    raw: [
      ['Mango stones','180 KT/yr — kernel fat',     'pulp processing cluster'],
      ['Tomato waste','60 KT/yr — pectin / lycopene','Madanapalle, Punganur'],
      ['Bagasse',     '480 KT/yr',                   'Renigunta sugar mill'],
    ],
    flagshipMaterial: 'mango',
    note: 'Madanapalle tomato hub — mango pulp and horticulture belt.',
  },
  // old Kurnool → Kurnool, Nandyal
  "Kurnool": {
    raw: [
      ['Cotton stalks',   '420 KT/yr','particle board / briquettes'],
      ['Groundnut shells','280 KT/yr','Banaganapalle, Adoni clusters'],
      ['Sunflower hulls', '85 KT/yr', 'oil mill residue'],
    ],
    flagshipMaterial: 'cotton',
    note: 'Rayalaseema cotton and oilseed pool — Adoni ginning cluster.',
  },
  "Nandyal": {
    raw: [
      ['Cotton stalks',   '420 KT/yr','particle board / briquettes'],
      ['Groundnut shells','280 KT/yr','Banaganapalle, Adoni clusters'],
      ['Sunflower hulls', '85 KT/yr', 'oil mill residue'],
    ],
    flagshipMaterial: 'cotton',
    note: 'Nandyal cluster — cotton, groundnut and onion belt.',
  },
  // old Anantapur → Ananthapuramu, Sri Sathya Sai
  "Ananthapuramu": {
    raw: [
      ['Groundnut shells','780 KT/yr — silica + briquettes',"India's largest pool"],
      ['Groundnut haulms','420 KT/yr — fodder',              'export to dairy belts'],
    ],
    flagshipMaterial: 'groundnut',
    note: "India's #1 groundnut district — largest shell pool nationally.",
  },
  "Sri Sathya Sai": {
    raw: [
      ['Groundnut shells','780 KT/yr — silica + briquettes',"India's largest pool"],
      ['Groundnut haulms','420 KT/yr — fodder',              'export to dairy belts'],
    ],
    flagshipMaterial: 'groundnut',
    note: 'Rayalaseema dryland — groundnut shell and haulm pool.',
  },
  // old Visakhapatnam → Visakhapatnam, Anakapalli, Alluri Sitharama Raju
  "Visakhapatnam": {
    raw: [
      ['Cashew shells', '7 KT/yr — CNSL feedstock','Anakapalle, Yelamanchili'],
      ['Coconut shell', '32 KT/yr',                'minor charcoal'],
      ['Port logistics','Vizag port — gateway',    'export-grade hub'],
    ],
    flagshipMaterial: 'mixed',
    note: 'North coastal hub — Vizag port gateway for agri-exports.',
  },
  "Anakapalli": {
    raw: [
      ['Cashew shells', '7 KT/yr — CNSL feedstock','Anakapalle, Yelamanchili'],
      ['Coconut shell', '32 KT/yr',                'minor charcoal'],
      ['Port logistics','Vizag port — gateway',    'export-grade hub'],
    ],
    flagshipMaterial: 'mixed',
    note: 'Anakapalle sugar belt — cashew CNSL and coconut shell.',
  },
  "Alluri Sitharama Raju": {
    raw: [
      ['Cashew shells', '7 KT/yr — CNSL feedstock','Anakapalle, Yelamanchili'],
      ['Coconut shell', '32 KT/yr',                'minor charcoal'],
      ['Port logistics','Vizag port — gateway',    'export-grade hub'],
    ],
    flagshipMaterial: 'mixed',
    note: 'Tribal Eastern Ghats district — NTFP-rich uplands.',
  },
  // old Nellore → Sri Potti Sriramulu Nellore
  "Sri Potti Sriramulu Nellore": {
    raw: [
      ['Shrimp shells','85 KT/yr — chitin / chitosan','export pharma'],
      ['Rice husk',    '180 KT/yr',                   'boiler pool'],
      ['Lemon peel',   '12 KT/yr — pectin / oil',     'untapped'],
    ],
    flagshipMaterial: 'aqua',
    note: 'Penna delta — shrimp chitin pool and Nellore lemon GI.',
  },
  // old Prakasam → Prakasam
  "Prakasam": {
    raw: [
      ['Cotton stalks','210 KT/yr','particle board feed'],
      ['Chili stems',  '8 KT/yr',  'capsaicin opp'],
    ],
    flagshipMaterial: 'mixed',
    note: 'Dry tract — FCV tobacco, chili and cotton on black soil.',
  },
  // old Srikakulam → Srikakulam, Parvathipuram Manyam, Vizianagaram
  "Srikakulam": {
    raw: [
      ['Cashew shells','9 KT/yr', 'Tekkali, Palasa clusters'],
      ['Rice husk',    '155 KT/yr','boiler pool'],
    ],
    flagshipMaterial: 'cashew',
    note: 'North coastal — Tekkali/Palasa cashew clusters.',
  },
  "Parvathipuram Manyam": {
    raw: [
      ['Cashew shells','9 KT/yr', 'Tekkali, Palasa clusters'],
      ['Rice husk',    '155 KT/yr','boiler pool'],
    ],
    flagshipMaterial: 'cashew',
    note: 'Tribal Manyam uplands — cashew and rice-husk pool.',
  },
  "Vizianagaram": {
    raw: [
      ['Cashew shells','9 KT/yr', 'Tekkali, Palasa clusters'],
      ['Rice husk',    '155 KT/yr','boiler pool'],
    ],
    flagshipMaterial: 'cashew',
    note: 'North coastal plains — cashew and paddy belt.',
  },
  // Y.S.R. Kadapa — no curated predecessor
  "Y.S.R. Kadapa": {
    raw: [],
    flagshipMaterial: 'mixed',
    note: 'Rayalaseema dryland district — groundnut and pulses belt.',
  },
};

// Centroids on 1000×1100 canvas — used for fallback bubble map + label placement
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
export const ALL_CROPS = (() => {
  const set = new Set();
  for (const s of Object.values(STATES)) for (const c of s.crops) set.add(c[0]);
  return [...set].sort((a, b) => a.localeCompare(b));
})();
