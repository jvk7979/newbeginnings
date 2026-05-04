import { C } from '../../../tokens';
import { runCalc, DEFAULT_CALC_INPUT } from '../../../utils/calcEngine';
import { fmtINR, IS } from '../../../components/calc/primitives';

// Pick another eligible project, render its saved calc alongside this one.
// Re-runs runCalc on the comparison project's saved input so the metrics
// reflect the current engine, not what was saved.
export default function CompareTab({ eligible, selectedProject, calc, compareWithId, setCompareWithId }) {
  const others = eligible.filter(p => p.id !== selectedProject.id);
  const compareWith = others.find(p => p.id === compareWithId) || null;
  const compareCalc = compareWith?.calc ? runCalc({ ...DEFAULT_CALC_INPUT, ...compareWith.calc }) : null;

  if (others.length === 0) {
    return (
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3, padding: '40px 0', textAlign: 'center', lineHeight: 1.6 }}>
        Compare needs at least two eligible projects.<br/>
        Mark another project eligible to use this tab.
      </div>
    );
  }

  const metrics = [
    { label: 'Annual Revenue', a: fmtINR(calc.revenue),       b: compareCalc ? fmtINR(compareCalc.revenue) : '—' },
    { label: 'EBITDA',         a: fmtINR(calc.ebitda),        b: compareCalc ? fmtINR(compareCalc.ebitda)  : '—' },
    { label: 'EBITDA Margin',  a: `${calc.ebitdaMargin.toFixed(1)}%`, b: compareCalc ? `${compareCalc.ebitdaMargin.toFixed(1)}%` : '—' },
    { label: 'IRR',            a: calc.irr !== null ? `${calc.irr.toFixed(1)}%` : '—', b: compareCalc?.irr !== null && compareCalc?.irr !== undefined ? `${compareCalc.irr.toFixed(1)}%` : '—' },
    { label: 'NPV',            a: fmtINR(calc.npv),           b: compareCalc ? fmtINR(compareCalc.npv)     : '—' },
    { label: 'Payback (yrs)',  a: calc.payback !== null ? String(calc.payback) : '—', b: compareCalc?.payback !== null && compareCalc?.payback !== undefined ? String(compareCalc.payback) : '—' },
    { label: 'Y1 DSCR',        a: calc.dscrY1 !== null ? calc.dscrY1.toFixed(2) : '—', b: compareCalc?.dscrY1 !== null && compareCalc?.dscrY1 !== undefined ? compareCalc.dscrY1.toFixed(2) : '—' },
    { label: 'Eff. CAPEX',     a: fmtINR(calc.effectiveCapex), b: compareCalc ? fmtINR(compareCalc.effectiveCapex) : '—' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.fg3 }}>Compare with</span>
        <select value={compareWithId || ''}
          onChange={e => setCompareWithId(e.target.value ? Number(e.target.value) : null)}
          style={{ ...IS, fontSize: 13, padding: '5px 10px', cursor: 'pointer', maxWidth: 320 }}>
          <option value="">— Select another eligible project —</option>
          {others.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
      </div>

      {!compareWith && (
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, fontStyle: 'italic' }}>
          Pick a project above to see a side-by-side comparison.
        </div>
      )}

      {compareWith && !compareCalc && (
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, padding: '12px 14px', background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 8 }}>
          <strong>{compareWith.title}</strong> has no saved calculation yet. Open it in the Calculations page, fill in inputs, and Save first.
        </div>
      )}

      {compareWith && compareCalc && (
        <div style={{ overflowX: 'auto', border: `1px solid ${C.border}`, borderRadius: 10 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.bg2 }}>
                <th style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.fg3, padding: '10px 14px', textAlign: 'left', borderBottom: `1px solid ${C.border}` }}>Metric</th>
                <th style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, color: C.fg1, padding: '10px 14px', textAlign: 'right', borderBottom: `1px solid ${C.border}` }}>{selectedProject.title}</th>
                <th style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, color: C.fg1, padding: '10px 14px', textAlign: 'right', borderBottom: `1px solid ${C.border}` }}>{compareWith.title}</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m, i) => (
                <tr key={m.label} style={{ background: i % 2 === 0 ? C.bg0 : C.bg1, borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg2, padding: '8px 14px' }}>{m.label}</td>
                  <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: C.fg1, fontWeight: 600, padding: '8px 14px', textAlign: 'right' }}>{m.a}</td>
                  <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: C.fg1, fontWeight: 600, padding: '8px 14px', textAlign: 'right' }}>{m.b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
