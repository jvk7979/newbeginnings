// src/pages/Atlas/index.jsx
//
// AtlasPage — India crops & raw-materials atlas. Follows the Markets page
// pattern: JetBrains Mono eyebrow, Playfair title with a Cormorant italic
// flourish, DM Sans subhead, then the working surface.
//
// India state choropleth → click a gold-dotted state to drill into its
// districts. Pick one crop from the Crop dropdown to recolour the whole
// country by it, switch the metric between Production and Area, and choose
// the financial year. Layout: 60/40 split between map (centre) and detail
// panel (right). All state data is APEDA-backed (production) with DES sown
// area merged in.

import { useMemo, useState } from 'react';
import { C } from '../../tokens';
import IndiaMap from './IndiaMap';
import APMap from './APMap';
import FilterBar from './FilterBar';
import DetailPanel from './DetailPanel';
import RankingPanel from './RankingPanel';
import HoverTip from './HoverTip';
import Legend from './Legend';
import { buildUnifiedStates, mergedApDistricts } from './desDataset';

// eslint-disable-next-line no-unused-vars
export default function AtlasPage({ onNavigate }) {
  // `crop` null = no crop picked → maps colour by the all-crops aggregate.
  // `category` is fixed at 'all' (the category filter UI was removed) so the
  // compute helpers in geoHelpers keep working unchanged.
  const [filter, setFilter] = useState({ category: 'all', metric: 'production', crop: null });
  const [view, setView] = useState({ level: 'india', state: null });
  const [hover, setHover] = useState(null);                       // { name, x, y }
  const [selected, setSelected] = useState(null);                 // null → ranking table
  const [districtSelected, setDistrictSelected] = useState(null); // null → ranking table
  const [search, setSearch] = useState('');
  const [year, setYear] = useState('2024-25');

  // The active state dataset handed down to every component — always the
  // year-driven unified dataset (APEDA production + DES sown area). AP
  // district crops are always DES (there is no district-level APEDA data).
  const activeStates = useMemo(() => buildUnifiedStates(year), [year]);
  const activeApDistricts = mergedApDistricts;

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

  // The metric toggle is now just Production / Area. Defend against any
  // stale 'share' value (the Nat'l Share metric was removed) so the choro-
  // pleth and panels never colour by a metric the UI can no longer pick.
  const safeFilter = filter.metric === 'share'
    ? { ...filter, metric: 'production' }
    : filter;

  return (
    <div className="page-pad atlas-root" style={{ background: C.bg0, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
      {/* Page header (mirrors Markets/index.jsx) */}
      <div className="atlas-header" style={{ padding: '24px 32px 20px', borderBottom: `1px solid ${C.border}`, background: C.bg0 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.fg3, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
          Atlas · {view.level === 'india' ? 'India' : view.state}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 className="page-title atlas-title" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 34, fontWeight: 600, color: C.fg1, margin: 0, lineHeight: 1.15, letterSpacing: '-0.01em' }}>
              {view.level === 'india' ? 'Crops & Raw Materials' : view.state}
              {' '}
              <span style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif", fontStyle: 'italic', fontWeight: 600, color: C.accent }}>
                {view.level === 'india' ? 'Atlas' : '· Districts'}
              </span>
            </h1>
            <div className="atlas-subhead" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3, marginTop: 6, lineHeight: 1.45, maxWidth: 760 }}>
              {view.level === 'india'
                ? 'Real state-wise crop production across India by financial year — pick a crop to recolour the map, switch metric, click a state with a gold dot to drill into its districts.'
                : 'District-level breakdown of crops and downstream raw-material streams for venture exploration.'}
            </div>
          </div>
        </div>
      </div>

      <FilterBar
        filter={safeFilter} setFilter={setFilter}
        view={view} onBack={handleBack}
        searchValue={search} setSearch={setSearch}
        onSearchSelect={handleSearchSelect}
        states={activeStates} apDistricts={activeApDistricts}
        year={year} setYear={handleSetYear}
      />

      <div className="atlas-body" style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* Map area — sizing is owned by .atlas-map in styles.css: on desktop
            it is sized to India's aspect ratio off the row height so it never
            stretches into wide cream letterbox gaps (the map+panel group is
            centred via .atlas-body); below 1100px it becomes a full-width
            fixed-height slice. */}
        <div className="atlas-map" style={{ position: 'relative', background: C.bg0 }}>
          {view.level === 'india' && (
            <IndiaMap filter={safeFilter}
                      states={activeStates}
                      hovered={hover?.name}
                      selected={selected}
                      onHover={handleHover}
                      onSelect={handleSelect}
                      onDrillDown={handleDrillDown}/>
          )}
          {view.level === 'state' && (
            <APMap filter={safeFilter}
                   apDistricts={activeApDistricts}
                   hovered={hover?.name}
                   selected={districtSelected}
                   onHover={handleHover}
                   onSelect={handleSelect}/>
          )}
          <Legend filter={safeFilter} view={view} year={year}/>

          {view.level === 'india' && (
            <div style={{
              position: 'absolute', top: 18, right: 18,
              background: 'rgba(253,250,242,0.94)',
              border: `1px solid ${C.border}`, borderRadius: 10,
              padding: '12px 16px', backdropFilter: 'blur(8px)',
              boxShadow: '0 8px 24px rgba(45,42,38,0.12)',
              fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg2, maxWidth: 240,
            }}>
              <div style={{ fontSize: 9, color: C.fg3, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6, fontWeight: 700 }}>India · overview</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
                <SnapStat value="140 M" label="HA NET SOWN"/>
                <SnapStat value="146 M" label="FARM HHS" accent/>
                <SnapStat value="22.7 MT" label="COCONUT"/>
                <SnapStat value="138 MT" label="RICE"/>
              </div>
            </div>
          )}
        </div>

        {/* Right pane — ranked table by default, region detail once focused.
            Widened to 520px: the RankingPanel table and DetailPanel stat
            grids genuinely use the extra room, and it helps the map+panel
            group fill wide screens without large empty cream gaps. */}
        <div className="atlas-side" style={{ width: 520, background: C.bg1, borderLeft: `1px solid ${C.border}`, flexShrink: 0, overflow: 'hidden' }}>
          {focused ? (
            <DetailPanel
              name={focused} level={view.level} filter={safeFilter}
              states={activeStates} apDistricts={activeApDistricts}
              onDrillDown={handleDrillDown}
              onClear={clearFocus}
            />
          ) : (
            <RankingPanel
              level={view.level} filter={safeFilter}
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
                  filter={safeFilter} states={activeStates} apDistricts={activeApDistricts}/>
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
