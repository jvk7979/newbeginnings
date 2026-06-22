// src/pages/WorldMarket/APTab.jsx

import { useState, useEffect } from 'react';
import CommodityLeaderboard from './CommodityLeaderboard';
import DestinationPanel from './DestinationPanel';

const AP_URL = `${import.meta.env.BASE_URL || '/'}data/ap-exports.json`;

export default function APTab() {
  const [apData, setApData]     = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(AP_URL)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => { if (!cancelled) { setApData(d); setLoading(false); } })
      .catch(err => { if (!cancelled) { setError(err.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="wm-loading">Loading AP export data…</div>;
  if (error)   return <div className="wm-loading" style={{ color: 'var(--c-danger)' }}>Error: {error}</div>;

  const commodities = apData?.commodities || [];
  const selectedCommodity = commodities.find(c => c.name === selected) || null;

  return (
    <div className="wm-ap-body">
      <CommodityLeaderboard
        commodities={commodities}
        selected={selected}
        onSelect={setSelected}
      />
      <DestinationPanel commodity={selectedCommodity} />
    </div>
  );
}
