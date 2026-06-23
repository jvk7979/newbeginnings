// src/pages/WorldMarket/WorldMap.jsx
//
// SVG choropleth world map. Uses a simple equirectangular projection with
// latitude clipping to remove Antarctica and antimeridian-break handling to
// eliminate the stray horizontal lines that Mercator produces for countries
// whose polygons cross ±180° (Russia, USA/Alaska, Fiji, etc.).

import { useMemo, memo } from 'react';
import { feature } from 'topojson-client';
import worldTopo from 'world-atlas/countries-110m.json';

// ── Projection ─────────────────────────────────────────────────────────────

const W = 960, H = 480;

// Clip map to these latitudes — removes Antarctica at bottom, trims Arctic top.
const LAT_MIN = -58;
const LAT_MAX =  84;

function project(lng, lat) {
  const x = ((lng + 180) / 360) * W;
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * H;
  return [x, y];
}

// Convert one ring to an SVG path string, breaking the path when crossing the
// antimeridian (a longitude jump > 180° signals a wrap-around).
function ringToPath(ring) {
  let d = '';
  let prevLng = null;
  let penDown = false;

  for (const coord of ring) {
    const lng = coord[0], lat = coord[1];
    if (lat < LAT_MIN || lat > LAT_MAX) { penDown = false; prevLng = null; continue; }
    // Antimeridian jump — lift pen so no line crosses the map
    if (prevLng !== null && Math.abs(lng - prevLng) > 180) penDown = false;
    const [x, y] = project(lng, lat);
    d += (penDown ? 'L' : 'M') + x.toFixed(1) + ',' + y.toFixed(1);
    penDown = true;
    prevLng = lng;
  }
  return d ? d + 'Z' : '';
}

function featurePath(feature) {
  const g = feature.geometry;
  if (!g) return '';
  const rings = g.type === 'Polygon'
    ? g.coordinates
    : g.type === 'MultiPolygon'
      ? g.coordinates.flat()
      : [];
  return rings.map(ringToPath).join(' ');
}

// ── Static country data ────────────────────────────────────────────────────

const WORLD_GEO = feature(worldTopo, worldTopo.objects.countries);

const COUNTRY_PATHS = WORLD_GEO.features
  .filter(f => Number(f.id) !== 10)   // skip Antarctica (ISO 3166-1: 010)
  .map(f => ({
    code: Number(f.id),
    name: f.properties?.name || '',
    d: featurePath(f),
  }))
  .filter(c => c.d);                  // drop any empty paths

// Each country gets a unique hue via golden-angle hash.
// Export intensity (t: 0–1) drives saturation and lightness — big exporters
// are vivid and dark, no-data countries are pale. Every country keeps its own
// distinct colour (orange, blue, red, teal, etc.).
function countryFill(code, t) {
  const hue = (code * 137) % 360;
  if (t == null) return `hsl(${hue}, 22%, 66%)`; // muted, no trade data
  const sat = Math.round(35 + t * 50);            // 35% → 85%  as export grows
  const lig = Math.round(62 - t * 30);            // 62% → 32%  as export grows
  return `hsl(${hue}, ${sat}%, ${lig}%)`;
}

// ── Components ─────────────────────────────────────────────────────────────

const CountryPath = memo(function CountryPath({ d, fill, stroke, strokeWidth, code, onSelect, onHover }) {
  return (
    <path
      d={d}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      style={{ cursor: 'pointer', transition: 'fill 150ms' }}
      onClick={() => onSelect(code)}
      onMouseEnter={() => onHover(code)}
      onMouseLeave={() => onHover(null)}
    />
  );
});

export default function WorldMap({ partnerData, selectedCode, hoveredCode, onSelect, onHover }) {
  const maxVal = useMemo(() => {
    if (!partnerData) return 1;
    return Math.max(1, ...Object.values(partnerData).map(d => d.value_usd));
  }, [partnerData]);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block', width: '100%', height: '100%' }}
      aria-label="World map — India's agricultural exports by destination"
    >
      <rect width={W} height={H} fill="var(--c-bg0)" />
      {COUNTRY_PATHS.map(({ code, d }) => {
        const partner = partnerData?.[code];
        const t = partner ? Math.pow(partner.value_usd / maxVal, 0.32) : null;
        const fill = countryFill(code, t);
        const isSel = selectedCode === code;
        const isHov = hoveredCode === code;
        return (
          <CountryPath
            key={code}
            code={code}
            d={d}
            fill={fill}
            stroke={isSel ? 'var(--c-accent)' : isHov ? 'var(--c-fg2)' : 'var(--c-border)'}
            strokeWidth={isSel ? 1.5 : isHov ? 0.8 : 0.3}
            onSelect={onSelect}
            onHover={onHover}
          />
        );
      })}
    </svg>
  );
}
