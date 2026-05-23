// src/pages/Atlas/AtlasMapMode.jsx
//
// Atlas tab — the three-column working surface:
//   AtlasSidebar (intensity key + category filter)
//   │ IndiaMap / APMap
//   │ Splitter (draggable, ↔)
//   │ RankingPanel / DetailPanel
// Composes the existing map and panel components; the v2 router mounts
// this for the 'atlas' tab.
//
// The map ↔ panel split is user-controlled via a Splitter handle (same
// component the Calculations page uses for its Assumptions / Output
// panels). The chosen width persists per browser via localStorage so
// returning users land on their preferred ratio. Default is 50/50; below
// the 1099 px stacking breakpoint the splitter hides itself and the
// columns reflow to a stacked layout (see atlas-v2.css mobile rules).

import { useCallback, useState } from 'react';
import IndiaMap from './IndiaMap';
import APMap from './APMap';
import FilterBar from './FilterBar';
import AtlasSidebar from './AtlasSidebar';
import DetailPanel from './DetailPanel';
import RankingPanel from './RankingPanel';
import HoverTip from './HoverTip';
import Splitter from '../../components/calc/Splitter';

// Persisted map-column width as a percentage of the .atlasv2-body
// container (which also includes the fixed 214 px sidebar — the Splitter
// reports position pct against the full container so the same percentage
// translates directly to .atlasv2-map flex-basis with no extra maths).
const MAP_WIDTH_KEY     = 'atlas-map-width';
const MAP_WIDTH_DEFAULT = 50;
const MAP_WIDTH_MIN     = 30;
const MAP_WIDTH_MAX     = 75;
const readSavedMapWidth = () => {
  try {
    const raw = localStorage.getItem(MAP_WIDTH_KEY);
    const n = Number(raw);
    if (Number.isFinite(n) && n >= MAP_WIDTH_MIN && n <= MAP_WIDTH_MAX) return n;
  } catch {}
  return MAP_WIDTH_DEFAULT;
};

export default function AtlasMapMode({
  filter, setFilter, view, setView,
  hover, setHover, selected, setSelected,
  districtSelected, setDistrictSelected,
  search, setSearch, year, setYear,
  states, apDistricts,
}) {
  const [mapWidth, setMapWidth] = useState(readSavedMapWidth);

  const handleResize = useCallback((pct) => {
    setMapWidth(pct);
    try { localStorage.setItem(MAP_WIDTH_KEY, String(pct)); } catch {}
  }, []);
  const handleHover = (name, e) => {
    if (!name) { setHover(null); return; }
    setHover({ name, x: e?.clientX || 0, y: e?.clientY || 0, tip: !!e });
  };

  const handleSelect = (name) => {
    if (view.level === 'india') setSelected(name);
    else setDistrictSelected(name);
  };

  const handleDrillDown = (stateName) => {
    if (states[stateName]?.districtKey) {
      setView({ level: 'state', state: stateName });
      setDistrictSelected(null);
      setHover(null);
    }
  };

  const handleBack = () => {
    setView({ level: 'india', state: null });
    setSelected(null);
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

  const focused = view.level === 'india' ? selected : districtSelected;
  const clearFocus = view.level === 'india' ? () => setSelected(null) : () => setDistrictSelected(null);

  return (
    <>
      <FilterBar
        filter={filter} setFilter={setFilter}
        view={view} onBack={handleBack}
        searchValue={search} setSearch={setSearch}
        onSearchSelect={handleSearchSelect}
        states={states} apDistricts={apDistricts}
        year={year} setYear={setYear}
      />

      <div className="atlasv2-body" style={{ '--atlas-map-width': `${mapWidth}%` }}>
        <AtlasSidebar filter={filter} setFilter={setFilter} states={states}/>

        <div className="atlasv2-map">
          {view.level === 'india' && (
            <IndiaMap filter={filter} states={states} year={year}
                      hovered={hover?.name} selected={selected}
                      onHover={handleHover} onSelect={handleSelect}
                      onDrillDown={handleDrillDown}/>
          )}
          {view.level === 'state' && (
            <APMap filter={filter} apDistricts={apDistricts}
                   hovered={hover?.name} selected={districtSelected}
                   onHover={handleHover} onSelect={handleSelect}/>
          )}
        </div>

        <Splitter
          currentWidth={mapWidth}
          onResize={handleResize}
          min={MAP_WIDTH_MIN}
          max={MAP_WIDTH_MAX}
          ariaLabel="Resize map / ranking panel"
          className="atlas-splitter"
        />

        <div className="atlasv2-panel">
          {focused ? (
            <DetailPanel
              name={focused} level={view.level} filter={filter}
              states={states} apDistricts={apDistricts}
              onDrillDown={handleDrillDown} onClear={clearFocus}
            />
          ) : (
            <RankingPanel
              level={view.level} filter={filter}
              states={states} apDistricts={apDistricts}
              hovered={hover?.name}
              onHover={handleHover} onSelect={handleSelect}
            />
          )}
        </div>
      </div>

      {hover && hover.tip && hover.name !== focused && (
        <HoverTip name={hover.name} level={view.level} x={hover.x} y={hover.y}
                  filter={filter} states={states} apDistricts={apDistricts}/>
      )}
    </>
  );
}
