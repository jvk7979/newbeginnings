import { useState, useMemo } from 'react';
import { C, alpha } from '../tokens';
import { usePlans } from '../context/AppContext';
import { runCalc, DEFAULT_CALC_INPUT, normalizeCalcInput } from '../utils/calcEngine';
import { fmtINR } from '../components/calc/primitives';

const fmtPct = (v) => v == null || !isFinite(v) ? '—' : `${v.toFixed(1)}%`;
const fmtYrs = (v) => v == null ? '> life' : `${v} yr${v === 1 ? '' : 's'}`;
const fmtCap = (v) => v == null || !isFinite(v) ? '—' : `${Math.round(v)}%`;

// Run the engine on one project's saved calc and reduce it to the row
// the portfolio table needs. Mirrors the load path in CalculationsPage:
// normalize the saved input (kg/ton migration) before merging defaults.
function projectRow(plan) {
  const normalized = normalizeCalcInput(plan.calc);
  const input = normalized && typeof normalized === 'object'
    ? { ...DEFAULT_CALC_INPUT, ...normalized }
    : DEFAULT_CALC_INPUT;
  const calc = runCalc(input);
  const hurdle = Number(input.discountRate) || 0;
  const hasData = calc.revenue > 0 || calc.effectiveCapex > 0;

  let verdict; // 'Viable' | 'Below hurdle' | 'No data'
  if (!hasData || calc.irr == null) verdict = !hasData ? 'No data' : 'Below hurdle';
  else verdict = calc.irr > hurdle ? 'Viable' : 'Below hurdle';

  return {
    id: plan.id,
    title: plan.title || 'Untitled project',
    irr: calc.irr,
    npv: isFinite(calc.npv) ? calc.npv : null,
    payback: calc.payback,
    operatingProfit: calc.ebitda,
    netProfit: calc.netProfitY1 ?? 0,
    breakEven: calc.breakEvenCapacity,
    verdict,
  };
}

const COLUMNS = [
  { key: 'title',           label: 'Project',    align: 'left',  fmt: (v) => v },
  { key: 'irr',             label: 'IRR',        align: 'right', fmt: fmtPct },
  { key: 'npv',             label: 'NPV',        align: 'right', fmt: (v) => v == null ? '—' : fmtINR(v) },
  { key: 'payback',         label: 'Payback',    align: 'right', fmt: fmtYrs },
  { key: 'operatingProfit', label: 'Op. Profit', align: 'right', fmt: (v) => fmtINR(v) },
  { key: 'netProfit',       label: 'Net Profit', align: 'right', fmt: (v) => fmtINR(v) },
  { key: 'breakEven',       label: 'Break-even', align: 'right', fmt: fmtCap },
  { key: 'verdict',         label: 'Verdict',    align: 'left',  fmt: (v) => v },
];

const VERDICT_COLOR = { 'Viable': C.chartPositive, 'Below hurdle': C.chartNegative, 'No data': C.fg3 };

// For sorting: pull a comparable value. Payback null = worst (Infinity);
// other null metrics sort last regardless of direction by being pushed
// to the bottom in the comparator.
const sortVal = (row, key) => {
  const v = row[key];
  if (key === 'title' || key === 'verdict') return String(v).toLowerCase();
  if (v == null) return null;
  return v;
};

