import { C, alpha } from '../../tokens';
import IRRGauge from '../../components/calc/IRRGauge';
import DonutChart from '../../components/calc/DonutChart';
import { Sparkline, NPVBar, PaybackTrack } from '../../components/calc/charts';
import { fmtINR } from '../../components/calc/primitives';

// Project Health Dashboard — IRR gauge + revenue composition + 4 KPI tiles.
// Single dominant gauge for the headline metric, icon-led tiles for the rest.
export default function MetricDashboard({
  calc, input, dr, tn,
  irrColor, npvColor, paybackColor, ebitdaColor,
}) {
  return (
    <div className="calc-metric-dashboard">

      {/* Big IRR gauge — semicircular with red/yellow/green zones */}
      <div className="calc-gauge-card">
        <div className="calc-gauge-eyebrow">IRR</div>
        <IRRGauge value={calc.irr} hurdle={dr} />
        <div className="calc-gauge-value" style={{ color: irrColor }}>
          {calc.irr !== null ? `${calc.irr.toFixed(0)}%` : '—'}
        </div>
        <div className="calc-gauge-sub">vs {dr}% hurdle rate</div>
      </div>

      {/* Revenue Composition — donut + per-product breakdown. Lives inline
          with the gauge so users see top-line health (IRR + revenue mix) at
          a glance, without having to open the Summary tab. */}
      <div className="calc-composition-card">
        <div className="calc-composition-eyebrow">Revenue Composition</div>
        {calc.revenueByProduct.length === 0 ? (
          <div className="calc-composition-empty">
            Add products in the Assumptions panel to see the revenue mix.
          </div>
        ) : (
          <div className="calc-composition-body">
            <div className="calc-composition-chart">
              <DonutChart segments={calc.revenueByProduct} totalLabel={fmtINR(calc.revenue)} />
            </div>
            <div className="calc-composition-list">
              {calc.revenueByProduct.map(seg => {
                const pct = calc.revenue > 0 ? ((seg.value / calc.revenue) * 100).toFixed(0) : 0;
                return (
                  <div key={seg.name} className="calc-composition-row">
                    <span className="calc-composition-dot" style={{ background: seg.color }} />
                    <span className="calc-composition-name">{seg.name || 'Untitled'}</span>
                    <span className="calc-composition-value">{fmtINR(seg.value)}</span>
                    <span className="calc-composition-pct">{pct}%</span>
                  </div>
                );
              })}
              <div className="calc-composition-total">
                <span className="calc-composition-name"><strong>Total Revenue</strong></span>
                <span className="calc-composition-value"><strong>{fmtINR(calc.revenue)}</strong></span>
                <span className="calc-composition-pct">100%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* KPI tile grid — 4 across in a row spanning the full width */}
      <div className="calc-kpi-grid">
        {[
          {
            label: 'Annual Revenue',
            value: fmtINR(calc.revenue),
            sub: `over ${input.lifetime} yrs`,
            color: C.accent,
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><polyline points="3 17 9 11 13 15 21 7"/><polyline points="14 7 21 7 21 14"/></svg>,
            chart: <Sparkline values={calc.rows.map(r => r.revenue)} color={C.accent} width={120} height={26} />,
          },
          {
            label: 'EBITDA',
            value: fmtINR(calc.ebitda),
            sub: `${calc.ebitdaMargin.toFixed(0)}% margin`,
            color: ebitdaColor,
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>,
            chart: <Sparkline values={calc.rows.map(r => r.ebitda)} color={ebitdaColor} width={120} height={26} />,
          },
          {
            label: 'NPV',
            value: fmtINR(calc.npv),
            sub: `at ${dr}% discount`,
            color: npvColor,
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
            chart: <NPVBar value={calc.npv} scale={calc.effectiveCapex} color={npvColor} width={120} />,
          },
          {
            label: 'Payback',
            value: calc.payback !== null ? `${calc.payback} yr${calc.payback !== 1 ? 's' : ''}` : '—',
            sub: `${tn}-yr tenure`,
            color: paybackColor,
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
            chart: <PaybackTrack payback={calc.payback} tenure={tn} color={paybackColor} width={120} />,
          },
        ].map(m => (
          <div key={m.label} className="calc-kpi-card">
            <div className="calc-kpi-icon" style={{ background: alpha(m.color, 22), color: m.color }}>
              {m.icon}
            </div>
            <div className="calc-kpi-content">
              <div className="calc-kpi-label">{m.label}</div>
              <div className="calc-kpi-value" style={{ color: m.color }}>{m.value}</div>
              {m.sub && <div className="calc-kpi-sub">{m.sub}</div>}
              {m.chart && <div className="calc-kpi-chart">{m.chart}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
