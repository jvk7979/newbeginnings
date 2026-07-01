// IndiaMap.jsx — India state-wise export infographic map
// Pastel choropleth · state labels with commodity + value · Top 5 panel
// Uses same GeoJSON + Mercator projection as the Crop Atlas

import { useState, useEffect, useMemo } from 'react';
import { buildPathGen, stateNameOf } from '../Atlas/geoHelpers';
import { fmtUsd } from './comtradeDataset';

const IW = 500, IH = 580;
const GEO_URL     = `${import.meta.env.BASE_URL}atlas/india-states.geojson`;
const EXPORTS_URL = `${import.meta.env.BASE_URL}data/india-state-exports.json`;

// Soft pastel palette (low saturation, light) — distinct per state
const PALETTE = [
  '#fde8c8','#c8edd8','#fcd0d0','#c8ddf5','#faeac8',
  '#e0cdf5','#c8f0e8','#fdddc8','#ccd5f5','#f5f5c8',
  '#f5c8e0','#c8f5c8','#dcc8f5','#f5d8c8','#c8ecf5',
  '#f0c8f5','#d5f5c8','#f5c8d5','#c8d8f5','#f5eac8',
  '#d0e8f5','#f5d0c8','#c8f5d8','#f5c8f0','#e8f5c8',
  '#fcd8e8','#c8e0f5','#f5f5d0','#d8c8f5','#c8f5e8',
  '#f5e0c8','#d0c8f5','#e8f5d0','#f5c8d8','#c8d0f5',
];

// States large enough to show full 3-line label
const LABEL_FULL = new Set([
  'Gujarat','Rajasthan','Madhya Pradesh','Maharashtra','Uttar Pradesh',
  'Andhra Pradesh','Telangana','Karnataka','Tamil Nadu','Kerala',
  'Odisha','Chhattisgarh','Jharkhand','West Bengal','Punjab',
  'Haryana','Bihar','Assam','Jammu and Kashmir','Ladakh','Arunachal Pradesh',
]);

// States that get a 2-line label (abbr + commodity)
const LABEL_MED = new Set([
  'Himachal Pradesh','Uttarakhand','Sikkim','Meghalaya',
  'Nagaland','Manipur','Tripura','Mizoram','Delhi','Goa',
]);

function fmtCr(cr) {
  if (!cr) return '';
  if (cr >= 100000) return `₹${(cr/100000).toFixed(2).replace(/\.?0+$/,'')}L Cr`;
  if (cr >= 1000)   return `₹${Math.round(cr/100)/10}K Cr`;
  return `₹${cr} Cr`;
}

function catColor(cat) {
  const MAP = {
    cereal:'#e81c1c', spice:'#f07000', livestock:'#0070e8',
    oilseed:'#e8a800', horticulture:'#00a832', fiber:'#8800e8',
  };
  return MAP[cat] || '#e05c2a';
}

const TOP5_COLOURS = ['#f5c518','#c0c0c0','#cd7f32','#4a90d9','#7ac43a'];

