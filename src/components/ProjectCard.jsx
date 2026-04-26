import { useState } from 'react';
import { C } from '../tokens';
import Badge from './Badge';

export default function ProjectCard({ title, date, status, desc, kpis, progress, nextAction, onClick }) {
  const [hov, setHov] = useState(false);
  const pct = typeof progress === 'number' ? Math.min(100, Math.max(0, progress)) : null;
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: C.bg1, border: `1px solid ${hov ? C.borderLight : C.border}`, borderRadius: 8, padding: '18px 20px', cursor: 'pointer', boxShadow: hov ? '0 4px 16px rgba(60,40,10,0.12)' : '0 1px 3px rgba(60,40,10,0.08)', transition: 'all 180ms cubic-bezier(0.16,1,0.3,1)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, gap: 8 }}>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 16, fontWeight: 500, color: C.fg1, lineHeight: 1.3, flex: 1 }}>{title}</div>
        <Badge status={status} />
      </div>
      {desc && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg2, lineHeight: 1.55, marginBottom: 12, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>{desc}</div>}
      {pct !== null && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3 }}>Progress</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.accent, fontWeight: 500 }}>{pct}%</span>
          </div>
          <div style={{ height: 5, background: C.bg3, borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: C.accent, borderRadius: 99, transition: 'width 400ms ease' }} />
          </div>
        </div>
      )}
      {nextAction && (
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg2, background: C.bg2, borderRadius: 5, padding: '5px 10px', marginBottom: 10 }}>
          <span style={{ color: C.fg3, fontSize: 11 }}>Next: </span>{nextAction}
        </div>
      )}
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
