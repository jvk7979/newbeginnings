// src/pages/Atlas/DetailPanel.jsx
import { C } from '../../tokens';
import { STATES, AP_DISTRICTS, CATEGORIES } from './cropData';
import { intensityColor } from './geoHelpers';

export default function DetailPanel({ name, level, filter, onDrillDown, onClear }) {
  // Crop-overview mode: when a crop is picked on the India view, the panel
  // shows that crop's figures across every state instead of one state's
  // detail. (District drill-down keeps the per-district detail.)
  if (filter.crop && level === 'india') {
    return <CropOverview crop={filter.crop} metric={filter.metric} />;
  }
  if (!name) return <EmptyState/>;
  const isState = level === 'india';
  const data = isState ? STATES[name] : AP_DISTRICTS[name];
  if (!data) return <EmptyState/>;

  const crops = filter.category === 'all'
    ? data.crops
    : data.crops.filter((c) => c[1] === filter.category);
  const sortBy = filter.metric === 'area' ? 3 : filter.metric === 'share' ? 4 : 2;
  const sortedCrops = [...crops].sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0));
  const monopolies = isState ? data.crops.filter((c) => (c[4] || 0) >= 30) : [];

  return (
    <div style={{ padding: '22px 22px 40px', overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.fg3, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          {isState ? 'STATE' : 'DISTRICT · ANDHRA PRADESH'}
        </div>
        {onClear && (
          <button onClick={onClear} aria-label="Clear selection"
                  style={{ background: 'transparent', border: 'none', color: C.fg3, cursor: 'pointer', padding: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        )}
      </div>
      <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 600, color: C.fg1, lineHeight: 1.1, letterSpacing: '-0.02em', margin: '0 0 4px' }}>{name}</h2>
      {isState && (
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3 }}>
          {data.capital} · {data.area_sqkm.toLocaleString('en-IN')} km²
        </div>
      )}
      {!isState && (
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3 }}>
          Pop. {data.population} · {data.area_sqkm.toLocaleString('en-IN')} km²
        </div>
      )}

      {data.highlight && (
        <div style={{ marginTop: 10, padding: '6px 10px', background: C.accentBg, border: `1px solid var(--c-border-accent, #C4A060)`, borderRadius: 4, fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: 'var(--c-h-gold)', letterSpacing: '0.08em', display: 'inline-block', fontWeight: 700 }}>
          ★ MY HOME DISTRICT
        </div>
      )}

      {isState && STATES[name].districtKey && (
        <button onClick={() => onDrillDown?.(name)}
                style={{
                  marginTop: 16, width: '100%',
                  padding: '11px 14px',
                  border: `1px solid var(--c-border-accent, #C4A060)`,
                  background: C.accentBg, color: C.accent,
                  borderRadius: 6, cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                  fontWeight: 700, letterSpacing: '0.04em',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 21l-5-5"/><circle cx="11" cy="11" r="8"/><path d="M11 8v6M8 11h6"/></svg>
          Drill into {Object.keys(AP_DISTRICTS).length} districts →
        </button>
      )}

      {data.note && (
        <div style={{ marginTop: 16, padding: '11px 14px', background: C.bg2, borderLeft: `2px solid ${C.accent}`, borderRadius: 3 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif", fontSize: 14, color: C.fg2, lineHeight: 1.55, fontStyle: 'italic' }}>"{data.note}"</div>
        </div>
      )}

      {isState ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 18 }}>
          <Stat label="Net sown" value={`${(data.netSown_kha/1000).toFixed(2)} M ha`}/>
          <Stat label="Irrigated" value={`${data.irrigated_pct}%`}/>
          <Stat label="Farmers" value={`${data.farmers} M`}/>
          <Stat label="Monopolies" value={`${monopolies.length}`} accent/>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 18 }}>
          <Stat label="Main crop" value={data.crops[0][0]}/>
          <Stat label="Material" value={data.flagshipMaterial} accent/>
        </div>
      )}

      <SectionHead title="Crops & Production" meta={`${sortedCrops.length} of ${data.crops.length}`}/>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {sortedCrops.length === 0 && (
          <div style={{ padding: 14, background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, color: C.fg3, textAlign: 'center' }}>
            No crops in selected category.
          </div>
        )}
        {sortedCrops.map((c, i) => {
          const [crop, cat, prod, area, fifth] = c;
          const catMeta = CATEGORIES[cat];
          const top = sortedCrops[0];
          const topVal = filter.metric === 'area' ? top[3] : filter.metric === 'share' ? top[4] : top[2];
          const myVal = filter.metric === 'area' ? area : filter.metric === 'share' ? fifth : prod;
          const w = topVal > 0 ? (myVal / topVal) * 100 : 0;

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
                    </div>
                  )}
                  {!isState && (
                    <>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.fg3, marginTop: 1 }}>
                        {prod} KT · {area} K ha · {area > 0 ? (prod / area).toFixed(1) : '—'} t/ha yield
                      </div>
                      {fifth && (
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: C.fg3, fontStyle: 'italic', marginTop: 1 }}>{fifth}</div>
                      )}
                    </>
                  )}
                </div>
                {isState && fifth >= 20 && (
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, padding: '2px 6px', background: C.accentBg, color: 'var(--c-h-gold)', border: `1px solid var(--c-border-accent, #C4A060)`, borderRadius: 3, letterSpacing: '0.06em', fontWeight: 700 }}>
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

      <div style={{ marginTop: 28, padding: '10px 0', borderTop: `1px solid ${C.border}`, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.fg3, letterSpacing: '0.08em' }}>
        SOURCES · APEDA · COIR BOARD · SPICES BOARD · STATE HORTICULTURE 22–24
      </div>
    </div>
  );
}

