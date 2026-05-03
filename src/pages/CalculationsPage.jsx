import { useState, useMemo, useEffect, useCallback } from 'react';
import { C, alpha } from '../tokens';
import { usePlans } from '../context/AppContext';
import { runCalc, runSensitivity, DEFAULT_CALC_INPUT, PRODUCT_COLORS_EXPORT as PRODUCT_COLORS } from '../utils/calcEngine';
import { useAutosave } from '../utils/useAutosave';
import AutosaveStatus from '../components/AutosaveStatus';
import ConfirmModal from '../components/ConfirmModal';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtINR(n) {
  if (n === null || n === undefined || !isFinite(n)) return '—';
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(2)} Cr`;
  if (abs >= 100000)   return `${sign}₹${(abs / 100000).toFixed(1)} L`;
  if (abs >= 1000)     return `${sign}₹${(abs / 1000).toFixed(1)} K`;
  return `${sign}₹${abs.toFixed(0)}`;
}

const IS = { fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'inherit', background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 5, padding: '5px 8px', width: '100%', boxSizing: 'border-box', outline: 'none' };

// Each input section renders as its own elevated card to match the
// mockup's clearly delineated control panels. Header is a clickable
// row that collapses the body; chevron rotates to indicate state.
function Section({ id, label, open, onToggle, children, accent }) {
  return (
    <div style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 12, overflow: 'hidden', boxShadow: accent ? `0 0 0 1px ${alpha(C.accent, 22)}` : '0 1px 2px rgba(0,0,0,0.04)' }}>
      <button onClick={() => onToggle(id)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: accent ? alpha(C.accent, 8) : 'transparent', border: 'none', borderBottom: open ? `1px solid ${C.border}` : 'none', cursor: 'pointer', padding: '10px 14px' }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: accent ? C.accent : C.fg3, whiteSpace: 'nowrap', flex: 1, textAlign: 'left' }}>{label}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke={accent ? C.accent : C.fg3} strokeWidth="2" strokeLinecap="round" width="11" height="11"
          style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 150ms', flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && <div style={{ padding: '12px 14px' }}>{children}</div>}
    </div>
  );
}

function Hint({ children }) {
  return <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3, marginTop: 2, marginBottom: 6, lineHeight: 1.45 }}>{children}</div>;
}

// ─── Empty States ─────────────────────────────────────────────────────────────

function EmptyNoEligible({ onNavigate }) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div style={{ maxWidth: 480, textAlign: 'center', background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 12, padding: '40px 32px' }}>
        <div style={{ fontSize: 40, marginBottom: 14 }}>🧮</div>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, color: C.fg1, marginBottom: 10 }}>No projects ready to calculate</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.fg2, lineHeight: 1.6, marginBottom: 22 }}>
          Open a project, click <strong>Edit</strong>, and tick <strong>"Eligible for Calculations"</strong>. It'll show up here.
        </div>
        <button onClick={() => onNavigate('projects')}
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, padding: '9px 20px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}>
          Go to Projects
        </button>
      </div>
    </div>
  );
}

function EmptyNoSelection({ eligible, onPick }) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div style={{ maxWidth: 480, textAlign: 'center', background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 12, padding: '40px 32px' }}>
        <div style={{ fontSize: 40, marginBottom: 14 }}>📊</div>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, color: C.fg1, marginBottom: 10 }}>Pick a project to begin</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.fg2, lineHeight: 1.6, marginBottom: 22 }}>
          Choose one of the projects you've marked eligible. Their saved calculation loads automatically.
        </div>
        <select onChange={e => e.target.value && onPick(e.target.value)} defaultValue=""
          style={{ ...IS, fontSize: 14, padding: '8px 12px', cursor: 'pointer', maxWidth: 320 }}>
          <option value="" disabled>— Select a project —</option>
          {eligible.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
      </div>
    </div>
  );
}

// ─── DonutChart (kept from original, used in Summary tab) ─────────────────────

function DonutChart({ segments, totalLabel }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return (
    <svg viewBox="0 0 100 100" width={120} height={120}>
      <circle cx="50" cy="50" r="38" fill="none" stroke={C.border} strokeWidth="16" />
    </svg>
  );
  if (segments.length === 1) return (
    <svg viewBox="0 0 100 100" width={130} height={130}>
      <circle cx="50" cy="50" r="38" fill="none" stroke={segments[0].color} strokeWidth="16" />
      <text x="50" y="46" textAnchor="middle" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '9px', fill: C.fg3 }}>TOTAL</text>
      <text x="50" y="60" textAnchor="middle" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: 'bold', fill: C.fg1 }}>{totalLabel}</text>
    </svg>
  );
  const R = 38, IR = 22, cx = 50, cy = 50;
  let angle = -Math.PI / 2;
  const arcs = segments.map(seg => {
    const sweep = (seg.value / total) * 2 * Math.PI;
    const cos1 = Math.cos(angle), sin1 = Math.sin(angle);
    const cos2 = Math.cos(angle + sweep), sin2 = Math.sin(angle + sweep);
    const x1 = cx + R * cos1, y1 = cy + R * sin1;
    const x2 = cx + R * cos2, y2 = cy + R * sin2;
    const ix1 = cx + IR * cos1, iy1 = cy + IR * sin1;
    const ix2 = cx + IR * cos2, iy2 = cy + IR * sin2;
    const large = sweep > Math.PI ? 1 : 0;
    const path = `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} L ${ix2.toFixed(2)} ${iy2.toFixed(2)} A ${IR} ${IR} 0 ${large} 0 ${ix1.toFixed(2)} ${iy1.toFixed(2)} Z`;
    angle += sweep;
    return { ...seg, path };
  });
  return (
    <svg viewBox="0 0 100 100" width={130} height={130}>
      {arcs.map((seg, i) => <path key={i} d={seg.path} fill={seg.color} />)}
      <text x="50" y="46" textAnchor="middle" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '9px', fill: C.fg3 }}>TOTAL</text>
      <text x="50" y="60" textAnchor="middle" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: 'bold', fill: C.fg1 }}>{totalLabel}</text>
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CalculationsPage({ onNavigate }) {
  const { plans, updatePlan } = usePlans();

  const eligible = useMemo(() => plans.filter(p => p.eligibleForCalc), [plans]);

  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [input, setInput] = useState(DEFAULT_CALC_INPUT);
  const [openSections, setOpenSections] = useState(['capacity', 'products', 'costs', 'financing', 'subsidies', 'wc']);
  const [costTab, setCostTab] = useState('fixed');
  const [rightTab, setRightTab] = useState('summary');
  const [compareWithId, setCompareWithId] = useState(null);

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

  // Autosave — debounced 1500ms. Re-keying on selectedProjectId guarantees
  // that switching projects loads the new doc's saved state without
  // immediately overwriting it via a stale dirty-diff.
  const onAutosave = useCallback(
    async (val) => {
      if (!selectedProject) return;
      await updatePlan(selectedProject.id, { calc: val });
    },
    [selectedProject?.id, updatePlan]
  );
  const { status: autosaveStatus, lastSavedAt, retry: retryAutosave, flushNow, isDirty } = useAutosave(
    input, onAutosave, { delay: 1500, enabled: !!selectedProject, key: selectedProject?.id }
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
    const cp = Number(input.capacityPct) || 0;
    if (irr === null && payback === null)
      return { verdict: 'Add data', text: 'Enter revenue and cost rows to see projections.', positive: false };
    if (irr !== null && irr > dr * 1.5 && payback !== null && payback < tn * 0.6)
      return { verdict: `Strong returns at ${cp}% capacity`, text: `Payback in ${payback} yr${payback !== 1 ? 's' : ''} with IRR of ${irr.toFixed(0)}% — comfortably exceeds cost of capital.`, positive: true };
    if (irr !== null && irr > dr && payback !== null && payback <= tn)
      return { verdict: `Viable at ${cp}% capacity`, text: `Payback in ${payback} yr${payback !== 1 ? 's' : ''} with IRR of ${irr.toFixed(1)}% — meets the ${dr}% hurdle rate.`, positive: true };
    return { verdict: `Below break-even at ${cp}% capacity`, text: `IRR of ${irr !== null ? irr.toFixed(1) + '%' : '—'} does not meet the ${dr}% hurdle rate. Review pricing or cost structure.`, positive: false };
  }, [calc, input.discountRate, input.tenure, input.capacityPct]);

  // Color helpers
  const dr = Number(input.discountRate) || 0;
  const tn = Number(input.tenure) || 1;
  const irrColor     = calc.irr === null ? C.fg3 : calc.irr > dr + 3 ? '#2a7d3c' : calc.irr > dr - 3 ? '#b06000' : '#c0392b';
  const npvColor     = !isFinite(calc.npv) ? C.fg3 : calc.npv > 0 ? '#2a7d3c' : '#c0392b';
  const paybackColor = calc.payback === null ? C.fg3 : calc.payback < tn * 0.6 ? '#2a7d3c' : calc.payback < tn * 0.8 ? '#b06000' : '#c0392b';
  const dscrColor    = calc.dscrY1 === null ? C.fg3 : calc.dscrY1 >= 1.5 ? '#2a7d3c' : calc.dscrY1 >= 1.25 ? '#b06000' : '#c0392b';
  const ebitdaColor  = calc.ebitda > 0 ? '#2a7d3c' : '#c0392b';

  const sliderMin = 10, sliderMax = 100;
  const bePct  = calc.breakEvenCapacity !== null ? Math.min(sliderMax, Math.max(sliderMin, calc.breakEvenCapacity)) : null;
  const beLeft = bePct !== null ? `${((bePct - sliderMin) / (sliderMax - sliderMin)) * 100}%` : null;

  // ── Render — guard rails ────────────────────────────────────────────────────

  if (eligible.length === 0) return <EmptyNoEligible onNavigate={onNavigate} />;
  if (!selectedProject)      return <EmptyNoSelection eligible={eligible} onPick={(id) => setSelectedProjectId(Number(id))} />;

  return (
    <div className="calc-page">

      {/* ── Top header card (mockup row 1: Title + tagline · autosave pill) ── */}
      <div style={{ background: C.bg1, borderBottom: `1px solid ${C.border}`, padding: '16px 20px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 700, color: C.fg1, lineHeight: 1.2 }}>Financial Calculator</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, marginTop: 2 }}>Model revenue, EBITDA, IRR, and payback. Changes save automatically — Save commits immediately.</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }} data-testid="calc-autosave">
            <AutosaveStatus status={autosaveStatus} lastSavedAt={lastSavedAt} retry={retryAutosave} />
            <button onClick={handleResetToDefaults}
              title="Reset every field to the default values"
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: '6px 14px', borderRadius: 6, background: 'transparent', color: C.fg2, border: `1px solid ${C.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
              Reset
            </button>
            <button onClick={flushNow}
              disabled={!isDirty || autosaveStatus === 'saving'}
              title={isDirty ? 'Save now (skip the autosave wait)' : 'No unsaved changes'}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, padding: '6px 16px', borderRadius: 6, background: !isDirty || autosaveStatus === 'saving' ? C.bg2 : C.accent, color: !isDirty || autosaveStatus === 'saving' ? C.fg3 : '#fff', border: 'none', cursor: !isDirty || autosaveStatus === 'saving' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              Save
            </button>
          </div>
        </div>
      </div>

      {/* ── Project selector strip (mockup row 2: PROJECT · selector) ─────── */}
      <div style={{ background: C.bg0, borderBottom: `1px solid ${C.border}`, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.fg3 }}>Project</span>
        <select value={selectedProjectId || ''}
          onChange={e => setSelectedProjectId(Number(e.target.value))}
          aria-label="Select project"
          style={{ ...IS, background: C.bg1, fontSize: 14, padding: '6px 10px', cursor: 'pointer', maxWidth: 380 }}>
          {eligible.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
      </div>

      {/* ── Live output card (mockup row 3: LIVE OUTPUT · big project name + capacity chip · status pill · metric tiles) ── */}
      <div className="calc-topbar" style={{ background: C.bg1, borderBottom: `1px solid ${C.border}`, padding: '14px 20px 16px' }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.fg3, marginBottom: 10 }}>Live Output</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(20px,3vw,26px)', fontWeight: 700, color: C.fg1, lineHeight: 1.2, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
            {selectedProject.title}
          </h1>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: C.fg3, background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 999, padding: '3px 10px' }}>
            {input.capacityPct}% capacity
          </span>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: insight.positive ? alpha(C.accent, 22) : alpha('#c0392b', 22), border: `1px solid ${insight.positive ? alpha(C.accent, 55) : alpha('#c0392b', 55)}`, borderRadius: 999, padding: '5px 14px' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: insight.positive ? C.accent : '#c0392b' }} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: insight.positive ? C.accent : '#c0392b' }}>{insight.verdict}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {[
            { label: 'Annual Revenue', value: fmtINR(calc.revenue), sub: null, color: C.fg1 },
            { label: 'EBITDA', value: fmtINR(calc.ebitda), sub: `${calc.ebitdaMargin.toFixed(0)}% margin`, color: ebitdaColor },
            { label: 'IRR', value: calc.irr !== null ? `${calc.irr.toFixed(0)}%` : '—', sub: `vs ${dr}% hurdle`, color: irrColor },
            { label: 'NPV', value: fmtINR(calc.npv), sub: `at ${dr}% discount`, color: npvColor },
            { label: 'Payback', value: calc.payback !== null ? `${calc.payback} yr${calc.payback !== 1 ? 's' : ''}` : '—', sub: `${tn}-yr tenure`, color: paybackColor },
          ].map(m => (
            <div key={m.label}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: C.fg3, marginBottom: 3 }}>{m.label}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 26, fontWeight: 800, color: m.color, lineHeight: 1 }}>{m.value}</div>
              {m.sub && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, marginTop: 2 }}>{m.sub}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* ── Two-panel split ──────────────────────────────────────────────────── */}
      <div className="calc-panels">

        {/* ── LEFT PANEL: Inputs ────────────────────────────────────────────── */}
        <div className="calc-left" style={{ borderRight: `1px solid ${C.border}`, padding: '16px 14px' }}>

          {/* Capacity Utilisation */}
          <Section id="capacity" label="Capacity Utilisation" open={openSections.includes('capacity')} onToggle={toggleSection}>
            <Hint>What % of your maximum planned output you expect to achieve. Most projects run at 60–80% in Year 1.</Hint>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: C.fg2 }}>Capacity</span>
              <div>
                <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 32, fontWeight: 700, color: C.accent, lineHeight: 1 }}>{input.capacityPct}</span>
                <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 700, color: C.accent }}>%</span>
              </div>
            </div>
            <div style={{ position: 'relative', marginBottom: 12, paddingTop: 18 }}>
              {beLeft && (
                <div style={{ position: 'absolute', top: 0, left: beLeft, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, pointerEvents: 'none' }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: C.fg3, whiteSpace: 'nowrap' }}>break-even {Math.round(bePct)}%</span>
                  <div style={{ width: 1, height: 8, background: C.fg3 }} />
                </div>
              )}
              <input type="range" min={sliderMin} max={sliderMax} step={5} value={input.capacityPct}
                onChange={e => setI({ capacityPct: Number(e.target.value) })}
                style={{ width: '100%', accentColor: C.accent, cursor: 'pointer' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3 }}>10%</span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3 }}>100%</span>
              </div>
            </div>
            {/* Quick-set chips */}
            <div style={{ display: 'flex', gap: 4, justifyContent: 'space-between' }}>
              {[40, 60, 80, 100].map(v => (
                <button key={v} onClick={() => setI({ capacityPct: v })}
                  aria-pressed={input.capacityPct === v}
                  style={{ flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: input.capacityPct === v ? 700 : 500, padding: '4px 0', borderRadius: 4, background: input.capacityPct === v ? C.accentBg : 'transparent', border: `1px solid ${input.capacityPct === v ? alpha(C.accent, 55) : C.border}`, color: input.capacityPct === v ? C.accent : C.fg2, cursor: 'pointer' }}>
                  {v}%
                </button>
              ))}
            </div>
          </Section>

          {/* Product Mix */}
          <Section id="products" label="Products & Pricing" open={openSections.includes('products')} onToggle={toggleSection}>
            <Hint>List everything you sell. Price × Qty at 100% capacity; the slider scales them.</Hint>
            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 0.7fr 0.7fr 0.7fr auto', gap: 4, marginBottom: 4, alignItems: 'center' }}>
              {['Product', 'Unit', 'Price ₹', 'Qty/yr', ''].map((h, i) => (
                <div key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: C.fg3, paddingLeft: i === 0 ? 14 : 0 }}>{h}</div>
              ))}
            </div>
            {input.revenueRows.map((row, i) => (
              <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '1.8fr 0.7fr 0.7fr 0.7fr auto', gap: 4, marginBottom: 5, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: PRODUCT_COLORS[i % PRODUCT_COLORS.length], flexShrink: 0 }} />
                  <input value={row.name} placeholder="Product" onChange={e => setRow('revenueRows', row.id, 'name', e.target.value)} style={{ ...IS, flex: 1 }} />
                </div>
                <input value={row.unit} placeholder="kg" onChange={e => setRow('revenueRows', row.id, 'unit', e.target.value)} style={IS} />
                <input type="number" value={row.price} min={0} onChange={e => setRow('revenueRows', row.id, 'price', e.target.value)} style={IS} />
                <input type="number" value={row.qty} min={0} onChange={e => setRow('revenueRows', row.id, 'qty', e.target.value)} style={IS} />
                <button onClick={() => delRow('revenueRows', row.id)} disabled={input.revenueRows.length === 1}
                  style={{ background: 'none', border: 'none', cursor: input.revenueRows.length === 1 ? 'default' : 'pointer', color: input.revenueRows.length === 1 ? C.fg3 : '#c0392b', fontSize: 16, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}>×</button>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
              <button onClick={() => addRow('revenueRows', { name: '', unit: '', price: 0, qty: 0 })}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.accent, background: 'none', border: `1px dashed ${alpha(C.accent, 66)}`, borderRadius: 5, padding: '3px 10px', cursor: 'pointer' }}>+ Add product</button>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg2 }}>{fmtINR(calc.revenue)}/yr at {input.capacityPct}%</span>
            </div>
          </Section>

          {/* Costs */}
          <Section id="costs" label="Operating Costs" open={openSections.includes('costs')} onToggle={toggleSection}>
            <div style={{ display: 'flex', gap: 0, marginBottom: 10, borderBottom: `1px solid ${C.border}` }}>
              {[['variable', 'Variable'], ['fixed', 'Fixed']].map(([id, lbl]) => (
                <button key={id} onClick={() => setCostTab(id)}
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: costTab === id ? 700 : 400, color: costTab === id ? C.accent : C.fg3, background: 'none', border: 'none', borderBottom: `2px solid ${costTab === id ? C.accent : 'transparent'}`, padding: '3px 12px 7px', cursor: 'pointer' }}>
                  {lbl}
                </button>
              ))}
            </div>
            {costTab === 'variable' ? (
              <>
                <Hint>Variable costs scale with output — raw materials, packaging, fuel, contract labour.</Hint>
                {input.varRows.length === 0 && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, marginBottom: 8 }}>No variable costs yet.</div>}
                {input.varRows.map((row, i) => (
                  <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '1.8fr 0.7fr 0.7fr 0.7fr auto', gap: 4, marginBottom: 5, alignItems: 'center' }}>
                    {i === 0 && ['Item', 'Unit', 'Cost ₹', 'Qty/yr', ''].map((h, j) => <div key={j} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: C.fg3 }}>{h}</div>)}
                    <input value={row.name} placeholder="Material" onChange={e => setRow('varRows', row.id, 'name', e.target.value)} style={IS} />
                    <input value={row.unit} placeholder="kg" onChange={e => setRow('varRows', row.id, 'unit', e.target.value)} style={IS} />
                    <input type="number" value={row.price} min={0} onChange={e => setRow('varRows', row.id, 'price', e.target.value)} style={IS} />
                    <input type="number" value={row.qty} min={0} onChange={e => setRow('varRows', row.id, 'qty', e.target.value)} style={IS} />
                    <button onClick={() => delRow('varRows', row.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c0392b', fontSize: 16, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}>×</button>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <button onClick={() => addRow('varRows', { name: '', unit: '', price: 0, qty: 0 })}
                    style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.accent, background: 'none', border: `1px dashed ${alpha(C.accent, 66)}`, borderRadius: 5, padding: '3px 10px', cursor: 'pointer' }}>+ Add</button>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg2 }}>{fmtINR(calc.variableCosts)}/yr</span>
                </div>
              </>
            ) : (
              <>
                <Hint>Fixed costs don't change with output — salaries, rent, insurance, electricity base. Annual amount per item.</Hint>
                {input.fixedRows.map((row, i) => (
                  <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr auto', gap: 4, marginBottom: 5, alignItems: 'center' }}>
                    {i === 0 && ['Item', 'Annual (₹)', ''].map((h, j) => <div key={j} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: C.fg3 }}>{h}</div>)}
                    <input value={row.name} placeholder="Expense" onChange={e => setRow('fixedRows', row.id, 'name', e.target.value)} style={IS} />
                    <input type="number" value={row.amount} min={0} onChange={e => setRow('fixedRows', row.id, 'amount', e.target.value)} style={IS} />
                    <button onClick={() => delRow('fixedRows', row.id)} disabled={input.fixedRows.length === 1}
                      style={{ background: 'none', border: 'none', cursor: input.fixedRows.length === 1 ? 'default' : 'pointer', color: input.fixedRows.length === 1 ? C.fg3 : '#c0392b', fontSize: 16, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}>×</button>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <button onClick={() => addRow('fixedRows', { name: '', amount: 0 })}
                    style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.accent, background: 'none', border: `1px dashed ${alpha(C.accent, 66)}`, borderRadius: 5, padding: '3px 10px', cursor: 'pointer' }}>+ Add</button>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg2 }}>{fmtINR(calc.fixedCosts)}/yr</span>
                </div>
              </>
            )}
          </Section>

          {/* Financing & Subsidies */}
          <Section id="financing" label="Financing" open={openSections.includes('financing')} onToggle={toggleSection}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg2, marginBottom: 2 }}>Total CAPEX (₹)</div>
            <Hint>Total capital before subsidies — land, civil work, machinery, electrification.</Hint>
            <input type="number" value={input.capex} min={0} step={100000} onChange={e => setI({ capex: Number(e.target.value) || 0 })} style={{ ...IS, marginBottom: 10 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
              <div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg2, marginBottom: 2 }}>Lifetime (yrs)</div>
                <input type="number" value={input.lifetime} min={1} max={30} onChange={e => setI({ lifetime: Number(e.target.value) || 1 })} style={IS} />
              </div>
              <div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg2, marginBottom: 2 }}>Discount %</div>
                <input type="number" value={input.discountRate} min={1} max={50} step={0.5} onChange={e => setI({ discountRate: Number(e.target.value) || 1 })} style={IS} />
              </div>
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg2, marginBottom: 2 }}>Debt {input.debtPct}% / Equity {100 - input.debtPct}%</div>
            <input type="range" min={0} max={100} step={5} value={input.debtPct} onChange={e => setI({ debtPct: Number(e.target.value) })} style={{ width: '100%', accentColor: C.accent, marginBottom: 10 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg2, marginBottom: 2 }}>Interest %</div>
                <input type="number" value={input.interestRate} min={0} max={30} step={0.5} onChange={e => setI({ interestRate: Number(e.target.value) || 0 })} style={IS} />
              </div>
              <div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg2, marginBottom: 2 }}>Tenure (yrs)</div>
                <input type="number" value={input.tenure} min={1} max={20} onChange={e => setI({ tenure: Number(e.target.value) || 1 })} style={IS} />
              </div>
            </div>
          </Section>

          {/* Subsidy Stack — accent-highlighted card to mirror the mockup's
              "Subsidy Stack" panel; individual checkboxes preserved for
              flexibility, savings line surfaced as a prominent footer. */}
          <Section id="subsidies" label="Subsidy Stack" open={openSections.includes('subsidies')} onToggle={toggleSection} accent>
            <Hint>Tick what you're eligible for — they stack multiplicatively.</Hint>
            {[
              { id: 'pmegp', label: 'PMEGP', enabled: input.pmegpEnabled, setEnabled: (v) => setI({ pmegpEnabled: v }), pct: input.pmegpPct, setPct: (v) => setI({ pmegpPct: v }), editable: true },
              { id: 'citus', label: 'CITUS (25%)', enabled: input.citusEnabled, setEnabled: (v) => setI({ citusEnabled: v }), editable: false },
              { id: 'apmsme', label: 'AP MSME 4.0 (20%)', enabled: input.apmsmeEnabled, setEnabled: (v) => setI({ apmsmeEnabled: v }), editable: false },
            ].map(sub => (
              <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <input type="checkbox" id={`sub-${sub.id}`} checked={sub.enabled} onChange={e => sub.setEnabled(e.target.checked)} style={{ accentColor: C.accent, width: 15, height: 15, cursor: 'pointer', flexShrink: 0 }} />
                <label htmlFor={`sub-${sub.id}`} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg1, cursor: 'pointer', flex: 1 }}>{sub.label}</label>
                {sub.editable && sub.enabled && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <input type="number" value={sub.pct} min={0} max={100} step={5} onChange={e => sub.setPct(Number(e.target.value) || 0)}
                      style={{ width: 48, fontFamily: "'DM Sans', sans-serif", fontSize: 12, padding: '3px 5px', border: `1px solid ${C.border}`, borderRadius: 4, background: C.bg2, color: C.fg1, outline: 'none' }} />
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3 }}>%</span>
                  </div>
                )}
              </div>
            ))}
            {(input.pmegpEnabled || input.citusEnabled || input.apmsmeEnabled) && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${alpha(C.accent, 22)}`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 6 }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: C.fg2 }}>Effective CAPEX</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: C.fg1 }}>{fmtINR(calc.effectiveCapex)}</span>
                <span style={{ flexBasis: '100%', fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: C.accent }}>
                  Saves {fmtINR(Number(input.capex) - calc.effectiveCapex)}
                </span>
              </div>
            )}
          </Section>

          {/* Working Capital */}
          <Section id="wc" label="Working Capital" open={openSections.includes('wc')} onToggle={toggleSection}>
            <Hint>Cash you need day-to-day.</Hint>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                ['Receivable d', input.receivableDays, (v) => setI({ receivableDays: v })],
                ['Payable d',    input.payableDays,    (v) => setI({ payableDays: v })],
                ['Inventory d',  input.inventoryDays,  (v) => setI({ inventoryDays: v })],
              ].map(([lbl, val, set]) => (
                <div key={lbl}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg2, marginBottom: 2 }}>{lbl}</div>
                  <input type="number" value={val} min={0} max={180} onChange={e => set(Number(e.target.value) || 0)} style={IS} />
                </div>
              ))}
            </div>
            {calc.workingCapital > 0 && (
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, marginTop: 8 }}>
                Required: <strong style={{ color: C.fg1 }}>{fmtINR(calc.workingCapital)}</strong>
              </div>
            )}
          </Section>

        </div>

        {/* ── RIGHT PANEL: Output ───────────────────────────────────────────── */}
        <div className="calc-right">

          {/* Tab bar — 5 tabs */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, background: C.bg1, padding: '0 20px', flexShrink: 0, overflowX: 'auto' }}>
            {[
              ['summary',     'Summary'],
              ['pl',          'P&L & Capex'],
              ['projection',  `${input.lifetime}-Yr Projection`],
              ['sensitivity', 'Sensitivity'],
              ['compare',     'Compare'],
            ].map(([id, lbl]) => (
              <button key={id} onClick={() => setRightTab(id)}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: rightTab === id ? 600 : 400, color: rightTab === id ? C.accent : C.fg3, background: 'none', border: 'none', borderBottom: `2px solid ${rightTab === id ? C.accent : 'transparent'}`, padding: '10px 16px 12px', cursor: 'pointer', marginRight: 4, whiteSpace: 'nowrap' }}>
                {lbl}
              </button>
            ))}
          </div>

          <div className="calc-right-body">

            {/* Summary — Revenue Composition card + insight callout */}
            {rightTab === 'summary' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 18px' }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: C.fg3, marginBottom: 14 }}>Revenue Composition</div>
                  <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
                    <DonutChart segments={calc.revenueByProduct} totalLabel={fmtINR(calc.revenue)} />
                    <div style={{ flex: 1, minWidth: 240, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {calc.revenueByProduct.map(seg => {
                        const pct = calc.revenue > 0 ? ((seg.value / calc.revenue) * 100).toFixed(0) : 0;
                        return (
                          <div key={seg.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 10, height: 10, borderRadius: 2, background: seg.color, flexShrink: 0 }} />
                            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg1, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{seg.name}</span>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 600, color: C.fg1, minWidth: 60, textAlign: 'right' }}>{fmtINR(seg.value)}</span>
                            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, minWidth: 36, textAlign: 'right' }}>{pct}%</span>
                          </div>
                        );
                      })}
                      {calc.revenueByProduct.length === 0 && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3 }}>Add products to see breakdown.</div>}
                    </div>
                  </div>
                  {calc.revenueByProduct.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700, color: C.fg1, flex: 1 }}>Total Revenue</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: C.fg1, minWidth: 60, textAlign: 'right' }}>{fmtINR(calc.revenue)}</span>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, minWidth: 36, textAlign: 'right' }}>100%</span>
                    </div>
                  )}
                </div>

                <div style={{ background: insight.positive ? alpha(C.accent, 11) : alpha('#c0392b', 11), border: `1px solid ${insight.positive ? alpha(C.accent, 44) : alpha('#c0392b', 44)}`, borderRadius: 10, padding: '14px 18px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: insight.positive ? alpha(C.accent, 33) : alpha('#c0392b', 33), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    {insight.positive
                      ? <svg viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>
                      : <svg viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="2" strokeLinecap="round" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
                  </div>
                  <div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700, color: insight.positive ? C.accent : '#c0392b', marginBottom: 4 }}>{insight.verdict}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2, lineHeight: 1.6 }}>{insight.text}</div>
                  </div>
                </div>
              </div>
            )}

            {/* P&L & Capex */}
            {rightTab === 'pl' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                {[
                  { label: 'Effective CAPEX', value: fmtINR(calc.effectiveCapex), sub: 'after subsidies', color: C.fg1 },
                  { label: 'Equity Required', value: fmtINR(calc.equity), sub: `${100 - input.debtPct}% of capex`, color: C.fg1 },
                  { label: 'Loan Amount',     value: fmtINR(calc.loan), sub: `${input.debtPct}% debt`, color: C.fg1 },
                  { label: 'Annual Revenue',  value: fmtINR(calc.revenue), sub: `at ${input.capacityPct}% capacity`, color: C.fg1 },
                  { label: 'EBITDA',          value: fmtINR(calc.ebitda), sub: `${calc.ebitdaMargin.toFixed(1)}% margin`, color: ebitdaColor },
                  { label: 'IRR',             value: calc.irr !== null ? `${calc.irr.toFixed(1)}%` : '—', sub: `vs ${dr}% hurdle`, color: irrColor },
                  { label: 'NPV',             value: fmtINR(calc.npv), sub: `at ${dr}% discount`, color: npvColor },
                  { label: 'Payback',         value: calc.payback !== null ? `${calc.payback} yr${calc.payback !== 1 ? 's' : ''}` : '> lifetime', sub: `${tn}-yr loan`, color: paybackColor },
                  { label: 'Y1 DSCR',         value: calc.dscrY1 !== null ? calc.dscrY1.toFixed(2) : '—', sub: '≥ 1.25 comfortable', color: dscrColor },
                  { label: 'Break-even Rev',  value: calc.breakEvenRev !== null ? fmtINR(calc.breakEvenRev) + '/yr' : '—', sub: 'cover fixed costs', color: C.fg1 },
                  { label: 'Working Capital', value: fmtINR(calc.workingCapital), sub: `${input.receivableDays}R + ${input.inventoryDays}I − ${input.payableDays}P d`, color: C.fg1 },
                ].map(card => (
                  <div key={card.label} style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.fg3, marginBottom: 6 }}>{card.label}</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: card.color, marginBottom: 4 }}>{card.value}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3 }}>{card.sub}</div>
                  </div>
                ))}
              </div>
            )}

            {/* N-Yr Projection */}
            {rightTab === 'projection' && (
              <div style={{ overflowX: 'auto', border: `1px solid ${C.border}`, borderRadius: 10 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: C.bg2 }}>
                      {['Yr', 'Revenue', 'Var', 'Fixed', 'EBITDA', 'Depr.', 'Interest', 'EBT', 'Tax', 'PAT', 'Principal', 'NCF', 'Cum NCF', 'DSCR', 'Loan Bal.'].map(h => (
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
            )}

            {/* Sensitivity tab — tornado chart of IRR sensitivity to ±20% on key inputs */}
            {rightTab === 'sensitivity' && (() => {
              const rows = runSensitivity(input, 20);
              const maxAbs = Math.max(0.01, ...rows.map(r => Math.max(Math.abs(r.deltaLow), Math.abs(r.deltaHigh))));
              return (
                <div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg2, marginBottom: 14, lineHeight: 1.55 }}>
                    How much each input moves IRR when flexed <strong>±20%</strong>. Bars to the right (green) mean a positive flex helps IRR; bars to the left (red) mean it hurts. Inputs are sorted by total impact.
                  </div>
                  {rows.length === 0 || calc.irr === null ? (
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, fontStyle: 'italic', padding: '20px 0' }}>
                      Sensitivity needs a non-degenerate IRR. Add CAPEX, products, and costs first.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', alignItems: 'center', gap: 6, fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: C.fg3, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
                        <span></span>
                        <span style={{ textAlign: 'right' }}>−20%</span>
                        <span>+20%</span>
                      </div>
                      {rows.map(r => {
                        const lowPct  = Math.abs(r.deltaLow)  / maxAbs * 100;
                        const highPct = Math.abs(r.deltaHigh) / maxAbs * 100;
                        const lowColor  = r.deltaLow  < 0 ? '#c0392b' : '#2a7d3c';
                        const highColor = r.deltaHigh > 0 ? '#2a7d3c' : '#c0392b';
                        return (
                          <div key={r.key} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', alignItems: 'center', gap: 6, padding: '6px 0' }}>
                            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: C.fg1 }}>{r.label}</span>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg3, minWidth: 40, textAlign: 'right' }}>
                                {r.deltaLow > 0 ? '+' : ''}{r.deltaLow.toFixed(1)}%
                              </span>
                              <div style={{ flex: 1, height: 14, background: C.bg2, borderRadius: 3, overflow: 'hidden', display: 'flex', justifyContent: 'flex-end' }}>
                                <div style={{ width: `${lowPct}%`, height: '100%', background: lowColor, opacity: 0.85 }} />
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ flex: 1, height: 14, background: C.bg2, borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ width: `${highPct}%`, height: '100%', background: highColor, opacity: 0.85 }} />
                              </div>
                              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg3, minWidth: 40 }}>
                                {r.deltaHigh > 0 ? '+' : ''}{r.deltaHigh.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, marginTop: 8, paddingTop: 10, borderTop: `1px solid ${C.border}`, lineHeight: 1.55 }}>
                        Base IRR: <strong style={{ color: C.fg1 }}>{calc.irr.toFixed(1)}%</strong>. Top entries dominate your project's risk profile — focus diligence there.
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Compare tab — pick another eligible project, render its saved calc alongside this one */}
            {rightTab === 'compare' && (() => {
              const others = eligible.filter(p => p.id !== selectedProject.id);
              const compareWith = others.find(p => p.id === compareWithId) || null;
              const compareCalc = compareWith?.calc ? runCalc({ ...DEFAULT_CALC_INPUT, ...compareWith.calc }) : null;
              const metrics = [
                { label: 'Annual Revenue', a: fmtINR(calc.revenue),       b: compareCalc ? fmtINR(compareCalc.revenue) : '—' },
                { label: 'EBITDA',         a: fmtINR(calc.ebitda),        b: compareCalc ? fmtINR(compareCalc.ebitda)  : '—' },
                { label: 'EBITDA Margin',  a: `${calc.ebitdaMargin.toFixed(1)}%`, b: compareCalc ? `${compareCalc.ebitdaMargin.toFixed(1)}%` : '—' },
                { label: 'IRR',            a: calc.irr !== null ? `${calc.irr.toFixed(1)}%` : '—', b: compareCalc?.irr !== null && compareCalc?.irr !== undefined ? `${compareCalc.irr.toFixed(1)}%` : '—' },
                { label: 'NPV',            a: fmtINR(calc.npv),           b: compareCalc ? fmtINR(compareCalc.npv)     : '—' },
                { label: 'Payback (yrs)',  a: calc.payback !== null ? String(calc.payback) : '—', b: compareCalc?.payback !== null && compareCalc?.payback !== undefined ? String(compareCalc.payback) : '—' },
                { label: 'Y1 DSCR',        a: calc.dscrY1 !== null ? calc.dscrY1.toFixed(2) : '—', b: compareCalc?.dscrY1 !== null && compareCalc?.dscrY1 !== undefined ? compareCalc.dscrY1.toFixed(2) : '—' },
                { label: 'Eff. CAPEX',     a: fmtINR(calc.effectiveCapex), b: compareCalc ? fmtINR(compareCalc.effectiveCapex) : '—' },
              ];

              if (others.length === 0) {
                return (
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3, padding: '40px 0', textAlign: 'center', lineHeight: 1.6 }}>
                    Compare needs at least two eligible projects.<br/>
                    Mark another project eligible to use this tab.
                  </div>
                );
              }

              return (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.fg3 }}>Compare with</span>
                    <select value={compareWithId || ''}
                      onChange={e => setCompareWithId(e.target.value ? Number(e.target.value) : null)}
                      style={{ ...IS, fontSize: 13, padding: '5px 10px', cursor: 'pointer', maxWidth: 320 }}>
                      <option value="">— Select another eligible project —</option>
                      {others.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                  </div>

                  {!compareWith && (
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, fontStyle: 'italic' }}>
                      Pick a project above to see a side-by-side comparison.
                    </div>
                  )}

                  {compareWith && !compareCalc && (
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, padding: '12px 14px', background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 8 }}>
                      <strong>{compareWith.title}</strong> has no saved calculation yet. Open it in the Calculations page, fill in inputs, and Save first.
                    </div>
                  )}

                  {compareWith && compareCalc && (
                    <div style={{ overflowX: 'auto', border: `1px solid ${C.border}`, borderRadius: 10 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: C.bg2 }}>
                            <th style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.fg3, padding: '10px 14px', textAlign: 'left', borderBottom: `1px solid ${C.border}` }}>Metric</th>
                            <th style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, color: C.fg1, padding: '10px 14px', textAlign: 'right', borderBottom: `1px solid ${C.border}` }}>{selectedProject.title}</th>
                            <th style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, color: C.fg1, padding: '10px 14px', textAlign: 'right', borderBottom: `1px solid ${C.border}` }}>{compareWith.title}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {metrics.map((m, i) => (
                            <tr key={m.label} style={{ background: i % 2 === 0 ? C.bg0 : C.bg1, borderBottom: `1px solid ${C.border}` }}>
                              <td style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg2, padding: '8px 14px' }}>{m.label}</td>
                              <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: C.fg1, fontWeight: 600, padding: '8px 14px', textAlign: 'right' }}>{m.a}</td>
                              <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: C.fg1, fontWeight: 600, padding: '8px 14px', textAlign: 'right' }}>{m.b}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })()}

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
