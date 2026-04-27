import { useState } from 'react';
import { C } from '../tokens';
import Badge from './Badge';
import { getCategoryStyle } from '../utils/categoryStyles';

export default function IdeaCard({ title, date, status, desc, category, onClick }) {
  const [hov, setHov] = useState(false);
  const cat = getCategoryStyle(category);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => e.key === 'Enter' && onClick()}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="card-interactive"
      style={{ background: C.bg1, border: `1px solid ${hov ? C.borderLight : C.border}`, borderRadius: 8, padding: '18px 20px', cursor: 'pointer', boxShadow: hov ? '0 4px 16px rgba(60,40,10,0.12)' : '0 1px 3px rgba(60,40,10,0.08)', transition: 'all 180ms cubic-bezier(0.16,1,0.3,1)', display: 'flex', flexDirection: 'column', minHeight: 180 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 }}>
        <div style={{ flex: 1 }}>
          {category && (
            <span style={{ display: 'inline-block', fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: cat.color, background: cat.bg, padding: '2px 7px', borderRadius: 4, marginBottom: 6 }}>{category}</span>
          )}
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 16, fontWeight: 500, color: C.fg1, lineHeight: 1.3 }}>{title}</div>
        </div>
        <Badge status={status} />
      </div>
      {desc && (
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg2, lineHeight: 1.55, marginBottom: 10, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', flex: 1 }}>{desc}</div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg3 }}>{date}</div>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.accent, fontWeight: 500 }}>Read →</span>
      </div>
    </div>
  );
}
