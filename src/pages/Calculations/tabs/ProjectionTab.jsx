import { C, alpha } from '../../../tokens';
import { fmtINR } from '../../../components/calc/primitives';

// Year-by-year P&L + cash-flow table. Row tinting: alternate bg + sage tint
// on the break-even year (first year cumulative NCF ≥ 0).
export default function ProjectionTab({ calc }) {
  const headers = ['Yr', 'Revenue', 'Var', 'Fixed', 'EBITDA', 'Depr.', 'Interest', 'EBT', 'Tax', 'PAT', 'Principal', 'NCF', 'Cum NCF', 'DSCR', 'Loan Bal.'];
  return (
    <div style={{ overflowX: 'auto', border: `1px solid ${C.border}`, borderRadius: 10 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
        <thead>
          <tr style={{ background: C.bg2 }}>
            {headers.map(h => (
              <th key={h} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 700, color: C.fg3, padding: '8px 9px', textAlign: 'right', whiteSpace: 'nowrap', borderBottom: `1px solid ${C.border}` }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {calc.rows.map((row, i) => {
            const isBreakEven = row.cumNCF >= 0 && (i === 0 || calc.rows[i - 1].cumNCF < 0);
            const rowDscrColor = row.dscr === null ? C.fg2 : row.dscr >= 1.5 ? '#2a7d3c' : row.dscr >= 1.25 ? '#b06000' : '#c0392b';
            return (
              <tr key={row.t} style={{ background: isBreakEven ? alpha(C.accent, 22) : i % 2 === 0 ? C.bg0 : C.bg1, borderBottom: `1px solid ${C.border}` }}>
                <td style={{ padding: '6px 9px', textAlign: 'right', color: C.fg2, fontWeight: 600 }}>{row.t}</td>
                <td style={{ padding: '6px 9px', textAlign: 'right', color: C.fg1 }}>{fmtINR(row.revenue)}</td>
                <td style={{ padding: '6px 9px', textAlign: 'right', color: C.fg2 }}>{fmtINR(row.variableCosts)}</td>
                <td style={{ padding: '6px 9px', textAlign: 'right', color: C.fg2 }}>{fmtINR(row.fixedCosts)}</td>
                <td style={{ padding: '6px 9px', textAlign: 'right', color: C.fg1, fontWeight: 600 }}>{fmtINR(row.ebitda)}</td>
                <td style={{ padding: '6px 9px', textAlign: 'right', color: C.fg3 }}>{fmtINR(row.depreciation)}</td>
                <td style={{ padding: '6px 9px', textAlign: 'right', color: C.fg3 }}>{fmtINR(row.interest)}</td>
                <td style={{ padding: '6px 9px', textAlign: 'right', color: row.ebt < 0 ? '#c0392b' : C.fg1 }}>{fmtINR(row.ebt)}</td>
                <td style={{ padding: '6px 9px', textAlign: 'right', color: C.fg3 }}>{fmtINR(row.tax)}</td>
                <td style={{ padding: '6px 9px', textAlign: 'right', color: row.pat < 0 ? '#c0392b' : C.fg1 }}>{fmtINR(row.pat)}</td>
                <td style={{ padding: '6px 9px', textAlign: 'right', color: C.fg3 }}>{fmtINR(row.principal)}</td>
                <td style={{ padding: '6px 9px', textAlign: 'right', color: row.ncf < 0 ? '#c0392b' : '#2a7d3c', fontWeight: 700 }}>{fmtINR(row.ncf)}</td>
                <td style={{ padding: '6px 9px', textAlign: 'right', color: row.cumNCF < 0 ? '#c0392b' : '#2a7d3c', fontWeight: 700 }}>{fmtINR(row.cumNCF)}</td>
                <td style={{ padding: '6px 9px', textAlign: 'right', color: rowDscrColor, fontWeight: 600 }}>{row.dscr !== null ? row.dscr.toFixed(2) : '—'}</td>
                <td style={{ padding: '6px 9px', textAlign: 'right', color: C.fg3 }}>{fmtINR(row.loanBalance)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
