import { useState, useMemo } from 'react';
import { C } from '../../../../tokens';
import { solveForMulti } from '../../../../utils/calcEngine';
import { fmtINR } from '../../../../components/calc/primitives';

// Goal Seek — multi-target solver. Pick 1+ constraints (e.g.,
// "IRR ≥ 18% AND DSCR ≥ 1.25"), pick a single lever to adjust, click
// Solve. Engine grid-scans the lever's range, finds the value that
// satisfies all constraints simultaneously (and picks the one closest
// to the user's current saved value when there are many). When no
// value satisfies, the result card shows which constraint binds and
// what the closest-achievable values are.

const TARGETS = [
  { key: 'irr',     label: 'IRR',       unit: '%',  metric: (r) => r.irr },
  { key: 'npv',     label: 'NPV',       unit: '₹',  metric: (r) => r.npv },
  { key: 'ebitda',  label: 'EBITDA Y1', unit: '₹',  metric: (r) => r.rows[0]?.ebitda ?? 0 },
  { key: 'payback', label: 'Payback',   unit: 'yr', metric: (r) => r.payback ?? 99 },
  { key: 'dscrY1',  label: 'Y1 DSCR',   unit: '',   metric: (r) => r.dscrY1 ?? 0 },
];

const LEVERS = [
  {
    key: 'capex', label: 'Total CAPEX', unit: '₹',
    min: 100000, max: 500000000,
    read: (i) => Number(i.capex || 0),
    patch: (v) => ({ capex: v, capexRows: [] }),
  },
  {
    key: 'capacityCeilingPct', label: 'Capacity Ceiling', unit: '%',
    min: 10, max: 100,
    read: (i) => Number(i.capacityCeilingPct ?? i.capacityPct ?? 80),
    patch: (v) => ({ capacityCeilingPct: v, capacityPct: v }),
  },
  {
    key: 'interestRate', label: 'Interest Rate', unit: '%',
    min: 1, max: 25,
    read: (i) => Number(i.interestRate ?? 12),
    patch: (v) => ({ interestRate: v }),
  },
  {
    key: 'debtPct', label: 'Debt %', unit: '%',
    min: 0, max: 100,
    read: (i) => Number(i.debtPct ?? 60),
    patch: (v) => ({ debtPct: v }),
  },
  {
    key: 'salePriceMult', label: 'Sale-Price Multiplier', unit: '× current',
    min: 0.5, max: 2.5,
    read: () => 1,
    patch: (v) => null,
  },
  {
    key: 'varCostMult', label: 'Variable-Cost Multiplier', unit: '× current',
    min: 0.4, max: 2,
    read: () => 1,
    patch: (v) => null,
  },
];

function fmtLever(lever, value) {
  if (lever.unit === '₹') return fmtINR(value);
  if (lever.unit === '× current') return `${value.toFixed(2)}× current`;
  return `${typeof value === 'number' ? value.toFixed(1) : value}${lever.unit}`;
}

function fmtMetric(target, value) {
  if (value === null || !isFinite(value)) return '—';
  if (target.unit === '₹') return fmtINR(value);
  if (target.unit === '%') return `${value.toFixed(1)}%`;
  if (target.unit === 'yr') return `${value.toFixed(1)} yr`;
  return value.toFixed(2);
}

// Default initial constraint when a fresh row is added.
const newConstraint = () => ({ id: Date.now() + Math.random(), targetKey: 'irr', dir: 'gte', value: 18 });

const MAX_CONSTRAINTS = 4;