// Portfolio dashboard — every calc-eligible project's headline financials
// in one sortable table, with a summary strip across the top.
export default function PortfolioPage() {
  const { plans } = usePlans();
  const [sort, setSort] = useState({ key: 'irr', dir: 'desc' });

  const eligible = useMemo(() => plans.filter(p => p.eligibleForCalc), [plans]);
  const rows = useMemo(() => eligible.map(projectRow), [eligible]);

  const sorted = useMemo(() => {
    const arr = [...rows];
    const { key, dir } = sort;
    arr.sort((a, b) => {
      const av = sortVal(a, key);
      const bv = sortVal(b, key);
      // nulls always sink to the bottom regardless of direction
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [rows, sort]);

  const summary = useMemo(() => {
    const irrs = rows.map(r => r.irr).filter(v => v != null && isFinite(v));
    const npvs = rows.map(r => r.npv).filter(v => v != null && isFinite(v));
    return {
      count: rows.length,
      viable: rows.filter(r => r.verdict === 'Viable').length,
      totalNPV: npvs.reduce((s, v) => s + v, 0),
      avgIRR: irrs.length ? irrs.reduce((s, v) => s + v, 0) / irrs.length : null,
    };
  }, [rows]);

  const toggleSort = (key) => {
    setSort(s => s.key === key
      ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
      : { key, dir: key === 'title' || key === 'verdict' ? 'asc' : 'desc' });
  };

  return (
    <div className="page-pad" style={{ background: C.bg0, flex: 1, overflowY: 'auto' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, letterSpacing: '0.06em', color: C.fg3, marginBottom: 10, textTransform: 'uppercase' }}>
          Portfolio
        </div>
        <h1 className="page-title" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 34, fontWeight: 600, color: C.fg1, margin: 0, lineHeight: 1.15 }}>
          Project Portfolio
        </h1>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3, marginTop: 4 }}>
          Headline financials for every calc-eligible project, side by side.
        </div>
      </div>

      {eligible.length === 0 ? (
        <div style={{ background: C.bg1, border: `1px dashed ${C.border}`, borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 600, color: C.fg1, marginBottom: 6 }}>No projects to compare yet</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3 }}>
            Mark a project as eligible for calculations, fill in its numbers, and it will appear here.
          </div>
        </div>
      ) : (
        <>
          {/* Summary strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Projects', value: String(summary.count), color: C.fg1 },
              { label: 'Viable', value: `${summary.viable} / ${summary.count}`, color: summary.viable > 0 ? C.chartPositive : C.fg2 },
              { label: 'Combined NPV', value: fmtINR(summary.totalNPV), color: summary.totalNPV >= 0 ? C.chartPositive : C.chartNegative },
              { label: 'Average IRR', value: fmtPct(summary.avgIRR), color: C.fg1 },
            ].map(t => (
              <div key={t.label} style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.fg3, marginBottom: 6 }}>{t.label}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: t.color }}>{t.value}</div>
              </div>
            ))}
          </div>

          {/* Comparison table */}
          <div style={{ overflowX: 'auto', border: `1px solid ${C.border}`, borderRadius: 10 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
              <thead>
                <tr style={{ background: C.bg2 }}>
                  {COLUMNS.map(col => (
                    <th key={col.key} onClick={() => toggleSort(col.key)}
                      style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, color: sort.key === col.key ? C.accent : C.fg3, padding: '10px 12px', textAlign: col.align, whiteSpace: 'nowrap', borderBottom: `1px solid ${C.border}`, cursor: 'pointer', userSelect: 'none' }}>
                      {col.label}
                      {sort.key === col.key && <span style={{ marginLeft: 4 }}>{sort.dir === 'asc' ? '▲' : '▼'}</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((row, i) => (
                  <tr key={row.id} style={{ background: i % 2 === 0 ? C.bg0 : C.bg1, borderBottom: `1px solid ${C.border}` }}>
                    {COLUMNS.map(col => {
                      if (col.key === 'verdict') {
                        return (
                          <td key={col.key} style={{ padding: '9px 12px' }}>
                            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, color: VERDICT_COLOR[row.verdict], background: alpha(VERDICT_COLOR[row.verdict], 13), border: `1px solid ${alpha(VERDICT_COLOR[row.verdict], 33)}`, borderRadius: 4, padding: '2px 8px', whiteSpace: 'nowrap' }}>
                              {row.verdict}
                            </span>
                          </td>
                        );
                      }
                      const isNeg = col.align === 'right' && typeof row[col.key] === 'number' && row[col.key] < 0;
                      return (
                        <td key={col.key} style={{
                          padding: '9px 12px',
                          textAlign: col.align,
                          fontFamily: col.key === 'title' ? "'DM Sans', sans-serif" : "'JetBrains Mono', monospace",
                          fontWeight: col.key === 'title' ? 600 : 500,
                          color: isNeg ? C.chartNegative : C.fg1,
                          whiteSpace: col.key === 'title' ? 'normal' : 'nowrap',
                          minWidth: col.key === 'title' ? 160 : 'auto',
                        }}>
                          {col.fmt(row[col.key])}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, marginTop: 10 }}>
            Operating Profit is the steady-state figure at the capacity ceiling · Net Profit is Year 1 (after interest, tax, principal) · click any column header to sort.
          </div>
        </>
      )}
    </div>
  );
}
