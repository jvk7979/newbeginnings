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

// Editorial assumption group — hairline-separated typographic block instead
// of the previous heavy bordered card. The header shows the section label
// (eyebrow style) on the left, a quick-summary chip on the right (so users
// see the current key value at a glance even when collapsed), and a chevron
// for expand/collapse. Accent variant adds a sage left-border for emphasis
// (Subsidy Stack).
function Section({ id, label, summary, open, onToggle, children, accent }) {
  return (
    <section className="calc-assumption-group" data-accent={accent ? 'true' : 'false'} data-open={open ? 'true' : 'false'}>
      <button onClick={() => onToggle(id)} className="calc-assumption-header" type="button" aria-expanded={open}>
        <span className="calc-assumption-eyebrow">{label}</span>
        {summary && <span className="calc-assumption-summary">{summary}</span>}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="11" height="11"
          className="calc-assumption-chevron"
          style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {/* Always-mounted body so the CSS grid-rows transition can animate
          collapse/expand; aria-hidden + tabIndex hide the inputs from
          screen readers and the tab order while collapsed. */}
      <div className="calc-assumption-body" data-open={open ? 'true' : 'false'} aria-hidden={!open}>
        <div className="calc-assumption-body-inner" inert={open ? undefined : ''}>
          {children}
        </div>
      </div>
    </section>
  );
}

// Stepper — wraps a numeric input with - / + buttons. Same control surface
// as the input itself, so accessibility and existing autosave wiring are
// unaffected; the buttons just nudge the value by `step` within [min, max].
function Stepper({ value, onChange, min = 0, max, step = 1, ariaLabel }) {
  const v = Number(value) || 0;
  const dec = () => onChange(Math.max(min, v - step));
  const inc = () => onChange(max !== undefined ? Math.min(max, v + step) : v + step);
  return (
    <div className="calc-stepper" role="group" aria-label={ariaLabel}>
      <button type="button" onClick={dec} disabled={v <= min} className="calc-stepper-btn" aria-label={`Decrease ${ariaLabel || ''}`}>−</button>
      <input type="number" value={value} min={min} max={max} step={step}
        onChange={e => onChange(Number(e.target.value) || 0)}
        className="calc-stepper-input" />
      <button type="button" onClick={inc} disabled={max !== undefined && v >= max} className="calc-stepper-btn" aria-label={`Increase ${ariaLabel || ''}`}>+</button>
    </div>
  );
}

// ChipRow — preset-value picker that complements a stepper or input below it.
// Highlights the active value (or null if the current value isn't one of
// the presets) so users can switch by tap instead of typing.
function ChipRow({ values, current, onPick, suffix = '' }) {
  const cur = Number(current);
  return (
    <div className="calc-chip-row">
      {values.map(v => (
        <button key={v} type="button" onClick={() => onPick(v)}
          className="calc-chip-preset" data-active={cur === v ? 'true' : 'false'}>
          {v}{suffix}
        </button>
      ))}
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
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <span style={{ width: 56, height: 56, borderRadius: 14, background: `linear-gradient(135deg, ${C.accentBg} 0%, ${C.bg2} 100%)`, border: `1px solid ${alpha(C.accent, 44)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent }}>
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
              <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
              <line x1="8" y1="6" x2="16" y2="6"/>
              <line x1="8" y1="10" x2="10" y2="10"/>
              <line x1="12" y1="10" x2="14" y2="10"/>
              <line x1="16" y1="10" x2="16" y2="10"/>
              <line x1="8" y1="14" x2="10" y2="14"/>
              <line x1="12" y1="14" x2="14" y2="14"/>
              <line x1="16" y1="14" x2="16" y2="18"/>
              <line x1="8" y1="18" x2="14" y2="18"/>
            </svg>
          </span>
        </div>
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
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <span style={{ width: 56, height: 56, borderRadius: 14, background: `linear-gradient(135deg, ${C.accentBg} 0%, ${C.bg2} 100%)`, border: `1px solid ${alpha(C.accent, 44)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent }}>
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
              <path d="M3 3v18h18"/>
              <rect x="7" y="12" width="3" height="6" rx="0.5"/>
              <rect x="12" y="8" width="3" height="10" rx="0.5"/>
              <rect x="17" y="5" width="3" height="13" rx="0.5"/>
            </svg>
          </span>
        </div>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, color: C.fg1, marginBottom: 10 }}>Pick a project to begin</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.fg2, lineHeight: 1.6, marginBottom: 22 }}>
          Choose one of the projects you've marked eligible. Their saved calculation loads automatically.
        </div>
        <select onChange={e => e.target.value && onPick(e.target.value)} defaultValue=""
          style={{ ...IS, fontSize: 14, padding: '8px 12px', cursor: 'pointer', maxWidth: 320 }}>
          <option value="" disabled>Select a project…</option>
          {eligible.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
      </div>
    </div>
  );
}

