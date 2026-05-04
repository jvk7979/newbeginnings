import { useState, useMemo, useEffect, useCallback, lazy, Suspense } from 'react';
import { C } from '../../tokens';
import { usePlans } from '../../context/AppContext';
import { runCalc, DEFAULT_CALC_INPUT } from '../../utils/calcEngine';
import { useAutosave } from '../../utils/useAutosave';
import ConfirmModal from '../../components/ConfirmModal';

import { EmptyNoEligible, EmptyNoSelection } from './EmptyStates';
import Hero from './Hero';
import MetricDashboard from './MetricDashboard';
import AssumptionsPanel from './AssumptionsPanel';
import Splitter from '../../components/calc/Splitter';

// Persisted Assumptions-panel width as a percentage of the .calc-panels
// container. localStorage key keeps the choice across page reloads.
const LEFT_WIDTH_KEY = 'calc-left-width';
const LEFT_WIDTH_DEFAULT = 65;
const LEFT_WIDTH_MIN = 30;
const LEFT_WIDTH_MAX = 80;
const readSavedLeftWidth = () => {
  try {
    const raw = localStorage.getItem(LEFT_WIDTH_KEY);
    const n = Number(raw);
    if (Number.isFinite(n) && n >= LEFT_WIDTH_MIN && n <= LEFT_WIDTH_MAX) return n;
  } catch {}
  return LEFT_WIDTH_DEFAULT;
};

// Per-tab lazy loading — non-active tabs don't ship in the initial chunk,
// and the user only pays for what they actually open.
const SummaryTab     = lazy(() => import('./tabs/SummaryTab'));
const PLTab          = lazy(() => import('./tabs/PLTab'));
const ProjectionTab  = lazy(() => import('./tabs/ProjectionTab'));
const SensitivityTab = lazy(() => import('./tabs/SensitivityTab'));
const CompareTab     = lazy(() => import('./tabs/CompareTab'));

const TabFallback = () => <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, padding: '12px 0' }}>Loading…</div>;

