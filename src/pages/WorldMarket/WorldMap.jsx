// src/pages/WorldMarket/WorldMap.jsx
//
// SVG choropleth world map using Natural Earth 110m data (world-atlas npm).
// TopoJSON → GeoJSON via topojson-client. Country numeric IDs match
// UN Comtrade partnerCode directly (ISO 3166-1 numeric).
// Shading reuses intensityColor() from Atlas geoHelpers.

import { useMemo, memo } from 'react';
import { feature } from 'topojson-client';
import worldTopo from 'world-atlas/countries-110m.json';
import { buildPathGen, intensityColor } from '../Atlas/geoHelpers';

// Convert once at module load — pure, no side effects.
const WORLD_GEO = feature(worldTopo, worldTopo.objects.countries);

const W = 960, H = 500;

// Pre-build path strings once — buildPathGen is deterministic for fixed W/H.
const PATH_GEN = buildPathGen(WORLD_GEO, W, H, 2);
const COUNTRY_PATHS = WORLD_GEO.features.map(f => ({
  code: Number(f.id),
  name: f.properties?.name || '',
  d: PATH_GEN.path(f),
}));

const CountryPath = memo(function CountryPath({
  d, fill, stroke, strokeWidth, code, onSelect, onHover,
}) {
  return (
    <path
      d={d}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      style={{ cursor: 'pointer', transition: 'fill 150ms' }}
      onClick={() => onSelect(code)}
      onMouseEnter={(e) => onHover(code, e)}
      onMouseLeave={() => onHover(null, null)}
    />
  );
});

export default function WorldMap({ partnerData, selectedCode, hoveredCode, onSelect, onHover }) {
  const maxVal = useMemo(() => {
    if (!partnerData) return 1;
    const vals = Object.values(partnerData).map(d => d.value_usd);
    return Math.max(1, ...vals);
  }, [partnerData]);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block', width: '100%', height: '100%' }}
      aria-label="World map — India's exports by destination country"
    >
      <rect width={W} height={H} fill="var(--c-bg0)" />
      {COUNTRY_PATHS.map(({ code, d }) => {
        if (!d) return null;
        const partner = partnerData?.[code];
        const t = partner ? partner.value_usd / maxVal : null;
        // Power-scale so mid-range countries are still visible alongside outliers.
        const fill = t != null ? intensityColor(Math.pow(t, 0.35)) : 'var(--c-bg2)';
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
