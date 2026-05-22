// src/pages/Atlas/AtlasMapMode.jsx
//
// Wraps your original Atlas layout — FilterBar + 60/40 split with
// IndiaMap / APMap on the left and RankingPanel / DetailPanel on the
// right — as a mode of the v2 router. The existing components in this
// folder are not modified; this file just composes them.

import { C } from '../../tokens';
import IndiaMap from './IndiaMap';
import APMap from './APMap';
import FilterBar from './FilterBar';
import DetailPanel from './DetailPanel';
import RankingPanel from './RankingPanel';
import HoverTip from './HoverTip';
import Legend from './Legend';

export default function AtlasMapMode({
  filter, setFilter, view, setView,
  hover, setHover, selected, setSelected,
  districtSelected, setDistrictSelected,
  search, setSearch, year, setYear,
  states, apDistricts,
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
      />

      <div className="atlas-body" style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        <div className="atlas-map-col" style={{ display: 'flex', flexDirection: 'column', background: C.bg0 }}>
          <div className="atlas-map" style={{ position: 'relative', background: C.bg0 }}>
            {view.level === 'india' && (
              <IndiaMap filter={filter}
                        states={states}
                        hovered={hover?.name}
                        selected={selected}
                        onHover={handleHover}
                        onSelect={handleSelect}
                        onDrillDown={handleDrillDown}/>
            )}
            {view.level === 'state' && (
              <APMap filter={filter}
                     apDistricts={apDistricts}
                     hovered={hover?.name}
                     selected={districtSelected}
                     onHover={handleHover}
                     onSelect={handleSelect}/>
            )}
          </div>
          <Legend filter={filter} view={view} year={year}/>
        </div>

        <div className="atlas-side" style={{
          width: 600, background: C.bg1, borderLeft: `1px solid ${C.border}`,
          flexShrink: 0, overflow: 'hidden',
        }}>
          {focused ? (
            <DetailPanel
              name={focused} level={view.level} filter={filter}
              states={states} apDistricts={apDistricts}
              onDrillDown={handleDrillDown}
              onClear={clearFocus}
            />
          ) : (
            <RankingPanel
              level={view.level} filter={filter}
              states={states} apDistricts={apDistricts}
              hovered={hover?.name}
              onHover={handleHover}
              onSelect={handleSelect}
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