export default function CalculationsPage({ onNavigate }) {
  const { plans, updatePlan } = usePlans();

  const eligible = useMemo(() => plans.filter(p => p.eligibleForCalc), [plans]);

  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [input, setInput] = useState(DEFAULT_CALC_INPUT);
  const [openSections, setOpenSections] = useState(['capacity', 'products', 'costs', 'financing', 'subsidies', 'wc']);
  const [rightTab, setRightTab] = useState('summary');
  const [compareWithId, setCompareWithId] = useState(null);
  const [leftWidth, setLeftWidth] = useState(readSavedLeftWidth);

  const handleResize = useCallback((pct) => {
    setLeftWidth(pct);
    try { localStorage.setItem(LEFT_WIDTH_KEY, String(pct)); } catch {}
  }, []);

  // Auto-load the project's saved calc when selection changes; or on first
  // mount, auto-pick the only eligible project if there's just one.
  useEffect(() => {
    if (!selectedProjectId && eligible.length === 1) {
      setSelectedProjectId(eligible[0].id);
    }
  }, [eligible, selectedProjectId]);

  const selectedProject = useMemo(
    () => plans.find(p => p.id === selectedProjectId) || null,
    [plans, selectedProjectId]
  );

  useEffect(() => {
    if (!selectedProject) return;
    const saved = selectedProject.calc;
    const next = saved && typeof saved === 'object' ? { ...DEFAULT_CALC_INPUT, ...saved } : DEFAULT_CALC_INPUT;
    setInput(next);
  }, [selectedProject?.id]);

  const setI = (patch) => setInput(prev => ({ ...prev, ...patch }));
  const setRow = (field, id, k, v) => setInput(prev => ({ ...prev, [field]: prev[field].map(r => r.id === id ? { ...r, [k]: v } : r) }));
  const addRow = (field, blank) => setInput(prev => ({ ...prev, [field]: [...prev[field], { id: Date.now(), ...blank }] }));
  const delRow = (field, id) => setInput(prev => ({ ...prev, [field]: prev[field].filter(r => r.id !== id) }));

  const toggleSection = (id) => setOpenSections(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  // Autosave — debounced 30s. Re-keying on selectedProjectId guarantees that
  // switching projects loads the new doc's saved state without immediately
  // overwriting it via a stale dirty-diff.
  const onAutosave = useCallback(
    async (val) => {
      if (!selectedProject) return;
      await updatePlan(selectedProject.id, { calc: val });
    },
    [selectedProject?.id, updatePlan]
  );
  const { status: autosaveStatus, lastSavedAt, retry: retryAutosave, flushNow, isDirty } = useAutosave(
    input, onAutosave, { delay: 30000, enabled: !!selectedProject, key: selectedProject?.id }
  );

  // Hard reset: blow away every input back to the empty defaults. The
  // autosave layer will persist this fresh state shortly after.
  const [confirmReset, setConfirmReset] = useState(false);
  const handleResetToDefaults = () => setConfirmReset(true);
  const doResetToDefaults = () => {
    setInput(DEFAULT_CALC_INPUT);
    setConfirmReset(false);
  };

  // Math
  const calc = useMemo(() => runCalc(input), [input]);

  const insight = useMemo(() => {
    const { irr, payback } = calc;
    const dr = Number(input.discountRate) || 0;
    const tn = Number(input.tenure) || 1;
    const cp = Number(input.capacityCeilingPct ?? input.capacityPct) || 0;
    if (irr === null && payback === null)
      return { verdict: 'Add data', text: 'Enter revenue and cost rows to see projections.', positive: false };
    if (irr !== null && irr > dr * 1.5 && payback !== null && payback < tn * 0.6)
      return { verdict: `Strong returns at ${cp}% ceiling`, text: `Payback in ${payback} yr${payback !== 1 ? 's' : ''} with IRR of ${irr.toFixed(0)}% — comfortably exceeds cost of capital.`, positive: true };
    if (irr !== null && irr > dr && payback !== null && payback <= tn)
      return { verdict: `Viable at ${cp}% ceiling`, text: `Payback in ${payback} yr${payback !== 1 ? 's' : ''} with IRR of ${irr.toFixed(1)}% — meets the ${dr}% hurdle rate.`, positive: true };
    return { verdict: `Below break-even at ${cp}% ceiling`, text: `IRR of ${irr !== null ? irr.toFixed(1) + '%' : '—'} does not meet the ${dr}% hurdle rate. Review pricing or cost structure.`, positive: false };
  }, [calc, input.discountRate, input.tenure, input.capacityCeilingPct, input.capacityPct]);

  // Color helpers — gate on actual signal so an empty/zero project doesn't
  // flash all-red. The thresholds only kick in once meaningful values exist.
  const dr = Number(input.discountRate) || 0;
  const tn = Number(input.tenure) || 1;
  const hasData = calc.revenue > 0 || calc.effectiveCapex > 0;
  const irrColor     = !hasData || calc.irr === null ? C.fg2 : calc.irr > dr + 3 ? '#2a7d3c' : calc.irr > dr - 3 ? '#b06000' : '#c0392b';
  const npvColor     = !hasData || !isFinite(calc.npv) ? C.fg2 : calc.npv > 0 ? '#2a7d3c' : '#c0392b';
  const paybackColor = !hasData || calc.payback === null ? C.fg2 : calc.payback < tn * 0.6 ? '#2a7d3c' : calc.payback < tn * 0.8 ? '#b06000' : '#c0392b';
  const dscrColor    = !hasData || calc.dscrY1 === null ? C.fg2 : calc.dscrY1 >= 1.5 ? '#2a7d3c' : calc.dscrY1 >= 1.25 ? '#b06000' : '#c0392b';
  const ebitdaColor  = !hasData ? C.fg2 : calc.ebitda > 0 ? '#2a7d3c' : '#c0392b';

  const sliderMin = 10, sliderMax = 100;
  const bePct  = calc.breakEvenCapacity !== null ? Math.min(sliderMax, Math.max(sliderMin, calc.breakEvenCapacity)) : null;
  const beLeft = bePct !== null ? `${((bePct - sliderMin) / (sliderMax - sliderMin)) * 100}%` : null;

  // Render — guard rails
  if (eligible.length === 0) return <EmptyNoEligible onNavigate={onNavigate} />;
  if (!selectedProject)      return <EmptyNoSelection eligible={eligible} onPick={(id) => setSelectedProjectId(Number(id))} />;

  return (
    <div className="calc-page calc-page-redesign">

      <Hero
        selectedProject={selectedProject}
        selectedProjectId={selectedProjectId}
        eligible={eligible}
        onSelectProject={setSelectedProjectId}
        insight={insight}
        input={input}
        setI={setI}
        autosaveStatus={autosaveStatus}
        lastSavedAt={lastSavedAt}
        retryAutosave={retryAutosave}
        flushNow={flushNow}
        isDirty={isDirty}
        onReset={handleResetToDefaults}
      />

      <MetricDashboard
        calc={calc}
        input={input}
        dr={dr}
        tn={tn}
        irrColor={irrColor}
        npvColor={npvColor}
        paybackColor={paybackColor}
        ebitdaColor={ebitdaColor}
      />

      <div className="calc-panels">

        <AssumptionsPanel
          input={input}
          calc={calc}
          setI={setI}
          setRow={setRow}
          addRow={addRow}
          delRow={delRow}
          openSections={openSections}
          toggleSection={toggleSection}
          bePct={bePct}
          beLeft={beLeft}
          sliderMin={sliderMin}
          sliderMax={sliderMax}
          style={{ width: `${leftWidth}%` }}
        />

        <Splitter currentWidth={leftWidth} onResize={handleResize} min={LEFT_WIDTH_MIN} max={LEFT_WIDTH_MAX} />

        {/* RIGHT PANEL: Output tabs */}
        <div className="calc-right">
          <div className="calc-pill-tabs">
            {[
              ['summary',     'Summary'],
              ['pl',          'P&L & Capex'],
              ['projection',  `${input.lifetime}-Yr Projection`],
              ['sensitivity', 'Sensitivity'],
              ['compare',     'Compare'],
            ].map(([id, lbl]) => (
              <button key={id} onClick={() => setRightTab(id)}
                className="calc-pill"
                data-active={rightTab === id ? 'true' : 'false'}>
                {lbl}
              </button>
            ))}
          </div>

          <div className="calc-right-body">
            <Suspense fallback={<TabFallback />}>
              {rightTab === 'summary'     && <SummaryTab insight={insight} />}
              {rightTab === 'pl'          && <PLTab calc={calc} input={input} dr={dr} tn={tn} ebitdaColor={ebitdaColor} irrColor={irrColor} npvColor={npvColor} paybackColor={paybackColor} dscrColor={dscrColor} />}
              {rightTab === 'projection'  && <ProjectionTab calc={calc} />}
              {rightTab === 'sensitivity' && <SensitivityTab input={input} calc={calc} />}
              {rightTab === 'compare'     && <CompareTab eligible={eligible} selectedProject={selectedProject} calc={calc} compareWithId={compareWithId} setCompareWithId={setCompareWithId} />}
            </Suspense>
          </div>
        </div>
      </div>

      {confirmReset && (
        <ConfirmModal
          title="Reset all fields to defaults?"
          message="This clears CAPEX, products, costs, financing, subsidies, and working capital back to their default values for this project. The change saves automatically."
          confirmLabel="Reset to defaults"
          variant="danger"
          onConfirm={doResetToDefaults}
          onCancel={() => setConfirmReset(false)} />
      )}
    </div>
  );
}
