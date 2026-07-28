// Shared SVG map geometry — equirectangular projection, antimeridian-safe.
// Imported by WorldMap.jsx and all concept preview components.

import { feature } from 'topojson-client';
import worldTopo from 'world-atlas/countries-110m.json';

export const W = 960, H = 480;
const LAT_MIN = -58, LAT_MAX = 84;

export function project(lng, lat) {
  return [
    ((lng + 180) / 360) * W,
    ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * H,
  ];
}

function ringToPath(ring) {
  let d = '', prevLng = null, penDown = false;
  for (const coord of ring) {
    const lng = coord[0], lat = coord[1];
    if (lat < LAT_MIN || lat > LAT_MAX) { penDown = false; prevLng = null; continue; }
    if (prevLng !== null && Math.abs(lng - prevLng) > 180) penDown = false;
    const [x, y] = project(lng, lat);
    d += (penDown ? 'L' : 'M') + x.toFixed(1) + ',' + y.toFixed(1);
    penDown = true; prevLng = lng;
  }
  return d ? d + 'Z' : '';
}

function featurePath(f) {
  const g = f.geometry;
  if (!g) return '';
  const rings = g.type === 'Polygon' ? g.coordinates
    : g.type === 'MultiPolygon' ? g.coordinates.flat() : [];
  return rings.map(ringToPath).join(' ');
}

const WORLD_GEO = feature(worldTopo, worldTopo.objects.countries);

export const COUNTRY_PATHS = WORLD_GEO.features
  .filter(f => Number(f.id) !== 10)
  .map(f => ({ code: Number(f.id), name: f.properties?.name || '', d: featurePath(f) }))
  .filter(c => c.d);

// Rough visual centroid per country code — averages every coordinate pair in
// the path. Good enough to anchor trade-flow arc endpoints. Computed once and
// shared by the World and Andhra Pradesh flow maps.
export const CENTROIDS = (() => {
  const m = {};
  for (const { code, d } of COUNTRY_PATHS) {
    const nums = d.match(/-?\d+(?:\.\d+)?/g);
    if (!nums || nums.length < 2) continue;
    let sx = 0, sy = 0, n = 0;
    for (let i = 0; i + 1 < nums.length; i += 2) { sx += +nums[i]; sy += +nums[i + 1]; n++; }
    if (n) m[code] = { x: sx / n, y: sy / n };
  }
  return m;
})();

// Build a curved arc path (quadratic bezier bowing up) between two points.
export function arcPath(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const dist = Math.hypot(dx, dy) || 1;
  const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2 - dist * 0.32;
  return { d: `M${a.x.toFixed(1)},${a.y.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}`, dist };
}

// Small 5-point star path, used to mark an origin hub.
export function starPath(cx, cy, rO = 10, pts = 5) {
  let s = ''; const rI = rO * 0.45;
  for (let i = 0; i < pts * 2; i++) {
    const r = i % 2 ? rI : rO;
    const a = (Math.PI / pts) * i - Math.PI / 2;
    s += (i ? 'L' : 'M') + (cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1);
  }
  return s + 'Z';
}
