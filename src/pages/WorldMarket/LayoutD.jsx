// Layout D — Map + Treemap
// Map takes top 55% · proportional treemap fills the bottom 45%
// Each country box = area proportional to export value · click to highlight both

import { useState } from 'react';
import { COUNTRY_PATHS, W, H } from './mapGeo';
import { fmtUsd } from './comtradeDataset';

const HUES = [350, 25, 195, 130, 270, 45, 165, 310, 80, 10];

function fill(code, t) {
  if (t == null) return '#e8e0d0';
  return `hsl(${HUES[code % 10]},${45 + t * 25}%,${68 - t * 28}%)`;
}

// Simple strip treemap: lays countries row by row, each row ~same total value
function buildTreemap(items, containerW, containerH) {
  if (!items.length) return [];
  const total = items.reduce((s, p) => s + p.value_usd, 0);
  const rows = [];
  let remaining = [...items];
  let usedH = 0;

  while (remaining.length > 0 && usedH < containerH - 2) {
    // Fill a row: keep adding items until adding one more would exceed the target row value
    const rowH = Math.max(32, (containerH - usedH) / Math.ceil(remaining.length / 5));
    const rowTarget = (rowH / containerH) * total;
    let rowSum = 0;
    let rowItems = [];
    for (let i = 0; i < remaining.length; i++) {
      rowSum += remaining[i].value_usd;
      rowItems.push(remaining[i]);
      if (rowSum >= rowTarget && rowItems.length >= 2) break;
    }
    // Assign widths proportional within the row
    const cells = rowItems.map(p => ({
      ...p,
      x: 0, y: usedH,
      w: Math.round((p.value_usd / rowSum) * containerW),
      h: Math.round(rowH),
    }));
    // Fix rounding: adjust last cell
    let xCursor = 0;
    cells.forEach((c, i) => {
      c.x = xCursor;
      if (i === cells.length - 1) c.w = containerW - xCursor;
      xCursor += c.w;
    });
    rows.push(...cells);
    usedH += Math.round(rowH);
    remaining = remaining.slice(rowItems.length);
  }
  return rows;
}

const TM_W = 960;
const TM_H = 280;

export default function LayoutD({ partnerData, topPartners }) {
  const [selected, setSelected] = useState(null);
  const maxVal = topPartners[0]?.value_usd || 1;
  const total  = topPartners.reduce((s, p) => s + p.value_usd, 0);
  const selP   = selected ? partnerData?.[selected] : null;
  const selRank = selected ? topPartners.findIndex(p => p.code === selected) + 1 : null;

  const top30 = topPartners.slice(0, 30);
  const cells = buildTreemap(top30, TM_W, TM_H);

  function pick(code) { setSelected(code === selected ? null : code); }

  return (
    <div className="ld-root">
      {/* ── Map (top section) ── */}
      <div className="ld-map-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} className="ld-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <pattern id="ld-hatch" width="6" height="6" patternUnits="userSpaceOnUse">
              <path d="M-1,1 l2,-2 M0,6 l6,-6 M5,7 l2,-2" stroke="rgba(0,0,0,0.14)" strokeWidth="1.1" fill="none"/>
            </pattern>
          </defs>
          <rect width={W} height={H} fill="#f0e8d8"/>
          {COUNTRY_PATHS.map(({ code, d }) => {
            const pd  = partnerData?.[code];
            const t   = pd ? Math.pow(pd.value_usd / maxVal, 0.38) : null;
            const isP = t != null;
            const isSel = selected === code;
            return (
              <g key={code}>
                <path d={d} fill={fill(code, t)} stroke="#2d1207"
                  strokeWidth={isSel ? 1.6 : 0.3}
                  style={{ cursor: isP ? 'pointer' : 'default' }}
                  onClick={() => isP && pick(code)}/>
                {isP && <path d={d} fill="url(#ld-hatch)" stroke="none"
                  style={{ pointerEvents: 'none', opacity: isSel ? 0.8 : 0.45 }}/>}
              </g>
            );
          })}
        </svg>

        {/* Selected info overlay on map */}
        {selP && (
          <div className="ld-map-info">
            <span className="ld-map-info-name">{selP.name}</span>
            <span className="ld-map-info-sep">·</span>
            <span className="ld-map-info-rank">#{selRank}</span>
            <span className="ld-map-info-sep">·</span>
            <span className="ld-map-info-val">{fmtUsd(selP.value_usd)}</span>
            <button className="ld-map-info-clear" onClick={() => setSelected(null)}>✕</button>
          </div>
        )}
      </div>

      {/* ── Treemap (bottom section) ── */}
      <div className="ld-tree-wrap">
        <div className="ld-tree-label">Export Value Treemap — Top 30 Markets · size = value</div>
        <svg viewBox={`0 0 ${TM_W} ${TM_H}`} className="ld-tree-svg" preserveAspectRatio="none">
          {cells.map((c, i) => {
            const isSel = selected === c.code;
            const hue = HUES[c.code % 10];
            const lightness = 35 + (i / cells.length) * 25;
            const share = (c.value_usd / total * 100).toFixed(1);
            const showLabel = c.w > 60 && c.h > 28;
            const showVal   = c.w > 80 && c.h > 46;
            return (
              <g key={c.code} onClick={() => pick(c.code)} style={{ cursor: 'pointer' }}>
                <rect
                  x={c.x + 1} y={c.y + 1}
                  width={Math.max(0, c.w - 2)} height={Math.max(0, c.h - 2)}
                  fill={`hsl(${hue},${isSel ? 65 : 52}%,${isSel ? 38 : lightness}%)`}
                  rx="3"
                  style={{ transition: 'fill 150ms' }}
                />
                {isSel && (
                  <rect x={c.x + 1} y={c.y + 1}
                    width={Math.max(0, c.w - 2)} height={Math.max(0, c.h - 2)}
                    fill="none" stroke="white" strokeWidth="2" rx="3"/>
                )}
                {showLabel && (
                  <text x={c.x + 8} y={c.y + 16}
                    fill="rgba(255,255,255,0.92)" fontSize="11" fontWeight="600"
                    fontFamily="'DM Sans', sans-serif"
                    style={{ pointerEvents: 'none' }}>
                    {c.name.split(' ')[0]}
                  </text>
                )}
                {showVal && (
                  <text x={c.x + 8} y={c.y + 30}
                    fill="rgba(255,255,255,0.65)" fontSize="9"
                    fontFamily="'JetBrains Mono', monospace"
                    style={{ pointerEvents: 'none' }}>
                    {fmtUsd(c.value_usd)} · {share}%
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
