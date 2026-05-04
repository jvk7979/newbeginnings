import { C } from '../../tokens';
import { fmtINR } from './primitives';

// Twin-bar chart: Revenue (accent) + EBITDA (green if positive, red if
// negative) for each year. Pure SVG, no chart library. Defaults to the
// first `windowYears` rows so a 10-year project shows as a 5-year preview;
// pass null to render every row. Y-axis is auto-scaled to the largest
// absolute value across both series.
export default function RevenueEbitdaBarChart({ rows, startYear, windowYears = 5 }) {
  const data = (windowYears != null) ? rows.slice(0, windowYears) : rows;
  if (data.length === 0) return null;

  const maxAbs = Math.max(0.01, ...data.map(r => Math.max(Math.abs(r.revenue), Math.abs(r.ebitda))));
  const W = 640;
  const H = 220;
  const padTop    = 28;   // headroom for the +revenue label
  const padBottom = 50;   // axis labels + EBITDA label below the bar
  const padLeft   = 18;
  const padRight  = 18;
  const innerW = W - padLeft - padRight;
  const innerH = H - padTop - padBottom;
  // EBITDA can dip negative — keep the zero baseline at 60% of the inner
  // height so positive values dominate, but negative values stay visible.
  const zeroY = padTop + innerH * 0.62;

  const groupW = innerW / data.length;
  const barW   = Math.min(28, groupW * 0.32);
  const gap    = 4;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', maxWidth: W }}
         role="img" aria-label="Revenue and EBITDA by year">
      {/* Zero line */}
      <line x1={padLeft} y1={zeroY} x2={W - padRight} y2={zeroY} stroke={C.border} strokeWidth="1" />
      {data.map((r, i) => {
        const cx = padLeft + groupW * i + groupW / 2;
        const revH    = (Math.abs(r.revenue) / maxAbs) * (zeroY - padTop);
        const ebitdaH = (Math.abs(r.ebitda)  / maxAbs) * (r.ebitda >= 0 ? (zeroY - padTop) : (H - padBottom - zeroY));
        const ebitdaPositive = r.ebitda >= 0;
        const ebitdaColor = ebitdaPositive ? '#2a7d3c' : '#c0392b';
        return (
          <g key={r.t}>
            {/* Revenue bar — always above the zero line */}
            <rect x={cx - barW - gap / 2} y={zeroY - revH} width={barW} height={revH}
                  fill={C.accent} rx={2} />
            <text x={cx - barW - gap / 2 + barW / 2} y={zeroY - revH - 6}
                  textAnchor="middle" fontSize="10"
                  fontFamily="'JetBrains Mono', monospace" fill={C.fg2}>
              {fmtINR(r.revenue)}
            </text>

            {/* EBITDA bar — above zero if positive, below if negative */}
            <rect x={cx + gap / 2}
                  y={ebitdaPositive ? zeroY - ebitdaH : zeroY}
                  width={barW} height={ebitdaH}
                  fill={ebitdaColor} rx={2} />
            <text x={cx + gap / 2 + barW / 2}
                  y={ebitdaPositive ? zeroY - ebitdaH - 6 : zeroY + ebitdaH + 12}
                  textAnchor="middle" fontSize="10"
                  fontFamily="'JetBrains Mono', monospace" fill={ebitdaColor}>
              {fmtINR(r.ebitda)}
            </text>

            {/* X-axis label — calendar year if startYear provided, else "Y1..N" */}
            <text x={cx} y={H - 18}
                  textAnchor="middle" fontSize="11"
                  fontFamily="'DM Sans', sans-serif" fill={C.fg3}>
              {startYear ? startYear + r.t - 1 : `Y${r.t}`}
            </text>
          </g>
        );
      })}

      {/* Legend */}
      <g transform={`translate(${padLeft}, ${H - 4})`}>
        <rect x="0" y="-9" width="10" height="9" fill={C.accent} rx={1.5} />
        <text x="14" y="-1" fontSize="10" fontFamily="'DM Sans', sans-serif" fill={C.fg2}>Revenue</text>
        <rect x="80" y="-9" width="10" height="9" fill="#2a7d3c" rx={1.5} />
        <text x="94" y="-1" fontSize="10" fontFamily="'DM Sans', sans-serif" fill={C.fg2}>EBITDA</text>
      </g>
    </svg>
  );
}
