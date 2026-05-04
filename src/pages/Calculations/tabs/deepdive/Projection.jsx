import { useState } from 'react';
import { C } from '../../../../tokens';
import { fmtINR } from '../../../../components/calc/primitives';
import RevenueEbitdaBarChart from '../../../../components/calc/RevenueEbitdaBarChart';
import ProjectionTable from '../ProjectionTab';

// 5-year default chart view of revenue + EBITDA. The full year-by-year
// table is collapsed behind a toggle so the chart claims the page on
// first paint. Footer shows cumulative and end-window summary metrics.
export default function Projection({ calc }) {
  const [showTable, setShowTable] = useState(false);
  if (!calc.rows || calc.rows.length === 0) {
    return <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, padding: '20px 0', fontStyle: 'italic' }}>Add CAPEX, products and costs to see the projection.</div>;
  }

  const startYear  = new Date().getFullYear();
  const windowYears = Math.min(5, calc.rows.length);
  const window = calc.rows.slice(0, windowYears);

  const cumRevenue  = window.reduce((s, r) => s + r.revenue, 0);
  const cumEbitda   = window.reduce((s, r) => s + r.ebitda,  0);
  const lastYrRow   = window[window.length - 1];
  const lastMargin  = lastYrRow.revenue > 0 ? (lastYrRow.ebitda / lastYrRow.revenue) * 100 : 0;

  return (
    <div className="calc-projection-redesign">
      <div className="calc-projection-header">
        <div>
          <div className="calc-projection-title">{windowYears}-Year Projection</div>
          <div className="calc-projection-sub">Revenue grows with the capacity ramp · costs held flat in real terms · hover bars for exact values</div>
        </div>
        <button onClick={() => setShowTable(s => !s)} className="calc-projection-toggle" type="button">
          {showTable ? 'Hide table' : 'Show full table'}
        </button>
      </div>

      <RevenueEbitdaBarChart rows={calc.rows} startYear={startYear} windowYears={windowYears} />

      <div className="calc-projection-footer">
        {[
          { label: `Cumulative ${windowYears}-yr Revenue`, value: fmtINR(cumRevenue), color: C.fg1 },
          { label: `Cumulative ${windowYears}-yr EBITDA`,  value: fmtINR(cumEbitda),  color: cumEbitda >= 0 ? '#2a7d3c' : '#c0392b' },
          { label: `Yr ${windowYears} EBITDA Margin`,      value: `${lastMargin.toFixed(0)}%`, color: lastMargin >= 0 ? '#2a7d3c' : '#c0392b' },
        ].map(t => (
          <div key={t.label} className="calc-projection-footer-tile">
            <div className="calc-projection-footer-label">{t.label}</div>
            <div className="calc-projection-footer-value" style={{ color: t.color }}>{t.value}</div>
          </div>
        ))}
      </div>

      {showTable && (
        <div style={{ marginTop: 18 }}>
          <ProjectionTable calc={calc} />
        </div>
      )}
    </div>
  );
}
