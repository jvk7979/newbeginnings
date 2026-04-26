import { useState } from 'react';
import { C } from '../tokens';
import Badge from './Badge';
import Tag from './Tag';

const CAT_STYLE = {
  Business:     { bg: '#FDF5E4', color: '#B8892A' },
  Agriculture:  { bg: '#EAF5EE', color: '#2E7D52' },
  Technology:   { bg: '#EAF0FA', color: '#2B5FA6' },
  'Real Estate':{ bg: '#F0EAF8', color: '#6B3FA6' },
  Finance:      { bg: '#FDF0E4', color: '#C4681C' },
  Community:    { bg: '#EAF5EE', color: '#2E7D52' },
  Travel:       { bg: '#EAF0FA', color: '#2B5FA6' },
  Personal:     { bg: '#EDE8DE', color: '#9A8E80' },
};

export default function IdeaCard({ title, date, tags, status, desc, category, onClick }) {
  const [hov, setHov] = useState(false);
  const cat = CAT_STYLE[category];
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: C.bg1, border: `1px solid ${hov ? C.borderLight : C.border}`, borderRadius: 8, padding: '18px 20px', cursor: 'pointer', boxShadow: hov ? '0 4px 16px rgba(60,40,10,0.12)' : '0 1px 3px rgba(60,40,10,0.08)', transition: 'all 180ms cubic-bezier(0.16,1,0.3,1)', display: 'flex', flexDirection: 'column', minHeight: 180 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 }}>
        <div style={{ flex: 1 }}>
          {category && cat && (
            <span style={{ display: 'inline-block', fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: cat.color, background: cat.bg, padding: '2px 7px', borderRadius: 4, marginBottom: 6 }}>{category}</span>
          )}
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 16, fontWeight: 500, color: C.fg1, lineHeight: 1.3 }}>{title}</div>
        </div>
        <Badge status={status} />
      </div>
      {desc && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg2, lineHeight: 1.55, marginBottom: 10, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', flex: 1 }}>{desc}</div>}
      {(tags || []).length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {(tags || []).map(t => <Tag key={t} label={t} />)}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg3 }}>{date}</div>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.accent, fontWeight: 500 }}>Read full idea →</span>
      </div>
    </div>
  );
}
