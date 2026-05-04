import { useState, useMemo, useEffect } from 'react';
import { C } from '../../../tokens';
import { runCalc, DEFAULT_CALC_INPUT } from '../../../utils/calcEngine';
import { fmtINR } from '../../../components/calc/primitives';
import { loadScenarios, saveScenarios } from '../../../utils/scenarios';

// Per-metric "winner direction" — used to decide which column wins on
// each comparison row. Higher is better for IRR/NPV/EBITDA/DSCR;
// lower is better for Payback / Effective CAPEX (smaller capex on the
// same returns is more efficient).
const COMPARE_METRICS = [
  { key: 'irr',          label: 'IRR',             higherWins: true,  fmt: (v) => v.irr  !== null ? `${v.irr.toFixed(1)}%` : '—', score: (v) => v.irr ?? -Infinity },
  { key: 'npv',          label: 'NPV',             higherWins: true,  fmt: (v) => fmtINR(v.npv),                                  score: (v) => v.npv ?? -Infinity },
  { key: 'payback',      label: 'Payback',         higherWins: false, fmt: (v) => v.payback !== null ? `${v.payback} yr` : '> life', score: (v) => v.payback ?? Infinity },
  { key: 'dscrY1',       label: 'Y1 DSCR',         higherWins: true,  fmt: (v) => v.dscrY1 !== null ? v.dscrY1.toFixed(2) : '—', score: (v) => v.dscrY1 ?? -Infinity },
  { key: 'ebitda',       label: 'EBITDA',          higherWins: true,  fmt: (v) => fmtINR(v.ebitda),                               score: (v) => v.ebitda },
  { key: 'ebitdaMargin', label: 'EBITDA Margin',   higherWins: true,  fmt: (v) => `${v.ebitdaMargin.toFixed(1)}%`,                score: (v) => v.ebitdaMargin },
  { key: 'effectiveCapex', label: 'Effective CAPEX', higherWins: false, fmt: (v) => fmtINR(v.effectiveCapex),                     score: (v) => v.effectiveCapex },
];

