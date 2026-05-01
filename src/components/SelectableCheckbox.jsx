import { C } from '../tokens';

export default function SelectableCheckbox({ checked, onChange, label = 'Select item' }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); onChange(!checked); } }}
      style={{
        width: 22, height: 22, borderRadius: 5,
        border: `1.5px solid ${checked ? C.accent : C.fg3}`,
        background: checked ? C.accent : C.bg1,
        cursor: 'pointer', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 0, transition: 'border-color 120ms, background 120ms',
      }}>
      {checked && (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      )}
    </button>
  );
}
