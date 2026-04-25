import { useState } from 'react';
import { C } from '../tokens';
import Badge from './Badge';

export default function ProjectCard({ title, date, status, desc, kpis, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: C.bg1, border: `1px solid ${hov ? C.borderLight : C.border}`, borderRadius: 8, padding: '18px 20px', cursor: 'pointer', boxShadow: hov ? '0 4px 16px rgba(60,40,10,0.12)' : '0 1px 3px rgba(60,40,10,0.08)', transition: 'all 180ms cubic-bezier(0.16,1,0.3,1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 16, fontWeight: 500, color: C.fg1, lineHeight: 1.3 }}>{title}</div>
        <Badge status={status} />
      </div>
      {desc && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg2, lineHeight: 1.5, marginBottom: 12 }}>{desc}</div>}
      {kpis && (
        <div style={{ display: 'flex', gap: 16, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
          {kpis.map(k => (
            <div key={k.label}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 500, color: C.accent }}>{k.value}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: C.fg3, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>
      )}
      {date && !kpis && <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg3, marginTop: 8 }}>{date}</div>}
    </div>
  );
}
