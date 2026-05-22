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
      {/* Page header (mirrors Markets/index.jsx) — compacted so the map row
          below reclaims the height; the aspect-locked map grows with it. */}
      <div className="atlas-header" style={{ padding: '12px 32px 10px', borderBottom: `1px solid ${C.border}`, background: C.bg0 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg3, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
          Atlas · {view.level === 'india' ? 'India' : view.state}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 320px', minWidth: 260 }}>
            <h1 className="page-title atlas-title" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 25, fontWeight: 600, color: C.fg1, margin: 0, lineHeight: 1.12, letterSpacing: '-0.01em' }}>
              {view.level === 'india' ? 'Crops & Raw Materials' : view.state}
              {' '}
              <span style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif", fontStyle: 'italic', fontWeight: 600, color: C.accent }}>
                {view.level === 'india' ? 'Atlas' : '· Districts'}
              </span>
            </h1>
            <div className="atlas-subhead" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, color: C.fg3, marginTop: 3, lineHeight: 1.4, maxWidth: 720 }}>
              {view.level === 'india'
                ? 'State-wise crop production by financial year — pick a crop to recolour the map, or click a gold-dotted state to drill into its districts.'
                : 'District-level breakdown of crops and downstream raw-material streams for venture exploration.'}
            </div>
          </div>

          {/* Compact stat strip — moved out of the map area so nothing
              floats over India. India view only; wraps below the title on
              narrow screens. */}
          {view.level === 'india' && (
            <div className="atlas-overview" style={{
              display: 'flex', alignItems: 'stretch', flexWrap: 'wrap',
              gap: 0, flexShrink: 0,
              border: `1px solid ${C.border}`, borderRadius: 10,
              background: C.bg1, overflow: 'hidden',
            }}>
              <SnapStat value="140 M" label="HA NET SOWN"/>
              <SnapStat value="146 M" label="FARM HHS" accent/>
              <SnapStat value="22.7 MT" label="COCONUT"/>
              <SnapStat value="138 MT" label="RICE" last/>
            </div>
          )}
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
        {/* Map column — sizing is owned by .atlas-map-col in styles.css: on
            desktop it is sized to India's aspect ratio off the row height so
            it never stretches into wide cream letterbox gaps (the group is
            centred via .atlas-body); below 1100px it becomes a full-width
            fixed-height slice. The column stacks [ map ][ legend strip ] so
            the legend reads clearly below the landmass instead of over it. */}
        <div className="atlas-map-col" style={{ display: 'flex', flexDirection: 'column', background: C.bg0 }}>
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
          </div>
          {/* Legend — a slim strip below the map, spanning its width. */}
          <Legend filter={safeFilter} view={view} year={year}/>
        </div>

        {/* Right pane — ranked table by default, region detail once focused.
            Widened to 600px: the RankingPanel table and DetailPanel stat
            grids genuinely use the extra room, and — with the map column now
            flush-left — it absorbs wide-screen slack so the screen fills. */}
        <div className="atlas-side" style={{ width: 600, background: C.bg1, borderLeft: `1px solid ${C.border}`, flexShrink: 0, overflow: 'hidden' }}>
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

// One cell of the header overview strip. Cells are separated by a hairline
// right border (the strip itself owns the outer rounded border).
function SnapStat({ value, label, accent, last }) {
  return (
    <div style={{
      padding: '5px 13px',
      borderRight: last ? 'none' : `1px solid ${C.border}`,
      fontFamily: "'DM Sans', sans-serif",
      whiteSpace: 'nowrap',
    }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: accent ? C.accent : C.fg1, lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: 9, color: C.fg3, letterSpacing: '0.08em', marginTop: 1 }}>{label}</div>
    </div>
  );
}
