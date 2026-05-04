import { C } from '../../../../tokens';
import { fmtINR, IS } from '../../../../components/calc/primitives';

// Capex Breakdown palette — same interleave-by-hue rule as Money Flow on
// Quick Estimate, so neighbouring segments always have wide colour-wheel
// separation. Reused from QuickEstimate so the visual language is
// consistent across the workspace.
const CAPEX_COLORS = [
  '#dc2626', // red-600
  '#16a34a', // green-600
  '#0ea5e9', // sky-500
  '#ea580c', // orange-600
  '#7c3aed', // violet-600
  '#eab308', // yellow-500
  '#0f172a', // slate-900
];

// Default percentages for the "Break into categories" seed action,
// based on a typical Indian MSME manufacturing project. Numbers sum to
// 100; sequence drives both the row order and the COLOR index.
const SEED_CATEGORIES = [
  { name: 'Land',            pct: 15 },
  { name: 'Building',        pct: 25 },
  { name: 'Machinery',       pct: 50 },
  { name: 'Infrastructure',  pct:  5 },
  { name: 'Working Capital', pct:  5 },
];

export default function CapexReturns({
  calc, input, dr, tn,
  irrColor, npvColor, paybackColor, dscrColor,
  setI, setRow, addRow, delRow,
}) {
  const capexRows    = input.capexRows || [];
  const grossCapex   = Number(input.capex) || 0;
  const subsidySaved = Math.max(0, grossCapex - calc.effectiveCapex);

  // Engine treats capexRows as authoritative when they sum > 0; otherwise
  // it falls back to the legacy `capex` scalar. Mirror that rule here so
  // the visual matches what the math is using.
  const rowsTotal = capexRows.reduce((s, r) => r.enabled === false ? s : s + Number(r.amount || 0), 0);
  const useRows   = rowsTotal > 0;

  // Build the segment list for the stacked bar + the editable row list.
  // When using rows, each row gets a colour by index. When falling back
  // to the legacy scalar, render a single synthetic segment.
  const segments = useRows
    ? capexRows
        .filter(r => r.enabled !== false && Number(r.amount) > 0)
        .map((r, i) => {
          const idxInAll = capexRows.indexOf(r);
          return { ...r, color: CAPEX_COLORS[idxInAll % CAPEX_COLORS.length] };
        })
    : (grossCapex > 0
        ? [{ id: 'legacy', name: 'CAPEX', amount: grossCapex, color: CAPEX_COLORS[0] }]
        : []);

  const segmentTotal = segments.reduce((s, r) => s + Number(r.amount), 0);

  const handleSeed = () => {
    // Distribute the existing capex value across the 5 default categories.
    // If capex is 0, seed at amount 0 — user can then enter values.
    setI({
      capexRows: SEED_CATEGORIES.map((c, i) => ({
        id: Date.now() + i,
        name: c.name,
        amount: Math.round(grossCapex * c.pct / 100),
        enabled: true,
      })),
    });
  };

  return (
    <div className="calc-deepdive-grid">

      {/* ── Capex Breakdown card ──────────────────────────────────────── */}
      <div className="calc-deepdive-card">
        <div className="calc-capex-card-head">
          <div className="calc-deepdive-eyebrow">Capex Breakdown</div>
          {!useRows && grossCapex > 0 && (
            <button type="button" className="calc-capex-seed-btn" onClick={handleSeed}>
              Break into categories
            </button>
          )}
          {useRows && (
            <button type="button" className="calc-capex-seed-btn"
              onClick={() => addRow('capexRows', { name: '', amount: 0, enabled: true })}>
              + Add category
            </button>
          )}
        </div>

        {/* Multi-segment stacked bar with % overlays for segments wide
            enough to fit text. Falls back to a "no breakdown yet" hint
            when there's nothing to show. */}
        {segments.length === 0 ? (
          <div className="calc-capex-empty">Add a CAPEX value in the rail or break it into categories.</div>
        ) : (
          <>
            <div className="calc-capex-bar-multi" aria-hidden="true">
              {segments.map(seg => {
                const pct = (Number(seg.amount) / segmentTotal) * 100;
                return (
                  <div key={seg.id}
                       className="calc-capex-bar-multi-seg"
                       style={{ width: `${pct}%`, background: seg.color }}
                       title={`${seg.name || 'Category'}: ${fmtINR(seg.amount)} · ${pct.toFixed(0)}%`}>
                    {pct >= 8 && <span className="calc-capex-bar-multi-pct">{pct.toFixed(0)}%</span>}
                  </div>
                );
              })}
            </div>

            <div className="calc-capex-rowlist">
              {capexRows
                .filter(r => r.enabled !== false)
                .map((r, i) => {
                  const idxInAll = capexRows.indexOf(r);
                  return (
                    <div key={r.id} className="calc-capex-rowlist-row">
                      <span className="calc-capex-rowlist-dot" style={{ background: CAPEX_COLORS[idxInAll % CAPEX_COLORS.length] }} />
                      <input
                        type="text"
                        value={r.name || ''}
                        placeholder={`Category ${i + 1}`}
                        onChange={e => setRow('capexRows', r.id, 'name', e.target.value)}
                        className="calc-capex-rowlist-name" />
                      <input
                        type="number"
                        value={r.amount || 0}
                        min={0}
                        step={10000}
                        onChange={e => setRow('capexRows', r.id, 'amount', Number(e.target.value) || 0)}
                        className="calc-capex-rowlist-amount" />
                      <span className="calc-capex-rowlist-fmt">{fmtINR(Number(r.amount) || 0)}</span>
                      <button type="button"
                              className="calc-capex-rowlist-del"
                              onClick={() => delRow('capexRows', r.id)}
                              aria-label={`Remove ${r.name || 'category'}`}>×</button>
                    </div>
                  );
                })}

              {/* Legacy single-row case — display only, no editing */}
              {!useRows && grossCapex > 0 && (
                <div className="calc-capex-rowlist-row" style={{ opacity: 0.85 }}>
                  <span className="calc-capex-rowlist-dot" style={{ background: CAPEX_COLORS[0] }} />
                  <span className="calc-capex-rowlist-name" style={{ paddingLeft: 8, color: C.fg2 }}>CAPEX (un-broken)</span>
                  <span className="calc-capex-rowlist-fmt">{fmtINR(grossCapex)}</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* Totals + subsidy + effective stack — outside the multi-segment
            display because they're aggregates, not per-category. */}
        <div className="calc-capex-rows" style={{ marginTop: 14 }}>
          <div className="calc-capex-row">
            <span>Total CAPEX</span>
            <strong>{fmtINR(useRows ? rowsTotal : grossCapex)}</strong>
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
              <span>Working capital (cash cycle)</span>
              <strong>{fmtINR(calc.workingCapital)}</strong>
            </div>
          )}
        </div>
      </div>

      {/* ── Returns Summary card (unchanged from Phase 1) ─────────────── */}
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
