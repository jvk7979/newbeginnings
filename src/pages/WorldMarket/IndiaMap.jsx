// IndiaMap.jsx — India states SVG choropleth
// Uses the same GeoJSON + Mercator projection as the Crop Atlas for identical borders
// AP highlighted in commodity colour · other states in distinct vibrant colours

import { useState, useEffect, useMemo } from 'react';
import { buildPathGen, stateNameOf } from '../Atlas/geoHelpers';
import { fmtUsd } from './comtradeDataset';

const IW = 500, IH = 580;

// Same GeoJSON as the Crop Atlas — official Survey of India boundaries
const DATA_URL = `${import.meta.env.BASE_URL}atlas/india-states.geojson`;

// Vibrant distinct fills for each state (by sorted alpha index)
const PALETTE = [
  '#f4a236','#4db87a','#e05c5c','#4a90d9','#c47f2a',
  '#9b59d4','#2bbfa0','#e8742a','#5b7fd4','#c4c420',
  '#e05a9b','#3ab84a','#a048d4','#e8943a','#3ab8d4',
  '#d448b8','#7ac43a','#e8436a','#3a7ad4','#d4b820',
  '#6ab83a','#e843b8','#3ab888','#c448e8','#e87a3a',
  '#3ad4d4','#e85a5a','#7a5ad4','#d4d420','#3ab86a',
  '#e8743a','#4a7ad4','#a8d43a','#e8436a','#8a3ad4',
];

function catColor(cat) {
  const MAP = {
    cereal:      '#e81c1c',
    spice:       '#f07000',
    livestock:   '#0070e8',
    oilseed:     '#e8a800',
    horticulture:'#00a832',
    fiber:       '#8800e8',
  };
  return MAP[cat] || '#e05c2a';
}

export default function IndiaMap({ commodity, onStateClick }) {
  const [geo,     setGeo]  = useState(null);
  const [hovered, setHov]  = useState(null);
  const [tip,     setTip]  = useState(null);

  useEffect(() => {
    fetch(DATA_URL).then(r => r.json()).then(setGeo).catch(console.error);
  }, []);

  // Mercator path generator — same as Crop Atlas (padding 6)
  const pathGen = useMemo(() => geo ? buildPathGen(geo, IW, IH, 6) : null, [geo]);

  // Alphabetical sort for consistent palette assignment
  const stateOrder = useMemo(() => {
    if (!geo) return {};
    return Object.fromEntries(
      [...geo.features]
        .map(f => stateNameOf(f.properties))
        .sort()
        .map((name, i) => [name, i])
    );
  }, [geo]);

  const color = commodity ? catColor(commodity.category) : '#e05c2a';

  if (!geo || !pathGen) {
    return (
      <div className="im-root">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%',
          fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'#888' }}>
          Loading India map…
        </div>
      </div>
    );
  }

  return (
    <div className="im-root">
      {/* Header */}
      <div className="im-header">
        <span className="im-header-state">Andhra Pradesh</span>
        <span className="im-header-sep">·</span>
        <span className="im-header-label">India's Agri-Export Powerhouse</span>
      </div>

      {/* SVG Map */}
      <div className="im-svg-wrap">
        <svg viewBox={`0 0 ${IW} ${IH}`} className="im-svg" preserveAspectRatio="xMidYMid meet">
          {geo.features.map((f, fi) => {
            const name  = stateNameOf(f.properties);
            const isAP  = name === 'Andhra Pradesh';
            const isHov = hovered === name;
            const idx   = stateOrder[name] ?? fi;
            const d     = pathGen.path(f);
            const cen   = pathGen.centroid(f);

            return (
              <g key={fi}
                onMouseEnter={e => { setHov(name); setTip({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY, name }); }}
                onMouseMove={e  => setTip({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY, name })}
                onMouseLeave={() => { setHov(null); setTip(null); }}
                onClick={() => isAP && onStateClick?.()}
                style={{ cursor: isAP ? 'pointer' : 'default' }}
              >
                <path
                  d={d}
                  fill={isAP ? color : PALETTE[idx % PALETTE.length]}
                  stroke="#fff"
                  strokeWidth={isAP ? 2.2 : 1.0}
                  opacity={isHov && !isAP ? 0.75 : 1}
                  style={{ filter: isAP ? 'drop-shadow(0 3px 10px rgba(0,0,0,0.35))' : 'none',
                           transition: 'opacity 100ms' }}
                />
                {isAP && cen && (
                  <text x={cen[0]} y={cen[1]}
                    textAnchor="middle" dominantBaseline="middle"
                    fill="#fff" fontWeight="700" fontSize="11"
                    fontFamily="'DM Sans',sans-serif"
                    style={{ pointerEvents:'none' }}>
                    Andhra Pradesh
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {tip && (
          <div className="im-tip" style={{ left: tip.x + 12, top: tip.y - 8 }}>
            {tip.name}
          </div>
        )}

        {commodity && (
          <div className="im-ap-chip" style={{ borderColor: color, color }}>
            <span className="im-ap-chip-name">{commodity.name}</span>
            <span className="im-ap-chip-val">{fmtUsd(commodity.value_usd_m * 1e6)}</span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="im-legend">
        <span className="im-legend-dot" style={{ background: color }}/>
        <span className="im-legend-text">
          Andhra Pradesh {commodity ? `· ${commodity.name}` : '· Select a commodity'}
        </span>
      </div>
    </div>
  );
}
