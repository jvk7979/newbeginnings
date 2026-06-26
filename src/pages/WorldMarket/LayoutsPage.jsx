import { useState, useEffect, useMemo } from 'react';
import { loadPartnerTotals } from './comtradeDataset';
import LayoutA from './LayoutA';
import LayoutB from './LayoutB';
import LayoutC from './LayoutC';
import LayoutD from './LayoutD';
import '../../world-market.css';
import '../../concepts.css';
import '../../layouts.css';

const LAYOUTS = [
  { id: 'A', label: 'Split Panel',      desc: 'Map · Ranked list · cross-highlight' },
  { id: 'B', label: 'Full-Screen Map',  desc: 'Floating card · slide-up drawer' },
  { id: 'C', label: 'Dashboard Grid',   desc: 'KPI row · Map + leaderboard · chart' },
  { id: 'D', label: 'Treemap',          desc: 'Map on top · proportional treemap below' },
];

export default function LayoutsPage({ onNavigate }) {
  const [active, setActive] = useState('A');
  const [partnerData, setPartnerData] = useState(null);

  useEffect(() => {
    loadPartnerTotals('2025', 'apeda').then(setPartnerData).catch(console.error);
  }, []);

  const topPartners = useMemo(() => {
    if (!partnerData) return [];
    return Object.entries(partnerData)
      .map(([code, d]) => ({ code: Number(code), ...d }))
      .sort((a, b) => b.value_usd - a.value_usd);
  }, [partnerData]);

  const props = { partnerData, topPartners };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f5efe4' }}>
      {/* Switcher bar */}
      <div className="lp-bar">
        <button className="lp-back" onClick={() => onNavigate?.('world-market')}>← World Market</button>
        <div className="lp-label">Layout Options</div>
        <div className="lp-tabs">
          {LAYOUTS.map(l => (
            <button
              key={l.id}
              className={`lp-tab${active === l.id ? ' lp-tab-active' : ''}`}
              onClick={() => setActive(l.id)}
            >
              <span className="lp-tab-id">{l.id}</span>
              <span className="lp-tab-label">{l.label}</span>
              <span className="lp-tab-desc">{l.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active layout */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {!partnerData
          ? <div style={{ padding: 40, fontFamily: 'JetBrains Mono', fontSize: 12, color: '#888' }}>Loading data…</div>
          : active === 'A' ? <LayoutA {...props}/>
          : active === 'B' ? <LayoutB {...props}/>
          : active === 'C' ? <LayoutC {...props}/>
          : <LayoutD {...props}/>
        }
      </div>
    </div>
  );
}
