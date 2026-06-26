// Concept C — "Trade Flows"
// Left 60%: world map — all neutral grey, import partners in teal intensity.
// Right 40%: live SVG Sankey-style flow chart — India → top countries.
// Hover/click on map syncs with the flow panel and vice versa.

import { useState, useMemo } from 'react';
import { COUNTRY_PATHS, W, H } from './mapGeo';
import { fmtUsd } from './comtradeDataset';

const TEAL_HUE = 185;

function tealFill(t) {
  if (t == null) return '#dde3e8';
  const sat = 55 + t * 25;
  const lig = 72 - t * 42;  // 72% → 30%
  return `hsl(${TEAL_HUE},${sat}%,${lig}%)`;
}

// Simple Sankey layout constants
const SK_W = 360, SK_H = 480;
const SK_INDIA_X = 28, SK_INDIA_W = 72, SK_INDIA_Y = 200, SK_INDIA_H = 80;
const SK_COUNTRY_X = 260, SK_COUNTRY_W = 78;
const SK_TOP = 24, SK_SPACING = 40;

export default function ConceptC({ partnerData, topPartners }) {
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered]   = useState(null);

  const maxVal = useMemo(() => topPartners.length ? topPartners[0].value_usd : 1, [topPartners]);
  const total  = useMemo(() => topPartners.reduce((s, p) => s + p.value_usd, 0), [topPartners]);

  const topN = topPartners.slice(0, 10);

  // Country nodes in the Sankey panel
  const nodes = useMemo(() => topN.map((p, i) => {
    const cy = SK_TOP + i * SK_SPACING + SK_SPACING / 2;
    const barH = Math.max(6, (p.value_usd / maxVal) * 32);
    return { ...p, cy, barH };
  }), [topN, maxVal]);

  // Bezier path from India node right-edge to country node left-edge
  function flowPath(cy) {
    const x1 = SK_INDIA_X + SK_INDIA_W;
    const y1 = SK_INDIA_Y + SK_INDIA_H / 2;
    const x2 = SK_COUNTRY_X;
    const cp = (x1 + x2) / 2;
    return `M${x1},${y1} C${cp},${y1} ${cp},${cy} ${x2},${cy}`;
  }

  return (
    <div className="cc-root">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="cc-header">
        <div className="cc-header-left">
          <div className="cc-eyebrow">India · Agricultural Exports · 2025</div>
          <div className="cc-title">Trade <em>Flows</em></div>
        </div>
        <div className="cc-kpis">
          <div className="cc-kpi"><span className="cc-kpi-val">{fmtUsd(total)}</span><span className="cc-kpi-lab">Total Exports</span></div>
          <div className="cc-kpi"><span className="cc-kpi-val">{topPartners.length}</span><span className="cc-kpi-lab">Markets</span></div>
          {topPartners[0] && <div className="cc-kpi"><span className="cc-kpi-val">{topPartners[0].name}</span><span className="cc-kpi-lab">Top Importer</span></div>}
        </div>
        <div className="cc-concept-badge">Concept C — Trade Flows</div>
      </div>

      {/* ── Body ─────────────────────────────────────────────── */}
      <div className="cc-body">
        {/* ── Map pane ─────────── */}
        <div className="cc-map-col">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="xMidYMid meet"
            className="cc-svg"
          >
            <rect width={W} height={H} fill="#f4f7f9"/>
            {COUNTRY_PATHS.map(({ code, d }) => {
              const pd = partnerData?.[code];
              const t  = pd ? Math.pow(pd.value_usd / maxVal, 0.4) : null;
              const fill = tealFill(t);
              const isPartner = t != null;
              const isSel = selected === code;
              const isHov = hovered === code;
              return (
                <path
                  key={code} d={d} fill={fill}
                  stroke={isSel ? `hsl(${TEAL_HUE},75%,30%)` : isHov ? `hsl(${TEAL_HUE},60%,40%)` : '#b0bec5'}
                  strokeWidth={isSel ? 1.2 : isHov ? 0.8 : 0.35}
                  style={{
                    cursor: isPartner ? 'pointer' : 'default',
                    transition: 'fill 150ms, stroke-width 100ms',
                    filter: isSel ? `drop-shadow(0 0 4px hsl(${TEAL_HUE},70%,45%))` : undefined,
                  }}
                  onClick={() => isPartner && setSelected(code === selected ? null : code)}
                  onMouseEnter={() => setHovered(code)}
                  onMouseLeave={() => setHovered(null)}
                />
              );
            })}
          </svg>
          <div className="cc-map-legend">
            <div className="cc-legend-label">Export value</div>
            <svg width="120" height="12" style={{ display: 'block' }}>
              <defs>
                <linearGradient id="cc-leg-grad">
                  <stop offset="0%" stopColor={`hsl(${TEAL_HUE},55%,72%)`}/>
                  <stop offset="100%" stopColor={`hsl(${TEAL_HUE},80%,30%)`}/>
                </linearGradient>
              </defs>
              <rect width="120" height="10" rx="2" fill="url(#cc-leg-grad)"/>
            </svg>
            <div className="cc-legend-ends"><span>Low</span><span>High</span></div>
          </div>
          <div className="cc-attribution">Source: APEDA AgriExchange / DGFT</div>
        </div>

        {/* ── Sankey flow pane ─── */}
        <div className="cc-sankey-col">
          <div className="cc-sankey-head">
            <div className="cc-sankey-eye">FLOW CHART</div>
            <div className="cc-sankey-title">India → Top 10 Importers</div>
          </div>
          <svg
            viewBox={`0 0 ${SK_W} ${SK_H}`}
            preserveAspectRatio="xMidYMid meet"
            className="cc-sankey-svg"
          >
            {/* Flow paths */}
            {nodes.map((p, i) => {
              const t = p.value_usd / maxVal;
              const isSel = selected === p.code;
              const isHov = hovered === p.code;
              const sw = Math.max(1.5, t * 18);
              const sat = isSel ? 80 : 55;
              const lig = isSel ? 35 : 50;
              const alpha = isSel ? 0.9 : isHov ? 0.75 : 0.45;
              return (
                <path
                  key={p.code}
                  d={flowPath(p.cy)}
                  fill="none"
                  stroke={`hsla(${TEAL_HUE},${sat}%,${lig}%,${alpha})`}
                  strokeWidth={sw}
                  strokeLinecap="round"
                  className="cc-flow-path"
                  style={{ '--i': i, cursor: 'pointer' }}
                  onClick={() => setSelected(p.code === selected ? null : p.code)}
                  onMouseEnter={() => setHovered(p.code)}
                  onMouseLeave={() => setHovered(null)}
                />
              );
            })}

            {/* India source node */}
            <rect
              x={SK_INDIA_X} y={SK_INDIA_Y}
              width={SK_INDIA_W} height={SK_INDIA_H}
              rx="6" fill={`hsl(${TEAL_HUE},70%,35%)`}
            />
            <text x={SK_INDIA_X + SK_INDIA_W / 2} y={SK_INDIA_Y + SK_INDIA_H / 2 - 6}
              textAnchor="middle" dominantBaseline="middle"
              fill="#fff" fontSize="13" fontWeight="700" fontFamily="'DM Sans',sans-serif">
              India
            </text>
            <text x={SK_INDIA_X + SK_INDIA_W / 2} y={SK_INDIA_Y + SK_INDIA_H / 2 + 12}
              textAnchor="middle" dominantBaseline="middle"
              fill="rgba(255,255,255,0.7)" fontSize="9" fontFamily="'JetBrains Mono',monospace">
              {fmtUsd(total)}
            </text>

            {/* Country destination nodes */}
            {nodes.map((p) => {
              const t = p.value_usd / maxVal;
              const isSel = selected === p.code;
              const isHov = hovered === p.code;
              const nodeH = Math.max(8, t * 28);
              const lig = isSel ? 32 : isHov ? 38 : 44;
              return (
                <g
                  key={p.code}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelected(p.code === selected ? null : p.code)}
                  onMouseEnter={() => setHovered(p.code)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <rect
                    x={SK_COUNTRY_X}
                    y={p.cy - nodeH / 2}
                    width={SK_COUNTRY_W} height={nodeH} rx="3"
                    fill={`hsl(${TEAL_HUE},${isSel ? 70 : 55}%,${lig}%)`}
                  />
                  <text
                    x={SK_COUNTRY_X + SK_COUNTRY_W + 8}
                    y={p.cy}
                    dominantBaseline="middle"
                    fill={isSel ? `hsl(${TEAL_HUE},70%,25%)` : '#445'}
                    fontSize={isSel ? 12 : 11}
                    fontWeight={isSel ? '700' : '500'}
                    fontFamily="'DM Sans',sans-serif"
                  >
                    {p.name.length > 14 ? p.name.slice(0, 13) + '…' : p.name}
                  </text>
                  <text
                    x={SK_COUNTRY_X - 6}
                    y={p.cy}
                    dominantBaseline="middle"
                    textAnchor="end"
                    fill="rgba(255,255,255,0.8)"
                    fontSize="8"
                    fontFamily="'JetBrains Mono',monospace"
                  >
                    {fmtUsd(p.value_usd)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