export default function GoalSeek({ input, calc, setI }) {
  // Constraints array — start with one (matches single-target Phase-1
  // behaviour); user can add up to 4.
  const [constraints, setConstraints] = useState([newConstraint()]);
  const [leverKey,    setLeverKey]    = useState('capex');
  const [result, setResult] = useState(null);

  const lever = LEVERS.find(l => l.key === leverKey) || LEVERS[0];

  // Resolve real patch fn for the multiplier levers (need closure over input).
  const leverPatch = useMemo(() => {
    if (lever.key === 'salePriceMult') {
      return (v) => ({
        revenueRows: input.revenueRows.map(r => ({ ...r, price: Number(r.price || 0) * v })),
      });
    }
    if (lever.key === 'varCostMult') {
      return (v) => ({
        varRows: input.varRows.map(r => ({ ...r, price: Number(r.price || 0) * v })),
      });
    }
    return lever.patch;
  }, [lever, input]);

  const updateConstraint = (id, patch) => {
    setConstraints(cs => cs.map(c => c.id === id ? { ...c, ...patch } : c));
    setResult(null);
  };
  const addConstraint = () => {
    if (constraints.length >= MAX_CONSTRAINTS) return;
    setConstraints(cs => [...cs, newConstraint()]);
    setResult(null);
  };
  const delConstraint = (id) => {
    if (constraints.length <= 1) return;
    setConstraints(cs => cs.filter(c => c.id !== id));
    setResult(null);
  };

  const handleSolve = () => {
    const targets = constraints.map(c => {
      const t = TARGETS.find(x => x.key === c.targetKey) || TARGETS[0];
      return {
        label: t.label,
        target: Number(c.value),
        dir: c.dir,
        metric: t.metric,
        unit: t.unit,
      };
    });
    const r = solveForMulti({
      input,
      lever: leverPatch,
      originalValue: lever.read(input),
      targets,
      min: lever.min,
      max: lever.max,
    });
    setResult(r);
  };

  const handleApply = () => {
    if (!result || !result.found) return;
    setI(leverPatch(result.value));
  };

  return (
    <div className="calc-goalseek">
      <div className="calc-goalseek-head">
        <div>
          <div className="calc-goalseek-title">Goal Seek</div>
          <div className="calc-goalseek-sub">Set one or more targets, pick a lever, solve. Bisection-style grid search finds the lever value that satisfies all constraints together — closest to your current value.</div>
        </div>
      </div>

      {/* Constraint stack */}
      <div className="calc-goalseek-constraints">
        {constraints.map((c, i) => {
          const t = TARGETS.find(x => x.key === c.targetKey) || TARGETS[0];
          return (
            <div key={c.id} className="calc-goalseek-constraint">
              <span className="calc-goalseek-prefix">{i === 0 ? 'I want' : 'AND'}</span>
              <select
                value={c.targetKey}
                onChange={e => updateConstraint(c.id, { targetKey: e.target.value })}
                className="calc-goalseek-select">
                {TARGETS.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
              </select>
              <select
                value={c.dir}
                onChange={e => updateConstraint(c.id, { dir: e.target.value })}
                className="calc-goalseek-select calc-goalseek-dir">
                <option value="gte">≥</option>
                <option value="lte">≤</option>
              </select>
              <input
                type="number"
                value={c.value}
                onChange={e => updateConstraint(c.id, { value: e.target.value })}
                className="calc-goalseek-target-input"
                step="0.5" />
              <span className="calc-goalseek-unit">{t.unit}</span>
              {constraints.length > 1 && (
                <button
                  type="button"
                  onClick={() => delConstraint(c.id)}
                  className="calc-goalseek-del"
                  aria-label="Remove constraint">×</button>
              )}
            </div>
          );
        })}
        {constraints.length < MAX_CONSTRAINTS && (
          <button type="button" onClick={addConstraint} className="calc-goalseek-add">
            + AND another constraint
          </button>
        )}
      </div>

      {/* Lever + Solve */}
      <div className="calc-goalseek-lever-row">
        <span className="calc-goalseek-prefix">by changing</span>
        <select
          value={leverKey}
          onChange={e => { setLeverKey(e.target.value); setResult(null); }}
          className="calc-goalseek-select">
          {LEVERS.map(l => <option key={l.key} value={l.key}>{l.label}</option>)}
        </select>
        <button type="button" onClick={handleSolve} className="calc-goalseek-solve">Solve</button>
      </div>

      <div className="calc-goalseek-context">
        <span><em>Lever range</em>: {fmtLever(lever, lever.min)} to {fmtLever(lever, lever.max)}</span>
        {leverKey !== 'salePriceMult' && leverKey !== 'varCostMult' && (
          <>
            <span>·</span>
            <span><em>Saved</em>: {fmtLever(lever, lever.read(input))}</span>
          </>
        )}
      </div>

      {/* Result card */}
      {result && (
        <div className="calc-goalseek-result" data-state={result.found ? 'found' : 'unreachable'}>
          {result.found ? (
            <>
              <div className="calc-goalseek-result-head">
                <span className="calc-goalseek-result-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="16" height="16"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                {constraints.length === 1 ? 'Solution found' : 'All constraints met'}
              </div>
              <div className="calc-goalseek-result-row">
                <span>Set <strong>{lever.label}</strong> to:</span>
                <span className="calc-goalseek-result-value">{fmtLever(lever, result.value)}</span>
              </div>
              {/* Per-constraint sat snapshot */}
              <div className="calc-goalseek-perTarget">
                {result.perTarget.map((p, i) => {
                  const t = TARGETS.find(x => x.label === p.label) || TARGETS[0];
                  return (
                    <div key={i} className="calc-goalseek-perTarget-row" data-ok={p.ok ? 'true' : 'false'}>
                      <span className="calc-goalseek-perTarget-icon">{p.ok ? '✓' : '✗'}</span>
                      <span>{p.label} {p.dir === 'gte' ? '≥' : '≤'} {p.target}{t.unit}</span>
                      <span className="calc-goalseek-perTarget-actual">→ {fmtMetric(t, p.value)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="calc-goalseek-result-actions">
                <button type="button" onClick={handleApply} className="calc-goalseek-apply">
                  Apply to project
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="calc-goalseek-result-head" data-warn="true">
                <span className="calc-goalseek-result-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </span>
                Constraints can't be satisfied together
              </div>
              {result.closest && (
                <>
                  <div className="calc-goalseek-result-row">
                    <span>Closest reachable lever value:</span>
                    <span className="calc-goalseek-result-value">{fmtLever(lever, result.closest.value)}</span>
                  </div>
                  <div className="calc-goalseek-perTarget">
                    {result.closest.perTarget.map((p, i) => {
                      const t = TARGETS.find(x => x.label === p.label) || TARGETS[0];
                      return (
                        <div key={i} className="calc-goalseek-perTarget-row" data-ok={p.ok ? 'true' : 'false'}>
                          <span className="calc-goalseek-perTarget-icon">{p.ok ? '✓' : '✗'}</span>
                          <span>{p.label} {p.dir === 'gte' ? '≥' : '≤'} {p.target}{t.unit}</span>
                          <span className="calc-goalseek-perTarget-actual">→ {fmtMetric(t, p.value)}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
              <div className="calc-goalseek-result-row sub">
                <span>Try a different lever or relax the constraints that failed (✗).</span>
              </div>
            </>
          )}
        </div>
      )}

      <div className="calc-goalseek-hint">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14" height="14">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <circle cx="12" cy="16" r="0.5" fill="currentColor"/>
        </svg>
        <span>Multi-target search uses a 200-point grid scan over the lever range. The "Sale-Price Multiplier" and "Variable-Cost Multiplier" levers scale every row by the same factor — Apply rewrites the prices in your products / variable-costs lists.</span>
      </div>
    </div>
  );
}
