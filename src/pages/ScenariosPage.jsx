import { useState, useMemo, useEffect, useCallback } from 'react';
import { C } from '../tokens';
import { usePlans } from '../context/AppContext';
import { runCalc, DEFAULT_CALC_INPUT } from '../utils/calcEngine';
import Scenarios from './Calculations/tabs/Scenarios';
import { EmptyNoEligible, EmptyNoSelection } from './Calculations/EmptyStates';

// Top-level Scenarios route. Re-mounts the same Scenarios component the
// Calculations workspace uses inside its 4th tab — but lifted out so
// users can land here directly from the side nav, see all snapshots
// across the currently-selected eligible project, and battle-compare
// without opening the Calculations workspace first.
//
// Project selection is independent here: the page picks the first
// eligible project on mount (or auto-loads when there's only one)
// and lets the user switch via a header dropdown. The selection
// doesn't sync with Calculations' selection — they're separate
// surfaces, mostly because users might want to compare snapshots
// for one project here while editing another in Calculations.

export default function ScenariosPage({ onNavigate }) {
  const { plans } = usePlans();
  const eligible = useMemo(() => plans.filter(p => p.eligibleForCalc), [plans]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  useEffect(() => {
    if (!selectedProjectId && eligible.length === 1) {
      setSelectedProjectId(eligible[0].id);
    }
  }, [eligible, selectedProjectId]);

  const selectedProject = useMemo(
    () => plans.find(p => p.id === selectedProjectId) || null,
    [plans, selectedProjectId]
  );

  // Current state = the selected project's saved calc input
  const currentInput = useMemo(() => {
    if (!selectedProject) return DEFAULT_CALC_INPUT;
    const saved = selectedProject.calc;
    return saved && typeof saved === 'object' ? { ...DEFAULT_CALC_INPUT, ...saved } : DEFAULT_CALC_INPUT;
  }, [selectedProject]);

  const currentCalc = useMemo(() => runCalc(currentInput), [currentInput]);

  // "Load" from Scenarios → for now, surface a navigation hint to the
  // user that loading happens inside the Calculations workspace.
  // Re-mounting Calculations with the loaded scenario as the active
  // input would require a cross-page state hook; defer to a future
  // pass.
  const loadScenario = useCallback(() => {
    onNavigate('calculations');
  }, [onNavigate]);

  if (eligible.length === 0) return <EmptyNoEligible onNavigate={onNavigate} />;
  if (!selectedProject)      return <EmptyNoSelection eligible={eligible} onPick={(id) => setSelectedProjectId(Number(id))} />;

  return (
    <div className="page-pad page-hero-atmo" style={{ background: C.bg0, minHeight: '100%' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 18, marginBottom: 22, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: "'Inter', Georgia, serif", fontSize: 36, fontWeight: 800, color: C.fg1, marginBottom: 6, letterSpacing: '-0.02em' }}>
              Scenarios
            </h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2, lineHeight: 1.5, maxWidth: 580 }}>
              Save snapshots of your calc input set, name them, and battle-compare side by side. Snapshots live in your browser's localStorage — they don't sync across devices.
            </p>
          </div>
          <select
            value={selectedProjectId || ''}
            onChange={e => setSelectedProjectId(Number(e.target.value))}
            aria-label="Project"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              padding: '8px 12px',
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              background: C.bg1,
              color: C.fg1,
              cursor: 'pointer',
              outline: 'none',
              minWidth: 220,
            }}>
            {eligible.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>

        {/* Body — re-uses the existing Scenarios component */}
        <Scenarios
          projectId={selectedProject?.id}
          currentInput={currentInput}
          currentCalc={currentCalc}
          loadScenario={loadScenario}
        />
      </div>
    </div>
  );
}