// ─── Mini-charts for the headline metric band ────────────────────────────────
// Tiny inline visualizations that sit between the metric value and its
// sub-label. Each takes 100x28 by default and is purely decorative — the
// underlying data is the same calc.rows the projection table uses.

// Sparkline with a soft area fill underneath. Used for Revenue/EBITDA where
// the year-over-year shape tells you whether the project ramps or fades.
function Sparkline({ values, color, width = 100, height = 28 }) {
  if (!values || values.length < 2) return null;
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0.001);
  const range = max - min || 1;
  const stepX = width / (values.length - 1);
  const pts = values.map((v, i) => {
    const x = (i * stepX).toFixed(1);
    const y = (height - ((v - min) / range) * (height - 2) - 1).toFixed(1);
    return `${x},${y}`;
  });
  const lastX = (width).toFixed(1);
  const areaPath = `M 0,${height} L ${pts.join(' L ')} L ${lastX},${height} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" style={{ display: 'block' }}>
      <path d={areaPath} fill={color} fillOpacity="0.14" />
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1].split(',')[0]} cy={pts[pts.length - 1].split(',')[1]} r="2" fill={color} />
    </svg>
  );
}

// Horizontal hurdle bar — fills proportionally, with a dashed marker at
// the hurdle line so users can see "am I above or below my cost of capital?"
function HurdleBar({ value, hurdle, color, width = 100, height = 8 }) {
  if (value === null || !isFinite(value)) return null;
  const safeMax = Math.max(hurdle * 2, value * 1.15, 1);
  const fill = Math.max(0, Math.min(1, value / safeMax));
  const hurdleX = Math.max(0, Math.min(1, hurdle / safeMax)) * width;
  return (
    <svg width={width} height={height + 4} viewBox={`0 0 ${width} ${height + 4}`} aria-hidden="true" style={{ display: 'block' }}>
      <rect x="0" y="2" width={width} height={height} rx={height / 2} fill={color} fillOpacity="0.18" />
      <rect x="0" y="2" width={fill * width} height={height} rx={height / 2} fill={color} />
      <line x1={hurdleX} y1="0" x2={hurdleX} y2={height + 4} stroke={C.fg2} strokeWidth="1" strokeDasharray="2,2" />
    </svg>
  );
}

// Centered NPV bar — extends right (positive) or left (negative) from the
// midline, scaled relative to capex. Conveys magnitude AND sign in one glance.
function NPVBar({ value, scale, color, width = 100, height = 14 }) {
  if (!isFinite(value)) return null;
  const half = width / 2;
  const safeScale = Math.max(Math.abs(scale) || 1, Math.abs(value) || 1);
  const ratio = Math.max(-1, Math.min(1, value / safeScale));
  const barWidth = Math.abs(ratio) * (half - 2);
  const positive = value >= 0;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" style={{ display: 'block' }}>
      <line x1={half} y1="0" x2={half} y2={height} stroke={C.fg3} strokeWidth="1" strokeDasharray="2,2" />
      <rect
        x={positive ? half : half - barWidth}
        y="3"
        width={barWidth}
        height={height - 6}
        fill={color}
        rx="1.5"
      />
    </svg>
  );
}

// Payback track — a tenure-length axis with year-tick marks, a dot
// at the payback year, and a faded "tenure window" highlight.
function PaybackTrack({ payback, tenure, color, width = 100, height = 14 }) {
  const ticks = Math.max(1, tenure);
  const usable = width - 2;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" style={{ display: 'block' }}>
      <line x1="1" y1={height / 2} x2={width - 1} y2={height / 2} stroke={C.border} strokeWidth="1" />
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const tx = (i / ticks) * usable + 1;
        return <line key={i} x1={tx} y1={height / 2 - 2.5} x2={tx} y2={height / 2 + 2.5} stroke={C.fg3} strokeWidth="1" />;
      })}
      {payback !== null && payback <= ticks && (
        <circle
          cx={Math.max(0, Math.min(1, payback / ticks)) * usable + 1}
          cy={height / 2}
          r="3.5"
          fill={color}
          stroke="#fff"
          strokeWidth="1.5" />
      )}
    </svg>
  );
}

// ─── CapacityRing (editorial redesign) ───────────────────────────────────────
// Big SVG ring that lives in the hero band. Reads the current capacityPct,
// fills the arc proportionally, and prints the % in Playfair inside the ring.
function CapacityRing({ pct, color, track }) {
  const R = 32, cx = 40, cy = 40;
  const circumference = 2 * Math.PI * R;
  const dash = Math.max(0, Math.min(100, pct)) / 100 * circumference;
  return (
    <svg viewBox="0 0 80 80" width={120} height={120} role="img" aria-label={`Operating at ${pct}% capacity`}>
      <circle cx={cx} cy={cy} r={R} fill="none" stroke={track} strokeWidth="6" />
      <circle cx={cx} cy={cy} r={R} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${dash.toFixed(2)} ${circumference.toFixed(2)}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`} />
      <text x={cx} y={cy + 1} textAnchor="middle"
        style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, fontWeight: 700, fill: color }}>{pct}%</text>
      <text x={cx} y={cy + 11} textAnchor="middle"
        style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 5, letterSpacing: '0.14em', fontWeight: 700, fill: track === '#000' ? '#888' : track }}>CAPACITY</text>
    </svg>
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
    <div className="calc-page calc-page-redesign">

      {/* ── EDITORIAL HERO BAND ────────────────────────────────────────────
          Toolbar (eyebrow + project picker + autosave/reset/save) sits at
          the top, then a magazine-spread layout: project title + verdict
          paragraph on the left, capacity ring on the right. */}
      <div className="calc-hero" data-positive={insight.positive ? 'true' : 'false'}>

        <div className="calc-hero-toolbar">
          <span className="calc-hero-eyebrow">Financial Story</span>
          <div className="calc-hero-toolbar-actions" data-testid="calc-autosave">
            <select value={selectedProjectId || ''}
              onChange={e => setSelectedProjectId(Number(e.target.value))}
              aria-label="Select project"
              className="calc-hero-project-picker">
              {eligible.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
            <span className="calc-hero-autosave">
              <AutosaveStatus status={autosaveStatus} lastSavedAt={lastSavedAt} retry={retryAutosave} />
            </span>
            <button onClick={handleResetToDefaults} className="calc-hero-btn calc-hero-btn-secondary"
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
            <CapacityRing pct={input.capacityPct} color={C.accent} track={alpha(C.accent, 22)} />
            <div className="calc-hero-dial-chips">
              {[40, 60, 80, 100].map(v => (
                <button key={v} onClick={() => setI({ capacityPct: v })}
                  aria-pressed={input.capacityPct === v}
                  className="calc-hero-dial-chip"
                  data-active={input.capacityPct === v ? 'true' : 'false'}>
                  {v}%
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── HEADLINE METRIC BAND ───────────────────────────────────────────
          IRR is the dominant number on the page (Playfair, ~56px) and sits
          on the left with a vertical hairline. The other 4 metrics fan out
          to the right at smaller scale, monospace numerals. */}
      <div className="calc-metric-band">
        <div className="calc-metric-headline">
          <div className="calc-metric-eyebrow">IRR</div>
          <div className="calc-metric-headline-value" style={{ color: irrColor }}>
            {calc.irr !== null ? `${calc.irr.toFixed(0)}%` : '—'}
          </div>
          <div className="calc-metric-chart">
            <HurdleBar value={calc.irr} hurdle={dr} color={irrColor} width={140} />
          </div>
          <div className="calc-metric-sub">vs {dr}% hurdle rate</div>
        </div>
        <div className="calc-metric-row">
          {[
            {
              label: 'Annual Revenue',
              value: fmtINR(calc.revenue),
              sub: `over ${input.lifetime} yrs`,
              color: C.accent,
              chart: <Sparkline values={calc.rows.map(r => r.revenue)} color={C.accent} />,
            },
            {
              label: 'EBITDA',
              value: fmtINR(calc.ebitda),
              sub: `${calc.ebitdaMargin.toFixed(0)}% margin`,
              color: ebitdaColor,
              chart: <Sparkline values={calc.rows.map(r => r.ebitda)} color={ebitdaColor} />,
            },
            {
              label: 'NPV',
              value: fmtINR(calc.npv),
              sub: `at ${dr}% discount`,
              color: npvColor,
              chart: <NPVBar value={calc.npv} scale={calc.effectiveCapex} color={npvColor} />,
            },
            {
              label: 'Payback',
              value: calc.payback !== null ? `${calc.payback} yr${calc.payback !== 1 ? 's' : ''}` : '—',
              sub: `${tn}-yr tenure`,
              color: paybackColor,
              chart: <PaybackTrack payback={calc.payback} tenure={tn} color={paybackColor} />,
            },
          ].map(m => (
            <div key={m.label} className="calc-metric-cell">
              <div className="calc-metric-eyebrow">{m.label}</div>
              <div className="calc-metric-value" style={{ color: m.color }}>{m.value}</div>
              {m.chart && <div className="calc-metric-chart">{m.chart}</div>}
              {m.sub && <div className="calc-metric-sub">{m.sub}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* ── Two-panel split ──────────────────────────────────────────────────── */}
      <div className="calc-panels">

        {/* ── LEFT PANEL: Assumptions (editorial typographic groups) ───────── */}
        <div className="calc-left calc-assumptions">
          <div className="calc-assumptions-title">
            <span className="calc-assumptions-eyebrow">Assumptions</span>
            <span className="calc-assumptions-hint">Click any group to expand or collapse</span>
          </div>

          {/* Capacity Utilisation */}
          <Section id="capacity" label="Capacity Utilisation"
            summary={`${input.capacityPct}%`}
            open={openSections.includes('capacity')} onToggle={toggleSection}>
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
          <Section id="products" label="Products & Pricing"
            summary={`${fmtINR(calc.revenue)}/yr`}
            open={openSections.includes('products')} onToggle={toggleSection}>
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
          <Section id="costs" label="Operating Costs"
            summary={`${fmtINR(calc.variableCosts + calc.fixedCosts)}/yr`}
            open={openSections.includes('costs')} onToggle={toggleSection}>
            {/* Variable-vs-fixed split bar — shows the cost mix at a glance
                so users see whether the project is variable-heavy (commodity)
                or fixed-heavy (overhead-driven) without opening either tab. */}
            {(calc.variableCosts + calc.fixedCosts) > 0 && (() => {
              const total = calc.variableCosts + calc.fixedCosts;
              const varPct = (calc.variableCosts / total) * 100;
              const fixedPct = 100 - varPct;
              return (
                <div className="calc-cost-split">
                  <div className="calc-cost-split-bar">
                    <div className="calc-cost-split-seg calc-cost-split-var" style={{ width: `${varPct}%` }} />
                    <div className="calc-cost-split-seg calc-cost-split-fixed" style={{ width: `${fixedPct}%` }} />
                  </div>
                  <div className="calc-cost-split-legend">
                    <span><span className="dot calc-cost-split-var" /> Variable {fmtINR(calc.variableCosts)} <em>· {varPct.toFixed(0)}%</em></span>
                    <span><span className="dot calc-cost-split-fixed" /> Fixed {fmtINR(calc.fixedCosts)} <em>· {fixedPct.toFixed(0)}%</em></span>
                  </div>
                </div>
              );
            })()}
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
          <Section id="financing" label="Financing"
            summary={`${input.debtPct}% debt · ${fmtINR(input.capex)}`}
            open={openSections.includes('financing')} onToggle={toggleSection}>
            <div className="calc-field-label">Total CAPEX (₹)</div>
            <Hint>Total capital before subsidies — land, civil work, machinery, electrification.</Hint>
            <input type="number" value={input.capex} min={0} step={100000} onChange={e => setI({ capex: Number(e.target.value) || 0 })} style={{ ...IS, marginBottom: 12 }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <div className="calc-field-label">Lifetime (yrs)</div>
                <Stepper value={input.lifetime} onChange={v => setI({ lifetime: Math.max(1, v) })} min={1} max={30} ariaLabel="lifetime" />
              </div>
              <div>
                <div className="calc-field-label">Discount %</div>
                <Stepper value={input.discountRate} onChange={v => setI({ discountRate: Math.max(1, v) })} min={1} max={50} step={0.5} ariaLabel="discount rate" />
                <ChipRow values={[8, 10, 12, 15]} current={input.discountRate} onPick={v => setI({ discountRate: v })} suffix="%" />
              </div>
            </div>

            <div className="calc-field-label">Debt <strong style={{ color: C.fg1 }}>{input.debtPct}%</strong> · Equity {100 - input.debtPct}%</div>
            <input type="range" min={0} max={100} step={5} value={input.debtPct} onChange={e => setI({ debtPct: Number(e.target.value) })} style={{ width: '100%', accentColor: C.accent, marginBottom: 12 }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div className="calc-field-label">Interest %</div>
                <Stepper value={input.interestRate} onChange={v => setI({ interestRate: Math.max(0, v) })} min={0} max={30} step={0.5} ariaLabel="interest rate" />
              </div>
              <div>
                <div className="calc-field-label">Tenure (yrs)</div>
                <Stepper value={input.tenure} onChange={v => setI({ tenure: Math.max(1, v) })} min={1} max={20} ariaLabel="tenure" />
                <ChipRow values={[5, 7, 10, 15]} current={input.tenure} onPick={v => setI({ tenure: v })} suffix="y" />
              </div>
            </div>
          </Section>

          {/* Subsidy Stack — accent-highlighted card to mirror the mockup's
              "Subsidy Stack" panel; individual checkboxes preserved for
              flexibility, savings line surfaced as a prominent footer. */}
          <Section id="subsidies" label="Subsidy Stack"
            summary={
              (input.pmegpEnabled || input.citusEnabled || input.apmsmeEnabled)
                ? `Saves ${fmtINR(Number(input.capex) - calc.effectiveCapex)}`
                : 'none active'
            }
            open={openSections.includes('subsidies')} onToggle={toggleSection} accent>
            {/* Savings progress bar — visualizes how much capex the active
                subsidies have shaved off, so the impact is felt before the
                user re-checks the metric band. */}
            {(input.pmegpEnabled || input.citusEnabled || input.apmsmeEnabled) && Number(input.capex) > 0 && (() => {
              const saved = Number(input.capex) - calc.effectiveCapex;
              const savedPct = (saved / Number(input.capex)) * 100;
              return (
                <div className="calc-subsidy-savings">
                  <div className="calc-subsidy-savings-bar">
                    <div className="calc-subsidy-savings-fill" style={{ width: `${Math.min(100, savedPct)}%` }} />
                  </div>
                  <div className="calc-subsidy-savings-legend">
                    <span><strong>{savedPct.toFixed(0)}%</strong> capex saved</span>
                    <span>·</span>
                    <span>{fmtINR(saved)} off</span>
                  </div>
                </div>
              );
            })()}
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
          <Section id="wc" label="Working Capital"
            summary={calc.workingCapital > 0 ? fmtINR(calc.workingCapital) : `${input.receivableDays + input.inventoryDays - input.payableDays}d cycle`}
            open={openSections.includes('wc')} onToggle={toggleSection}>
            <Hint>Cash you need day-to-day. Common values: 30 / 45 / 60 / 90 days.</Hint>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {[
                ['Receivable d', 'receivableDays'],
                ['Payable d',    'payableDays'],
                ['Inventory d',  'inventoryDays'],
              ].map(([lbl, key]) => (
                <div key={key}>
                  <div className="calc-field-label">{lbl}</div>
                  <Stepper value={input[key]} onChange={v => setI({ [key]: Math.max(0, Math.min(180, v)) })} min={0} max={180} step={5} ariaLabel={lbl} />
                  <ChipRow values={[15, 30, 45, 60]} current={input[key]} onPick={v => setI({ [key]: v })} suffix="d" />
                </div>
              ))}
            </div>
            {calc.workingCapital > 0 && (
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, marginTop: 12, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                Required: <strong style={{ color: C.fg1, fontFamily: "'JetBrains Mono', monospace" }}>{fmtINR(calc.workingCapital)}</strong>
                <span style={{ marginLeft: 8 }}>· {input.receivableDays + input.inventoryDays - input.payableDays}d cash cycle</span>
              </div>
            )}
          </Section>

        </div>

        {/* ── RIGHT PANEL: Output ───────────────────────────────────────────── */}
        <div className="calc-right">

          {/* Pill tab bar — 5 tabs, rounded chips for the editorial look */}
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
