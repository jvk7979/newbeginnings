// src/pages/Atlas/index.jsx
//
// AtlasPage v2 — top-level mode router. Keeps your original map +
// ranking layout intact (now `AtlasMapMode`) and adds two new modes:
// Compare and Opportunities.
//
// Layout: a single `.atlas-scroll` region holds the compact header,
// the mode tabs, and the active mode. The header scrolls away with the
// content; the mode tabs are sticky so they stay reachable.
//
// State lives here and is passed down so cross-mode navigation works:
//   - tab            current mode ('atlas' | 'compare' | 'opps')
//   - filter         { category, metric, crop } — same shape as before
//   - view           { level, state } — india / state drill-down
//   - selected/etc.  region focus (state or AP district)
//   - year           financial year (drives buildUnifiedStates)
//
// All data still comes from desDataset.buildUnifiedStates + mergedApDistricts —
// nothing in cropData / desData / apedaData is touched.

import { useMemo, useState } from 'react';
import { C } from '../../tokens';
import { buildUnifiedStates, mergedApDistricts } from './desDataset';

import AtlasMasthead from './AtlasMasthead';
import ModeBar from './ModeBar';
import AtlasMapMode from './AtlasMapMode';
import CompareMode from './CompareMode';
import OpportunitiesMode from './OpportunitiesMode';

import '../../atlas-v2.css';

// eslint-disable-next-line no-unused-vars
export default function AtlasPage({ onNavigate }) {
  const [tab, setTab] = useState('atlas');
  const [filter, setFilter] = useState({ category: 'all', metric: 'production', crop: null });
  const [view, setView] = useState({ level: 'india', state: null });
  const [hover, setHover] = useState(null);
  const [selected, setSelected] = useState(null);
  const [districtSelected, setDistrictSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [year, setYear] = useState('2024-25');

  // Year-driven unified dataset — same call your original used.
  const states = useMemo(() => buildUnifiedStates(year), [year]);
  const apDistricts = mergedApDistricts;

  // Defend against any legacy 'share' value (the Nat'l Share metric was
  // removed from the UI) so cross-mode helpers never receive it.
  const safeFilter = filter.metric === 'share'
    ? { ...filter, metric: 'production' }
    : filter;

  const handleSetYear = (y) => {
    setYear(y);
    setSelected(null);
    setDistrictSelected(null);
  };

  return (
    <div className="atlas-root" style={{ background: C.bg0, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
      {/* Single scrolling surface — the header scrolls away, the mode
          tabs (inside ModeBar) stick to the top as you move down. */}
      <div className="atlas-scroll">
        <AtlasMasthead view={view}/>
        <ModeBar tab={tab} setTab={setTab}/>

        {tab === 'atlas' && (
          <AtlasMapMode
            filter={safeFilter} setFilter={setFilter}
            view={view} setView={setView}
            hover={hover} setHover={setHover}
            selected={selected} setSelected={setSelected}
            districtSelected={districtSelected} setDistrictSelected={setDistrictSelected}
            search={search} setSearch={setSearch}
            year={year} setYear={handleSetYear}
            states={states} apDistricts={apDistricts}
          />
        )}
        {tab === 'compare' && (
          <CompareMode states={states} year={year} setYear={handleSetYear}/>
        )}
        {tab === 'opps' && (
          <OpportunitiesMode states={states}/>
        )}
      </div>
    </div>
  );
}
