// src/pages/Atlas/FilterBar.jsx
//
// Atlas-tab control row — Crop, Metric, Year, Search, and a "SHOWING …"
// status that names what the choropleth is currently coloured by. The
// category filter lives in the left rail (AtlasSidebar), not here.

import { C } from '../../tokens';
import { CATEGORIES } from './cropData';
import CropSelect from './CropSelect';

// Metric toggle — Production (APEDA) and Area (DES sown area, merged in).
const METRICS = [
  ['production', 'Prod'],
  ['area',       'Area'],
];

const fbLabel = {
  fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600,
  color: C.fg3, letterSpacing: '0.14em', textTransform: 'uppercase',
  whiteSpace: 'nowrap',
};
const grp = { display: 'flex', alignItems: 'center', gap: 8 };

// YEAR_OPTIONS + CROP_OPTIONS used to be derived at module-init time
// from a static import of apedaData.json. That import baked ~480 KB of
// JSON into the JS bundle. After the move to public/data/ + runtime
// fetch (see desDataset.js), the lists arrive as props from the Atlas
// page, which knows when the data is ready. Fallbacks below cover the
// brief pre-load window so the first paint doesn't crash.
const DEFAULT_YEAR_OPTIONS = ['2024-25'];

export default function FilterBar({
  filter, setFilter, view, onBack, searchValue, setSearch, onSearchSelect,
  states, apDistricts, year, setYear,
  yearOptions, cropOptions,
}) {
  const YEAR_OPTIONS  = yearOptions || DEFAULT_YEAR_OPTIONS;
  const APEDA_CROPS   = cropOptions || [];
  const results = computeSearchResults(searchValue, view, states, apDistricts);

  // What the map is coloured by right now — a picked crop wins over a
  // picked category; otherwise it is the all-crops aggregate.
  const scope = filter.crop
    ? filter.crop
    : (filter.category && filter.category !== 'all'
        ? (CATEGORIES[filter.category]?.label || 'All crops')
        : 'All crops');
  const metricWord = filter.metric === 'area' ? 'Area' : 'Production';
  const yearWord = view.level === 'india' ? year : '2024-25';

  return (
    <div className="atlas-filterbar" style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '11px 24px',
      background: C.bg0, borderBottom: `1px solid ${C.border}`,
      position: 'relative', zIndex: 20, flexWrap: 'wrap',
    }}>
      {view.level === 'state' && (
        <button onClick={onBack} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 13px', background: C.bg1, color: C.fg2,
          border: `1px solid ${C.border}`, borderRadius: 6,
          fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
          cursor: 'pointer',
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          Back to India
        </button>
      )}

      {/* Crop — recolour the whole map by one crop, or the all-crops aggregate */}
      <div style={grp}>
        <span style={fbLabel}>Crop</span>
        <CropSelect crop={filter.crop} crops={APEDA_CROPS}
                    emptyLabel="All crops (aggregate)"
                    onChange={(c) => setFilter((f) => ({ ...f, crop: c, category: 'all' }))}/>
      </div>

      {/* Metric toggle */}
      <div style={grp}>
        <span style={fbLabel}>Metric</span>
        <div role="group" aria-label="Metric" style={{ display: 'flex', border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
          {METRICS.map(([k, label]) => {
            const active = filter.metric === k;
            return (
              <button key={k}
                onClick={() => setFilter((f) => ({ ...f, metric: k }))}
                aria-pressed={active}
                style={{
                  padding: '8px 14px', border: 'none',
                  background: active ? C.accent : 'transparent',
                  color: active ? '#fff' : C.fg2,
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                  fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
                  cursor: 'pointer',
                }}>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Financial-Year selector — India level only (district data is DES 2024-25) */}
      {view.level === 'india' && (
        <div style={grp}>
          <span style={fbLabel}>Year</span>
          <div className="select-wrap">
            <select value={year} onChange={(e) => setYear?.(e.target.value)}
              style={{
                background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6,
                padding: '8px 12px', cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
                fontWeight: 600, color: C.fg1, outline: 'none',
              }}>
              {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Search */}
      <div style={grp}>
        <span style={fbLabel}>Search</span>
        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, background: C.bg1,
            border: `1px solid ${searchValue ? C.accent : C.border}`,
            borderRadius: 6, padding: '8px 12px', minWidth: 210,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.fg3} strokeWidth="1.75" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-5-5"/>
            </svg>
            <input
              value={searchValue}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={view.level === 'india' ? 'state, district or crop' : 'Search district…'}
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                flex: 1, minWidth: 0, width: '100%',
              }}/>
            {searchValue && (
              <button onClick={() => setSearch('')} aria-label="Clear search"
                style={{ background: 'transparent', border: 'none', color: C.fg3, cursor: 'pointer', padding: 0, display: 'flex', flexShrink: 0 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            )}
          </div>
          {results.length > 0 && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0,
              width: 'min(320px, calc(100vw - 48px))',
              background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 10,
              boxShadow: '0 12px 32px rgba(0,0,0,0.16)', zIndex: 50,
              maxHeight: 340, overflowY: 'auto',
            }}>
              {results.slice(0, 12).map((r, i) => (
                <div key={i}
                     onClick={() => onSearchSelect(r)}
                     style={{
                       padding: '10px 14px',
                       borderBottom: i < Math.min(results.length, 12) - 1 ? `1px solid ${C.border}` : 'none',
                       cursor: 'pointer',
                     }}
                     onMouseEnter={(e) => (e.currentTarget.style.background = C.bg2)}
                     onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: C.fg3, letterSpacing: '0.08em', padding: '2px 6px', background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 4 }}>
                      {r.kind.toUpperCase()}
                    </span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg1, fontWeight: 500 }}>{r.name}</span>
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg3 }}>{r.meta}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 12 }}/>

      {/* SHOWING status — names the current colouring */}
      <div style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
        letterSpacing: '0.1em', textTransform: 'uppercase', color: C.fg3,
        whiteSpace: 'nowrap',
      }}>
        Showing <b style={{ color: C.fg1, fontWeight: 700 }}>{scope}</b> · {metricWord} · {yearWord}
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
