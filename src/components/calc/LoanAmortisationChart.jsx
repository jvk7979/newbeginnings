import { C } from '../../tokens';
import { fmtShort } from './primitives';

// Loan Amortisation Chart — for each year of the project, a stacked bar
// of [principal | interest], plus a line tracing the outstanding loan
// balance falling from the full loan to zero by the end of the tenure.
// Visual lesson: interest dominates early years (because loan balance
// is high), principal dominates late years (because tenure has burned
// off most of the original balance). Banks read this shape backwards
// to verify that DSCR is comfortable in the binding (early) years.
export default function LoanAmortisationChart({ rows, tenure }) {
  if (!rows || rows.length === 0) return null;

  // Only include years up to tenure (after that, principal + interest
  // are both 0 and the bars are empty). Cap at 15 years to keep the
  // chart legible.
  const data = rows.slice(0, Math.min(15, rows.length, tenure)).map(r => ({
    t: r.t,
    principal: Math.max(0, r.principal),
    interest:  Math.max(0, r.interest),
    loanBalance: Math.max(0, r.loanBalance),
  }));

  if (data.length === 0) return null;

  // Y-axis range: max stacked debt service across years (used for the
  // bars) AND max loan balance (used for the line). Use a single axis
  // since both quantities are in the same currency unit and we want the
  // line and bars on the same scale.
  const yMax = Math.max(
    0.01,
    ...data.map(r => r.principal + r.interest),
    ...data.map(r => r.loanBalance)
  );

  const W = 760;
  const H = 320;
  const padTop    = 36;
  const padBottom = 60;
  const padLeft   = 28;
  const padRight  = 24;
  const innerW = W - padLeft - padRight;
  const innerH = H - padTop - padBottom;
  const yPx = (v) => padTop + ((yMax - v) / yMax) * innerH;
  const zeroY = yPx(0);

  const groupW = innerW / data.length;
  const barW   = Math.min(40, groupW * 0.45);

  // Pre-compute the loan-balance polyline. Each point sits at the END
  // of the year (i.e., at the right edge of that year's bar) since the
  // amortisation row.loanBalance is the AMOUNT REMAINING at the start
  // of that year. We add a final point at (rightEdge, 0) to make the
  // line land at zero by the end of the tenure.
  const balancePoints = data.map((r, i) => {
    const cx = padLeft + groupW * i + groupW / 2;
    return { x: cx, y: yPx(r.loanBalance) };
  });
  // Append the "end-of-tenure" terminus
  if (data.length > 0) {
    const lastIdx = data.length - 1;
    const lastCx = padLeft + groupW * lastIdx + groupW / 2;
    balancePoints.push({ x: lastCx + groupW / 2 - 6, y: zeroY });
  }
  const balancePath = balancePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', maxWidth: W }}
         role="img" aria-label="Loan amortisation chart — principal, interest, balance per year">

      {/* Zero / axis line — chart-axis token at 1.2px for the warmer
          editorial rule consistent with Revenue/EBITDA + Waterfall */}
      <line x1={padLeft} y1={zeroY} x2={W - padRight} y2={zeroY}
            stroke={C.chartAxis} strokeWidth="1.2" />

      {/* Stacked bars per year */}
      {data.map((r, i) => {
        const cx = padLeft + groupW * i + groupW / 2;
        const x  = cx - barW / 2;
        const total = r.principal + r.interest;

        // Principal sits at the bottom of the stack; interest stacks on top
        const principalY  = yPx(r.principal);
        const principalH  = zeroY - principalY;
        const interestY   = yPx(total);
        const interestH   = principalY - interestY;

        return (
          <g key={r.t}>
            {/* Principal — chart-accent (the theme's primary metric colour) */}
            {principalH > 0.5 && (
              <rect x={x} y={principalY} width={barW} height={principalH}
                    fill={C.chartAccent} rx={2} />
            )}
            {/* Interest — chart-negative, stacked above */}
            {interestH > 0.5 && (
              <rect x={x} y={interestY} width={barW} height={interestH}
                    fill={C.chartNegative} fillOpacity={0.85} rx={2} />
            )}

            {/* Total label above the stack — only when there's a meaningful total */}
            {total > 0 && (
              <text x={cx} y={interestY - 6}
                    textAnchor="middle" fontSize="10" fontWeight="600"
                    fontFamily="'JetBrains Mono', monospace"
                    fill={C.fg2}>
                {fmtShort(total)}
              </text>
            )}

            {/* X-axis label */}
            <text x={cx} y={H - 38}
                  textAnchor="middle" fontSize="11" fontWeight="500"
                  fontFamily="'DM Sans', sans-serif"
                  fill={C.fg2}>
              Y{r.t}
            </text>
          </g>
        );
      })}

      {/* Outstanding loan balance line — drawn AFTER the bars so it
          floats on top */}
      {balancePoints.length > 1 && (
        <>
          <path d={balancePath}
                fill="none"
                stroke="#2563a8"
                strokeWidth="2"
                strokeDasharray="0"
                strokeLinecap="round"
                strokeLinejoin="round" />
          {/* Dot at each balance point */}
          {balancePoints.slice(0, -1).map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="3" fill="#2563a8" stroke="#fff" strokeWidth="1.5" />
          ))}
        </>
      )}

      {/* Legend at the bottom */}
      <g transform={`translate(${padLeft}, ${H - 8})`}>
        <rect x="0"   y="-9" width="11" height="11" fill={C.chartAccent} rx={2} />
        <text x="16"  y="0"  fontSize="11" fontFamily="'DM Sans', sans-serif" fill={C.fg2}>Principal</text>
        <rect x="86"  y="-9" width="11" height="11" fill={C.chartNegative} rx={2} fillOpacity="0.85" />
        <text x="102" y="0"  fontSize="11" fontFamily="'DM Sans', sans-serif" fill={C.fg2}>Interest</text>
        <line x1="170" y1="-3" x2="186" y2="-3" stroke="#2563a8" strokeWidth="2" strokeLinecap="round" />
        <circle cx="178" cy="-3" r="2.5" fill="#2563a8" stroke="#fff" strokeWidth="1.2" />
        <text x="192" y="0"  fontSize="11" fontFamily="'DM Sans', sans-serif" fill={C.fg2}>Outstanding balance</text>
      </g>
    </svg>
  );
}
