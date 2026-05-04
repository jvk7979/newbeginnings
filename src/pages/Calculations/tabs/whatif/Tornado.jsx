import { useState, useMemo } from 'react';
import { C } from '../../../../tokens';
import { runSensitivity } from '../../../../utils/calcEngine';
import { fmtINR } from '../../../../components/calc/primitives';

// Twin-axis tornado chart. Each driver row:
//   - left bar shows the impact of a -20% flex (red if it hurts, green if
//     it helps the chosen metric)
//   - right bar shows the impact of a +20% flex (same colour rule)
//   - the bar's value is rendered IN ₹ inside the bar (or alongside when
//     too narrow), with a ±% swing column on the right
// User toggles between EBITDA and PAT at the top right. The most-impacting
// driver gets a TOP badge. An insight footer explains what to focus on.
export default function Tornado({ input, calc }) {
  const [metric, setMetric] = useState('ebitda');
  const flexPct = 20;

  const { base, rows } = useMemo(() => runSensitivity(input, flexPct), [input]);

  if (!rows || rows.length === 0) {
    return (
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, fontStyle: 'italic', padding: '20px 0' }}>
        Sensitivity needs revenue and costs to flex. Add CAPEX, products and costs first.
      </div>
    );
  }

  const baseValue = metric === 'ebitda' ? base.ebitda : base.pat;
  const deltaLowKey  = metric === 'ebitda' ? 'deltaEbitdaLow'  : 'deltaPatLow';
  const deltaHighKey = metric === 'ebitda' ? 'deltaEbitdaHigh' : 'deltaPatHigh';

  const sorted = [...rows].sort((a, b) =>
    Math.max(Math.abs(b[deltaLowKey]), Math.abs(b[deltaHighKey])) -
    Math.max(Math.abs(a[deltaLowKey]), Math.abs(a[deltaHighKey]))
  );

  const maxAbs = Math.max(0.01, ...sorted.map(r =>
    Math.max(Math.abs(r[deltaLowKey]), Math.abs(r[deltaHighKey]))
  ));

  const top = sorted[0];
  const second = sorted[1];
  const topImpact = Math.max(Math.abs(top[deltaLowKey]), Math.abs(top[deltaHighKey]));
  const secondImpact = second
    ? Math.max(Math.abs(second[deltaLowKey]), Math.abs(second[deltaHighKey]))
    : 0;
  const dominates = secondImpact > 0 && topImpact > secondImpact * 1.5;
  const metricLabel = metric === 'ebitda' ? 'EBITDA' : 'PAT';
  const insightText = dominates
    ? `${top.label} dominates risk on ${metricLabel} — focus contracts and hedges there. Bottom drivers are safe to lock as standing assumptions.`
    : `${top.label} has the largest swing on ${metricLabel}, with ${second?.label ?? '—'} a close second. Both deserve scenario testing.`;

  return (
    <div className="calc-whatif">

      <div className="calc-whatif-head">
        <div>
          <div className="calc-whatif-title">Sensitivity Tornado</div>
          <div className="calc-whatif-sub">
            ±{flexPct}% shock on each driver, ranked by impact. Base {metricLabel}: <strong style={{ color: baseValue >= 0 ? '#2a7d3c' : '#c0392b' }}>{fmtINR(baseValue)}</strong>
          </div>
        </div>
        <div className="calc-whatif-toggle" role="tablist" aria-label="Metric">
          {[
            ['ebitda', 'EBITDA'],
            ['pat',    'PAT'],
          ].map(([id, lbl]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={metric === id}
              data-active={metric === id ? 'true' : 'false'}
              onClick={() => setMetric(id)}
              className="calc-whatif-toggle-btn">
              {lbl}
            </button>
          ))}
        </div>
      </div>

      <div className="calc-whatif-rows">
        {sorted.map((r, i) => {
          const dLow  = r[deltaLowKey];
          const dHigh = r[deltaHighKey];
          const rowMax = Math.max(Math.abs(dLow), Math.abs(dHigh));
          const swingPct = Math.abs(baseValue) > 0 ? (rowMax / Math.abs(baseValue)) * 100 : 0;

          const lowWidth  = (Math.abs(dLow)  / maxAbs) * 100;
          const highWidth = (Math.abs(dHigh) / maxAbs) * 100;
          const lowColor  = dLow  < 0 ? '#dc2626' : '#16a34a';
          const highColor = dHigh > 0 ? '#16a34a' : '#dc2626';
          const lowSign   = dLow  > 0 ? '+' : (dLow  < 0 ? '−' : '');
          const highSign  = dHigh > 0 ? '+' : (dHigh < 0 ? '−' : '');

          return (
            <div key={r.key} className="calc-whatif-row">
              <div className="calc-whatif-label">
                {i === 0 && <span className="calc-whatif-top-badge">TOP</span>}
                <span>{r.label}</span>
              </div>

              <div className="calc-whatif-half left">
                {lowWidth <= 22 && Math.abs(dLow) > 0 && (
                  <span className="calc-whatif-bar-label-out left" style={{ color: lowColor }}>
                    {lowSign}{fmtINR(Math.abs(dLow))}
                  </span>
                )}
                <div className="calc-whatif-bar"
                     style={{ width: `${lowWidth}%`, background: lowColor }}>
                  {lowWidth > 22 && (
                    <span className="calc-whatif-bar-label">
                      {lowSign}{fmtINR(Math.abs(dLow))}
                    </span>
                  )}
                </div>
              </div>

              <div className="calc-whatif-half right">
                <div className="calc-whatif-bar"
                     style={{ width: `${highWidth}%`, background: highColor }}>
                  {highWidth > 22 && (
                    <span className="calc-whatif-bar-label">
                      {highSign}{fmtINR(Math.abs(dHigh))}
                    </span>
                  )}
                </div>
                {highWidth <= 22 && Math.abs(dHigh) > 0 && (
                  <span className="calc-whatif-bar-label-out right" style={{ color: highColor }}>
                    {highSign}{fmtINR(Math.abs(dHigh))}
                  </span>
                )}
              </div>

              <div className="calc-whatif-pct">±{swingPct.toFixed(0)}%</div>
            </div>
          );
        })}
      </div>

      <div className="calc-whatif-axis">
        <span>−{flexPct}% shock</span>
        <span>+{flexPct}% shock</span>
      </div>

      <div className="calc-whatif-insight">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14" height="14">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <circle cx="12" cy="16" r="0.5" fill="currentColor"/>
        </svg>
        <span>{insightText}</span>
      </div>
    </div>
  );
}
