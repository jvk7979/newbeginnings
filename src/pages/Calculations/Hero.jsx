import { C, alpha } from '../../tokens';
import AutosaveStatus from '../../components/AutosaveStatus';
import CapacityRing from '../../components/calc/CapacityRing';

// Editorial hero band: toolbar (eyebrow + project picker + autosave/reset/save)
// at the top, then a magazine-spread layout with title + verdict on the left
// and the capacity ring on the right.
export default function Hero({
  selectedProject, selectedProjectId, eligible, onSelectProject,
  insight, input, setI,
  autosaveStatus, lastSavedAt, retryAutosave, flushNow, isDirty,
  onReset,
}) {
  return (
    <div className="calc-hero" data-positive={insight.positive ? 'true' : 'false'}>

      <div className="calc-hero-toolbar">
        <span className="calc-hero-eyebrow">Financial Story</span>
        <div className="calc-hero-toolbar-actions" data-testid="calc-autosave">
          <select value={selectedProjectId || ''}
            onChange={e => onSelectProject(Number(e.target.value))}
            aria-label="Select project"
            className="calc-hero-project-picker">
            {eligible.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
          <span className="calc-hero-autosave">
            <AutosaveStatus status={autosaveStatus} lastSavedAt={lastSavedAt} retry={retryAutosave} />
          </span>
          <button onClick={onReset} className="calc-hero-btn calc-hero-btn-secondary"
            title="Reset every field to the default values">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
            Reset
          </button>
          <button onClick={flushNow}
            disabled={!isDirty || autosaveStatus === 'saving'}
            className="calc-hero-btn calc-hero-btn-primary"
            title={isDirty ? 'Save now (skip the autosave wait)' : 'No unsaved changes'}>
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Save
          </button>
        </div>
      </div>

      <div className="calc-hero-content">
        <div className="calc-hero-text">
          <h1 className="calc-hero-title">{selectedProject.title}</h1>
          <div className="calc-hero-verdict-pill">
            <span className="dot" />
            <span>{insight.verdict}</span>
          </div>
          <p className="calc-hero-blurb">{insight.text}</p>
        </div>

        <div className="calc-hero-dial">
          <CapacityRing pct={input.capacityCeilingPct ?? input.capacityPct} color={C.accent} track={alpha(C.accent, 22)} />
          <div className="calc-hero-dial-chips">
            {[40, 60, 80, 100].map(v => (
              <button key={v} onClick={() => setI({ capacityCeilingPct: v, capacityPct: v })}
                aria-pressed={(input.capacityCeilingPct ?? input.capacityPct) === v}
                className="calc-hero-dial-chip"
                data-active={(input.capacityCeilingPct ?? input.capacityPct) === v ? 'true' : 'false'}>
                {v}%
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
