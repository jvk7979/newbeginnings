// src/pages/Atlas/DetailPanel.jsx
//
// Right pane of the Atlas tab once a region is focused — an editorial
// "chapter" on one state (or AP district): a vitals strip, the ranked
// crop list with national-share, and downstream raw-material streams.

import { C } from '../../tokens';
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
  const sortBy = filter.metric === 'area' ? 3 : 2;
  const sortedCrops = [...crops].sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0));

  return (
    <div style={{ padding: '20px 22px 40px', overflowY: 'auto', height: '100%' }}>
      {onClear && (
        <button onClick={onClear} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'transparent', border: 'none', padding: '2px 0',
          marginBottom: 14, cursor: 'pointer',
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase', color: C.accent,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          Back to ranking
        </button>
      )}

      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.fg3, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>
        {isState
          ? `Chapter · ${data.code || '—'}${data.capital ? ' · ' + data.capital : ''}`
          : 'Chapter · Andhra Pradesh district'}
      </div>
      <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 30, fontWeight: 600, color: C.fg1, lineHeight: 1.1, letterSpacing: '-0.02em', margin: 0 }}>
        {name}
      </h2>

      {data.highlight && (
        <div style={{ marginTop: 10, padding: '4px 9px', background: 'var(--c-h-gold-bg)', border: `1px solid var(--c-h-gold-light)`, borderRadius: 5, fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: 'var(--c-h-gold)', letterSpacing: '0.08em', display: 'inline-block', fontWeight: 700 }}>
          ★ MY HOME DISTRICT
        </div>
      )}

      {data.note && (
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, color: C.fg2, lineHeight: 1.55, margin: '12px 0 0' }}>
          {data.note}
        </p>
      )}

      {/* Vitals strip */}
      {isState ? (
        <div style={vitalsWrap}>
          <Vital v={data.farmers != null ? `${data.farmers}M` : '—'} l="Farmers"/>
          <Vital v={data.netSown_kha != null ? `${(data.netSown_kha / 1000).toFixed(1)}M` : '—'} l="Ha sown" border/>
          <Vital v={data.irrigated_pct != null ? `${data.irrigated_pct}%` : '—'} l="Irrigated" border/>
        </div>
      ) : (
        <div style={vitalsWrap}>
          <Vital v={data.crops[0]?.[0] || '—'} l="Top crop"/>
          <Vital v={data.flagshipMaterial || '—'} l="Flagship" border/>
        </div>
      )}

      {isState && data.districtKey && (
        <button onClick={() => onDrillDown?.(name)} style={{
          marginTop: 14, width: '100%', padding: '10px 14px',
          border: `1px solid ${C.accent}`, background: C.accentBg, color: C.accent,
          borderRadius: 6, cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          Drill into {Object.keys(apDistricts).length} districts →
        </button>
      )}

      {/* Crops */}
      <SectionHead title="Crops" count={sortedCrops.length}/>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {sortedCrops.length === 0 && (
          <div style={{ padding: 14, background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 6, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, textAlign: 'center' }}>
            No crops in this category.
          </div>
        )}
        {sortedCrops.map((c, i) => {
          const [crop, cat, prod, area, share] = c;
          const meta = CATEGORIES[cat];
          const val = filter.metric === 'area'
            ? (area >= 1000 ? `${(area / 1000).toFixed(2)} M ha` : `${area} K ha`)
            : `${(prod / 1000).toFixed(2)} MT`;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 13px', background: C.bg0, border: `1px solid ${C.border}`, borderRadius: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: meta?.color || C.border, flex: 'none' }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, fontWeight: 600, color: C.fg1 }}>{crop}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, color: C.fg3, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>
                  {meta?.label || cat}{isState && share ? ` · ${share}% nat. share` : ''}
                </div>
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: C.fg1, whiteSpace: 'nowrap' }}>{val}</div>
            </div>
          );
        })}
      </div>

      {/* Raw materials */}
      {data.raw?.length > 0 && (
        <>
          <SectionHead title="Raw materials" count={data.raw.length}/>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {data.raw.map((r, i) => (
              <div key={i} style={{ padding: '11px 13px', background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 6 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: C.fg1 }}>{r[0]}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.accent, whiteSpace: 'nowrap' }}>{r[2]}</div>
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11.5, color: C.fg2, lineHeight: 1.45 }}>{r[1]}</div>
                {r[3] && <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.fg3, marginTop: 4 }}>· {r[3]}</div>}
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ marginTop: 26, paddingTop: 12, borderTop: `1px solid ${C.border}`, fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, color: C.fg3, letterSpacing: '0.08em' }}>
        SOURCES · APEDA · DES · COIR BOARD · SPICES BOARD
      </div>
    </div>
  );
}

const vitalsWrap = {
  display: 'flex', border: `1px solid ${C.border}`, borderRadius: 6,
  overflow: 'hidden', marginTop: 18, background: C.bg0,
};

function Vital({ v, l, border }) {
  return (
    <div style={{ flex: 1, minWidth: 0, padding: '11px 13px', borderLeft: border ? `1px solid ${C.border}` : 'none' }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: C.fg1, lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.fg3, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 3 }}>{l}</div>
    </div>
  );
}

function SectionHead({ title, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '22px 0 11px' }}>
      <span style={{ color: C.accent, fontSize: 11 }}>◆</span>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg2, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700 }}>{title}</div>
      {count != null && <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg3 }}>· {count}</div>}
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ padding: '22px' }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.fg3, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>No selection</div>
      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 600, color: C.fg1, lineHeight: 1.2 }}>
        Pick a region to inspect.
      </div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, color: C.fg2, marginTop: 10, lineHeight: 1.6 }}>
        Click a state on the map (or a row in the ranking) to open its chapter. Gold-dotted states drill into districts.
      </div>
      <div style={{ marginTop: 22, padding: 14, background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 8 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.fg3, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10, fontWeight: 700 }}>Reading the map</div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, color: C.fg2, lineHeight: 2 }}>
          <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 14, height: 6, background: intensityColor(0.15), borderRadius: 2 }}/> Low intensity</li>
          <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 14, height: 6, background: intensityColor(0.5), borderRadius: 2 }}/> Mid intensity</li>
          <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 14, height: 6, background: intensityColor(0.95), borderRadius: 2 }}/> High intensity</li>
        </ul>
      </div>
    </div>
  );
}
