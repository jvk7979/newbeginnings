// src/pages/Atlas/geoHelpers.js
//
// Minimal GeoJSON projection + path generator. Avoids the `d3-geo`
// dependency — we only need to fit a polygon set into a canvas and
// generate an SVG path string. India lies between ~6°N and 37°N, ~68°E
// and 97°E so a Web-Mercator projection has acceptable distortion at
// this scale.

// Web-Mercator: x = lng (radians), y = ln(tan(π/4 + lat/2))
const mercatorPoint = (lng, lat) => {
  const x = (lng * Math.PI) / 180;
  const yRad = Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
  return [x, yRad];
};

// Walk every coordinate in a FeatureCollection and return the
// projected-space bounding box.
const projectedBounds = (geojson) => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const visit = (lng, lat) => {
    const [x, y] = mercatorPoint(lng, lat);
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  };
  const walk = (coords) => {
    if (typeof coords[0] === 'number') {
      visit(coords[0], coords[1]);
    } else {
      coords.forEach(walk);
    }
  };
  geojson.features.forEach((f) => walk(f.geometry.coordinates));
  return { minX, minY, maxX, maxY };
};

// Build an SVG path generator that fits the GeoJSON into a width×height
// canvas (preserves aspect ratio, centred). Returns:
//   { path: (feature) => 'M..L..Z',
//     project: (lng, lat) => [x, y],
//     centroid: (feature) => [x, y] }
export function buildPathGen(geojson, width, height, padding = 4) {
  if (!geojson || !geojson.features?.length) {
    return { path: () => '', project: () => [0, 0], centroid: () => [0, 0] };
  }
  const { minX, minY, maxX, maxY } = projectedBounds(geojson);
  const projW = maxX - minX;
  const projH = maxY - minY;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  const scale = Math.min(innerW / projW, innerH / projH);
  const tx = padding + (innerW - projW * scale) / 2 - minX * scale;
  // Mercator y grows downward in image space; we already use Math.log which
  // increases northward — flip. So canvas-y = maxY*scale instead of +minY.
  const ty = padding + (innerH - projH * scale) / 2 + maxY * scale;

  const project = (lng, lat) => {
    const [px, py] = mercatorPoint(lng, lat);
    return [px * scale + tx, ty - py * scale];
  };

  const ringToString = (ring) => {
    let d = '';
    for (let i = 0; i < ring.length; i++) {
      const [x, y] = project(ring[i][0], ring[i][1]);
      d += (i === 0 ? 'M' : 'L') + x.toFixed(2) + ',' + y.toFixed(2);
    }
    return d + 'Z';
  };

  const polygonToString = (poly) => poly.map(ringToString).join('');

  const path = (feature) => {
    const g = feature.geometry;
    if (!g) return '';
    if (g.type === 'Polygon') return polygonToString(g.coordinates);
    if (g.type === 'MultiPolygon') return g.coordinates.map(polygonToString).join('');
    return '';
  };

  // Simple centroid: average of all vertices weighted equally. Good enough
  // for labelling / drill-down dots — not a true polygon-area centroid.
  const centroid = (feature) => {
    let sx = 0, sy = 0, n = 0;
    const walk = (coords) => {
      if (typeof coords[0] === 'number') {
        const [x, y] = project(coords[0], coords[1]);
        sx += x; sy += y; n += 1;
      } else {
        coords.forEach(walk);
      }
    };
    walk(feature.geometry.coordinates);
    return n === 0 ? [0, 0] : [sx / n, sy / n];
  };

  return { path, project, centroid };
}

// Fetch with timeout & cors. Tries each URL until one succeeds.
export async function fetchGeoJSON(urls, timeoutMs = 6000) {
  for (const url of urls) {
    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), timeoutMs);
      const resp = await fetch(url, { mode: 'cors', signal: controller.signal });
      clearTimeout(tid);
      if (!resp.ok) continue;
      const text = await resp.text();
      if (!text || text.length < 100) continue;
      const json = JSON.parse(text);
      if (json && (json.features || json.type)) return json;
    } catch { /* try next */ }
  }
  return null;
}

// Bundled-asset base — respects any Vite `base` config for sub-path deploys.
const ATLAS_ASSETS = `${import.meta.env.BASE_URL}atlas/`;

