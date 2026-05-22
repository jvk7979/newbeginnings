// src/pages/Atlas/FilterBar.jsx
import { C } from '../../tokens';
import apedaData from './apedaData.json';
import CropSelect from './CropSelect';

// Metric toggle — Production (APEDA) and Area (DES sown area, merged in).
const METRICS = [
  ['production', 'Production'],
  ['area',       'Area'],
];

// Selectable financial years — APEDA has state data for all five years
// 2020-21…2024-25 (no incomplete year to exclude).
const YEAR_OPTIONS = apedaData.meta.years;

// Crop dropdown list — the real APEDA crops, so a picked crop always
// resolves to data on the map.
const APEDA_CROPS = Object.keys(apedaData.cropCategory).sort();

export default function FilterBar({
  filter, setFilter, view, onBack, searchValue, setSearch, onSearchSelect,
  states, apDistricts, year, setYear,
}) {
  const results = computeSearchResults(searchValue, view, states, apDistricts);

  return (
    <div className="atlas-filterbar" style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 24px',
      background: C.bg0, borderBottom: `1px solid ${C.border}`,
      position: 'relative', zIndex: 20, flexWrap: 'wrap',
    }}>
      {view.level === 'state' && (
        <button onClick={onBack} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 10px', background: C.bg2, color: C.fg2,
          border: `1px solid ${C.border}`, borderRadius: 6,
          fontFamily: "'DM Sans', sans-serif", fontSize: 12, cursor: 'pointer',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          Back to India
        </button>
      )}

      {/* Search (with dropdown) */}
      <div className="atlas-fb-search" style={{ position: 'relative' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: C.bg1,
          border: `1px solid ${searchValue ? 'var(--c-border-accent, #C4A060)' : C.border}`,
          borderRadius: 6, padding: '6px 12px', minWidth: 200,
          transition: 'border-color 120ms',
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.fg3} strokeWidth="1.5"
               style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-5-5"/>
          </svg>
          <input
            value={searchValue}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={view.level === 'india' ? 'Search state or crop…' : 'Search district…'}
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 13,
              flex: 1, minWidth: 0, width: '100%',
            }}/>
          {searchValue && (
            <button onClick={() => setSearch('')} style={{ background: 'transparent', border: 'none', color: C.fg3, cursor: 'pointer', padding: 0 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          )}
        </div>
        {results.length > 0 && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0,
            width: 'min(320px, calc(100vw - 48px))',
            background: C.bg1, border: `1px solid ${C.borderLight}`, borderRadius: 8,
            boxShadow: '0 12px 40px rgba(45,42,38,0.18)', zIndex: 50,
            maxHeight: 340, overflowY: 'auto',
          }}>
            {results.slice(0, 12).map((r, i) => (
              <div key={i}
                   onClick={() => onSearchSelect(r)}
                   style={{
                     padding: '10px 14px',
                     borderBottom: i < results.length - 1 ? `1px solid ${C.border}` : 'none',
                     cursor: 'pointer', transition: 'background 120ms',
                   }}
                   onMouseEnter={(e) => (e.currentTarget.style.background = C.bg2)}
                   onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.fg3, letterSpacing: '0.08em', padding: '1px 5px', background: C.bg3, borderRadius: 3 }}>
                    {r.kind.toUpperCase()}
                  </span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg1, fontWeight: 500 }}>{r.name}</span>
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.fg3 }}>{r.meta}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="atlas-fb-divider" style={{ width: 1, height: 24, background: C.border }}/>

      {/* Financial-Year selector — shown at India level; hidden once drilled
          into AP districts (district data is DES 2024-25 only). */}
      {view.level === 'india' && (
        <div className="atlas-fb-group" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: C.fg3, letterSpacing: '0.12em', textTransform: 'uppercase', marginRight: 2 }}>Year</span>
          <select
            value={year}
            onChange={(e) => setYear?.(e.target.value)}
            style={{
              background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6,
              padding: '5px 9px', cursor: 'pointer',
              fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
              fontWeight: 600, color: C.fg1, outline: 'none',
            }}>
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      )}

      <div className="atlas-fb-spacer" style={{ flex: 1 }}/>

      {/* Recolour the whole map by one crop (or "Any crop" for the all-crops aggregate) */}
      <div className="atlas-fb-group" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: C.fg3, letterSpacing: '0.12em', textTransform: 'uppercase', marginRight: 2 }}>Crop</span>
        <CropSelect crop={filter.crop} crops={APEDA_CROPS}
                    onChange={(c) => setFilter((f) => ({ ...f, crop: c }))} />
      </div>

      {/* Metric toggle */}
      <div className="atlas-fb-group" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: C.fg3, letterSpacing: '0.12em', textTransform: 'uppercase', marginRight: 6 }}>Metric</span>
        <div style={{ display: 'flex', background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6, padding: 2 }}>
          {METRICS.map(([k, label]) => {
            const active = filter.metric === k;
            return (
              <button key={k}
                onClick={() => setFilter((f) => ({ ...f, metric: k }))}
                style={{
                  padding: '5px 11px', border: 'none', borderRadius: 4,
                  background: active ? C.bg3 : 'transparent',
                  color: active ? C.fg1 : C.fg3,
                  fontFamily: "'DM Sans', sans-serif", fontSize: 11,
                  fontWeight: active ? 600 : 500, cursor: 'pointer',
                  transition: 'all 120ms',
                }}>
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Search over the active dataset — `states` / `apDistricts` are passed in
// from index.jsx so search tracks the selected financial year.
function computeSearchResults(query, view, states, apDistricts) {
  if (!query) return [];
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const out = [];
  if (view.level === 'india') {
    for (const name of Object.keys(states)) {
      const code = (states[name].code || '').toLowerCase();
      if (name.toLowerCase().includes(q) || (code && code === q)) {
        out.push({ kind: 'state', name, meta: `${states[name].crops.length} crops · ${states[name].capital || '—'}` });
      }
    }
    for (const name of Object.keys(states)) {
      const matches = states[name].crops.filter((c) => c[0].toLowerCase().includes(q));
      for (const c of matches.slice(0, 1)) {
        out.push({ kind: 'crop', name: c[0], state: name, meta: `${name} · ${c[4]}% national`, share: c[4] });
      }
    }
    out.sort((a, b) => (b.share || 0) - (a.share || 0));
  } else {
    for (const name of Object.keys(apDistricts)) {
      if (name.toLowerCase().includes(q)) {
        out.push({ kind: 'district', name, meta: apDistricts[name].flagshipMaterial });
      }
    }
  }
  return out;
}
