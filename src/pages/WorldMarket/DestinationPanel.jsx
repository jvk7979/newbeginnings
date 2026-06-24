// src/pages/WorldMarket/DestinationPanel.jsx
//
// AP tab right panel — full-width destination bar chart for a selected commodity.

import { CATEGORIES } from '../Atlas/cropData';
import { fmtUsd } from './comtradeDataset';

export default function DestinationPanel({ commodity }) {
  if (!commodity) {
    return (
      <div className="wm-dest-panel">
        <div className="wm-dest-empty">
          Select a commodity from the list to see destination markets
        </div>
      </div>
    );
  }

  const cat   = CATEGORIES[commodity.category];
  const color = cat?.color || 'var(--c-accent)';
  const dests = commodity.destinations || [];
  const max   = dests[0]?.value_usd_m || 1;

  return (
    <div className="wm-dest-panel">
      {/* Header */}
      <div className="wm-dest-head">
        <div className="wm-dest-section-label">Destination Markets</div>
        <div className="wm-dest-commodity-name">{commodity.name}</div>
        <div className="wm-dest-subtitle" style={{ color }}>
          {fmtUsd(commodity.value_usd_m * 1e6)}&nbsp;&nbsp;total exports · AP · 2023-24
        </div>
      </div>

      {/* Bars */}
      <div className="wm-dest-bars">
        {dests.map((d) => {
          const w = Math.max(2, (d.value_usd_m / max) * 100);
          return (
            <div key={d.country} className="wm-dest-bar-row">
              <div className="wm-dest-bar-meta">
                <span className="wm-dest-bar-country">{d.country}</span>
                <span>
                  <span className="wm-dest-bar-val" style={{ color }}>{fmtUsd(d.value_usd_m * 1e6)}</span>
                  <span className="wm-dest-bar-pct">&nbsp;{d.share_pct}%</span>
                </span>
              </div>
              <div className="wm-dest-bar-track">
                <div className="wm-dest-bar-fill" style={{ width: `${w}%`, background: color }} />
              </div>
            </div>
          );
        })}

        <div className="wm-dest-source-note">
          Source: APEDA AgriExchange · Andhra Pradesh region · FY 2023-24
        </div>
      </div>
    </div>
  );
}
