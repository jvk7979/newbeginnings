// src/pages/Atlas/AtlasMapMode.jsx
//
// Atlas tab — the three-column working surface:
//   AtlasSidebar (intensity key + category filter)
//   │ IndiaMap / APMap
//   │ Right panel: Ranking tab | Stats tab

import { useState } from 'react';
import IndiaMap from './IndiaMap';
import APMap from './APMap';
import FilterBar from './FilterBar';
import AtlasSidebar from './AtlasSidebar';
import DetailPanel from './DetailPanel';
import RankingPanel from './RankingPanel';
import StatsPanel from './StatsPanel';
import HoverTip from './HoverTip';

export default function AtlasMapMode({
  filter, setFilter, view, setView,
  hover, setHover, selected, setSelected,
  districtSelected, setDistrictSelected,
  search, setSearch, year, setYear,
  states, apDistricts, yearOptions, cropOptions,
}) {
  const [rightTab, setRightTab] = useState('ranking');

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

  const focused    = view.level === 'india' ? selected : districtSelected;
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
        yearOptions={yearOptions} cropOptions={cropOptions}
      />

      <div className="atlasv2-body">
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

        {/* Right panel — tab bar + content */}
        <div className="atlasv2-panel">
          {/* Tab bar — hidden when a region is focused (DetailPanel takes over) */}
          {!focused && (
            <div className="atlas-panel-tabs" role="tablist">
              <button
                role="tab"
                aria-selected={rightTab === 'ranking'}
                className={`atlas-panel-tab${rightTab === 'ranking' ? ' active' : ''}`}
                onClick={() => setRightTab('ranking')}
              >
                <span className="atlas-panel-tab-idx">01</span>
                Ranking
              </button>
              <button
                role="tab"
                aria-selected={rightTab === 'stats'}
                className={`atlas-panel-tab${rightTab === 'stats' ? ' active' : ''}`}
                onClick={() => setRightTab('stats')}
              >
                <span className="atlas-panel-tab-idx">02</span>
                Stats
              </button>
            </div>
          )}

          {/* Panel content */}
          {focused ? (
            <DetailPanel
              name={focused} level={view.level} filter={filter}
              states={states} apDistricts={apDistricts}
              onDrillDown={handleDrillDown} onClear={clearFocus}
            />
          ) : rightTab === 'ranking' ? (
            <RankingPanel
              level={view.level} filter={filter}
              states={states} apDistricts={apDistricts}
              hovered={hover?.name}
              onHover={handleHover} onSelect={handleSelect}
            />
          ) : (
            <StatsPanel filter={filter} states={states}/>
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
