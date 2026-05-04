import { useState, useMemo } from 'react';
import { C } from '../../../../tokens';
import { solveFor } from '../../../../utils/calcEngine';
import { fmtINR } from '../../../../components/calc/primitives';

// Goal Seek — solver-backed reverse calculator.
//
// User picks a target metric ("I want IRR ≥ 18%"), a lever to adjust
// ("by changing CAPEX"), and clicks Solve. The bisection-backed
// solveFor() in calcEngine searches the lever's bounded range for the
// value that hits the target. Result lands in a card with the
// achieved-vs-target sanity check and an Apply button that writes the
// solved value into the rail via setI.

const TARGETS = [
  { key: 'irr',     label: 'IRR',      unit: '%', metric: (r) => r.irr },
  { key: 'npv',     label: 'NPV',      unit: '₹', metric: (r) => r.npv },
  { key: 'ebitda',  label: 'EBITDA Y1',unit: '₹', metric: (r) => r.rows[0]?.ebitda ?? 0 },
  { key: 'payback', label: 'Payback',  unit: 'yr',metric: (r) => r.payback ?? 99 },
  { key: 'dscrY1',  label: 'Y1 DSCR',  unit: '',  metric: (r) => r.dscrY1 ?? 0 },
];

const LEVERS = [
  {
    key: 'capex', label: 'Total CAPEX', unit: '₹',
    min: 100000, max: 500000000, // 1 L to 50 Cr
    read: (i) => Number(i.capex || 0),
    patch: (v) => ({ capex: v, capexRows: [] }), // override capexRows so the legacy capex dominates the solve
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
    patch: (v) => null, // resolved below — needs access to input
  },
  {
    key: 'varCostMult', label: 'Variable-Cost Multiplier', unit: '× current',
    min: 0.4, max: 2,
    read: () => 1,
    patch: (v) => null,
  },
];

// Format a lever value for display
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

export default function GoalSeek({ input, calc, setI }) {
  const [targetKey, setTargetKey] = useState('irr');
  const [leverKey,  setLeverKey]  = useState('capex');
  const [targetValue, setTargetValue] = useState(18);
  const [result, setResult] = useState(null);

  const target = TARGETS.find(t => t.key === targetKey) || TARGETS[0];
  const lever  = LEVERS.find(l => l.key === leverKey)   || LEVERS[0];

  // Build a real `patch` function for the multiplier levers (they need
  // closure access to `input` to scale every row consistently).
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

  // Current (saved) achieved value of the chosen metric, for context.
  const currentAchieved = target.metric({ ...calc, rows: calc.rows });

  const handleSolve = () => {
    const r = solveFor({
      input,
      lever: leverPatch,
      metric: target.metric,
      target: Number(targetValue),
      min: lever.min,
      max: lever.max,
    });
    setResult({ ...r, leverKey: lever.key, targetKey: target.key, targetValue: Number(targetValue) });
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
          <div className="calc-goalseek-sub">Pick a target, pick a lever, solve. Bisection finds the lever value that hits the target — apply with one click.</div>
        </div>
      </div>

      {/* Inline question form: "I want [target] ≥ [value] [unit] by changing [lever]" */}
      <div className="calc-goalseek-form">
        <span className="calc-goalseek-prefix">I want</span>
        <select
          value={targetKey}
          onChange={e => { setTargetKey(e.target.value); setResult(null); }}
          className="calc-goalseek-select">
          {TARGETS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
        <span className="calc-goalseek-prefix">≥</span>
        <input
          type="number"
          value={targetValue}
          onChange={e => { setTargetValue(e.target.value); setResult(null); }}
          className="calc-goalseek-target-input"
          step="0.5" />
        <span className="calc-goalseek-unit">{target.unit}</span>
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
        <span><em>Current</em> {target.label}: <strong>{fmtMetric(target, currentAchieved)}</strong></span>
        <span>·</span>
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
                Solution found
              </div>
              <div className="calc-goalseek-result-row">
                <span>Set <strong>{lever.label}</strong> to:</span>
                <span className="calc-goalseek-result-value">{fmtLever(lever, result.value)}</span>
              </div>
              <div className="calc-goalseek-result-row sub">
                <span>{target.label} achieves:</span>
                <span>{fmtMetric(target, result.achieved)} (target {result.targetValue}{target.unit})</span>
              </div>
              <div className="calc-goalseek-result-row sub">
                <span>Iterations:</span>
                <span>{result.iterations}</span>
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
                Target not reachable
              </div>
              <div className="calc-goalseek-result-row">
                <span>{result.reason}</span>
              </div>
              {isFinite(result.boundaryLow) && (
                <div className="calc-goalseek-result-row sub">
                  <span>Best at lever min ({fmtLever(lever, lever.min)}):</span>
                  <span>{fmtMetric(target, result.boundaryLow)}</span>
                </div>
              )}
              {isFinite(result.boundaryHigh) && (
                <div className="calc-goalseek-result-row sub">
                  <span>Best at lever max ({fmtLever(lever, lever.max)}):</span>
                  <span>{fmtMetric(target, result.boundaryHigh)}</span>
                </div>
              )}
              <div className="calc-goalseek-result-row sub">
                <span>Try a different lever, or a less ambitious target.</span>
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
        <span>The "Sale-Price Multiplier" and "Variable-Cost Multiplier" levers scale every row by the same factor. Apply rewrites the prices in your products / variable-costs lists.</span>
      </div>
    </div>
  );
}