// India states GeoJSON sources, tried in order. Official Survey of India
// 1:1M administrative boundaries — bundled locally, generated from the
// SoI shapefiles by scripts/build-atlas-geojson.mjs — are primary: they
// carry the legally correct external boundaries. Community CDN sources
// (datta07, post-Telangana / post-Ladakh-UT) remain as fallbacks.
export const STATE_GEOJSON_URLS = [
  `${ATLAS_ASSETS}india-states.geojson`,
  'https://cdn.jsdelivr.net/gh/datta07/INDIAN-SHAPEFILES@master/INDIA/INDIA_STATES.geojson',
  'https://raw.githubusercontent.com/datta07/INDIAN-SHAPEFILES/master/INDIA/INDIA_STATES.geojson',
  'https://cdn.jsdelivr.net/gh/Subhash9325/GeoJson-Data-of-Indian-States@master/Indian_States',
  'https://raw.githubusercontent.com/Subhash9325/GeoJson-Data-of-Indian-States/master/Indian_States',
  'https://cdn.jsdelivr.net/gh/geohacker/india@master/state/india_telengana.geojson',
];

// Andhra Pradesh district GeoJSON. Official Survey of India district
// boundaries (bundled locally) are primary; the udit-001 per-state CDN
// file is the fallback. Both carry the current 26-district (2022
// reorganisation) layout — districtNameOf collapses the 26 names back onto
// our 12 priority-district keys.
export const AP_GEOJSON_URLS = [
  `${ATLAS_ASSETS}ap-districts.geojson`,
  'https://cdn.jsdelivr.net/gh/udit-001/india-maps-data@main/geojson/states/andhra-pradesh.geojson',
  'https://raw.githubusercontent.com/udit-001/india-maps-data/main/geojson/states/andhra-pradesh.geojson',
];

// Resolve state name across schemas; normalise variants. `STNAME_SH` is
// checked first — it is the title-cased "short name" used by the current
// datta07 boundary files and matches cropData's STATES keys directly.
export const stateNameOf = (props) => {
  if (!props) return '';
  const raw = props.STNAME_SH || props.NAME_1 || props.st_nm || props.STATE ||
              props.STNAME || props.NAME || props.name ||
              props.State_Name || props.statename || '';
  let norm = String(raw).replace(/\s+/g, ' ').trim();
  // Some sources store names in ALL CAPS — title-case them so they match
  // the title-case keys in cropData's STATES map.
  if (norm && norm === norm.toUpperCase()) {
    norm = norm.toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .replace(/\b(And|Of|The)\b/g, (m) => m.toLowerCase());
  }
  const aliases = {
    'NCT of Delhi': 'Delhi',
    'Orissa': 'Odisha',
    'Pondicherry': 'Puducherry',
    'Uttaranchal': 'Uttarakhand',
    'Jammu & Kashmir': 'Jammu and Kashmir',
    'Telengana': 'Telangana',
    'Dadara & Nagar Havelli': 'Dadra & Nagar Haveli',
  };
  return aliases[norm] || norm;
};

// Resolve AP district name; collapses sub-divisions back into our 12 keys
export const districtNameOf = (props) => {
  if (!props) return '';
  const raw = props.dtname || props.DISTRICT || props.District ||
              props.NAME_2 || props.district || props.name || '';
  const norm = String(raw).replace(/\s+/g, ' ').trim();
  // Spellings cover both the Survey of India source (primary) and the
  // udit-001 CDN fallback, which differ slightly — e.g. SoI writes
  // "Sitarama" / "Ananthapuramu" / "B.R.", udit-001 the other variants.
  const aliases = {
    'Dr. B. R. Ambedkar Konaseema': 'Konaseema',
    'Dr. B.R. Ambedkar Konaseema': 'Konaseema',
    'Ambedkar Konaseema': 'Konaseema',
    'Eluru': 'West Godavari',
    'Kakinada': 'East Godavari',
    'NTR': 'Krishna',
    'Bapatla': 'Guntur',
    'Palnadu': 'Guntur',
    'Anantapuramu': 'Anantapur',
    'Ananthapuramu': 'Anantapur',
    'Sri Sathya Sai': 'Anantapur',
    'Annamayya': 'Chittoor',
    'Tirupati': 'Chittoor',
    'Nandyal': 'Kurnool',
    'Alluri Sitharama Raju': 'Visakhapatnam',
    'Alluri Sitarama Raju': 'Visakhapatnam',
    'Anakapalli': 'Visakhapatnam',
    'Parvathipuram Manyam': 'Srikakulam',
    'Vizianagaram': 'Srikakulam',
    'Sri Potti Sriramulu Nellore': 'Nellore',
  };
  return aliases[norm] || norm;
};

