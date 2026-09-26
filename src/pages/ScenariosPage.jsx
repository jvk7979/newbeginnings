import { useState, useMemo, useEffect, useCallback } from 'react';
import { C } from '../tokens';
import { usePlans } from '../context/AppContext';
import { runCalc, DEFAULT_CALC_INPUT } from '../utils/calcEngine';
import Scenarios from './Calculations/tabs/Scenarios';
import { EmptyNoEligible, EmptyNoSelection } from './Calculations/EmptyStates';
import PageHeader from '../components/PageHeader';

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

        <PageHeader
          eyebrow="What-if"
          title="Scenarios"
          subtitle="Save named snapshots of a project's calculation and compare them side by side. Snapshots sync across your devices."
          actions={
            <select
              value={selectedProjectId || ''}
              onChange={e => setSelectedProjectId(Number(e.target.value))}
              aria-label="Project"
              style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 'var(--r-sm)', background: C.bg1, color: C.fg1, minWidth: 220 }}>
              {eligible.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          }
        />

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
