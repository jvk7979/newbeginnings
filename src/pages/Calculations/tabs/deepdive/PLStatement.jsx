import { C } from '../../../../tokens';
import { fmtINR } from '../../../../components/calc/primitives';
import GlossaryTerm from '../../../../components/calc/GlossaryTerm';

// Statement-style P&L. Three-column layout: line item / detail / amount.
// All values reflect Year 1 of the projection — typical year a banker
// reads. Detail column documents the formula so the engine isn't a black
// box. Sub-totals (Gross Profit, Operating Profit, PBT, PAT, Net Profit)
// get bold weight and a hairline above them.
export default function PLStatement({ calc, input }) {
  if (!calc.rows || calc.rows.length === 0) {
    return <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, padding: '20px 0', fontStyle: 'italic' }}>Add CAPEX, products and costs to see the P&L.</div>;
  }
  const y1 = calc.rows[0];
  const grossProfit  = y1.revenue - y1.variableCosts;
  const grossMargin  = y1.revenue > 0 ? (grossProfit / y1.revenue) * 100 : 0;
  const opMargin     = y1.revenue > 0 ? (y1.ebitda / y1.revenue) * 100 : 0;
  const netProfit    = y1.netProfit ?? (y1.ebitda - y1.interest - y1.tax - y1.principal);
  const netMargin    = y1.revenue > 0 ? (netProfit / y1.revenue) * 100 : 0;
  const taxRate      = input.taxRate ?? 25;

  // Each entry: [label, detail, amount, options]
  // options: { bold, subtotal (hairline above), positive, negative, indent }
  const y1CapacityPct = (y1.capacityPct ?? 0).toFixed(0);
  const lines = [
    { label: 'Revenue',          term: null,                  detail: `Σ price × qty × ${y1CapacityPct}% capacity`,          amount: y1.revenue,          positive: true },
    { label: 'Variable Costs',   term: 'Variable Costs',      detail: `Σ raw material × qty × ${y1CapacityPct}% capacity`,   amount: -y1.variableCosts,   indent: true,  negative: true },
    { label: 'Gross Profit',     term: 'Gross Profit',        detail: `${grossMargin.toFixed(1)}% gross margin`, amount: grossProfit,       subtotal: true, bold: true },

    // Engine excludes disabled fixed rows from Operating Profit — keep
    // these line items in lockstep so the statement reconciles to the
    // Operating Profit total below. Without this filter, a disabled row
    // would render as a deduction in the table while the Operating Profit
    // value below would (correctly) ignore it, breaking the chain.
    ...input.fixedRows.filter(r => r.enabled !== false && Number(r.amount) > 0).map(r => ({
      label: r.name || 'Fixed Cost',
      term: 'Fixed Costs',
      detail: 'Annual fixed expense',
      amount: -Number(r.amount),
      indent: true,
      negative: true,
    })),

    { label: 'Operating Profit', term: 'Operating Profit',    detail: `${opMargin.toFixed(1)}% operating margin`, amount: y1.ebitda,        subtotal: true, bold: true,
      positive: y1.ebitda >= 0, negative: y1.ebitda < 0 },

    { label: 'Depreciation',     term: 'Depreciation',        detail: '15% WDV on remaining book value',        amount: -y1.depreciation,    indent: true,  negative: true },
    { label: 'Interest',         term: null,                  detail: `${input.interestRate}% on Y1 loan balance`, amount: -y1.interest,    indent: true,  negative: true },
    ...(y1.subvention > 0 ? [{ label: 'Interest Subvention', term: 'Interest Subvention', detail: 'Government rebate (cash inflow)', amount: y1.subvention, indent: true, positive: true }] : []),

    { label: 'PBT',              term: 'PBT',                 detail: 'Profit before tax',                       amount: y1.ebt,             subtotal: true, bold: true,
      positive: y1.ebt >= 0, negative: y1.ebt < 0 },

    { label: 'Tax',              term: null,                  detail: `${taxRate}% effective rate`,              amount: -y1.tax,            indent: true,  negative: y1.tax > 0 },

    { label: 'PAT',              term: 'PAT',                 detail: 'Profit after tax (accounting view)',      amount: y1.pat,             subtotal: true, bold: true,
      positive: y1.pat >= 0, negative: y1.pat < 0 },

    { label: 'Loan Principal',   term: null,                  detail: 'Year 1 principal repayment',              amount: -y1.principal,      indent: true,  negative: y1.principal > 0 },

    { label: 'Net Profit',       term: 'Net Profit',          detail: `${netMargin.toFixed(1)}% net margin · cash after interest, tax, principal`, amount: netProfit, subtotal: true, bold: true,
      positive: netProfit >= 0, negative: netProfit < 0 },
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
                }}>{l.term ? <GlossaryTerm term={l.term}>{l.label}</GlossaryTerm> : l.label}</td>
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
