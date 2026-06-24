// src/pages/WorldMarket/CommodityLeaderboard.jsx

import { CATEGORIES } from '../Atlas/cropData';
import { fmtUsd } from './comtradeDataset';

export default function CommodityLeaderboard({ commodities, selected, onSelect }) {
  return (
    <div className="wm-ap-list">
      <div className="wm-ap-header">
        <div className="wm-ap-header-eye">Andhra Pradesh · 2023-24 · APEDA</div>
        <div className="wm-ap-title">Top Commodities</div>
      </div>

      <div className="wm-ap-cols">
        <span>#</span>
        <span>Commodity</span>
        <span style={{ textAlign: 'right' }}>USD</span>
      </div>

      <div className="wm-ap-rows">
        {commodities.map((c, i) => {
          const cat = CATEGORIES[c.category];
          const color = cat?.color || 'var(--c-accent)';
          const isActive = selected === c.name;
          return (
            <div
              key={c.name}
              className={`wm-ap-row${isActive ? ' active' : ''}`}
              style={{ borderLeftColor: isActive ? color : 'transparent' }}
              onClick={() => onSelect(isActive ? null : c.name)}
            >
              <span className="wm-ap-rank">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <div className="wm-ap-name">{c.name}</div>
                <div className="wm-ap-badge" style={{ color }}>
                  {cat?.label || c.category} · {c.volume_kt >= 1000
                    ? `${(c.volume_kt / 1000).toFixed(1)} MT`
                    : `${c.volume_kt} KT`}
                </div>
              </div>
              <span className="wm-ap-val" style={{ color: isActive ? color : undefined }}>
                {fmtUsd(c.value_usd_m * 1e6)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
