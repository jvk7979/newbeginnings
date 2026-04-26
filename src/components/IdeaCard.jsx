import { useState } from 'react';
import { C } from '../tokens';
import Badge from './Badge';
import Tag from './Tag';

export default function IdeaCard({ title, date, tags, status, desc, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: C.bg1, border: `1px solid ${hov ? C.borderLight : C.border}`, borderRadius: 8, padding: '18px 20px', cursor: 'pointer', boxShadow: hov ? '0 4px 16px rgba(60,40,10,0.12)' : '0 1px 3px rgba(60,40,10,0.08)', transition: 'all 180ms cubic-bezier(0.16,1,0.3,1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 16, fontWeight: 500, color: C.fg1, lineHeight: 1.3, paddingRight: 8 }}>{title}</div>
        <Badge status={status} />
      </div>
      {desc && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg2, lineHeight: 1.5, marginBottom: 10, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }}>{desc}</div>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {(tags || []).map(t => <Tag key={t} label={t} />)}
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg3 }}>{date}</div>
    </div>
  );
}
