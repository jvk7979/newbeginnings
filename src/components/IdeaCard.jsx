import { C, alpha } from '../tokens';
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
      style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 10, padding: '18px 20px', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', minHeight: 180 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 }}>
        <div style={{ flex: 1 }}>
          {category && (
            <span style={{ display: 'inline-block', fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: cat.color, background: cat.bg, padding: '2px 8px', borderRadius: 5, marginBottom: 7 }}>{category}</span>
          )}
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 16, fontWeight: 600, color: C.fg1, lineHeight: 1.3 }}>{title}</div>
        </div>
        <Badge status={status} />
      </div>
      {desc && (
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg2, lineHeight: 1.6, marginBottom: 10, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', flex: 1 }}>{desc}</div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg3 }}>{date}</div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.accent, fontWeight: 600 }}>
          Open
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </span>
      </div>
    </div>
  );
}
