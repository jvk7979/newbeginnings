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

// Shared label style for each control group — matches the uppercase mono
// labels used across the app's filter rows.
const fbLabel = {
  fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600,
  color: C.fg3, letterSpacing: '0.1em', textTransform: 'uppercase',
  whiteSpace: 'nowrap',
};

export default function FilterBar({
  filter, setFilter, view, onBack, searchValue, setSearch, onSearchSelect,
  states, apDistricts, year, setYear,
}) {
  const results = computeSearchResults(searchValue, view, states, apDistricts);

  return (
    <div className="atlas-filterbar" style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 32px',
      background: C.bg0, borderBottom: `1px solid ${C.border}`,
      position: 'relative', zIndex: 20, flexWrap: 'wrap',
    }}>
      {view.level === 'state' && (
        <button onClick={onBack} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 14px', background: C.bg1, color: C.fg2,
          border: `1px solid ${C.border}`, borderRadius: 6,
          fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
          cursor: 'pointer', transition: 'background 120ms, color 120ms',
        }}
          onMouseEnter={(e) => { e.currentTarget.style.background = C.bg2; e.currentTarget.style.color = C.fg1; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = C.bg1; e.currentTarget.style.color = C.fg2; }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          Back to India
        </button>
      )}

      {/* Search (with dropdown) */}
      <div className="atlas-fb-search" style={{ position: 'relative' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: C.bg1,
          border: `1px solid ${searchValue ? C.accent : C.border}`,
          borderRadius: 6, padding: '8px 12px', minWidth: 220,
          transition: 'border-color 120ms',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.fg3} strokeWidth="1.75"
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
                     cursor: 'pointer', transition: 'background 120ms',
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

      <div className="atlas-fb-divider" style={{ width: 1, height: 26, background: C.border }}/>

      {/* Financial-Year selector — shown at India level; hidden once drilled
          into AP districts (district data is DES 2024-25 only). */}
      {view.level === 'india' && (
        <div className="atlas-fb-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={fbLabel}>Year</span>
          <div className="select-wrap" style={{ minWidth: 100 }}>
            <select
              value={year}
              onChange={(e) => setYear?.(e.target.value)}
              style={{
                background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6,
                padding: '8px 12px', cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
                fontWeight: 600, color: C.fg1, outline: 'none',
              }}>
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="atlas-fb-spacer" style={{ flex: 1 }}/>

      {/* Recolour the whole map by one crop (or "Any crop" for the all-crops aggregate) */}
      <div className="atlas-fb-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={fbLabel}>Crop</span>
        <CropSelect crop={filter.crop} crops={APEDA_CROPS}
                    onChange={(c) => setFilter((f) => ({ ...f, crop: c }))} />
      </div>

      {/* Metric toggle — segmented control, matching the Markets view toggle */}
      <div className="atlas-fb-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
                  fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                  fontWeight: 500, cursor: 'pointer',
                  transition: 'background 120ms, color 120ms',
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
