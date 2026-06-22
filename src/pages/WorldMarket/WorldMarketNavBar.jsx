// src/pages/WorldMarket/WorldMarketNavBar.jsx
//
// Tab bar + KPI header strip.

import { fmtUsd } from './comtradeDataset';

export default function WorldMarketNavBar({ tab, setTab, topPartners, partnerCount }) {
  const totalUsd   = topPartners.reduce((s, p) => s + (p.value_usd || 0), 0);
  const topCountry = topPartners[0]?.name || '—';

  return (
    <>
      <div className="wm-navbar" role="tablist">
        <button
          role="tab"
          aria-selected={tab === 'world'}
          className={`wm-tab${tab === 'world' ? ' active' : ''}`}
          onClick={() => setTab('world')}
        >
          <span className="wm-tab-idx">01</span> World
        </button>
        <button
          role="tab"
          aria-selected={tab === 'ap'}
          className={`wm-tab${tab === 'ap' ? ' active' : ''}`}
          onClick={() => setTab('ap')}
        >
          <span className="wm-tab-idx">02</span> Andhra Pradesh
        </button>
      </div>

      <div className="wm-header-strip">
        <div className="wm-header-text">
          <div className="wm-eyebrow">India · Agricultural Exports</div>
          <div className="wm-title">World <em>Market</em></div>
        </div>
        <div className="wm-kpi-chips">
          <div className="wm-kpi-chip">
            <div className="wm-kpi-value">{totalUsd ? fmtUsd(totalUsd) : '—'}</div>
            <div className="wm-kpi-label">Total Agri Exports</div>
          </div>
          <div className="wm-kpi-chip">
            <div className="wm-kpi-value">{partnerCount || '—'}</div>
            <div className="wm-kpi-label">Markets</div>
          </div>
          <div className="wm-kpi-chip">
            <div className="wm-kpi-value" style={{ fontSize: 14, lineHeight: 1.2 }}>{topCountry}</div>
            <div className="wm-kpi-label">Top Importer</div>
          </div>
        </div>
      </div>
    </>
  );
}
