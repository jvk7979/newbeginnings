// src/pages/Atlas/IndiaMap.jsx
import { useEffect, useMemo, useState } from 'react';
import { C } from '../../tokens';
import { STATE_CENTROIDS } from './cropData';
import {
  buildPathGen, fetchGeoJSON, STATE_GEOJSON_URLS,
  stateNameOf, intensityColor, computeStateMetric,
} from './geoHelpers';

const W = 1000, H = 1100;

export default function IndiaMap({ filter, states, hovered, selected, onHover, onSelect, onDrillDown }) {
  const [geo, setGeo] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ok | fallback

  useEffect(() => {
    let cancelled = false;
    fetchGeoJSON(STATE_GEOJSON_URLS).then((json) => {
      if (cancelled) return;
      if (json?.features?.length) { setGeo(json); setStatus('ok'); }
      else setStatus('fallback');
    });
    return () => { cancelled = true; };
  }, []);

  const { metricRange, stateMetrics } = useMemo(() => {
    const all = {};
    let min = Infinity, max = -Infinity;
    for (const name of Object.keys(states)) {
      const m = computeStateMetric(states[name], filter);
      all[name] = m;
      if (m.value > 0) {
        if (m.value < min) min = m.value;
        if (m.value > max) max = m.value;
      }
    }
    if (min === Infinity) { min = 0; max = 1; }
    return { metricRange: [min, max], stateMetrics: all };
  }, [filter, states]);

  const intensityFor = (name) => {
    const m = stateMetrics[name];
    if (!m || m.value === 0) return 0;
    const [lo, hi] = metricRange;
    if (hi === lo) return 0.5;
    const t = Math.log(m.value - lo + 1) / Math.log(hi - lo + 1);
    return Math.max(0, Math.min(1, t));
  };

  const pathGen = useMemo(() => (geo ? buildPathGen(geo, W, H, 20) : null), [geo]);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet"
         style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <pattern id="atlas-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0V40" fill="none" stroke={C.bg3} strokeWidth="0.5" opacity="0.55"/>
        </pattern>
        <pattern id="atlas-grid-fine" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M10 0H0V10" fill="none" stroke={C.border} strokeWidth="0.4" opacity="0.45"/>
        </pattern>
        <radialGradient id="atlas-vignette" cx="50%" cy="50%" r="70%">
          <stop offset="60%" stopColor="rgba(246,241,231,0)"/>
          <stop offset="100%" stopColor="rgba(47,107,79,0.06)"/>
        </radialGradient>
        <filter id="atlas-glow">
          <feGaussianBlur stdDeviation="2"/>
          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <rect x="0" y="0" width={W} height={H} fill={C.bg0}/>
      <rect x="0" y="0" width={W} height={H} fill="url(#atlas-grid-fine)"/>
      <rect x="0" y="0" width={W} height={H} fill="url(#atlas-grid)"/>

      {/* Coordinate ticks */}
      <g opacity="0.55">
        {[...Array(11)].map((_, i) => (
          <g key={`tx${i}`}>
            <line x1={i * 100} y1="0" x2={i * 100} y2="8" stroke={C.fg3} strokeWidth="0.5"/>
            <text x={i * 100} y="20" fill={C.fg3} fontSize="9"
                  fontFamily="'JetBrains Mono', monospace" textAnchor="middle" opacity="0.85">
              {(68 + i).toFixed(0)}°E
            </text>
          </g>
        ))}
        {[...Array(11)].map((_, i) => (
          <g key={`ty${i}`}>
            <line x1="0" y1={100 + i * 100} x2="8" y2={100 + i * 100} stroke={C.fg3} strokeWidth="0.5"/>
            <text x="12" y={104 + i * 100} fill={C.fg3} fontSize="9"
                  fontFamily="'JetBrains Mono', monospace" opacity="0.85">
              {(36 - i * 2).toFixed(0)}°N
            </text>
          </g>
        ))}
      </g>

      {/* Title overlay */}
      <g transform="translate(40, 60)">
        <text fill={C.fg2} fontSize="11" fontFamily="'DM Sans', sans-serif"
              fontWeight="700" letterSpacing="0.2em">INDIA · STATE ATLAS</text>
        <text y="22" fill={C.fg3} fontSize="9"
              fontFamily="'JetBrains Mono', monospace" opacity="0.95">
          28 states · 8 UTs · ~700 districts
        </text>
      </g>

      {/* Compass */}
      <g transform="translate(940, 100)">
        <circle r="20" fill="none" stroke={C.fg3} strokeWidth="0.75" opacity="0.7"/>
        <circle r="14" fill="none" stroke={C.fg3} strokeWidth="0.5" opacity="0.5"/>
        <path d="M 0,-16 L 5,0 L 0,16 L -5,0 Z" fill="var(--c-h-gold)" opacity="0.9"/>
        <text y="-28" fill={C.fg2} fontSize="10"
              fontFamily="'JetBrains Mono', monospace" textAnchor="middle">N</text>
      </g>

      {status === 'loading' && (
        <g>
          <text x={W/2} y="550" fill={C.fg2} fontSize="13"
                fontFamily="'DM Sans', sans-serif" textAnchor="middle">Loading boundaries…</text>
          <text x={W/2} y="572" fill={C.fg3} fontSize="10"
                fontFamily="'JetBrains Mono', monospace" textAnchor="middle" opacity="0.9">
            fetching state geojson
          </text>
        </g>
      )}

      {status === 'ok' && pathGen && geo.features.map((f, i) => {
        const name = stateNameOf(f.properties);
        const isHover = hovered === name;
        const isSel = selected === name;
        const t = intensityFor(name);
        return (
          <path key={i}
                d={pathGen.path(f)}
                fill={intensityColor(t)}
                stroke={isSel ? 'var(--c-accent-dim)' : isHover ? C.accent : C.borderLight}
                strokeWidth={isSel ? 1.75 : isHover ? 1.2 : 0.6}
                style={{
                  cursor: 'pointer',
                  transition: 'stroke 120ms, stroke-width 120ms',
                  filter: isSel ? 'url(#atlas-glow)' : 'none',
                }}
                onMouseEnter={(e) => onHover?.(name, e)}
                onMouseMove={(e) => onHover?.(name, e)}
                onMouseLeave={() => onHover?.(null)}
                onClick={() => {
                  onSelect?.(name);
                  if (states[name]?.districtKey) onDrillDown?.(name);
                }}
          />
        );
      })}

      {/* Drill-down indicator dots */}
      {status === 'ok' && pathGen && Object.keys(states)
        .filter((n) => states[n].districtKey)
        .map((n, i) => {
          const feat = geo.features.find((f) => stateNameOf(f.properties) === n);
          if (!feat) return null;
          const [cx, cy] = pathGen.centroid(feat);
          return (
            <g key={i} transform={`translate(${cx},${cy})`} style={{ pointerEvents: 'none' }}>
              <circle r="5" fill="var(--c-h-gold)" stroke={C.bg1} strokeWidth="1.5"/>
              <circle r="8" fill="none" stroke="var(--c-h-gold)" strokeWidth="0.75" opacity="0.5"/>
            </g>
          );
        })}

      {/* Fallback: proportional-symbol map */}
      {status === 'fallback' && Object.entries(STATE_CENTROIDS).map(([name, [cx, cy]]) => {
        const t = intensityFor(name);
        const r = 8 + t * 36;
        const isHover = hovered === name;
        const isSel = selected === name;
        return (
          <g key={name} style={{ cursor: 'pointer' }}
             onMouseEnter={(e) => onHover?.(name, e)}
             onMouseMove={(e) => onHover?.(name, e)}
             onMouseLeave={() => onHover?.(null)}
             onClick={() => onSelect?.(name)}>
            <circle cx={cx} cy={cy} r={r + 4} fill={intensityColor(t)} opacity="0.22"/>
            <circle cx={cx} cy={cy} r={r} fill={intensityColor(t)}
                    stroke={isSel ? 'var(--c-accent-dim)' : isHover ? C.accent : C.borderLight}
                    strokeWidth={isSel ? 1.75 : 1}/>
            <text x={cx} y={cy + r + 12} fill={C.fg2} fontSize="9"
                  fontFamily="'JetBrains Mono', monospace" textAnchor="middle" opacity="0.95">
              {name}
            </text>
          </g>
        );
      })}

      <rect x="0" y="0" width={W} height={H} fill="url(#atlas-vignette)" pointerEvents="none"/>
    </svg>
  );
}