// Sage → coconut-green intensity ramp (matches Heritage palette).
export function intensityColor(t) {
  if (t == null || isNaN(t)) return '#EDE5D2';
  const stops = [
    { t: 0,    c: [246, 241, 231] },  // cream
    { t: 0.15, c: [225, 232, 211] },  // pale sage
    { t: 0.35, c: [188, 209, 178] },  // sage
    { t: 0.55, c: [134, 174, 138] },  // mid green
    { t: 0.75, c: [ 74, 143, 112] },  // accent-light
    { t: 1.0,  c: [ 32,  81,  57] },  // accent-dim
  ];
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i].t) {
      const a = stops[i - 1], b = stops[i];
      const u = (t - a.t) / (b.t - a.t);
      const r  = Math.round(a.c[0] + (b.c[0] - a.c[0]) * u);
      const g  = Math.round(a.c[1] + (b.c[1] - a.c[1]) * u);
      const bl = Math.round(a.c[2] + (b.c[2] - a.c[2]) * u);
      return `rgb(${r},${g},${bl})`;
    }
  }
  return '#205139';
}

// Compute the choropleth metric for a state under the active filter.
// When `filter.crop` is set, the map is recoloured purely by that one crop;
// otherwise it aggregates across the selected category.
export function computeStateMetric(stateData, filter) {
  if (!stateData) return { value: 0, topCrop: null };

  // Single-crop mode — colour by the chosen crop alone.
  if (filter.crop) {
    const row = stateData.crops.find((c) => c[0] === filter.crop);
    if (!row) return { value: 0, topCrop: null };
    const value = filter.metric === 'area' ? row[3]
                : filter.metric === 'share' ? row[4]
                : row[2];
    return { value: value || 0, topCrop: row };
  }

  const crops = filter.category === 'all'
    ? stateData.crops
    : stateData.crops.filter((c) => c[1] === filter.category);
  if (crops.length === 0) return { value: 0, topCrop: null };

  let value = 0;
  let topCrop = crops[0];
  for (const c of crops) {
    if (filter.metric === 'area') {
      value += c[3];
      if (c[3] > (topCrop[3] || 0)) topCrop = c;
    } else if (filter.metric === 'share') {
      if (c[4] > value) { value = c[4]; topCrop = c; }
    } else {
      value += c[2];
      if (c[2] > (topCrop[2] || 0)) topCrop = c;
    }
  }
  return { value, topCrop };
}

// District-level twin of computeStateMetric. District crop rows are
// [name, category, prod_kt, area_kha, note] — they carry no national-share
// column, so under the 'share' metric callers fall back to production.
export function computeDistrictMetric(districtData, filter) {
  if (!districtData) return { value: 0, topCrop: null };

  // Single-crop mode — value & top crop are that one crop.
  if (filter.crop) {
    const row = districtData.crops.find((c) => c[0] === filter.crop);
    if (!row) return { value: 0, topCrop: null };
    return { value: (filter.metric === 'area' ? row[3] : row[2]) || 0, topCrop: row };
  }

  const crops = filter.category === 'all'
    ? districtData.crops
    : districtData.crops.filter((c) => c[1] === filter.category);
  if (crops.length === 0) return { value: 0, topCrop: null };

  let value = 0;
  let topCrop = crops[0];
  for (const c of crops) {
    const v = filter.metric === 'area' ? c[3] : c[2];
    value += v;
    if (v > (filter.metric === 'area' ? topCrop[3] : topCrop[2])) topCrop = c;
  }
  return { value, topCrop };
}

export function formatVal(v, metric) {
  if (v == null || isNaN(v) || v === 0) return '—';
  if (metric === 'area')  return v >= 1000 ? `${(v / 1000).toFixed(1)} M ha` : `${Math.round(v)} K ha`;
  if (metric === 'share') return `${v.toFixed(1)}%`;
  return v >= 1000 ? `${(v / 1000).toFixed(2)} MT` : `${Math.round(v)} KT`;
}
