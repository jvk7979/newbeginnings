// src/pages/WorldMarket/CommodityLeaderboard.jsx
//
// AP tab left side — ranked AP export commodity rows.

import { CATEGORIES } from '../Atlas/cropData';
import { fmtUsd } from './comtradeDataset';

export default function CommodityLeaderboard({ commodities, selected, onSelect }) {
  return (
    <div className="wm-ap-list">
      <div className="wm-ap-header">
        <div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'var(--c-fg3)', marginBottom: 2,
          }}>
            Andhra Pradesh · Exports 2023-24
          </div>
          <div className="wm-ap-title">Top Commodities by Export Value</div>
        </div>
      </div>

      <div className="wm-ap-cols">
        <span>#</span>
        <span>COMMODITY</span>
        <span style={{ textAlign: 'right' }}>VALUE (USD)</span>
        <span style={{ textAlign: 'right' }}>VOLUME</span>
        <span style={{ textAlign: 'right' }}>TOP MARKET</span>
      </div>

      <div className="wm-ap-rows">
        {commodities.map((c, i) => {
          const cat = CATEGORIES[c.category];
          const color = cat?.color || 'var(--c-accent)';
          const topDest = c.destinations?.[0]?.country || '—';
          const isActive = selected === c.name;
          const volLabel = c.volume_kt >= 1000
            ? `${(c.volume_kt / 1000).toFixed(1)} MT`
            : `${c.volume_kt} KT`;
          return (
            <div
              key={c.name}
              className={`wm-ap-row${isActive ? ' active' : ''}`}
              style={{ borderLeftColor: color }}
              onClick={() => onSelect(isActive ? null : c.name)}
            >
              <span className="wm-ap-rank">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <div className="wm-ap-name">{c.name}</div>
                <div className="wm-ap-badge">{cat?.label || c.category} · APEDA</div>
              </div>
              <span className="wm-ap-val">{fmtUsd(c.value_usd_m * 1e6)}</span>
              <span className="wm-ap-val">{volLabel}</span>
              <span className="wm-ap-top">{topDest}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
