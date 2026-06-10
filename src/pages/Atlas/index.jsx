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

import { useEffect, useMemo, useState } from 'react';
import { C } from '../../tokens';
import { buildUnifiedStates, buildDesApDistricts, loadAtlasData } from './desDataset';

import AtlasMasthead from './AtlasMasthead';
import ModeBar from './ModeBar';
import Skeleton from '../../components/Skeleton';
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

  // APEDA + DES datasets used to be static imports baked into the JS
  // bundle (~780 KB combined), which slowed every deploy by ~80s and
  // bloated the initial Atlas chunk. Now they're fetched from
  // public/data/ on first mount; loadAtlasData() memoises so mode
  // switches / route remounts re-use the parsed result.
  const [data, setData] = useState(null);
  const [dataError, setDataError] = useState(null);
  useEffect(() => {
    let cancelled = false;
    loadAtlasData().then(d => { if (!cancelled) setData(d); })
                   .catch(err => { if (!cancelled) setDataError(err); });
    return () => { cancelled = true; };
  }, []);

  // Year-driven unified dataset. Returns {} until the JSON files load —
  // every map / panel handles an empty states object gracefully.
  const states = useMemo(
    () => data ? buildUnifiedStates(year, data.apeda, data.des, data.meta) : {},
    [year, data]
  );
  const apDistricts = useMemo(
    () => data ? buildDesApDistricts(data.des, data.meta) : {},
    [data]
  );

  // Year-picker + crop-picker options come from the loaded APEDA meta —
  // they used to be top-level constants derived from a static import,
  // but the public/data move means they're now props.
  const yearOptions = data?.apeda?.meta?.years || ['2024-25'];
  const cropOptions = useMemo(
    () => data?.apeda?.cropCategory ? Object.keys(data.apeda.cropCategory).sort() : [],
    [data]
  );

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

  // While the APEDA + DES JSON files are loading on first mount, the
  // map renders empty — show a brief inline status instead of a blank
  // map. Error state surfaces the network failure so the user knows to
  // refresh (rather than thinking the Atlas itself is broken).
  if (dataError) {
    return (
      <div className="atlas-root" style={{ background: C.bg0, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ maxWidth: 480, textAlign: 'center', fontFamily: "'DM Sans', sans-serif", color: C.fg2 }}>
          <div style={{ fontSize: 22, fontWeight: 600, color: C.fg1, marginBottom: 8 }}>Couldn't load Crop Atlas data</div>
          <div style={{ fontSize: 14, color: C.fg3, marginBottom: 18 }}>
            The APEDA + DES datasets couldn't be fetched. Refresh to retry.
          </div>
          <button onClick={() => window.location.reload()}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, padding: '8px 18px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}>
            Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="atlas-root" style={{ background: C.bg0, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
      {/* Single scrolling surface — the header scrolls away, the mode
          tabs (inside ModeBar) stick to the top as you move down. */}
      <div className="atlas-scroll">
        <AtlasMasthead view={view}/>
        <ModeBar tab={tab} setTab={setTab}/>
        {!data && (
          /* Skeleton sketching the map-mode layout (filter strip, map
             canvas, ranking sidebar) while the ~780 KB APEDA + DES JSONs
             fetch on first mount — a recognisable page shape instead of a
             lone status line. aria-busy + the visually-hidden text keep
             the state announced for screen readers. */
          <div className="atlas-mode-pane" aria-busy="true" style={{ padding: '16px 20px 32px' }}>
            <span className="sr-only" role="status">Loading APEDA and DES crop datasets…</span>
            <Skeleton height={46} radius={10} style={{ marginBottom: 14 }} />
            <div className="atlas-skeleton-grid">
              <Skeleton height={440} radius={12} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Skeleton height={26} width="60%" />
                {[...Array(7)].map((_, i) => <Skeleton key={i} height={44} radius={10} />)}
              </div>
            </div>
          </div>
        )}

        {data && tab === 'atlas' && (
          <AtlasMapMode
            filter={safeFilter} setFilter={setFilter}
            view={view} setView={setView}
            hover={hover} setHover={setHover}
            selected={selected} setSelected={setSelected}
            districtSelected={districtSelected} setDistrictSelected={setDistrictSelected}
            search={search} setSearch={setSearch}
            year={year} setYear={handleSetYear}
            states={states} apDistricts={apDistricts}
            yearOptions={yearOptions} cropOptions={cropOptions}
          />
        )}
        {data && tab === 'compare' && (
          <CompareMode states={states} year={year} setYear={handleSetYear}/>
        )}
        {data && tab === 'opps' && (
          <OpportunitiesMode states={states}/>
        )}
      </div>
    </div>
  );
}
