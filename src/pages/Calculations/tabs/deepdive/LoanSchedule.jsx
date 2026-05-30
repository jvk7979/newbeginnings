import { C } from '../../../../tokens';
import { fmtINR } from '../../../../components/calc/primitives';
import LoanAmortisationChart from '../../../../components/calc/LoanAmortisationChart';
import GlossaryTerm from '../../../../components/calc/GlossaryTerm';

// Loan Schedule sub-tab — a stacked-bar amortisation chart of
// principal + interest per year, with the outstanding loan balance
// overlaid as a falling line. Banker-style debt-service narrative for
// the project. Footer KPIs summarise the loan: total interest paid,
// % of total debt service that's interest in Y1 vs Y(tenure), etc.
export default function LoanSchedule({ calc, input }) {
  if (!calc.rows || calc.rows.length === 0 || !calc.loan) {
    return (
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, fontStyle: 'italic', padding: '20px 0' }}>
        Add a CAPEX value with debt &gt; 0 to see the loan schedule.
      </div>
    );
  }

  const tenure = Math.max(1, Number(input.tenure) || 1);
  const tenureRows = calc.rows.slice(0, Math.min(tenure, calc.rows.length));

  const totalInterest  = tenureRows.reduce((s, r) => s + r.interest, 0);
  const totalPrincipal = tenureRows.reduce((s, r) => s + r.principal, 0);

  const y1 = tenureRows[0];
  const yLast = tenureRows[tenureRows.length - 1];
  const y1InterestPct   = y1 ? (y1.interest   / Math.max(0.01, y1.interest + y1.principal)) * 100 : 0;
  const yLastInterestPct = yLast ? (yLast.interest / Math.max(0.01, yLast.interest + yLast.principal)) * 100 : 0;

  // Total subvention (rebate) over the loan, if any — counter-balance
  // to interest so users see the net cost.
  const totalSubvention = calc.totalSubvention || 0;
  const netInterestCost = totalInterest - totalSubvention;

  return (
    <div className="calc-loan">

      <div className="calc-loan-head">
        <div>
          <div className="calc-loan-title">Loan Amortisation Schedule</div>
          <div className="calc-loan-sub">
            Each year's debt service is split into principal (sage) and interest (red). Interest dominates early because the loan balance is high; principal dominates late because the balance has tailed off. The blue line traces outstanding balance.
          </div>
        </div>
      </div>

      <div className="calc-loan-chart-card">
        <LoanAmortisationChart rows={calc.rows} tenure={tenure} />
      </div>

      <div className="calc-loan-kpis">
        {[
          {
            label: <GlossaryTerm term="Debt">Loan Amount</GlossaryTerm>,
            value: fmtINR(calc.loan),
            sub: `${input.debtPct}% × Effective CAPEX`,
            color: C.fg1,
          },
          {
            label: 'Total Interest Paid',
            value: fmtINR(totalInterest),
            sub: `${tenure}-yr tenure @ ${input.interestRate}%`,
            color: C.chartNegative,
          },
          {
            label: 'Total Principal Repaid',
            value: fmtINR(totalPrincipal),
            sub: 'straight-line over tenure',
            color: C.accent,
          },
          ...(totalSubvention > 0
            ? [{
                label: <GlossaryTerm term="Total Subvention">Less: Subvention</GlossaryTerm>,
                value: '−' + fmtINR(totalSubvention),
                sub: 'government rebate',
                color: C.chartPositive,
              }, {
                label: 'Net Interest Cost',
                value: fmtINR(netInterestCost),
                sub: 'after subvention',
                color: C.chartNegative,
              }]
            : []),
          {
            label: 'Interest % in Y1',
            value: `${y1InterestPct.toFixed(0)}%`,
            sub: 'of debt service',
            color: C.chartNegative,
          },
          {
            label: `Interest % in Y${yLast?.t || tenure}`,
            value: `${yLastInterestPct.toFixed(0)}%`,
            sub: 'of debt service',
            color: C.chartNegative,
          },
        ].map((t, i) => (
          <div key={i} className="calc-loan-kpi">
            <div className="calc-loan-kpi-label">{t.label}</div>
            <div className="calc-loan-kpi-value" style={{ color: t.color }}>{t.value}</div>
            <div className="calc-loan-kpi-sub">{t.sub}</div>
          </div>
        ))}
      </div>

      <div className="calc-loan-hint">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14" height="14">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <circle cx="12" cy="16" r="0.5" fill="currentColor"/>
        </svg>
        <span>This model uses straight-line principal — equal principal each year. Real bank EMIs front-load interest more heavily, so your actual Y1 DSCR may be slightly tighter than what's shown.</span>
      </div>
    </div>
  );
}
