// src/pages/Atlas/index.jsx
//
// AtlasPage v2 — top-level mode router.
//
// Layout (new):
//   AtlasNavBar      — compact accent bar, never scrolls, has mode tabs + info toggle
//   AtlasMasthead    — collapsible editorial strip with KPI chips (below nav bar)
//   atlas-scroll     — scrollable region for mode content
//     atlas-scroll-map  — overflow:hidden variant used for the map tab so
//                         atlasv2-body can fill remaining height correctly
//
// State:
//   tab              current mode ('atlas' | 'compare' | 'opps')
//   headerCollapsed  whether the editorial strip is hidden (localStorage persisted)
//   filter           { category, metric, crop }
//   view             { level, state }  india / state drill-down

import { useEffect, useMemo, useState } from 'react';
import { C } from '../../tokens';
import { buildUnifiedStates, buildDesApDistricts, loadAtlasData } from './desDataset';

import AtlasNavBar from './AtlasNavBar';
import AtlasMasthead from './AtlasMasthead';
import Skeleton from '../../components/Skeleton';
import AtlasMapMode from './AtlasMapMode';
import CompareMode from './CompareMode';
import OpportunitiesMode from './OpportunitiesMode';

import '../../atlas-v2.css';

const HEADER_KEY = 'atlas-header-collapsed';
const readHeaderCollapsed = () => {
  try { return localStorage.getItem(HEADER_KEY) === '1'; } catch { return false; }
};

export default function AtlasPage({ onNavigate }) {
  const [tab, setTab]           = useState('atlas');
  const [headerCollapsed, setHeaderCollapsed] = useState(readHeaderCollapsed);
  const [filter, setFilter]     = useState({ category: 'all', metric: 'production', crop: null });
  const [view, setView]         = useState({ level: 'india', state: null });
  const [hover, setHover]       = useState(null);
  const [selected, setSelected] = useState(null);
  const [districtSelected, setDistrictSelected] = useState(null);
  const [search, setSearch]     = useState('');
  const [year, setYear]         = useState('2024-25');

  const toggleHeader = () => {
    setHeaderCollapsed((v) => {
      const next = !v;
      try { localStorage.setItem(HEADER_KEY, next ? '1' : '0'); } catch {}
      return next;
    });
  };

  const [data, setData]         = useState(null);
  const [dataError, setDataError] = useState(null);
  useEffect(() => {
    let cancelled = false;
    loadAtlasData()
      .then((d) => { if (!cancelled) setData(d); })
      .catch((err) => { if (!cancelled) setDataError(err); });
    return () => { cancelled = true; };
  }, []);

  const states = useMemo(
    () => data ? buildUnifiedStates(year, data.apeda, data.des, data.meta) : {},
    [year, data],
  );
  const apDistricts = useMemo(
    () => data ? buildDesApDistricts(data.des, data.meta) : {},
    [data],
  );

  const yearOptions = data?.apeda?.meta?.years || ['2024-25'];
  const cropOptions = useMemo(
    () => data?.apeda?.cropCategory ? Object.keys(data.apeda.cropCategory).sort() : [],
    [data],
  );

  // KPI values for the header strip — static counts, not filter-reactive.
  const kpiCrops  = cropOptions.length || null;
  const kpiStates = data ? Object.keys(states).length || null : null;
  const kpiPeak   = useMemo(() => {
    if (!data || Object.keys(states).length === 0) return null;
    let max = 0;
    for (const s of Object.values(states)) {
      for (const c of (s.crops || [])) {
        if ((c[2] || 0) > max) max = c[2];
      }
    }
    return max > 0 ? (max >= 1000 ? `${(max / 1000).toFixed(0)}` : `${Math.round(max)} KT`) : null;
  }, [states, data]);

  const safeFilter = filter.metric === 'share'
    ? { ...filter, metric: 'production' }
    : filter;

  const handleSetYear = (y) => {
    setYear(y);
    setSelected(null);
    setDistrictSelected(null);
  };

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

      {/* ① Compact nav bar — always visible */}
      <AtlasNavBar
        tab={tab} setTab={setTab}
        headerCollapsed={headerCollapsed}
        onToggleHeader={toggleHeader}
      />

      {/* ② Collapsible editorial header + KPI chips */}
      {!headerCollapsed && (
        <AtlasMasthead
          view={view}
          kpiCrops={kpiCrops}
          kpiStates={kpiStates}
          kpiPeak={kpiPeak}
        />
      )}

      {/* ③ Scrollable mode region */}
      <div className={`atlas-scroll${tab === 'atlas' ? ' atlas-scroll-map' : ''}`}>
        {!data && (
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
