// src/pages/Atlas/DetailPanel.jsx
import { C, alpha } from '../../tokens';
import { CATEGORIES } from './cropData';
import { intensityColor } from './geoHelpers';

export default function DetailPanel({ name, level, filter, states, apDistricts, onDrillDown, onClear }) {
  if (!name) return <EmptyState/>;
  const isState = level === 'india';
  const data = isState ? states[name] : apDistricts[name];
  if (!data) return <EmptyState/>;

  const crops = filter.category === 'all'
    ? data.crops
    : data.crops.filter((c) => c[1] === filter.category);
  const sortBy = filter.metric === 'area' ? 3 : filter.metric === 'share' ? 4 : 2;
  const sortedCrops = [...crops].sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0));
  const monopolies = isState ? data.crops.filter((c) => (c[4] || 0) >= 30) : [];

  return (
    <div style={{ padding: '22px 20px 40px', overflowY: 'auto', height: '100%' }}>
      {onClear && (
        <button onClick={onClear}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'transparent', border: 'none', padding: '4px 0',
                  marginBottom: 12, cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: C.accent,
                }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          Back to ranking
        </button>
      )}
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>
        {isState ? 'STATE' : 'DISTRICT · ANDHRA PRADESH'}
      </div>
      <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 600, color: C.fg1, lineHeight: 1.12, letterSpacing: '-0.02em', margin: '0 0 5px' }}>{name}</h2>
      {isState && (data.capital || data.area_sqkm) && (
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3 }}>
          {[data.capital, data.area_sqkm ? `${data.area_sqkm.toLocaleString('en-IN')} km²` : null].filter(Boolean).join(' · ')}
        </div>
      )}
      {!isState && (
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3 }}>
          Andhra Pradesh · DES 2024-25
        </div>
      )}

      {data.highlight && (
        <div style={{ marginTop: 12, padding: '5px 10px', background: 'var(--c-h-gold-bg)', border: `1px solid var(--c-h-gold-light)`, borderRadius: 6, fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: 'var(--c-h-gold)', letterSpacing: '0.08em', display: 'inline-block', fontWeight: 700 }}>
          ★ MY HOME DISTRICT
        </div>
      )}

      {isState && data.districtKey && (
        <button onClick={() => onDrillDown?.(name)}
                style={{
                  marginTop: 16, width: '100%',
                  padding: '11px 14px',
                  border: `1px solid ${C.accent}`,
                  background: C.accentBg, color: C.accent,
                  borderRadius: 6, cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                  fontWeight: 600, letterSpacing: '0.02em',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'background 120ms',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = alpha(C.accent, 22); }}
                onMouseLeave={(e) => { e.currentTarget.style.background = C.accentBg; }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M21 21l-5-5"/><circle cx="11" cy="11" r="8"/><path d="M11 8v6M8 11h6"/></svg>
          Drill into {Object.keys(apDistricts).length} districts →
        </button>
      )}

      {data.note && (
        <div style={{ marginTop: 16, padding: '12px 14px', background: C.bg2, borderLeft: `3px solid ${C.accent}`, borderRadius: '0 6px 6px 0' }}>
          <div style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif", fontSize: 15, color: C.fg2, lineHeight: 1.55, fontStyle: 'italic' }}>"{data.note}"</div>
        </div>
      )}

      {isState ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 18 }}>
          <Stat label="Net sown" value={data.netSown_kha != null ? `${(data.netSown_kha/1000).toFixed(2)} M ha` : '—'}/>
          <Stat label="Irrigated" value={data.irrigated_pct != null ? `${data.irrigated_pct}%` : '—'}/>
          <Stat label="Farmers" value={data.farmers != null ? `${data.farmers} M` : '—'}/>
          <Stat label="Monopolies" value={`${monopolies.length}`} accent/>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 18 }}>
          <Stat label="Main crop" value={data.crops[0]?.[0] || '—'}/>
          <Stat label="Material" value={data.flagshipMaterial} accent/>
        </div>
      )}

      <SectionHead title="Crops & Production" meta={`${sortedCrops.length} of ${data.crops.length}`}/>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sortedCrops.length === 0 && (
          <div style={{ padding: 16, background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 10, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, textAlign: 'center' }}>
            No crops in selected category.
          </div>
        )}
        {sortedCrops.map((c, i) => {
          // Row shape: [name, category, prod_kt, area_kha, share_pct, yield_kgha?]
          const [crop, cat, prod, area, fifth, sixth] = c;
          const catMeta = CATEGORIES[cat];
          const top = sortedCrops[0];
          const topVal = filter.metric === 'area' ? top[3] : filter.metric === 'share' ? top[4] : top[2];
          const myVal = filter.metric === 'area' ? area : filter.metric === 'share' ? fifth : prod;
          const w = topVal > 0 ? (myVal / topVal) * 100 : 0;
          // 6th element, when present, is the DES yield in kg/ha.
          const yieldKgHa = typeof sixth === 'number' && sixth > 0 ? sixth : null;

          return (
            <div key={i} style={{ padding: '10px 12px', background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6, position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: `${w}%`,
                background: `linear-gradient(90deg, ${catMeta ? catMeta.color + '22' : C.bg2}, transparent)`,
                borderRight: w > 5 ? `1px solid ${catMeta ? catMeta.color + '44' : 'transparent'}` : 'none',
              }}/>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 4, height: 18, background: catMeta?.color || C.border, borderRadius: 1 }}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: C.fg1, fontWeight: 500 }}>{crop}</div>
                  {isState && (
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.fg3, marginTop: 1 }}>
                      {prod >= 1000 ? `${(prod/1000).toFixed(2)} MT` : `${prod} KT`} · {area} K ha · {fifth}% IN
                      {yieldKgHa != null && ` · ${yieldKgHa} kg/ha`}
                    </div>
                  )}
                  {!isState && (
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.fg3, marginTop: 1 }}>
                      {prod >= 1000 ? `${(prod/1000).toFixed(2)} MT` : `${prod} KT`} · {area} K ha
                      {yieldKgHa != null && ` · ${yieldKgHa} kg/ha`}
                    </div>
                  )}
                </div>
                {isState && fifth >= 20 && (
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, padding: '2px 7px', background: 'var(--c-h-gold-bg)', color: 'var(--c-h-gold)', border: `1px solid var(--c-h-gold-light)`, borderRadius: 4, letterSpacing: '0.06em', fontWeight: 700 }}>
                    MONOPOLY
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {data.raw?.length > 0 && (
        <>
          <SectionHead title="Raw Materials & By-products" meta={`${data.raw.length} streams`}/>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.raw.map((r, i) => (
              <div key={i} style={{ padding: '11px 12px', background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 6 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: C.fg1 }}>{r[0]}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.accent, whiteSpace: 'nowrap' }}>{r[2]}</div>
                </div>
                <div style={{ fontSize: 11, color: C.fg2, lineHeight: 1.45 }}>{r[1]}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.fg3, marginTop: 4 }}>· {r[3]}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ marginTop: 28, padding: '12px 0 0', borderTop: `1px solid ${C.border}`, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.fg3, letterSpacing: '0.08em' }}>
        SOURCES · APEDA · COIR BOARD · SPICES BOARD · STATE HORTICULTURE 22–24
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ padding: '22px 20px' }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>No selection</div>
      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 600, color: C.fg1, lineHeight: 1.2, letterSpacing: '-0.01em' }}>
        Hover any region to inspect.
      </div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2, marginTop: 10, lineHeight: 1.6 }}>
        Click a state to lock its detail panel. States with a gold dot have district-level drill-down.
      </div>
      <div style={{ marginTop: 24, padding: 16, background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 10 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, fontWeight: 700 }}>Reading the map</div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg2, lineHeight: 1.9 }}>
          <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 14, height: 6, background: intensityColor(0.15), borderRadius: 2 }}/> Low intensity
          </li>
          <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 14, height: 6, background: intensityColor(0.5), borderRadius: 2 }}/> Mid intensity
          </li>
          <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 14, height: 6, background: intensityColor(0.95), borderRadius: 2 }}/> High intensity
          </li>
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div style={{ padding: '11px 14px', background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 10 }}>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 600, color: C.fg3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>{label}</div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 17, fontWeight: 700, color: accent ? C.accent : C.fg1, lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
    </div>
  );
}

function SectionHead({ title, meta }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, margin: '24px 0 12px' }}>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>{title}</div>
      {meta && <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg3 }}>{meta}</div>}
    </div>
  );
}
