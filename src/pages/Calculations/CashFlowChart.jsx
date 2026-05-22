// src/pages/Calculations/CashFlowChart.jsx
//
// Multi-year cash-flow combo chart for the Feasibility Report.
// EBITDA bars (blue/info), Revenue area + line (accent), Operating-cost
// dashed line (danger), and a fractional-year Payback marker (warning).
// Pure SVG, theme-aware via --c-* tokens.

import { C } from '../../tokens';

const W = 820, H = 280;
const M = { top: 18, right: 24, bottom: 32, left: 64 };

export default function CashFlowChart({ rows, payback }) {
  if (!rows || rows.length === 0) {
    return <div className="fr-cf-empty">Cash-flow projections will appear once inputs are set.</div>;
  }
  const N = rows.length;
  const innerW = W - M.left - M.right;
  const innerH = H - M.top  - M.bottom;
  const bandW  = innerW / N;

  // Y axis range — revenue is usually the tallest line. Round up via nice ticks.
  const dataMax = Math.max(
    1,
    ...rows.map(r => r.revenue),
    ...rows.map(r => Math.max(0, r.ebitda)),
    ...rows.map(r => (r.variableCosts || 0) + (r.fixedCosts || 0)),
  );
  const ticks = niceTicks(0, dataMax, 4);
  const yMax  = ticks[ticks.length - 1];

  const xC = (i) => M.left + bandW * (i + 0.5);
  const y  = (v) => M.top + innerH - (Math.max(0, v) / yMax) * innerH;
  const yBottom = M.top + innerH;

  const revPts  = rows.map((r, i) => `${xC(i)},${y(r.revenue)}`).join(' ');
  const costPts = rows.map((r, i) => `${xC(i)},${y((r.variableCosts || 0) + (r.fixedCosts || 0))}`).join(' ');
  const areaD   = `M ${xC(0)},${yBottom} L ${rows.map((r, i) => `${xC(i)},${y(r.revenue)}`).join(' L ')} L ${xC(N - 1)},${yBottom} Z`;

  // Payback marker — x-position from the fractional year value.
  const paybackX = payback != null ? M.left + bandW * payback : null;
  const labelW   = 110;
  const labelX   = paybackX != null
    ? Math.min(W - M.right - labelW, Math.max(M.left, paybackX + 6))
    : null;

  return (
    <svg className="fr-cf-chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Multi-year cash flow chart">
      {/* y-axis grid + labels */}
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)}
                stroke="var(--c-border)" strokeWidth="0.5"
                strokeDasharray={i === 0 ? '' : '2 3'} opacity="0.8"/>
          <text x={M.left - 8} y={y(t) + 3.5} fontSize="10" textAnchor="end"
                fill="var(--c-fg3)" fontFamily="'JetBrains Mono', monospace">
            {formatTick(t)}
          </text>
        </g>
      ))}

      {/* x-axis labels (Y1…Yn) */}
      {rows.map((r, i) => (
        <text key={i} x={xC(i)} y={H - M.bottom + 18} fontSize="10" textAnchor="middle"
              fill="var(--c-fg3)" fontFamily="'JetBrains Mono', monospace">
          Y{r.t}
        </text>
      ))}

      {/* Revenue area + line */}
      <path d={areaD} fill={C.accent} opacity="0.10"/>
      <polyline points={revPts} fill="none" stroke={C.accent} strokeWidth="2"/>

      {/* Operating costs (dashed) */}
      <polyline points={costPts} fill="none" stroke={C.danger} strokeWidth="1.5" strokeDasharray="5 4"/>

      {/* EBITDA bars */}
      {rows.map((r, i) => {
        const top = y(Math.max(0, r.ebitda));
        const h   = Math.max(0, yBottom - top);
        const bw  = Math.max(8, bandW * 0.55);
        return (
          <rect key={i} x={xC(i) - bw / 2} y={top} width={bw} height={h}
                fill={C.info} opacity="0.78" rx="1.5"/>
        );
      })}

      {/* Payback marker */}
      {paybackX != null && (
        <g>
          <line x1={paybackX} x2={paybackX} y1={M.top} y2={yBottom}
                stroke={C.warning} strokeWidth="1.5" strokeDasharray="4 4"/>
          <rect x={labelX} y={M.top + 3} width={labelW} height="18" rx="3"
                fill="var(--c-bg1)" stroke={C.warning} strokeWidth="1"/>
          <text x={labelX + labelW / 2} y={M.top + 16} fontSize="10" textAnchor="middle"
                fill={C.warning} fontFamily="'JetBrains Mono', monospace" fontWeight="700">
            Payback · {payback.toFixed(1)} yrs
          </text>
        </g>
      )}
    </svg>
  );
}

// Round a [0, max] range to a clean set of `n` ticks.
function niceTicks(lo, hi, n) {
  if (hi <= lo) return [0, 1];
  const range = hi - lo;
  const rough = range / n;
  const mag   = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm  = rough / mag;
  const step  = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
  const out   = [];
  for (let v = 0; v <= hi + step / 2; v += step) out.push(v);
  return out;
}

// Format ₹ scaled to Cr / L / K for the y-axis labels.
function formatTick(v) {
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(v >= 1e8 ? 0 : 1)} Cr`;
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(0)} L`;
  if (v >= 1e3) return `₹${(v / 1e3).toFixed(0)} K`;
  return `₹${Math.round(v)}`;
}