// Crop-overview panel — shown when a crop is selected from the filter bar.
// Ranks every state by that crop under the active metric.
function CropOverview({ crop, metric }) {
  const metricLabel = metric === 'area' ? 'Sown area' : metric === 'share' ? "Nat'l share" : 'Production';
  const rows = Object.entries(STATES)
    .map(([stName, s]) => {
      const c = s.crops.find((x) => x[0] === crop);
      return c ? { state: stName, cat: c[1], prod: c[2], area: c[3], share: c[4] } : null;
    })
    .filter(Boolean);
  const key = metric === 'area' ? 'area' : metric === 'share' ? 'share' : 'prod';
  rows.sort((a, b) => (b[key] || 0) - (a[key] || 0));
  const totalProd = rows.reduce((s, r) => s + r.prod, 0);
  const totalArea = rows.reduce((s, r) => s + r.area, 0);
  const topVal = rows[0] ? (rows[0][key] || 0) : 0;
  const catMeta = rows[0] ? CATEGORIES[rows[0].cat] : null;

  return (
    <div style={{ padding: '22px 22px 40px', overflowY: 'auto', height: '100%' }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.fg3, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
        Crop · across India
      </div>
      <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 600, color: C.fg1, lineHeight: 1.1, letterSpacing: '-0.02em', margin: '0 0 4px' }}>{crop}</h2>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3 }}>
        Grown across {rows.length} state{rows.length === 1 ? '' : 's'} · the map is recoloured by this crop
      </div>

      {rows.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 18 }}>
          <Stat label="Total production" value={totalProd >= 1000 ? `${(totalProd / 1000).toFixed(1)} MT` : `${Math.round(totalProd)} KT`}/>
          <Stat label="Total area" value={totalArea >= 1000 ? `${(totalArea / 1000).toFixed(2)} M ha` : `${Math.round(totalArea)} K ha`} accent/>
        </div>
      )}

      <SectionHead title={`States by ${metricLabel}`} meta={`${rows.length} ranked`}/>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {rows.length === 0 && (
          <div style={{ padding: 14, background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, color: C.fg3, textAlign: 'center' }}>
            No state-level data for {crop}.
          </div>
        )}
        {rows.map((r, i) => {
          const v = key === 'area' ? r.area : key === 'share' ? r.share : r.prod;
          const w = topVal > 0 ? (v / topVal) * 100 : 0;
          const disp = metric === 'area' ? `${r.area} K ha`
            : metric === 'share' ? `${r.share}% IN`
            : r.prod >= 1000 ? `${(r.prod / 1000).toFixed(2)} MT` : `${r.prod} KT`;
          return (
            <div key={i} style={{ padding: '10px 12px', background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6, position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: `${w}%`,
                background: `linear-gradient(90deg, ${catMeta ? catMeta.color + '22' : C.bg2}, transparent)`,
              }}/>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg3, width: 16, flexShrink: 0 }}>{i + 1}</span>
                <span style={{ flex: 1, fontSize: 13, color: C.fg1, fontWeight: 500 }}>{r.state}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.accent, whiteSpace: 'nowrap' }}>{disp}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 28, padding: '10px 0', borderTop: `1px solid ${C.border}`, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.fg3, letterSpacing: '0.08em' }}>
        SOURCES · APEDA · COIR BOARD · SPICES BOARD · STATE HORTICULTURE 22–24
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ padding: 22 }}>
      <div style={{ fontSize: 10, color: C.fg3, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>No selection</div>
      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 500, color: C.fg1, lineHeight: 1.2, letterSpacing: '-0.01em' }}>
        Hover any region to inspect.
      </div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg2, marginTop: 10, lineHeight: 1.55 }}>
        Click a state to lock its detail panel. States with a gold dot have district-level drill-down.
      </div>
      <div style={{ marginTop: 28, padding: 14, background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 8 }}>
        <div style={{ fontSize: 10, color: C.fg3, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Reading the map</div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 12, color: C.fg2, lineHeight: 1.7 }}>
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
    <div style={{ padding: '10px 12px', background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6 }}>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: C.fg3, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, color: accent ? C.accent : C.fg1, lineHeight: 1.1 }}>{value}</div>
    </div>
  );
}

function SectionHead({ title, meta }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, margin: '24px 0 10px' }}>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: C.fg3, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>{title}</div>
      {meta && <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.fg3 }}>{meta}</div>}
    </div>
  );
}