export default function Scenarios({ projectId, currentInput, currentCalc, loadScenario }) {
  const [scenarios, setScenarios] = useState(() => loadScenarios(projectId));
  const [selected, setSelected]   = useState(() => new Set());
  const [name, setName]           = useState('');

  // Re-load when the user switches projects (orchestrator re-keys this
  // whole component via projectId, but be safe).
  useEffect(() => {
    setScenarios(loadScenarios(projectId));
    setSelected(new Set());
  }, [projectId]);

  const handleSave = () => {
    const fallbackName = `Snapshot ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const next = [
      ...scenarios,
      { id: Date.now(), name: name.trim() || fallbackName, savedAt: Date.now(), input: currentInput },
    ];
    setScenarios(next);
    saveScenarios(projectId, next);
    setName('');
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this snapshot?')) return;
    const next = scenarios.filter(s => s.id !== id);
    setScenarios(next);
    saveScenarios(projectId, next);
    setSelected(s => { const n = new Set(s); n.delete(id); return n; });
  };

  const handleLoad = (s) => {
    if (!window.confirm(`Load "${s.name}"? Your current unsaved edits will be replaced.`)) return;
    loadScenario(s.input);
  };

  const handleRename = (id, newName) => {
    const next = scenarios.map(s => s.id === id ? { ...s, name: newName } : s);
    setScenarios(next);
    saveScenarios(projectId, next);
  };

  const toggleSelected = (id) => {
    setSelected(s => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  // Build the compare set: always include "Current" first; selected
  // saved snapshots after. Compare panel only renders when ≥ 2 columns.
  const compareSet = useMemo(() => {
    const list = [
      { id: 'current', name: 'Current', calc: currentCalc },
      ...scenarios.filter(s => selected.has(s.id)).map(s => ({
        id: s.id,
        name: s.name,
        calc: runCalc({ ...DEFAULT_CALC_INPUT, ...s.input }),
      })),
    ];
    return list.length >= 2 ? list : null;
  }, [scenarios, selected, currentCalc]);

  // Per-metric winner index (so the compare table can highlight the best
  // value in each row).
  const winners = useMemo(() => {
    if (!compareSet) return {};
    const map = {};
    COMPARE_METRICS.forEach(m => {
      const scores = compareSet.map(c => m.score(c.calc));
      const bestScore = m.higherWins ? Math.max(...scores) : Math.min(...scores);
      map[m.key] = scores.map((s, i) => s === bestScore ? i : -1).find(i => i !== -1);
    });
    return map;
  }, [compareSet]);

  return (
    <div className="calc-scenarios">

      {/* Save bar */}
      <div className="calc-scenarios-savebar">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Optional snapshot name…"
          className="calc-scenarios-name-input"
          onKeyDown={e => { if (e.key === 'Enter') handleSave(); }} />
        <button type="button" onClick={handleSave} className="calc-scenarios-save-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          Save current state
        </button>
      </div>

      {/* Saved scenarios list */}
      {scenarios.length === 0 ? (
        <div className="calc-scenarios-empty">
          <div className="calc-scenarios-empty-title">No snapshots yet</div>
          <div className="calc-scenarios-empty-sub">
            Save the current input set as a snapshot, tweak assumptions, save again, then check two or more boxes to compare side-by-side. Snapshots live in your browser's localStorage — they don't sync across devices.
          </div>
        </div>
      ) : (
        <div className="calc-scenarios-list">
          {scenarios.map(s => {
            const sCalc = runCalc({ ...DEFAULT_CALC_INPUT, ...s.input });
            const irrText = sCalc.irr !== null ? `${sCalc.irr.toFixed(1)}%` : '—';
            const paybackText = sCalc.payback !== null ? `${sCalc.payback}y` : '—';
            return (
              <div key={s.id} className="calc-scenarios-card" data-selected={selected.has(s.id) ? 'true' : 'false'}>
                <div className="calc-scenarios-card-head">
                  <input
                    type="checkbox"
                    checked={selected.has(s.id)}
                    onChange={() => toggleSelected(s.id)}
                    aria-label={`Compare ${s.name}`}
                    className="calc-scenarios-check" />
                  <input
                    type="text"
                    value={s.name}
                    onChange={e => handleRename(s.id, e.target.value)}
                    className="calc-scenarios-card-name" />
                </div>
                <div className="calc-scenarios-card-meta">
                  Saved {new Date(s.savedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
                <div className="calc-scenarios-card-kpis">
                  <span><em>IRR</em> <strong>{irrText}</strong></span>
                  <span><em>EBITDA</em> <strong style={{ color: sCalc.ebitda >= 0 ? '#2a7d3c' : '#c0392b' }}>{fmtINR(sCalc.ebitda)}</strong></span>
                  <span><em>Payback</em> <strong>{paybackText}</strong></span>
                </div>
                <div className="calc-scenarios-card-actions">
                  <button type="button" onClick={() => handleLoad(s)} className="calc-scenarios-action">Load</button>
                  <button type="button" onClick={() => handleDelete(s.id)} className="calc-scenarios-action danger" aria-label="Delete">×</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Battle compare panel */}
      {compareSet && (
        <div className="calc-scenarios-compare">
          <div className="calc-scenarios-compare-head">
            <div>
              <div className="calc-scenarios-compare-title">Battle Compare</div>
              <div className="calc-scenarios-compare-sub">
                {compareSet.length} {compareSet.length === 2 ? 'view' : 'views'} side-by-side · best metric in each row highlighted
              </div>
            </div>
          </div>
          <div className="calc-scenarios-compare-table-wrap">
            <table className="calc-scenarios-compare-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  {compareSet.map(c => (
                    <th key={c.id}>{c.id === 'current' ? <em>Current</em> : c.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE_METRICS.map(m => (
                  <tr key={m.key}>
                    <td>{m.label}</td>
                    {compareSet.map((c, i) => (
                      <td key={c.id} data-winner={winners[m.key] === i ? 'true' : 'false'}>
                        {m.fmt(c.calc)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
