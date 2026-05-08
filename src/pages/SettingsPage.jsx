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

// Static preview palette — each card renders in its OWN theme's colours
// regardless of which theme is currently active. Source of truth is
// src/styles.css. The `atmosphere` field captures the per-theme treatment
// (gradient backdrop, glass tiles, corner glows, gradient CTA) so the
// picker preview shows what the user actually gets after switching.
const THEME_PREVIEW = {
  heritage: {
    bg0: '#F6F1E7', bg1: '#FDFAF2', bg2: '#EDE5D2', bg3: '#DDD0B5',
    fg1: '#2D2A26', accent: '#2F6B4F', border: '#E5DDC9',
    atmosphere: 'editorial',
    desc: 'Coconut cream + deep green + Godavari hero photo. The leather-notebook default.',
  },
  aura: {
    bg0: '#F4F6FB', bg1: '#FFFFFF', bg2: '#EBE9FB', bg3: '#DBD8F2',
    fg1: '#1F2937', accent: '#7C7AED', border: '#E5E7EB',
    atmosphere: 'soft',
    desc: 'Lavender → peach gradient backdrop, glass-blur tiles, lavender pill CTA. Calm, breathable.',
  },
  prism: {
    bg0: '#FFFFFF', bg1: '#F8F9FB', bg2: '#F1F3F8', bg3: '#E5E9F0',
    fg1: '#0A2540', accent: '#635BFF', border: '#EDEFF2',
    atmosphere: 'vibrant',
    desc: 'White page with indigo + cyan corner glows, gradient KPI tile, gradient CTA. Confident, kinetic.',
  },
};

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

        {/* Theme picker — three light palettes. Editorial typography (Cormorant /
            Playfair / DM Sans) is constant across all themes; what each preview
            below shows is the per-theme atmospheric layer (gradient backdrop,
            glass tiles, corner glows, gradient CTA) the user gets when they
            switch. Each card paints in its OWN theme regardless of which is
            active, so they're directly comparable. */}
        <SectionCard
          title="Theme"
          subtitle="Three palettes — Heritage is the default. Editorial typography is the same across all three; only the colour and atmospheric layer change."
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
            {themes.map(t => {
              const p = THEME_PREVIEW[t.id] || THEME_PREVIEW.heritage;
              const isActive = theme === t.id;
              const isAura   = p.atmosphere === 'soft';
              const isPrism  = p.atmosphere === 'vibrant';

              const cardBackground = isAura
                ? 'linear-gradient(135deg, #F4F6FB 0%, #EBE9FB 50%, #F8E9F0 100%)'
                : isPrism
                  ? 'radial-gradient(ellipse 200px 200px at 100% 0%, rgba(99,91,255,0.18) 0%, rgba(99,91,255,0) 60%), radial-gradient(ellipse 180px 180px at 0% 100%, rgba(6,182,212,0.14) 0%, rgba(6,182,212,0) 60%), #FFFFFF'
                  : p.bg0;

              const ctaBackground = isPrism
                ? 'linear-gradient(135deg, #635BFF 0%, #4F46E5 100%)'
                : p.accent;

              const ctaShadow = isAura
                ? '0 4px 14px rgba(124, 122, 237, 0.40)'
                : isPrism
                  ? '0 4px 14px rgba(99, 91, 255, 0.40)'
                  : 'none';

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  aria-pressed={isActive}
                  aria-label={`Use ${t.label} theme`}
                  style={{
                    position: 'relative',
                    background: cardBackground,
                    border: isActive ? `2px solid ${p.accent}` : `1px solid ${p.border}`,
                    borderRadius: 14,
                    padding: isActive ? 17 : 18,
                    cursor: 'pointer',
                    textAlign: 'left',
                    overflow: 'hidden',
                    minHeight: 168,
                    boxShadow: isActive ? `0 6px 22px rgba(0,0,0,0.10)` : '0 1px 3px rgba(0,0,0,0.04)',
                    transition: 'box-shadow 140ms, transform 140ms',
                  }}>
                  <div style={{
                    fontFamily: "'Cormorant Garamond', 'Cormorant', Georgia, serif",
                    fontStyle: 'italic',
                    fontWeight: 600,
                    fontSize: 19,
                    letterSpacing: '1.2px',
                    textTransform: 'uppercase',
                    color: p.fg1,
                    lineHeight: 1,
                    marginBottom: 4,
                    ...(isPrism ? {
                      background: 'linear-gradient(90deg, #635BFF 0%, #06B6D4 100%)',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      color: 'transparent',
                    } : {}),
                  }}>VENTURE LOG</div>
                  <div style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 15,
                    fontWeight: 600,
                    color: p.fg1,
                    marginBottom: 8,
                  }}>{t.label}</div>
                  <div style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 11,
                    color: p.fg1,
                    opacity: 0.72,
                    lineHeight: 1.45,
                    marginBottom: 14,
                  }}>{p.desc}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[p.bg1, p.bg2, p.bg3].map((c, i) => (
                        <span key={i} aria-hidden style={{
                          width: 16, height: 16,
                          background: isAura ? `${c}` : c,
                          backdropFilter: isAura ? 'blur(4px)' : 'none',
                          WebkitBackdropFilter: isAura ? 'blur(4px)' : 'none',
                          border: `1px solid ${p.border}`,
                          borderRadius: 5,
                          boxShadow: isAura ? '0 1px 3px rgba(124,122,237,0.18)' : 'none',
                        }} />
                      ))}
                    </div>
                    <span aria-hidden style={{
                      background: ctaBackground,
                      color: '#FFFFFF',
                      padding: '5px 12px',
                      borderRadius: isAura ? 999 : isPrism ? 8 : 999,
                      fontSize: 11,
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 500,
                      letterSpacing: '0.3px',
                      boxShadow: ctaShadow,
                    }}>+ New idea</span>
                  </div>
                  {isActive && (
                    <span aria-hidden style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: p.accent,
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: isAura
                        ? '0 4px 10px rgba(124,122,237,0.40)'
                        : isPrism
                          ? '0 4px 10px rgba(99,91,255,0.40)'
                          : 'none',
                    }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
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
