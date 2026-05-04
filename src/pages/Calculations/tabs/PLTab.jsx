import { C } from '../../../tokens';
import { fmtINR } from '../../../components/calc/primitives';

// P&L & CAPEX — KPI cards in a responsive grid. Each card is one canonical
// metric with its sub-context.
export default function PLTab({ calc, input, dr, tn, ebitdaColor, irrColor, npvColor, paybackColor, dscrColor }) {
  const cards = [
    { label: 'Effective CAPEX', value: fmtINR(calc.effectiveCapex), sub: 'after subsidies', color: C.fg1 },
    { label: 'Equity Required', value: fmtINR(calc.equity), sub: `${100 - input.debtPct}% of capex`, color: C.fg1 },
    { label: 'Loan Amount',     value: fmtINR(calc.loan), sub: `${input.debtPct}% debt`, color: C.fg1 },
    { label: 'Annual Revenue',  value: fmtINR(calc.revenue), sub: `at ${input.capacityPct}% capacity`, color: C.fg1 },
    { label: 'EBITDA',          value: fmtINR(calc.ebitda), sub: `${calc.ebitdaMargin.toFixed(1)}% margin`, color: ebitdaColor },
    { label: 'IRR',             value: calc.irr !== null ? `${calc.irr.toFixed(1)}%` : '—', sub: `vs ${dr}% hurdle`, color: irrColor },
    { label: 'NPV',             value: fmtINR(calc.npv), sub: `at ${dr}% discount`, color: npvColor },
    { label: 'Payback',         value: calc.payback !== null ? `${calc.payback} yr${calc.payback !== 1 ? 's' : ''}` : '> lifetime', sub: `${tn}-yr loan`, color: paybackColor },
    { label: 'Y1 DSCR',         value: calc.dscrY1 !== null ? calc.dscrY1.toFixed(2) : '—', sub: '≥ 1.25 comfortable', color: dscrColor },
    { label: 'Break-even Rev',  value: calc.breakEvenRev !== null ? fmtINR(calc.breakEvenRev) + '/yr' : '—', sub: 'cover fixed costs', color: C.fg1 },
    { label: 'Working Capital', value: fmtINR(calc.workingCapital), sub: `${input.receivableDays}R + ${input.inventoryDays}I − ${input.payableDays}P d`, color: C.fg1 },
    ...(calc.totalSubvention > 0 ? [{ label: 'Total Subvention', value: fmtINR(calc.totalSubvention), sub: `${input.interestSubventionPct}% over ${input.interestSubventionYears} yrs`, color: '#2a7d3c' }] : []),
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
      {cards.map(card => (
        <div key={card.label} style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.fg3, marginBottom: 6 }}>{card.label}</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: card.color, marginBottom: 4 }}>{card.value}</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3 }}>{card.sub}</div>
        </div>
      ))}
    </div>
  );
}
