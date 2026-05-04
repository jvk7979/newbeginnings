import { C } from '../../tokens';

// Shared input style used by every text/number input on the Calculations page.
export const IS = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 13,
  color: 'inherit',
  background: C.bg2,
  border: `1px solid ${C.border}`,
  borderRadius: 5,
  padding: '5px 8px',
  width: '100%',
  boxSizing: 'border-box',
  outline: 'none',
};

// Local INR formatter — kept here because the rest of the app's fmtINR copies
// have subtly different signatures. A single shared util is a separate refactor.
export function fmtINR(n) {
  if (n === null || n === undefined || !isFinite(n)) return '—';
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(2)} Cr`;
  if (abs >= 100000)   return `${sign}₹${(abs / 100000).toFixed(1)} L`;
  if (abs >= 1000)     return `${sign}₹${(abs / 1000).toFixed(1)} K`;
  return `${sign}₹${abs.toFixed(0)}`;
}

// Editorial assumption group — hairline-separated typographic block instead
// of the previous heavy bordered card. Header shows label + summary chip +
// chevron; body uses CSS grid-rows transition for animated collapse.
export function Section({ id, label, summary, open, onToggle, children, accent }) {
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
      <div className="calc-assumption-body" data-open={open ? 'true' : 'false'} aria-hidden={!open}>
        <div className="calc-assumption-body-inner" inert={open ? undefined : ''}>
          {children}
        </div>
      </div>
    </section>
  );
}

// Stepper — wraps a numeric input with - / + buttons. Accessibility and
// existing autosave wiring unaffected; buttons just nudge by `step`.
export function Stepper({ value, onChange, min = 0, max, step = 1, ariaLabel }) {
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

// ChipRow — preset-value picker. Highlights active value (or null if current
// isn't a preset) so users can switch by tap instead of typing.
export function ChipRow({ values, current, onPick, suffix = '' }) {
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

export function Hint({ children }) {
  return <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3, marginTop: 2, marginBottom: 6, lineHeight: 1.45 }}>{children}</div>;
}
