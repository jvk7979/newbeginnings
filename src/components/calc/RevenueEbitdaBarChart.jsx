import { C } from '../../tokens';

// Chart-local short formatter — strips the ₹ prefix and trims decimals so
// labels fit above each bar without colliding. The big fmtINR is reserved
// for tiles + footers where the axis context isn't there. Examples:
//   1,40,00,000 → "1.4Cr"
//      76,30,000 → "76L"
//        2,500   → "3K"
function fmtShort(n) {
  if (n === null || n === undefined || !isFinite(n)) return '—';
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (abs >= 10000000) return `${sign}${(abs / 10000000).toFixed(1)}Cr`;
  if (abs >= 100000)   return `${sign}${Math.round(abs / 100000)}L`;
  if (abs >= 1000)     return `${sign}${Math.round(abs / 1000)}K`;
  return `${sign}${Math.round(abs)}`;
}

// Twin-bar chart: Revenue (accent) + EBITDA (green if positive, red if
// negative) for each year. Pure SVG, no chart library. Defaults to the
// first `windowYears` rows so a 10-year project shows as a 5-year preview;
// pass null to render every row.
export default function RevenueEbitdaBarChart({ rows, startYear, windowYears = 5 }) {
  const data = (windowYears != null) ? rows.slice(0, windowYears) : rows;
  if (data.length === 0) return null;

  const maxAbs = Math.max(0.01, ...data.map(r => Math.max(Math.abs(r.revenue), Math.abs(r.ebitda))));

  // Layout constants — bumped from the first version to fix label
  // collisions and the year-row / legend overlap. Vertical sections:
  //   padTop      — headroom for the +revenue / +ebitda value labels
  //   plot area   — the bars themselves
  //   ↳ zeroY at 62% of plot height so positive values dominate while
  //     negative EBITDA stays visible
  //   year-row    — year tick labels (calendar year if startYear given)
  //   legend-row  — colour legend (Revenue / EBITDA swatches)
  const W = 720;
  const H = 300;
  const padTop    = 40;
  const padBottom = 76;
  const padLeft   = 24;
  const padRight  = 24;
  const innerW = W - padLeft - padRight;
  const innerH = H - padTop - padBottom;
  const zeroY  = padTop + innerH * 0.62;

  const groupW = innerW / data.length;
  const barW   = Math.min(36, groupW * 0.32);
  const gap    = 10;

  // Y positions for the supporting rows
  const axisY      = zeroY;
  const yearY      = padTop + innerH + 30;  // 30px below the zero line
  const legendY    = H - 16;                // 16px above the bottom edge

  // Font sizes — bumped from 10/11 to 12/13/11 so small numbers stay
  // legible at the deployed responsive widths
  const FS_VALUE   = 12;
  const FS_YEAR    = 13;
  const FS_LEGEND  = 11;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', maxWidth: W }}
         role="img" aria-label="Revenue and EBITDA by year">
      {/* Zero / axis line */}
      <line x1={padLeft} y1={axisY} x2={W - padRight} y2={axisY} stroke={C.border} strokeWidth="1" />

      {data.map((r, i) => {
        const cx       = padLeft + groupW * i + groupW / 2;
        const revH     = (Math.abs(r.revenue) / maxAbs) * (zeroY - padTop);
        const ebPos    = r.ebitda >= 0;
        const ebitdaH  = (Math.abs(r.ebitda)  / maxAbs) * (ebPos ? (zeroY - padTop) : (H - padBottom - zeroY));
        const ebColor  = ebPos ? '#2a7d3c' : '#c0392b';
        const revBarX  = cx - barW - gap / 2;
        const ebBarX   = cx + gap / 2;
        return (
          <g key={r.t}>
            {/* Revenue bar — always above the zero line */}
            <rect x={revBarX} y={zeroY - revH} width={barW} height={revH}
                  fill={C.accent} rx={3} />
            <text x={revBarX + barW / 2} y={zeroY - revH - 8}
                  textAnchor="middle" fontSize={FS_VALUE} fontWeight="600"
                  fontFamily="'JetBrains Mono', monospace" fill={C.fg1}>
              {fmtShort(r.revenue)}
            </text>

            {/* EBITDA bar — above zero if positive, below if negative */}
            <rect x={ebBarX}
                  y={ebPos ? zeroY - ebitdaH : zeroY}
                  width={barW} height={ebitdaH}
                  fill={ebColor} rx={3} />
            <text x={ebBarX + barW / 2}
                  y={ebPos ? zeroY - ebitdaH - 8 : zeroY + ebitdaH + 14}
                  textAnchor="middle" fontSize={FS_VALUE} fontWeight="600"
                  fontFamily="'JetBrains Mono', monospace" fill={ebColor}>
              {fmtShort(r.ebitda)}
            </text>

            {/* Year label */}
            <text x={cx} y={yearY}
                  textAnchor="middle" fontSize={FS_YEAR} fontWeight="500"
                  fontFamily="'DM Sans', sans-serif" fill={C.fg2}>
              {startYear ? startYear + r.t - 1 : `Y${r.t}`}
            </text>
          </g>
        );
      })}

      {/* Legend — sits a clean ~30px below the year row so the two
          rows never crowd each other */}
      <g transform={`translate(${padLeft}, ${legendY})`}>
        <rect x="0"  y="-9" width="11" height="11" fill={C.accent} rx={2} />
        <text x="16" y="0"  fontSize={FS_LEGEND} fontWeight="500"
              fontFamily="'DM Sans', sans-serif" fill={C.fg2}>Revenue</text>
        <rect x="92" y="-9" width="11" height="11" fill="#2a7d3c" rx={2} />
        <text x="108" y="0" fontSize={FS_LEGEND} fontWeight="500"
              fontFamily="'DM Sans', sans-serif" fill={C.fg2}>EBITDA</text>
      </g>
    </svg>
  );
}
