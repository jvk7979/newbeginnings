// src/pages/Atlas/IndiaMap.jsx
import { useEffect, useMemo, useState, memo } from 'react';
import { C } from '../../tokens';
import { STATE_CENTROIDS } from './cropData';
import { useMapZoom, ZoomControls } from './MapZoom';
import {
  buildPathGen, fetchGeoJSON, STATE_GEOJSON_URLS,
  stateNameOf, intensityColor, computeStateMetric,
} from './geoHelpers';

// StatePath — per-state SVG <path> wrapped in React.memo so a hover
// event that only changes one state's `isHover` prop doesn't reconcile
// the other ~700 state paths. Default shallow-compare works because:
//   - String / boolean / number primitives compared by value
//   - Callbacks are stable from useCallback in the parent
//   - We pre-resolve fill / aria-label / d to primitives so the parent
//     doesn't recompute them per render
// Without this, every mousemove inside an SVG path reconciled the whole
// choropleth — visible as jank on slow connections + iPad.
const StatePath = memo(function StatePath({
  d, fill, stroke, strokeWidth, name, ariaLabel, isSel, onActivate, onHoverEnter, onHoverLeave,
}) {
  return (
    <path
      d={d}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      style={{
        cursor: 'pointer',
        transition: 'stroke 120ms',
        filter: isSel ? 'url(#atlas-glow)' : 'none',
      }}
      onMouseEnter={onHoverEnter}
      onMouseMove={onHoverEnter}
      onMouseLeave={onHoverLeave}
      onFocus={onHoverEnter}
      onBlur={onHoverLeave}
      onClick={onActivate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onActivate();
        }
      }}
    />
  );
});

const W = 1000, H = 1100;

// Stable callback factories — `useCallback`-wrap per state by closing
// over its name. Caching keyed on state name + the parent callback
// identity so we don't churn the StatePath memo on every render of
// the parent.
function useStablePathCallbacks(states, onHover, onSelect, onDrillDown) {
  return useMemo(() => {
    const cache = {};
    Object.keys(states || {}).forEach(name => {
      const hasDrill = !!states[name]?.districtKey;
      cache[name] = {
        onHoverEnter: (e) => onHover?.(name, e),
        onHoverLeave: () => onHover?.(null),
        onActivate:   () => {
          onSelect?.(name);
          if (hasDrill) onDrillDown?.(name);
        },
      };
    });
    return cache;
  }, [states, onHover, onSelect, onDrillDown]);
}

