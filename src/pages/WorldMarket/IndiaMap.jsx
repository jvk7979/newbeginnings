// IndiaMap.jsx — India states SVG choropleth
// AP highlighted in commodity colour · other states in distinct pastels

import { useState, useEffect, useMemo } from 'react';
import { fmtUsd } from './comtradeDataset';

const IW = 500, IH = 580;
const LNG_MIN = 68, LNG_MAX = 98;
const LAT_MIN = 7,  LAT_MAX = 38;

const DATA_URL = `${import.meta.env.BASE_URL || '/'}data/india-states.json`;

// Distinct pastel fills for each state (by sorted index → consistent colour)
const PALETTE = [
  '#f9d5a7','#b8e4c9','#f4b8b8','#b8d4f4','#e4d5b8',
  '#d4b8f4','#b8f4e4','#f4d8b8','#b8c4f4','#f4f4b8',
  '#f4b8d4','#b8f4b8','#d8b8f4','#f4c8b8','#b8e8f4',
  '#e8b8f4','#c8f4b8','#f4b8c8','#b8d8f4','#f4e8b8',
  '#d4f4b8','#f4b8e8','#b8f4d4','#e4b8f4','#f4d4b8',
  '#b8f4f4','#f4b8b8','#c4b8f4','#f4f4c8','#b8e4b8',
  '#f4c4b8','#b8c8f4','#e8f4b8','#f4b8c4','#c8b8f4',
];

// Simple equirectangular projection for India's bounding box
function project(lng, lat) {
  return [
    ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * IW,
    ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * IH,
  ];
}

function ringToPath(ring) {
  let d = '';
  for (let i = 0; i < ring.length; i++) {
    const [x, y] = project(ring[i][0], ring[i][1]);
    d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
  }
  return d + 'Z';
}

function geomToPath(geom) {
  if (!geom) return '';
  if (geom.type === 'Polygon')
    return geom.coordinates.map(ringToPath).join(' ');
  if (geom.type === 'MultiPolygon')
    return geom.coordinates.flatMap(r => r.map(ringToPath)).join(' ');
  return '';
}

// Centroid of a ring (for label placement)
function ringCentroid(ring) {
  let lngSum = 0, latSum = 0;
  for (const [lng, lat] of ring) { lngSum += lng; latSum += lat; }
  return [lngSum / ring.length, latSum / ring.length];
}

function featureCentroid(geom) {
  if (!geom) return null;
  const ring = geom.type === 'Polygon'
    ? geom.coordinates[0]
    : geom.coordinates.sort((a,b) => b[0].length - a[0].length)[0][0];
  const [lng, lat] = ringCentroid(ring);
  return project(lng, lat);
}

export default function IndiaMap({ commodity, onStateClick }) {
  const [geo, setGeo]     = useState(null);
  const [hovered, setHov] = useState(null);
  const [tip, setTip]     = useState(null); // {x,y,name}

  useEffect(() => {
    fetch(DATA_URL)
      .then(r => r.json())
      .then(setGeo)
      .catch(console.error);
  }, []);

  const stateOrder = useMemo(() => {
    if (!geo) return {};
    return Object.fromEntries(
      [...geo.features].sort((a,b) => a.properties.name.localeCompare(b.properties.name))
        .map((f,i) => [f.properties.name, i])
    );
  }, [geo]);

  const cat   = commodity?.category;
  const color = cat ? catColor(cat) : '#e05c2a';

  if (!geo) {
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
            const name  = f.properties.name;
            const isAP  = name === 'Andhra Pradesh';
            const isHov = hovered === name;
            const idx   = stateOrder[name] ?? fi;
            const d     = geomToPath(f.geometry);
            const cen   = featureCentroid(f.geometry);

            return (
              <g key={name}
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
                  strokeWidth={isAP ? 1.8 : 0.8}
                  opacity={isHov && !isAP ? 0.8 : 1}
                  style={{ filter: isAP ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.25))' : 'none',
                           transition: 'opacity 100ms' }}
                />
                {/* AP label */}
                {isAP && cen && (
                  <text x={cen[0]} y={cen[1]}
                    textAnchor="middle" dominantBaseline="middle"
                    fill="#fff" fontWeight="700"
                    fontSize="10" fontFamily="'DM Sans',sans-serif"
                    style={{ pointerEvents:'none', textShadow:'0 1px 2px rgba(0,0,0,0.4)' }}>
                    Andhra Pradesh
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover tooltip */}
        {tip && (
          <div className="im-tip" style={{ left: tip.x + 12, top: tip.y - 8 }}>
            {tip.name}
          </div>
        )}

        {/* AP commodity chip */}
        {commodity && (
          <div className="im-ap-chip" style={{ borderColor: color, color }}>
            <span className="im-ap-chip-name">{commodity.name}</span>
            <span className="im-ap-chip-val">{fmtUsd(commodity.value_usd_m * 1e6)}</span>
          </div>
        )}
      </div>

      {/* Legend row */}
      <div className="im-legend">
        <span className="im-legend-dot" style={{ background: color }}/>
        <span className="im-legend-text">Andhra Pradesh {commodity ? `· ${commodity.name}` : '· Select a commodity'}</span>
      </div>
    </div>
  );
}

// Commodity category → colour (same as Atlas)
function catColor(cat) {
  const MAP = {
    cereal:'#c0392b', spice:'#e67e22', livestock:'#2980b9',
    oilseed:'#f39c12', horticulture:'#27ae60', fiber:'#8e44ad',
  };
  return MAP[cat] || '#e05c2a';
}
