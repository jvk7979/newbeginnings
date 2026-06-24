// src/pages/WorldMarket/WorldMarketNavBar.jsx
//
// Tab bar + KPI header strip with Year and Source selectors.

import { fmtUsd, SOURCE_META } from './comtradeDataset';

const YEARS = ['2025', '2024', '2023', '2022'];

export default function WorldMarketNavBar({
  tab, setTab,
  topPartners, partnerCount,
  year, setYear,
  source, setSource,
}) {
  const totalUsd   = topPartners.reduce((s, p) => s + (p.value_usd || 0), 0);
  const topCountry = topPartners[0]?.name || '—';

  return (
    <>
      {/* Tab row */}
      <div className="wm-navbar" role="tablist">
        <button role="tab" aria-selected={tab === 'world'}
          className={`wm-tab${tab === 'world' ? ' active' : ''}`}
          onClick={() => setTab('world')}>
          <span className="wm-tab-idx">01</span> World
        </button>
        <button role="tab" aria-selected={tab === 'ap'}
          className={`wm-tab${tab === 'ap' ? ' active' : ''}`}
          onClick={() => setTab('ap')}>
          <span className="wm-tab-idx">02</span> Andhra Pradesh
        </button>
      </div>

      {/* Header strip */}
      <div className="wm-header-strip">
        {/* Title */}
        <div className="wm-header-text">
          <div className="wm-eyebrow">India · Agricultural Exports</div>
          <div className="wm-title">World <em>Market</em></div>
        </div>

        {/* KPI chips */}
        <div className="wm-kpi-chips">
          <div className="wm-kpi-chip">
            <div className="wm-kpi-value">{totalUsd ? fmtUsd(totalUsd) : '—'}</div>
            <div className="wm-kpi-label">Total Exports</div>
          </div>
          <div className="wm-kpi-chip">
            <div className="wm-kpi-value">{partnerCount || '—'}</div>
            <div className="wm-kpi-label">Markets</div>
          </div>
          <div className="wm-kpi-chip">
            <div className="wm-kpi-value" style={{ fontSize: 13, lineHeight: 1.2 }}>{topCountry}</div>
            <div className="wm-kpi-label">Top Importer</div>
          </div>
        </div>

        {/* Year + Source selectors — right side of header */}
        <div className="wm-header-selectors">
          <div className="wm-hsel-group">
            <span className="wm-hsel-label">Year</span>
            <select className="wm-hsel-select" value={year} onChange={e => setYear(e.target.value)}>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="wm-hsel-group">
            <span className="wm-hsel-label">Source</span>
            <select className="wm-hsel-select" value={source} onChange={e => setSource(e.target.value)}>
              <option value="apeda">APEDA</option>
              <option value="oec">OEC</option>
            </select>
          </div>
        </div>
      </div>
    </>
  );
}
