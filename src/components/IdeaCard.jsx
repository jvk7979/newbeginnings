import { C, alpha } from '../tokens';
import Badge from './Badge';
import { getCategoryStyle } from '../utils/categoryStyles';
import SelectableCheckbox from './SelectableCheckbox';

export default function IdeaCard({
  title, date, status, desc, category, onClick,
  selectable = false, selected = false, selectionMode = false, onToggleSelect,
}) {
  const cat = getCategoryStyle(category);

  // When any item is selected, the whole card toggles instead of navigating —
  // matches the muscle memory of native list apps (Mail, Photos). The
  // checkbox itself stops propagation so it always toggles, regardless of
  // mode.
  const handleClick = () => {
    if (selectionMode && selectable) onToggleSelect?.(!selected);
    else onClick?.();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selectable ? selected : undefined}
      onClick={handleClick}
      onKeyDown={e => {
        if (e.key === 'Enter') handleClick();
        if (e.key === ' ' && selectable) { e.preventDefault(); onToggleSelect?.(!selected); }
      }}
      className="card-interactive card-rich"
      style={{
        background: selected ? C.accentBg : C.bg1,
        border: `1px solid ${selected ? alpha(C.accent, 55) : C.border}`,
        borderLeft: `3px solid ${C.accent}`,
        borderRadius: 10,
        padding: '16px 18px',
        cursor: 'pointer',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 160,
      }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
          {selectable && (
            <SelectableCheckbox checked={selected}
              onChange={(v) => onToggleSelect?.(v)}
              label={`Select idea ${title}`} />
          )}
          {category
            ? <span style={{ display: 'inline-block', fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: cat.color, background: cat.bg, padding: '2px 8px', borderRadius: 4 }}>{category}</span>
            : <span />
          }
        </div>
        <Badge status={status} />
      </div>

      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 17, fontWeight: 700, color: C.fg1, lineHeight: 1.35, marginBottom: desc ? 8 : 0, flex: desc ? 'none' : 1 }}>
        {title}
      </div>

      {desc && (
        <div style={{ flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2, lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', marginBottom: 10 }}>
          {desc}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.fg3 }}>{date}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.accent, fontWeight: 600 }}>
          {selectionMode ? (selected ? 'Selected' : 'Tap to select') : 'Open'}
          {!selectionMode && (
            <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="11" height="11"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          )}
        </span>
      </div>
    </div>
  );
}
