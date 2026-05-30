// src/pages/Atlas/AtlasMapMode.jsx
//
// Atlas tab — the three-column working surface:
//   AtlasSidebar (intensity key + category filter)
//   │ IndiaMap / APMap
//   │ RankingPanel / DetailPanel
// Composes the existing map and panel components; the v2 router mounts
// this for the 'atlas' tab.

import IndiaMap from './IndiaMap';
import APMap from './APMap';
import FilterBar from './FilterBar';
import AtlasSidebar from './AtlasSidebar';
import DetailPanel from './DetailPanel';
import RankingPanel from './RankingPanel';
import HoverTip from './HoverTip';

export default function AtlasMapMode({
  filter, setFilter, view, setView,
  hover, setHover, selected, setSelected,
  districtSelected, setDistrictSelected,
  search, setSearch, year, setYear,
  states, apDistricts, yearOptions, cropOptions,
}) {
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
