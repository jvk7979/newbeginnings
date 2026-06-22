// src/pages/WorldMarket/DestinationPanel.jsx
//
// AP tab right side — destination country breakdown for selected commodity.

import { CATEGORIES } from '../Atlas/cropData';
import { fmtUsd } from './comtradeDataset';

export default function DestinationPanel({ commodity }) {
  if (!commodity) {
    return (
      <div className="wm-dest-panel">
        <div className="wm-dest-empty">
          Select a commodity to see which countries it goes to
        </div>
      </div>
    );
  }

  const cat = CATEGORIES[commodity.category];
  const color = cat?.color || 'var(--c-accent)';
  const max = commodity.destinations?.[0]?.value_usd_m || 1;

  return (
    <div className="wm-dest-panel">
      <div className="wm-panel-head">
        <div className="wm-panel-eyebrow">Destination Countries</div>
        <div className="wm-panel-name">{commodity.name}</div>
        <div className="wm-panel-sub">
          AP · {fmtUsd(commodity.value_usd_m * 1e6)} total · 2023-24
        </div>
      </div>
      <div className="wm-panel-list">
        {commodity.destinations?.map((d) => {
          const w = Math.max(3, (d.value_usd_m / max) * 100);
          return (
            <div key={d.country} className="wm-commodity-row"
              style={{ borderLeft: `3px solid ${color}` }}>
              <div className="wm-commodity-meta">
                <span className="wm-commodity-name">{d.country}</span>
                <span className="wm-commodity-val">
                  {fmtUsd(d.value_usd_m * 1e6)} · {d.share_pct}%
                </span>
              </div>
              <div className="wm-bar-track">
                <div className="wm-bar-fill" style={{ width: `${w}%`, background: color }} />
              </div>
            </div>
          );
        })}
        <div style={{
          marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--c-border)',
          fontFamily: "'DM Sans', sans-serif", fontSize: 12,
          color: 'var(--c-fg3)', lineHeight: 1.5,
        }}>
          Source: APEDA AgriExchange · AP region · 2023-24
        </div>
      </div>
    </div>
  );
}
