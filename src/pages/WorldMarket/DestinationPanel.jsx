// DestinationPanel.jsx — world destination map + bar chart for selected AP commodity

import { useState } from 'react';
import { COUNTRY_PATHS, W, H } from './mapGeo';
import { CATEGORIES } from '../Atlas/cropData';
import { fmtUsd } from './comtradeDataset';

// ISO 3166-1 numeric codes for every country in ap-exports.json
const NAME_TO_CODE = {
  'Bahrain': 48, 'Bangladesh': 50, 'Belgium': 56, 'Benin': 204,
  'Canada': 124, 'China': 156, 'Djibouti': 262, 'Egypt': 818,
  'France': 250, 'Germany': 276, 'Indonesia': 360, 'Japan': 392,
  'Kenya': 404, 'Malaysia': 458, 'Mexico': 484, 'Myanmar': 104,
  'Nepal': 524, 'Netherlands': 528, 'Pakistan': 586, 'Philippines': 608,
  'Poland': 616, 'Qatar': 634, 'Russia': 643, 'Saudi Arabia': 682,
  'Senegal': 686, 'South Korea': 410, 'Sri Lanka': 144, 'Thailand': 764,
  'Togo': 768, 'Turkey': 792, 'UAE': 784, 'UK': 826, 'USA': 840,
  'Ukraine': 804, 'Vietnam': 704,
};

export default function DestinationPanel({ commodity }) {
  const [hovered, setHovered] = useState(null);

  const cat   = commodity ? CATEGORIES[commodity.category] : null;
  const color = cat?.color || '#2d7a4f';
  const dests = commodity?.destinations || [];
  const max   = dests[0]?.value_usd_m || 1;

  // code → destination lookup
  const codeMap = {};
  dests.forEach(d => {
    const code = NAME_TO_CODE[d.country];
    if (code != null) codeMap[code] = d;
  });

  const hovDest = hovered != null ? (codeMap[hovered] || null) : null;

  if (!commodity) {
    return (
      <div className="wm-dest-panel">
        <div className="wm-dest-empty">
          Select a commodity to see destination markets
        </div>
      </div>
    );
  }

  return (
    <div className="wm-dest-panel">

      {/* Compact header */}
      <div className="wm-dest-head" style={{ padding: '12px 20px 10px', borderBottom: '1px solid rgba(45,18,7,0.1)' }}>
        <div className="wm-dest-commodity-name" style={{ fontSize: 18 }}>{commodity.name}</div>
        <div className="wm-dest-subtitle" style={{ color }}>
          {fmtUsd(commodity.value_usd_m * 1e6)} exports · AP · 2023-24
        </div>
      </div>

      {/* World map */}
      <div className="wm-dest-map-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} className="wm-dest-svg" preserveAspectRatio="xMidYMid meet">
          <rect width={W} height={H} fill="#d4e8f4"/>
          {COUNTRY_PATHS.map(({ code, d }) => {
            const dest  = codeMap[code];
            const isHov = hovered === code;
            return (
              <g key={code}
                onMouseEnter={() => dest && setHovered(code)}
                onMouseLeave={() => setHovered(null)}
              >
                <path d={d}
                  fill={dest ? color : '#c4bfb0'}
                  stroke={isHov ? '#fff' : '#8a8070'}
                  strokeWidth={isHov ? 1.2 : 0.3}
                  style={{ cursor: dest ? 'pointer' : 'default' }}
                />
                {dest && (
                  <path d={d}
                    fill={color}
                    opacity={0.3 + (dest.value_usd_m / max) * 0.6}
                    stroke="none"
                    style={{ pointerEvents: 'none' }}
                  />
                )}
              </g>
            );
          })}
        </svg>

        {hovDest && (
          <div className="wm-dest-map-tip">
            <span className="wm-dest-map-tip-name">{hovDest.country}</span>
            <span className="wm-dest-map-tip-val" style={{ color }}>{fmtUsd(hovDest.value_usd_m * 1e6)}</span>
            <span className="wm-dest-map-tip-pct">{hovDest.share_pct}%</span>
          </div>
        )}
      </div>

      {/* Bar chart */}
      <div className="wm-dest-bars" style={{ padding: '8px 16px 8px', flex: 'none', maxHeight: 220, overflowY: 'auto' }}>
        {dests.map((d) => {
          const w   = Math.max(2, (d.value_usd_m / max) * 100);
          const isH = hovered === NAME_TO_CODE[d.country];
          return (
            <div key={d.country}
              className={`wm-dest-bar-row${isH ? ' wm-dest-bar-row-hov' : ''}`}
              style={{ marginBottom: 10 }}
              onMouseEnter={() => setHovered(NAME_TO_CODE[d.country] ?? null)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="wm-dest-bar-meta" style={{ marginBottom: 4 }}>
                <span className="wm-dest-bar-country" style={{ fontSize: 12 }}>{d.country}</span>
                <span>
                  <span className="wm-dest-bar-val" style={{ color, fontSize: 11 }}>{fmtUsd(d.value_usd_m * 1e6)}</span>
                  <span className="wm-dest-bar-pct" style={{ fontSize: 10 }}>&nbsp;{d.share_pct}%</span>
                </span>
              </div>
              <div className="wm-dest-bar-track">
                <div className="wm-dest-bar-fill" style={{ width: `${w}%`, background: color }} />
              </div>
            </div>
          );
        })}
        <div className="wm-dest-source-note">APEDA AgriExchange · AP · FY 2023-24</div>
      </div>
    </div>
  );
}
