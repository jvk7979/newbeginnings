import { useState } from 'react';
import { C } from '../../../../tokens';
import { fmtINR } from '../../../../components/calc/primitives';
import RevenueToProfitWaterfall from '../../../../components/calc/RevenueToProfitWaterfall';

// Cash Flow Waterfall view — visualises the same Year-1 numbers as the
// P&L Statement, but as a falling-bar chart that traces every rupee
// from Revenue to PAT through each deduction. Matches the P&L
// convention (Year 1 by default) but lets the user pick any modelled
// year so they can see how the cash-flow shape evolves with the
// capacity ramp + inflation escalation.
export default function CashFlow({ calc }) {
  const [yearIdx, setYearIdx] = useState(0);

  if (!calc.rows || calc.rows.length === 0) {
    return (
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, fontStyle: 'italic', padding: '20px 0' }}>
        Add CAPEX, products and costs to see the cash-flow waterfall.
      </div>
    );
  }

  const safeIdx = Math.min(yearIdx, calc.rows.length - 1);
  const row = calc.rows[safeIdx];
  const yearLabel = `Year ${row.t}`;

  // Footer KPIs — same row in three different framings.
  const grossMargin = row.revenue > 0 ? ((row.revenue - row.variableCosts) / row.revenue) * 100 : 0;
  const ebitdaMargin = row.revenue > 0 ? (row.ebitda / row.revenue) * 100 : 0;
  const patMargin   = row.revenue > 0 ? (row.pat / row.revenue) * 100 : 0;

  return (
    <div className="calc-cashflow">

      <div className="calc-cashflow-head">
        <div>
          <div className="calc-cashflow-title">Cash Flow Waterfall</div>
          <div className="calc-cashflow-sub">
            Revenue → variable → fixed → depreciation → interest → tax → PAT.
            {row.capacityPct ? ` Operating at ${row.capacityPct.toFixed(0)}% capacity.` : ''}
          </div>
        </div>
        {/* Year picker — only rendered when there's more than one year to choose from */}
        {calc.rows.length > 1 && (
          <div className="calc-cashflow-year-picker" role="tablist" aria-label="Year">
            {calc.rows.slice(0, Math.min(10, calc.rows.length)).map((r, i) => (
              <button
                key={r.t}
                type="button"
                role="tab"
                aria-selected={safeIdx === i}
                data-active={safeIdx === i ? 'true' : 'false'}
                onClick={() => setYearIdx(i)}
                className="calc-cashflow-year-btn">
                Y{r.t}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="calc-cashflow-chart">
        <RevenueToProfitWaterfall row={row} />
      </div>

      <div className="calc-cashflow-footer">
        {[
          { label: `${yearLabel} Revenue`,    value: fmtINR(row.revenue),                                              color: C.fg1 },
          { label: 'Gross Margin',            value: `${grossMargin.toFixed(1)}%`,                                     color: grossMargin >= 0 ? '#2a7d3c' : '#c0392b' },
          { label: 'EBITDA Margin',           value: `${ebitdaMargin.toFixed(1)}%`,                                    color: ebitdaMargin >= 0 ? '#2a7d3c' : '#c0392b' },
          { label: 'PAT Margin',              value: `${patMargin.toFixed(1)}%`,                                       color: patMargin >= 0 ? '#2a7d3c' : '#c0392b' },
          { label: 'PAT Take-Home',           value: fmtINR(row.pat),                                                  color: row.pat >= 0 ? '#2a7d3c' : '#c0392b' },
        ].map(t => (
          <div key={t.label} className="calc-cashflow-footer-tile">
            <div className="calc-cashflow-footer-label">{t.label}</div>
            <div className="calc-cashflow-footer-value" style={{ color: t.color }}>{t.value}</div>
          </div>
        ))}
      </div>

      <div className="calc-cashflow-hint">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14" height="14">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <circle cx="12" cy="16" r="0.5" fill="currentColor"/>
        </svg>
        <span>Subtract bars (red) show the deduction at each step; subtotal bars (sage) show the running total. Connector lines trace the chain. Switch years to see how the shape changes as the capacity ramp + inflation kick in.</span>
      </div>
    </div>
  );
}