export default function IndiaMap({ commodity }) {
  const [geo,     setGeo]     = useState(null);
  const [exports, setExports] = useState(null);
  const [hovered, setHov]     = useState(null);

  useEffect(() => {
    fetch(GEO_URL).then(r => r.json()).then(setGeo).catch(console.error);
    fetch(EXPORTS_URL).then(r => r.json()).then(setExports).catch(console.error);
  }, []);

  const pathGen = useMemo(() => geo ? buildPathGen(geo, IW, IH, 6) : null, [geo]);

  const stateOrder = useMemo(() => {
    if (!geo) return {};
    return Object.fromEntries(
      [...geo.features].map(f => stateNameOf(f.properties)).sort().map((n,i) => [n,i])
    );
  }, [geo]);

  const apColor = commodity ? catColor(commodity.category) : '#e05c2a';

  if (!geo || !pathGen || !exports) {
    return (
      <div className="im-root">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%',
          fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'#888' }}>
          Loading India map…
        </div>
      </div>
    );
  }

  const statesData = exports.states || {};
  const top5       = exports.top5   || [];

  return (
    <div className="im-root">
      {/* Header */}
      <div className="im-header">
        <span className="im-header-state">India · State-wise Exports</span>
        <span className="im-header-sep">·</span>
        <span className="im-header-label">Apr 2023 – Mar 2024</span>
      </div>

      {/* Map + overlay */}
      <div className="im-svg-wrap">
        <svg viewBox={`0 0 ${IW} ${IH}`} className="im-svg" preserveAspectRatio="xMidYMid meet">

          {geo.features.map((f, fi) => {
            const name   = stateNameOf(f.properties);
            const isAP   = name === 'Andhra Pradesh';
            const isHov  = hovered === name;
            const idx    = stateOrder[name] ?? fi;
            const sd     = statesData[name];
            const d      = pathGen.path(f);
            const [cx, cy] = pathGen.centroid(f);
            const labelT = LABEL_FULL.has(name) ? 'full' : LABEL_MED.has(name) ? 'med' : 'tiny';
            const fill   = isAP ? apColor : PALETTE[idx % PALETTE.length];
            const textFill = isAP ? '#fff' : '#2d1a0e';

            return (
              <g key={fi}
                onMouseEnter={() => setHov(name)}
                onMouseLeave={() => setHov(null)}
              >
                <path d={d} fill={fill}
                  stroke={isHov ? '#2d1207' : '#fff'}
                  strokeWidth={isAP ? 1.6 : isHov ? 1.2 : 0.7}
                  style={{ filter: isAP ? 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' : 'none',
                           transition: 'stroke 80ms' }}
                />

                {/* Full label: name + commodity + value */}
                {labelT === 'full' && sd && cx && (
                  <>
                    <text x={cx} y={cy - (isAP ? 10 : 7)} textAnchor="middle"
                      fontSize={isAP ? 9 : 8} fontWeight="700"
                      fill={textFill} fontFamily="'DM Sans',sans-serif"
                      style={{ pointerEvents:'none' }}>
                      {isAP ? 'Andhra Pradesh' : name.replace(' Pradesh','').replace(' Bengal','').replace(' Nadu','').replace('Madhya ','MP–').replace('Uttar ','UP–').replace('West ','W.')}
                    </text>
                    <text x={cx} y={cy + 2} textAnchor="middle"
                      fontSize={isAP ? 7.5 : 6.5}
                      fill={isAP ? 'rgba(255,255,255,0.9)' : '#5a3a1a'}
                      fontFamily="'DM Sans',sans-serif"
                      fontStyle="italic"
                      style={{ pointerEvents:'none' }}>
                      {sd.commodity}
                    </text>
                    {sd.value_cr > 0 && (
                      <text x={cx} y={cy + (isAP ? 12 : 10)} textAnchor="middle"
                        fontSize={isAP ? 7 : 6}
                        fill={isAP ? 'rgba(255,255,255,0.8)' : '#3a2010'}
                        fontFamily="'JetBrains Mono',monospace" fontWeight="700"
                        style={{ pointerEvents:'none' }}>
                        {fmtCr(sd.value_cr)}
                      </text>
                    )}
                  </>
                )}

                {/* Medium label: abbr + commodity */}
                {labelT === 'med' && sd && cx && (
                  <>
                    <text x={cx} y={cy - 2} textAnchor="middle"
                      fontSize="7" fontWeight="700"
                      fill={textFill} fontFamily="'DM Sans',sans-serif"
                      style={{ pointerEvents:'none' }}>
                      {sd.abbr}
                    </text>
                    <text x={cx} y={cy + 6} textAnchor="middle"
                      fontSize="5.5" fill={textFill} opacity="0.75"
                      fontFamily="'DM Sans',sans-serif"
                      style={{ pointerEvents:'none' }}>
                      {sd.commodity.split(' ')[0]}
                    </text>
                  </>
                )}

                {/* Tiny label: abbr only */}
                {labelT === 'tiny' && sd && cx && (
                  <text x={cx} y={cy + 2.5} textAnchor="middle"
                    fontSize="5.5" fontWeight="600"
                    fill={textFill} opacity="0.8"
                    fontFamily="'DM Sans',sans-serif"
                    style={{ pointerEvents:'none' }}>
                    {sd.abbr}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover tooltip */}
        {hovered && statesData[hovered] && (
          <div className="im-tip" style={{ top: 8, left: '50%', transform: 'translateX(-50%)' }}>
            <span style={{ fontWeight:700 }}>{hovered}</span>
            {statesData[hovered].value_cr > 0 && (
              <> · {fmtCr(statesData[hovered].value_cr)}</>
            )}
            {' · '}{statesData[hovered].commodity}
          </div>
        )}

        {/* Top 5 panel */}
        <div className="im-top5">
          <div className="im-top5-head">Top 5 Exporting States</div>
          {top5.map((s, i) => (
            <div key={s.name} className="im-top5-row">
              <span className="im-top5-medal" style={{ background: TOP5_COLOURS[i] }}>{i+1}</span>
              <span className="im-top5-name">{s.name}</span>
              <span className="im-top5-val">{fmtCr(s.value_cr)}</span>
            </div>
          ))}
        </div>

        {/* AP commodity chip */}
        {commodity && (
          <div className="im-ap-chip" style={{ borderColor: apColor, color: apColor }}>
            <span className="im-ap-chip-name">{commodity.name}</span>
            <span className="im-ap-chip-val">{fmtUsd(commodity.value_usd_m * 1e6)}</span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="im-legend">
        <span className="im-legend-dot" style={{ background: apColor }}/>
        <span className="im-legend-text">
          Andhra Pradesh highlighted · {commodity ? commodity.name : 'select a commodity'}
          {' · '}Source: Ministry of Commerce & Industry
        </span>
      </div>
    </div>
  );
}
