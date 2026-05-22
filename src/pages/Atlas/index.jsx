// src/pages/Atlas/index.jsx
//
// AtlasPage — India crops & raw-materials atlas. Follows the Markets page
// pattern: JetBrains Mono eyebrow, Playfair title with a Cormorant italic
// flourish, DM Sans subhead, then the working surface.
//
// India state choropleth → click a gold-dotted state to drill into its
// districts. Filter by crop category, OR pick one crop from the Crop
// dropdown to recolour the whole country by it. Layout: 60/40 split
// between map (centre) and detail panel (right).

import { useMemo, useState } from 'react';
import { C } from '../../tokens';
import IndiaMap from './IndiaMap';
import APMap from './APMap';
import FilterBar from './FilterBar';
import DetailPanel from './DetailPanel';
import RankingPanel from './RankingPanel';
import HoverTip from './HoverTip';
import Legend from './Legend';
import { STATES } from './cropData';
import { buildDesStates, mergedApDistricts } from './desDataset';

// eslint-disable-next-line no-unused-vars
export default function AtlasPage({ onNavigate }) {
  // `crop` null = no crop picked → maps colour by the category aggregate.
  const [filter, setFilter] = useState({ category: 'all', metric: 'production', crop: null });
  const [view, setView] = useState({ level: 'india', state: null });
  const [hover, setHover] = useState(null);                       // { name, x, y }
  const [selected, setSelected] = useState(null);                 // null → ranking table
  const [districtSelected, setDistrictSelected] = useState(null); // null → ranking table
  const [search, setSearch] = useState('');
  // Data mode — 'snapshot' = curated cropData (default, byte-identical to
  // the original Atlas); 'des' = real DES data driven by the chosen year.
  const [mode, setMode] = useState('snapshot');
  const [year, setYear] = useState('2024-25');

  // The active datasets handed down to every component. In Snapshot mode the
  // states are the curated STATES; in DES mode they are built from real DES
  // data for the year. AP district crops are always DES (there is no curated
  // district crop data), so mergedApDistricts is used in both modes.
  const activeStates = useMemo(
    () => (mode === 'des' ? buildDesStates(year) : STATES),
    [mode, year],
  );
  const activeApDistricts = mergedApDistricts;

  // Switching mode/year invalidates any focused region — drop back to the
  // ranking table so the panel never shows a stale or absent region.
  const handleSetMode = (m) => {
    setMode(m);
    setSelected(null);
    setDistrictSelected(null);
  };
  const handleSetYear = (y) => {
    setYear(y);
    setSelected(null);
    setDistrictSelected(null);
  };

  const handleHover = (name, e) => {
    if (!name) { setHover(null); return; }
    // `tip` drives the floating HoverTip — set for map hovers (which carry a
    // mouse event) but not ranking-table row hovers, which only highlight.
    setHover({ name, x: e?.clientX || 0, y: e?.clientY || 0, tip: !!e });
  };

  const handleSelect = (name) => {
    if (view.level === 'india') setSelected(name);
    else setDistrictSelected(name);
  };

  const handleDrillDown = (stateName) => {
    if (activeStates[stateName]?.districtKey) {
      setView({ level: 'state', state: stateName });
      setDistrictSelected(null);   // open the district ranking, not a stale detail
      setHover(null);
    }
  };

  const handleBack = () => {
    setView({ level: 'india', state: null });
    setSelected(null);             // return to the India ranking
    setHover(null);
  };

  const handleSearchSelect = (r) => {
    if (r.kind === 'state' || r.kind === 'crop') {
      setSelected(r.state || r.name);
      setSearch('');
    } else if (r.kind === 'district') {
      setDistrictSelected(r.name);
      setSearch('');
    }
  };

  // The right pane shows the ranked table until a region is focused
  // (clicked); then it shows that region's detail. Hover only highlights —
  // it no longer swaps the pane.
  const focused = view.level === 'india' ? selected : districtSelected;
  const clearFocus = view.level === 'india' ? () => setSelected(null) : () => setDistrictSelected(null);

  return (
    <div className="page-pad" style={{ background: C.bg0, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
      {/* Page header (mirrors Markets/index.jsx) */}
      <div style={{ padding: '24px 32px 20px', borderBottom: `1px solid ${C.border}`, background: C.bg0 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.fg3, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
          Atlas · {view.level === 'india' ? 'India' : view.state}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 className="page-title" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 34, fontWeight: 600, color: C.fg1, margin: 0, lineHeight: 1.15, letterSpacing: '-0.01em' }}>
              {view.level === 'india' ? 'Crops & Raw Materials' : view.state}
              {' '}
              <span style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif", fontStyle: 'italic', fontWeight: 600, color: C.accent }}>
                {view.level === 'india' ? 'Atlas' : '· Districts'}
              </span>
            </h1>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3, marginTop: 6, lineHeight: 1.45, maxWidth: 760 }}>
              {view.level === 'india'
                ? 'Choropleth of agri-production across India. Filter by category or recolour the whole map by a single crop, switch metric, hover to inspect — click states with a gold dot to drill into districts.'
                : 'District-level breakdown of crops and downstream raw-material streams for venture exploration.'}
            </div>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--c-h-gold)', padding: '6px 12px', background: 'var(--c-h-gold-bg)', border: `1px solid ${C.borderLight}`, borderRadius: 999, letterSpacing: '0.04em' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--c-h-gold)' }}/>
            DATA · FY 22–24
          </span>
        </div>
      </div>

      <FilterBar
        filter={filter} setFilter={setFilter}
        view={view} onBack={handleBack}
        searchValue={search} setSearch={setSearch}
        onSearchSelect={handleSearchSelect}
        states={activeStates} apDistricts={activeApDistricts}
        mode={mode} setMode={handleSetMode}
        year={year} setYear={handleSetYear}
      />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* Map area */}
        <div style={{ flex: 1, position: 'relative', minWidth: 0, background: C.bg0 }}>
          {view.level === 'india' && (
            <IndiaMap filter={filter}
                      states={activeStates}
                      hovered={hover?.name}
                      selected={selected}
                      onHover={handleHover}
                      onSelect={handleSelect}
                      onDrillDown={handleDrillDown}/>
          )}
          {view.level === 'state' && (
            <APMap filter={filter}
                   apDistricts={activeApDistricts}
                   hovered={hover?.name}
                   selected={districtSelected}
                   onHover={handleHover}
                   onSelect={handleSelect}/>
          )}
          <Legend filter={filter} view={view} mode={mode} year={year}/>

          {view.level === 'india' && (
            <div style={{
              position: 'absolute', top: 18, right: 18,
              background: 'rgba(253,250,242,0.94)',
              border: `1px solid ${C.border}`, borderRadius: 10,
              padding: '12px 16px', backdropFilter: 'blur(8px)',
              boxShadow: '0 8px 24px rgba(45,42,38,0.12)',
              fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg2, maxWidth: 240,
            }}>
              <div style={{ fontSize: 9, color: C.fg3, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6, fontWeight: 700 }}>India · snapshot</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
                <SnapStat value="140 M" label="HA NET SOWN"/>
                <SnapStat value="146 M" label="FARM HHS" accent/>
                <SnapStat value="22.7 MT" label="COCONUT"/>
                <SnapStat value="138 MT" label="RICE"/>
              </div>
            </div>
          )}
        </div>

        {/* Right pane — ranked table by default, region detail once focused */}
        <div style={{ width: 360, background: C.bg1, borderLeft: `1px solid ${C.border}`, flexShrink: 0, overflow: 'hidden' }}>
          {focused ? (
            <DetailPanel
              name={focused} level={view.level} filter={filter}
              states={activeStates} apDistricts={activeApDistricts}
              onDrillDown={handleDrillDown}
              onClear={clearFocus}
            />
          ) : (
            <RankingPanel
              level={view.level} filter={filter}
              states={activeStates} apDistricts={activeApDistricts}
              hovered={hover?.name}
              onHover={handleHover}
              onSelect={handleSelect}
            />
          )}
        </div>
      </div>

      {/* Floating hover tooltip — map hovers only, never over the focused region */}
      {hover && hover.tip && hover.name !== focused && (
        <HoverTip name={hover.name} level={view.level} x={hover.x} y={hover.y}
                  filter={filter} states={activeStates} apDistricts={activeApDistricts}/>
      )}
    </div>
  );
}

function SnapStat({ value, label, accent }) {
  return (
    <div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: accent ? C.accent : C.fg1 }}>{value}</div>
      <div style={{ fontSize: 9, color: C.fg3, letterSpacing: '0.08em' }}>{label}</div>
    </div>
  );
}