export default function IndiaMap({ filter, states, hovered, selected, onHover, onSelect, onDrillDown, year }) {
  const stableCbs = useStablePathCallbacks(states, onHover, onSelect, onDrillDown);

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

  // Smaller padding → India fills more of the canvas (less cream margin).
  const pathGen = useMemo(() => (geo ? buildPathGen(geo, W, H, 6) : null), [geo]);

  // Zoom + pan. `resetKey` is constant here ('india'); switching to the AP
  // view unmounts this component, so a fresh mount already resets state.
  // The map area is CSS-capped to the viewBox's own aspect ratio, so at the
  // default 1× zoom India already fills the area with no letterbox and
  // nothing is clipped; the user can still zoom/pan in from there.
  const z = useMapZoom({ viewW: W, viewH: H, resetKey: 'india' });

  return (
    <>
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet"
         {...z.svgHandlers}
         style={{ width: '100%', height: '100%', display: 'block', ...z.svgHandlers.style }}>
      <defs>
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

      {/* Title overlay */}
      <g transform="translate(40, 56)">
        <text fill={C.fg2} fontSize="11" fontFamily="'DM Sans', sans-serif"
              fontWeight="700" letterSpacing="0.2em">INDIA · STATE ATLAS</text>
        <text y="20" fill={C.fg3} fontSize="9" letterSpacing="0.08em"
              fontFamily="'JetBrains Mono', monospace" opacity="0.95">
          28 STATES · 8 UTS · 29 REGIONS
        </text>
        <text y="34" fill={C.fg3} fontSize="9" letterSpacing="0.08em"
              fontFamily="'JetBrains Mono', monospace" opacity="0.8">
          FY {year || '2024-25'} · APEDA-ALIGNED
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

      {/* Zoom/pan layer — wraps every geographic element so +/−/wheel/drag
          scale the map while the title and compass chrome stay fixed. */}
      <g role="group" aria-label="India state choropleth — keyboard navigable" transform={z.transform}>
        {status === 'ok' && pathGen && geo.features.map((f, i) => {
          const name = stateNameOf(f.properties);
          const isHover = hovered === name;
          const isSel = selected === name;
          const t = intensityFor(name);
          const hasDrill = !!states[name]?.districtKey;
          const cbs = stableCbs[name] || stableCbs[name] || {};
          return (
            <StatePath
              key={i}
              name={name}
              d={pathGen.path(f)}
              fill={intensityColor(t)}
              stroke={isSel ? 'var(--c-accent-dim)' : isHover ? C.accent : C.borderLight}
              strokeWidth={(isSel ? 1.75 : isHover ? 1.2 : 0.6) / z.zoom}
              ariaLabel={hasDrill ? `${name} — press Enter to drill down to districts` : name}
              isSel={isSel}
              onActivate={cbs.onActivate}
              onHoverEnter={cbs.onHoverEnter}
              onHoverLeave={cbs.onHoverLeave}
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
              <g key={i} transform={`translate(${cx},${cy}) scale(${1 / z.zoom})`} style={{ pointerEvents: 'none' }}>
                <circle r="5" fill="var(--c-h-gold)" stroke={C.bg1} strokeWidth="1.5"/>
                <circle r="8" fill="none" stroke="var(--c-h-gold)" strokeWidth="0.75" opacity="0.5"/>
              </g>
            );
          })}

        {/* Fallback: proportional-symbol map — same keyboard contract as
            the choropleth above. */}
        {status === 'fallback' && Object.entries(STATE_CENTROIDS).map(([name, [cx, cy]]) => {
          const t = intensityFor(name);
          const r = 8 + t * 36;
          const isHover = hovered === name;
          const isSel = selected === name;
          return (
            <g key={name}
               role="button"
               tabIndex={0}
               aria-label={name}
               style={{ cursor: 'pointer' }}
               onMouseEnter={(e) => onHover?.(name, e)}
               onMouseMove={(e) => onHover?.(name, e)}
               onMouseLeave={() => onHover?.(null)}
               onFocus={(e) => onHover?.(name, e)}
               onBlur={() => onHover?.(null)}
               onClick={() => onSelect?.(name)}
               onKeyDown={(e) => {
                 if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect?.(name); }
               }}>
              <circle cx={cx} cy={cy} r={r + 4} fill={intensityColor(t)} opacity="0.22"/>
              <circle cx={cx} cy={cy} r={r} fill={intensityColor(t)}
                      stroke={isSel ? 'var(--c-accent-dim)' : isHover ? C.accent : C.borderLight}
                      strokeWidth={(isSel ? 1.75 : 1) / z.zoom}/>
              <text x={cx} y={cy + r + 12} fill={C.fg2} fontSize={9 / z.zoom}
                    fontFamily="'JetBrains Mono', monospace" textAnchor="middle" opacity="0.95">
                {name}
              </text>
            </g>
          );
        })}
      </g>

      <rect x="0" y="0" width={W} height={H} fill="url(#atlas-vignette)" pointerEvents="none"/>
    </svg>
    <ZoomControls
      onZoomIn={z.zoomIn} onZoomOut={z.zoomOut} onReset={z.reset}
      canZoomIn={z.canZoomIn} canZoomOut={z.canZoomOut} isZoomed={z.isZoomed}/>
    </>
  );
}
