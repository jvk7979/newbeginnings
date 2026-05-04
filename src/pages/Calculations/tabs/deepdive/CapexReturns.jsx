import { C, alpha } from '../../../../tokens';
import { fmtINR } from '../../../../components/calc/primitives';

// Two-column block: a "Capex breakdown" stack on the left (gross capex →
// subsidy savings → effective capex) and a "Returns Summary" KPI cluster
// on the right. Reuses values from the existing engine — no new fields,
// no new math. Stacked-bar visual is purely informational; engine still
// treats capex as a single number.
export default function CapexReturns({ calc, input, dr, tn, irrColor, npvColor, paybackColor, dscrColor }) {
  const grossCapex     = Number(input.capex) || 0;
  const subsidySaved   = Math.max(0, grossCapex - calc.effectiveCapex);
  const subsidyPct     = grossCapex > 0 ? (subsidySaved / grossCapex) * 100 : 0;
  const effectivePct   = 100 - subsidyPct;

  return (
    <div className="calc-deepdive-grid">

      {/* ── Capex breakdown card ──────────────────────────────────────── */}
      <div className="calc-deepdive-card">
        <div className="calc-deepdive-eyebrow">Capex Breakdown</div>

        {grossCapex > 0 ? (
          <>
            <div className="calc-capex-bar" aria-hidden="true">
              <div className="calc-capex-bar-fill calc-capex-bar-effective"
                   style={{ width: `${effectivePct}%` }} />
              {subsidyPct > 0 && (
                <div className="calc-capex-bar-fill calc-capex-bar-subsidy"
                     style={{ width: `${subsidyPct}%` }} />
              )}
            </div>
            <div className="calc-capex-legend">
              <span><span className="dot calc-capex-dot-effective" /> Effective {fmtINR(calc.effectiveCapex)} · {effectivePct.toFixed(0)}%</span>
              {subsidyPct > 0 && (
                <span><span className="dot calc-capex-dot-subsidy" /> Subsidy {fmtINR(subsidySaved)} · {subsidyPct.toFixed(0)}%</span>
              )}
            </div>
          </>
        ) : (
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, fontStyle: 'italic' }}>
            Add a CAPEX value to see the breakdown.
          </div>
        )}

        <div className="calc-capex-rows">
          <div className="calc-capex-row">
            <span>Total CAPEX</span>
            <strong>{fmtINR(grossCapex)}</strong>
          </div>
          {subsidySaved > 0 && (
            <div className="calc-capex-row" style={{ color: C.accent }}>
              <span>Less: subsidy</span>
              <strong>−{fmtINR(subsidySaved)}</strong>
            </div>
          )}
          <div className="calc-capex-row calc-capex-row-total">
            <span>Effective CAPEX</span>
            <strong>{fmtINR(calc.effectiveCapex)}</strong>
          </div>
          <div className="calc-capex-row">
            <span>Equity ({100 - input.debtPct}%)</span>
            <strong>{fmtINR(calc.equity)}</strong>
          </div>
          <div className="calc-capex-row">
            <span>Debt ({input.debtPct}% @ {input.interestRate}%)</span>
            <strong>{fmtINR(calc.loan)}</strong>
          </div>
          {calc.workingCapital > 0 && (
            <div className="calc-capex-row" style={{ paddingTop: 6, borderTop: `1px dashed ${C.border}`, marginTop: 4 }}>
              <span>Working capital</span>
              <strong>{fmtINR(calc.workingCapital)}</strong>
            </div>
          )}
        </div>
      </div>

      {/* ── Returns summary card ──────────────────────────────────────── */}
      <div className="calc-deepdive-card">
        <div className="calc-deepdive-eyebrow">Returns Summary</div>
        <div className="calc-returns-grid">
          {[
            { label: 'IRR (project)',    value: calc.irr !== null ? `${calc.irr.toFixed(1)}%` : '—', sub: `vs ${dr}% hurdle`,            color: irrColor },
            { label: 'NPV',              value: fmtINR(calc.npv),                                    sub: `at ${dr}% discount`,          color: npvColor },
            { label: 'Payback',          value: calc.payback !== null ? `${calc.payback} yr${calc.payback !== 1 ? 's' : ''}` : '> life', sub: `${tn}-yr loan`, color: paybackColor },
            { label: 'Y1 DSCR',          value: calc.dscrY1 !== null ? calc.dscrY1.toFixed(2) : '—', sub: '≥ 1.25 comfortable',          color: dscrColor },
            { label: 'Break-even Rev',   value: calc.breakEvenRev !== null ? fmtINR(calc.breakEvenRev) + '/yr' : '—', sub: 'cover fixed costs', color: C.fg1 },
            ...(calc.totalSubvention > 0
              ? [{ label: 'Total Subvention', value: fmtINR(calc.totalSubvention), sub: `${input.interestSubventionPct}% × ${input.interestSubventionYears} yrs`, color: '#2a7d3c' }]
              : []),
          ].map(card => (
            <div key={card.label} className="calc-returns-tile">
              <div className="calc-returns-tile-label">{card.label}</div>
              <div className="calc-returns-tile-value" style={{ color: card.color }}>{card.value}</div>
              <div className="calc-returns-tile-sub">{card.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
