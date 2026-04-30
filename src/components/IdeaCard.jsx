import { C } from '../tokens';
import Badge from './Badge';
import { getCategoryStyle } from '../utils/categoryStyles';

export default function IdeaCard({ title, date, status, desc, category, onClick }) {
  const cat = getCategoryStyle(category);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => e.key === 'Enter' && onClick()}
      className="card-interactive card-rich"
      style={{
        background: C.bg1,
        border: `1px solid ${C.border}`,
        borderLeft: `3px solid ${C.accent}`,
        borderRadius: 10,
        padding: '16px 18px',
        cursor: 'pointer',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 160,
      }}>

      {/* Header: category + status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 8 }}>
        {category
          ? <span style={{ display: 'inline-block', fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: cat.color, background: cat.bg, padding: '2px 8px', borderRadius: 4 }}>{category}</span>
          : <span />
        }
        <Badge status={status} />
      </div>

      {/* Title — primary, most prominent */}
      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 17, fontWeight: 700, color: C.fg1, lineHeight: 1.35, marginBottom: desc ? 8 : 0, flex: desc ? 'none' : 1 }}>
        {title}
      </div>

      {/* Description — secondary */}
      {desc && (
        <div style={{ flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2, lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', marginBottom: 10 }}>
          {desc}
        </div>
      )}

      {/* Footer: date + cta */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.fg3 }}>{date}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.accent, fontWeight: 600 }}>
          Open
          <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="11" height="11"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </span>
      </div>
    </div>
  );
}
