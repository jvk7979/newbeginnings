import { C } from '../../tokens';
import { fmtShort } from './primitives';

// Cash Flow Waterfall: Revenue → Variable → Fixed → EBITDA → Depr →
// Interest → PBT → Tax → PAT. Each "subtract" step is a floating
// rectangle between its in-value and out-value (the running total
// before vs after). Subtotals (EBITDA, PBT, PAT) are full bars from
// the zero line. Dashed connector lines between adjacent bars trace
// the running total so the eye follows the deductions chain.
//
// Caller passes a row from calc.rows (Year 1 by default). All step
// values are derived from that single row + the input.taxRate context
// already baked into row.tax.
export default function RevenueToProfitWaterfall({ row }) {
  if (!row || row.revenue === 0 && row.ebitda === 0 && row.pat === 0) {
    return (
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, fontStyle: 'italic', padding: '20px 0' }}>
        Add CAPEX, products and costs to see the cash-flow breakdown.
      </div>
    );
  }

  // Build the step list. Each step has:
  //   key, label (x-axis), kind ('total' | 'subtract' | 'subtotal'),
  //   inValue, outValue (running totals before/after the step).
  // For totals/subtotals, inValue = 0 (the bar grows from zero).
  // For subtract steps, the bar floats between inValue and outValue.
  const ebitda = row.ebitda;
  const pbt    = row.ebt;
  const pat    = row.pat;
  const ebitdaAfterVar = row.revenue - row.variableCosts;

  const steps = [
    { key: 'revenue', label: 'Revenue',    kind: 'total',    in: 0,                       out: row.revenue },
    { key: 'var',     label: '− Variable', kind: 'subtract', in: row.revenue,             out: ebitdaAfterVar },
    { key: 'fixed',   label: '− Fixed',    kind: 'subtract', in: ebitdaAfterVar,          out: ebitda },
    { key: 'ebitda',  label: 'EBITDA',     kind: 'subtotal', in: 0,                       out: ebitda },
    { key: 'depr',    label: '− Depr',     kind: 'subtract', in: ebitda,                  out: ebitda - row.depreciation },
    { key: 'int',     label: '− Interest', kind: 'subtract', in: ebitda - row.depreciation, out: pbt },
    { key: 'pbt',     label: 'PBT',        kind: 'subtotal', in: 0,                       out: pbt },
    { key: 'tax',     label: '− Tax',      kind: 'subtract', in: pbt,                     out: pat },
    { key: 'pat',     label: 'PAT',        kind: 'final',    in: 0,                       out: pat },
  ];

  // Y-axis range — track all step in/out values so even negative
  // running totals (loss years) stay on screen.
  const allValues = steps.flatMap(s => [s.in, s.out]);
  const yMax = Math.max(0, ...allValues);
  const yMin = Math.min(0, ...allValues);
  const yRange = (yMax - yMin) || 1;

  const W = 760;
  const H = 360;
  const padTop    = 44;   // headroom for the value label above the highest bar
  const padBottom = 66;   // x-axis label + axis line
  const padLeft   = 28;
  const padRight  = 24;
  const innerW = W - padLeft - padRight;
  const innerH = H - padTop - padBottom;

  // Convert a dollar value to a screen y. yMax → padTop, yMin → padTop+innerH.
  const yPx = (v) => padTop + ((yMax - v) / yRange) * innerH;
  const zeroY = yPx(0);

  const groupW = innerW / steps.length;
  const barW   = Math.min(56, groupW * 0.62);

  // Pick a colour for each step. Subtract = red, totals/subtotals tinted.
  const colorFor = (s) => {
    if (s.kind === 'subtract') return '#dc2626';
    if (s.kind === 'final')    return s.out >= 0 ? '#16a34a' : '#dc2626';
    if (s.kind === 'subtotal') return s.out >= 0 ? C.accent : '#dc2626';
    return C.accent; // 'total' (Revenue)
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', maxWidth: W }}
         role="img" aria-label="Cash flow waterfall — Revenue to PAT">
      {/* Zero line */}
      <line x1={padLeft} y1={zeroY} x2={W - padRight} y2={zeroY}
            stroke={C.border} strokeWidth="1" />

      {steps.map((s, i) => {
        const cx = padLeft + groupW * i + groupW / 2;
        const x  = cx - barW / 2;
        const top    = Math.max(s.in, s.out);
        const bottom = Math.min(s.in, s.out);
        const yTop    = yPx(top);
        const yBottom = yPx(bottom);
        const h = Math.max(2, yBottom - yTop); // min 2px so zero-magnitude steps still render
        const colour = colorFor(s);
        const isSub = s.kind === 'subtract';

        // Show value label for subtract = magnitude of deduction (out-in)
        // For totals/subtotals/final = the out value
        const labelValue = isSub ? (s.out - s.in) : s.out;
        const labelY = yTop - 8; // above the bar

        return (
          <g key={s.key}>
            {/* The bar itself — semi-transparent fill for subtract steps so
                they read as "passing through" rather than "starting fresh". */}
            <rect
              x={x} y={yTop} width={barW} height={h}
              fill={colour}
              fillOpacity={isSub ? 0.78 : 1}
              rx={3} />

            {/* Connector line from this bar's bottom-right to the next bar's
                top-left, hugging the running total. Only draw when the next
                bar exists AND it's not a subtotal that resets to zero. */}
            {i < steps.length - 1 && steps[i + 1].kind !== 'subtotal' && steps[i + 1].kind !== 'final' && (() => {
              const nextCx    = padLeft + groupW * (i + 1) + groupW / 2;
              const nextX     = nextCx - barW / 2;
              const yConnect  = yPx(s.out);
              return (
                <line
                  x1={x + barW}
                  y1={yConnect}
                  x2={nextX}
                  y2={yConnect}
                  stroke={C.fg3}
                  strokeWidth="1"
                  strokeDasharray="3,3"
                  opacity="0.6" />
              );
            })()}

            {/* Value label above the bar */}
            <text
              x={cx} y={labelY}
              textAnchor="middle"
              fontSize="12"
              fontWeight="700"
              fontFamily="'JetBrains Mono', monospace"
              fill={isSub ? '#dc2626' : (s.out >= 0 ? C.fg1 : '#dc2626')}>
              {isSub ? '−' : ''}{fmtShort(Math.abs(labelValue))}
            </text>

            {/* X-axis label */}
            <text
              x={cx} y={H - 38}
              textAnchor="middle"
              fontSize="11"
              fontWeight={s.kind === 'subtotal' || s.kind === 'final' || s.kind === 'total' ? '700' : '500'}
              fontFamily="'DM Sans', sans-serif"
              fill={s.kind === 'subtract' ? C.fg3 : C.fg2}>
              {s.label}
            </text>

            {/* Sub-label for totals/subtotals — small "RUNNING TOTAL" tag */}
            {(s.kind === 'subtotal' || s.kind === 'final' || s.kind === 'total') && (
              <text
                x={cx} y={H - 22}
                textAnchor="middle"
                fontSize="9"
                fontWeight="700"
                letterSpacing="0.06em"
                fontFamily="'DM Sans', sans-serif"
                fill={s.kind === 'final' ? colour : C.fg3}>
                {s.kind === 'final' ? 'TAKE-HOME' : 'SUBTOTAL'}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
