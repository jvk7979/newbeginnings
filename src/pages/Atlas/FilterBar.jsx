// src/pages/Atlas/FilterBar.jsx
import { C } from '../../tokens';
import { CATEGORIES } from './cropData';
import desData from './desData.json';
import CropSelect from './CropSelect';

const METRICS = [
  ['production', 'Production'],
  ['area',       'Area'],
  ['share',      "Nat'l Share"],
];

// Atlas data modes — Snapshot is the curated cropData; Yearly·DES drives the
// maps from real Directorate of Economics & Statistics data by year.
const MODES = [
  ['snapshot', 'Snapshot'],
  ['des',      'Yearly · DES'],
];

// Selectable financial years — DES has state data 2021-22…2025-26, but
// 2025-26 is incomplete so it is omitted from the picker.
const YEAR_OPTIONS = desData.meta.stateYears.filter((y) => y !== '2025-26');

export default function FilterBar({
  filter, setFilter, view, onBack, searchValue, setSearch, onSearchSelect,
  states, apDistricts, mode, setMode, year, setYear,
}) {
  const cats = [['all', 'All']].concat(Object.entries(CATEGORIES).map(([k, v]) => [k, v.label]));
  const results = computeSearchResults(searchValue, view, states, apDistricts);

  return (
    <div style={{
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
      <div style={{ position: 'relative' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: C.bg1,
          border: `1px solid ${searchValue ? 'var(--c-border-accent, #C4A060)' : C.border}`,
          borderRadius: 6, padding: '6px 12px', minWidth: 240,
          transition: 'border-color 120ms',
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.fg3} strokeWidth="1.5">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-5-5"/>
          </svg>
          <input
            value={searchValue}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={view.level === 'india' ? 'Search state or crop…' : 'Search district…'}
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 13, width: 200,
            }}/>
          {searchValue && (
            <button onClick={() => setSearch('')} style={{ background: 'transparent', border: 'none', color: C.fg3, cursor: 'pointer', padding: 0 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          )}
        </div>
        {results.length > 0 && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, width: 320,
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

      <div style={{ width: 1, height: 24, background: C.border }}/>

      {/* Category pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: C.fg3, letterSpacing: '0.12em', textTransform: 'uppercase', marginRight: 6 }}>Category</span>
        {cats.map(([k, label]) => {
          const active = filter.category === k;
          const cat = CATEGORIES[k];
          return (
            <button key={k}
              onClick={() => setFilter((f) => ({ ...f, category: k }))}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '5px 11px', borderRadius: 999,
                background: active ? C.accentBg : 'transparent',
                color: active ? C.accent : C.fg2,
                border: `1px solid ${active ? 'var(--c-border-accent, #C4A060)' : C.border}`,
                fontFamily: "'DM Sans', sans-serif", fontSize: 11,
                fontWeight: active ? 600 : 500, cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all 120ms',
              }}>
              {cat && <span style={{ width: 6, height: 6, borderRadius: '50%', background: cat.color }}/>}
              {label}
            </button>
          );
        })}
      </div>

      <div style={{ width: 1, height: 24, background: C.border }}/>

      {/* Mode toggle — Snapshot (curated) vs Yearly · DES (real govt data) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: C.fg3, letterSpacing: '0.12em', textTransform: 'uppercase', marginRight: 6 }}>Mode</span>
        <div style={{ display: 'flex', background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6, padding: 2 }}>
          {MODES.map(([k, label]) => {
            const active = mode === k;
            return (
              <button key={k}
                onClick={() => setMode?.(k)}
                style={{
                  padding: '5px 11px', border: 'none', borderRadius: 4,
                  background: active ? C.bg3 : 'transparent',
                  color: active ? C.fg1 : C.fg3,
                  fontFamily: "'DM Sans', sans-serif", fontSize: 11,
                  fontWeight: active ? 600 : 500, cursor: 'pointer',
                  transition: 'all 120ms', whiteSpace: 'nowrap',
                }}>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Financial-Year selector — only in DES mode, and hidden once drilled
          into AP districts (district data is DES 2024-25 only). */}
      {mode === 'des' && view.level === 'india' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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

      <div style={{ flex: 1 }}/>

      {/* Recolour the whole map by one crop (or "Any crop" for category colouring) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: C.fg3, letterSpacing: '0.12em', textTransform: 'uppercase', marginRight: 2 }}>Crop</span>
        <CropSelect crop={filter.crop} onChange={(c) => setFilter((f) => ({ ...f, crop: c }))} />
      </div>

      {/* Metric toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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

// Search over the *active* dataset (Snapshot or DES) — `states` /
// `apDistricts` are passed in from index.jsx so search tracks the mode.
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
