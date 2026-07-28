// DestinationPanel.jsx — Andhra Pradesh export flows for the selected commodity.
//
// Arcs curve from Andhra Pradesh out to every destination country, weighted by
// export value with a flowing pulse toward the buyer — the same Trade Flows
// language as the World tab, coloured by the commodity's category. A ranked
// bar list sits below. Fully theme-token driven (Monsoon / Delta).

import { useState } from 'react';
import { COUNTRY_PATHS, W, H, CENTROIDS, arcPath, starPath, project } from './mapGeo';
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

// Andhra Pradesh origin — coastal AP (near Rajahmundry / Kakinada).
const [AP_X, AP_Y] = project(81.5, 16.5);
const AP = { x: AP_X, y: AP_Y };

export default function DestinationPanel({ commodity }) {
  const [hovered, setHovered] = useState(null);

  const cat   = commodity ? CATEGORIES[commodity.category] : null;
  const color = cat?.color || 'var(--c-accent)';
  const dests = commodity?.destinations || [];
  const max   = dests[0]?.value_usd_m || 1;

  if (!commodity) {
    return (
      <div className="wm-dest-panel">
        <div className="wm-dest-empty">Select a commodity to see its export flows</div>
      </div>
    );
  }

  // Arc per destination that maps to a country centroid.
  const arcs = dests.map(dst => {
    const code = NAME_TO_CODE[dst.country];
    const c = code != null ? CENTROIDS[code] : null;
    if (!c) return null;
    const { d, dist } = arcPath(AP, c);
    const t = Math.pow(dst.value_usd_m / max, 0.5);
    return {
      country: dst.country, code, value: dst.value_usd_m, share: dst.share_pct,
      d, x: c.x, y: c.y, w: 1.2 + t * 6, r: 2.4 + t * 5, dur: (0.9 + dist / 900).toFixed(2),
    };
  }).filter(Boolean);

  const hov = hovered != null ? arcs.find(a => a.code === hovered) : null;

  return (
    <div className="wm-dest-panel">
      {/* Compact header */}
      <div className="wm-dest-head" style={{ padding: '12px 20px 10px', borderBottom: '1px solid var(--c-border)' }}>
        <div className="wm-dest-commodity-name" style={{ fontSize: 18 }}>{commodity.name}</div>
        <div className="wm-dest-subtitle" style={{ color }}>
          {fmtUsd(commodity.value_usd_m * 1e6)} exports · AP · 2023-24
        </div>
      </div>

      {/* Flow map */}
      <div className="wm-dest-map-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} className="wm-dest-svg" preserveAspectRatio="xMidYMid meet">
          <rect width={W} height={H} className="la-ocean" />
          {COUNTRY_PATHS.map(({ code, d }, i) => (
            <path key={i} d={d} className={`lf-land${code === 356 ? ' lf-land-india' : ''}`} />
          ))}
          <g>
            {arcs.map(a => {
              const hot = hovered === a.code;
              return (
                <g key={a.code} className={`lf-arc${hot ? ' hot' : ''}`}
                   onMouseEnter={() => setHovered(a.code)} onMouseLeave={() => setHovered(null)}>
                  <path className="lf-arc-hit" d={a.d} />
                  <path className="lf-arc-base" d={a.d} strokeWidth={a.w} style={{ stroke: color }} />
                  <path className="lf-arc-flow" d={a.d} strokeWidth={Math.max(1.2, a.w * 0.6)} style={{ animationDuration: `${a.dur}s` }} />
                  <circle className="lf-node" cx={a.x} cy={a.y} r={a.r} style={{ fill: color }} />
                </g>
              );
            })}
          </g>
          <g className="lf-hub" aria-hidden="true">
            <circle className="lf-hub-ring" cx={AP.x} cy={AP.y} r={10} />
            <path className="lf-hub-star" d={starPath(AP.x, AP.y, 9, 5)} />
            <text className="lf-hub-label" x={AP.x} y={AP.y + 22} textAnchor="middle">AP</text>
          </g>
          {hov && (() => {
            const anchor = hov.x > AP.x ? 'start' : 'end';
            const tx = hov.x + (hov.x > AP.x ? 9 : -9);
            return (
              <g style={{ pointerEvents: 'none' }}>
                <text className="lf-tip-name" x={tx} y={hov.y - 3} textAnchor={anchor}>{hov.country}</text>
                <text className="lf-tip-val" x={tx} y={hov.y + 9} textAnchor={anchor} style={{ fill: color }}>{fmtUsd(hov.value * 1e6)} · {hov.share}%</text>
              </g>
            );
          })()}
        </svg>
      </div>

      {/* Ranked destinations */}
      <div className="wm-dest-bars" style={{ padding: '8px 16px 8px', flex: 'none', maxHeight: 220, overflowY: 'auto' }}>
        {dests.map((d) => {
          const w   = Math.max(2, (d.value_usd_m / max) * 100);
          const isH = hovered === NAME_TO_CODE[d.country];
          return (
            <div key={d.country}
              className={`wm-dest-bar-row${isH ? ' wm-dest-bar-row-hov' : ''}`}
              style={{ marginBottom: 10 }}
              onMouseEnter={() => setHovered(NAME_TO_CODE[d.country] ?? null)}
              onMouseLeave={() => setHovered(null)}>
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
