// src/pages/Atlas/HoverTip.jsx
import { C } from '../../tokens';
import { CATEGORIES } from './cropData';

const W = 280;

export default function HoverTip({ name, level, x, y, filter, states, apDistricts }) {
  if (!name) return null;
  const isState = level === 'india';
  const data = isState ? states?.[name] : apDistricts?.[name];
  if (!data) return null;

  const crops = filter.category === 'all'
    ? data.crops
    : data.crops.filter((c) => c[1] === filter.category);
  const sortBy = filter.metric === 'area' ? 3 : filter.metric === 'share' ? 4 : 2;
  const top = [...crops].sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0)).slice(0, 4);

  const left = Math.min(x + 14, window.innerWidth - W - 14);
  const top_ = Math.min(y + 14, window.innerHeight - 240);

  return (
    <div style={{
      position: 'fixed', left, top: top_, width: W,
      background: C.bg1,
      border: `1px solid ${C.border}`,
      borderRadius: 10, padding: '14px 16px', pointerEvents: 'none',
      boxShadow: '0 16px 40px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.08)',
      zIndex: 1000,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, fontWeight: 600, color: C.fg1, letterSpacing: '-0.01em', lineHeight: 1.15 }}>{name}</div>
        {isState && data.code && (
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: C.accent, letterSpacing: '0.08em', padding: '2px 7px', background: C.accentBg, borderRadius: 4, border: `1px solid ${C.border}` }}>{data.code}</span>
        )}
      </div>

      {isState && data.netSown_kha != null && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 10, paddingBottom: 10, borderBottom: `1px solid ${C.border}` }}>
          <Stat label="Sown"    value={`${(data.netSown_kha/1000).toFixed(1)} M ha`}/>
          <Stat label="Irrig."  value={data.irrigated_pct != null ? `${data.irrigated_pct}%` : '—'}/>
          <Stat label="Farmers" value={data.farmers != null ? `${data.farmers} M` : '—'}/>
        </div>
      )}

      <div style={{ fontSize: 9, color: C.fg3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
        Top crops {filter.category !== 'all' && `· ${CATEGORIES[filter.category].label}`}
      </div>
      {top.length === 0 && <div style={{ fontSize: 12, color: C.fg3 }}>No crops in this category.</div>}
      {top.map((c, i) => {
        const cat = CATEGORIES[c[1]];
        const v = filter.metric === 'area' ? `${c[3]} K ha`
              : filter.metric === 'share' ? `${c[4]}% IN`
              : c[2] >= 1000 ? `${(c[2]/1000).toFixed(1)} MT` : `${c[2]} KT`;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: cat?.color || C.fg3 }}/>
            <span style={{ flex: 1, fontSize: 12, color: C.fg1 }}>{c[0]}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.accent }}>{v}</span>
          </div>
        );
      })}

      {isState && data.districtKey && (
        <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px solid ${C.border}`, fontSize: 10, color: 'var(--c-h-gold)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em', fontWeight: 700 }}>
          ▸ CLICK TO DRILL DOWN INTO DISTRICTS
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: C.fg3, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.fg1, marginTop: 2 }}>{value}</div>
    </div>
  );
}
