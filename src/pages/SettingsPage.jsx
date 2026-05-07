import { useState } from 'react';
import { C } from '../tokens';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

// Settings — top-level page with the controls scattered through the app
// brought into one place: theme picker, dark-mode preference, identity,
// and project defaults that bias new Calculations projects.
//
// Project-default fields (tax rate / discount rate / inflation rates)
// are stored in localStorage so they survive sign-out and sync across
// tabs. They're applied lazily — the engine reads them when a NEW
// project is created. Existing projects keep whatever values they
// were saved with.

const DEFAULTS_KEY = 'nb_calc_defaults';
const DEFAULT_DEFAULTS = {
  taxRate: 25,
  discountRate: 12,
  interestRate: 12,
  revenueInflationPct: 0,
  costInflationPct: 0,
};

function loadDefaults() {
  try {
    const raw = localStorage.getItem(DEFAULTS_KEY);
    if (!raw) return DEFAULT_DEFAULTS;
    return { ...DEFAULT_DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_DEFAULTS;
  }
}
function saveDefaults(next) {
  try { localStorage.setItem(DEFAULTS_KEY, JSON.stringify(next)); } catch {}
}

const DARK_MODE_OPTIONS = [
  { id: 'light',  label: 'Light',  hint: 'Always light' },
  { id: 'dark',   label: 'Dark',   hint: 'Always dark' },
  { id: 'system', label: 'System', hint: 'Follow OS preference' },
];

export default function SettingsPage() {
  const { theme, setTheme, themes, darkMode, setDarkMode } = useTheme();
  const { user } = useAuth();
  const [defaults, setDefaults] = useState(loadDefaults);

  const updateDefault = (k, v) => {
    const next = { ...defaults, [k]: v };
    setDefaults(next);
    saveDefaults(next);
  };

  const fields = [
    { key: 'taxRate',             label: 'Tax Rate %',           hint: 'Effective tax rate. 17% (Sec 115BAB), 25% (Sec 115BAA), 30% (old regime).', min: 0, max: 50, step: 0.5 },
    { key: 'discountRate',        label: 'Discount Rate %',      hint: 'Hurdle rate used in NPV calculations. Typical Indian MSME: 10–15%.', min: 1, max: 50, step: 0.5 },
    { key: 'interestRate',        label: 'Interest Rate %',      hint: 'Default term-loan rate for new projects. PSU bank typical: 11–13.5%.', min: 0, max: 30, step: 0.5 },
    { key: 'revenueInflationPct', label: 'Revenue Inflation %/yr', hint: 'Year-over-year revenue escalation. Y1 stays at base; Y2+ scale.', min: -10, max: 20, step: 0.5 },
    { key: 'costInflationPct',    label: 'Cost Inflation %/yr',    hint: 'Year-over-year cost escalation. Asymmetric vs revenue.', min: -10, max: 20, step: 0.5 },
  ];

  return (
    <div className="page-pad" style={{ background: C.bg0, minHeight: '100%' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        {/* Page header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 36, fontWeight: 800, color: C.fg1, marginBottom: 6, letterSpacing: '-0.02em' }}>
            Settings
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2, lineHeight: 1.5, maxWidth: 580 }}>
            Personalise the look, control dark mode, and set defaults that bias new Calculations projects.
          </p>
        </div>

        {/* Identity block */}
        {user && (
          <SectionCard title="Account">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: C.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent, fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 700 }}>
                {(user.displayName || user.email || '?').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: C.fg1 }}>
                  {user.displayName || user.email?.split('@')[0]}
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.email}
                </div>
              </div>
            </div>
          </SectionCard>
        )}

        {/* Theme picker */}
        <SectionCard title="Theme" subtitle="Three palettes ship — Heritage is the default.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            {themes.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                aria-pressed={theme === t.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  border: theme === t.id ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
                  borderRadius: 10,
                  background: theme === t.id ? C.accentBg : C.bg1,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  fontWeight: 600,
                  color: C.fg1,
                  transition: 'all 120ms',
                }}>
                <span style={{ display: 'flex', flexShrink: 0 }}>
                  {t.swatch.map((color, i) => (
                    <span key={i}
                      style={{
                        width: 18, height: 18,
                        background: color,
                        marginLeft: i > 0 ? -6 : 0,
                        border: '2px solid #fff',
                        borderRadius: '50%',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.10)',
                      }} />
                  ))}
                </span>
                <span style={{ flex: 1 }}>{t.label}</span>
                {theme === t.id && (
                  <svg viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>
                )}
              </button>
            ))}
          </div>
        </SectionCard>

        {/* Dark mode */}
        <SectionCard title="Dark mode" subtitle="Light surfaces reverse to dark while keeping each palette's accent colour.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {DARK_MODE_OPTIONS.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setDarkMode(opt.id)}
                aria-pressed={darkMode === opt.id}
                style={{
                  padding: '10px 12px',
                  border: darkMode === opt.id ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
                  borderRadius: 8,
                  background: darkMode === opt.id ? C.accentBg : C.bg1,
                  cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  textAlign: 'center',
                  transition: 'all 120ms',
                }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.fg1 }}>{opt.label}</div>
                <div style={{ fontSize: 11, color: C.fg3, marginTop: 2 }}>{opt.hint}</div>
              </button>
            ))}
          </div>
        </SectionCard>

        {/* Project defaults */}
        <SectionCard title="Calculations defaults" subtitle="Applied to new projects only — existing projects keep their saved values.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            {fields.map(f => (
              <label key={f.key} style={{ display: 'block' }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.fg3, marginBottom: 4 }}>
                  {f.label}
                </div>
                <input
                  type="number"
                  value={defaults[f.key]}
                  min={f.min}
                  max={f.max}
                  step={f.step}
                  onChange={e => updateDefault(f.key, Number(e.target.value))}
                  style={{
                    width: '100%',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 14,
                    fontWeight: 600,
                    padding: '8px 10px',
                    border: `1px solid ${C.border}`,
                    borderRadius: 6,
                    background: C.bg1,
                    color: C.fg1,
                    outline: 'none',
                  }} />
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3, marginTop: 4, lineHeight: 1.4 }}>
                  {f.hint}
                </div>
              </label>
            ))}
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, marginTop: 14, padding: 10, background: C.bg2, borderRadius: 6, lineHeight: 1.5 }}>
            <strong style={{ color: C.fg2 }}>Note:</strong> these defaults are stored locally in your browser. They won't sync across devices and won't affect projects that already have saved values.
          </p>
        </SectionCard>

      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, children }) {
  return (
    <div style={{
      background: C.bg1,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      padding: '20px 22px',
      marginBottom: 16,
    }}>
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, fontWeight: 700, color: C.fg1, letterSpacing: '-0.01em' }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, marginTop: 3, lineHeight: 1.5 }}>
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}
