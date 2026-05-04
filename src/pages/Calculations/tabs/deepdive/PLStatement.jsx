import { C } from '../../../../tokens';
import { fmtINR } from '../../../../components/calc/primitives';

// Statement-style P&L. Three-column layout: line item / detail / amount.
// All values reflect Year 1 of the projection — typical year a banker
// reads. Detail column documents the formula so the engine isn't a black
// box. Sub-totals (Gross Profit, EBITDA, PBT, PAT) get bold weight and a
// hairline above them.
export default function PLStatement({ calc, input }) {
  if (!calc.rows || calc.rows.length === 0) {
    return <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, padding: '20px 0', fontStyle: 'italic' }}>Add CAPEX, products and costs to see the P&L.</div>;
  }
  const y1 = calc.rows[0];
  const grossProfit = y1.revenue - y1.variableCosts;
  const grossMargin = y1.revenue > 0 ? (grossProfit / y1.revenue) * 100 : 0;
  const ebitdaMargin = y1.revenue > 0 ? (y1.ebitda / y1.revenue) * 100 : 0;
  const taxRate = input.taxRate ?? 25;

  // Each entry: [label, detail, amount, options]
  // options: { bold, subtotal (hairline above), positive, negative, indent }
  const lines = [
    { label: 'Revenue',          detail: 'Σ price × qty × Y1 capacity',          amount: y1.revenue,          positive: true },
    { label: 'Variable Costs',   detail: 'Σ raw material × qty × Y1 capacity',   amount: -y1.variableCosts,   indent: true,  negative: true },
    { label: 'Gross Profit',     detail: `${grossMargin.toFixed(1)}% gross margin`, amount: grossProfit,       subtotal: true, bold: true },

    ...input.fixedRows.filter(r => Number(r.amount) > 0).map(r => ({
      label: r.name || 'Fixed Cost',
      detail: 'Annual fixed expense',
      amount: -Number(r.amount),
      indent: true,
      negative: true,
    })),

    { label: 'EBITDA',           detail: `${ebitdaMargin.toFixed(1)}% EBITDA margin`, amount: y1.ebitda,        subtotal: true, bold: true,
      positive: y1.ebitda >= 0, negative: y1.ebitda < 0 },

    { label: 'Depreciation',     detail: '15% WDV on remaining book value',        amount: -y1.depreciation,    indent: true,  negative: true },
    { label: 'Interest',         detail: `${input.interestRate}% on Y1 loan balance`, amount: -y1.interest,    indent: true,  negative: true },
    ...(y1.subvention > 0 ? [{ label: 'Interest Subvention', detail: 'Government rebate (cash inflow)', amount: y1.subvention, indent: true, positive: true }] : []),

    { label: 'PBT',              detail: 'Profit before tax',                       amount: y1.ebt,             subtotal: true, bold: true,
      positive: y1.ebt >= 0, negative: y1.ebt < 0 },

    { label: 'Tax',              detail: `${taxRate}% effective rate`,              amount: -y1.tax,            indent: true,  negative: y1.tax > 0 },

    { label: 'PAT',              detail: 'Profit after tax',                        amount: y1.pat,             subtotal: true, bold: true,
      positive: y1.pat >= 0, negative: y1.pat < 0 },
  ];

  return (
    <div className="calc-statement">
      <div className="calc-statement-eyebrow">Year 1 P&amp;L Statement · steady-state ramp Y2–Y{calc.rows.length}</div>
      <table className="calc-statement-table">
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Line item</th>
            <th style={{ textAlign: 'left' }}>Detail</th>
            <th style={{ textAlign: 'right' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => {
            const amountColor = l.positive ? '#2a7d3c' : l.negative ? '#c0392b' : C.fg1;
            return (
              <tr key={i} className={l.subtotal ? 'calc-statement-subtotal' : ''}>
                <td style={{
                  paddingLeft: l.indent ? 22 : 0,
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: l.bold ? 700 : 500,
                  color: l.bold ? C.fg1 : C.fg2,
                }}>{l.label}</td>
                <td style={{ fontFamily: "'DM Sans', sans-serif", color: C.fg3, fontSize: 12 }}>{l.detail}</td>
                <td style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: l.bold ? 700 : 500,
                  color: amountColor,
                  textAlign: 'right',
                  whiteSpace: 'nowrap',
                }}>{fmtINR(l.amount)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
