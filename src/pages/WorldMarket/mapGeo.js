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
