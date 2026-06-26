// src/pages/WorldMarket/index.jsx

import { useState, useEffect, useMemo } from 'react';
import { loadPartnerTotals } from './comtradeDataset';
import WorldMarketNavBar from './WorldMarketNavBar';
import ConceptB from './ConceptB';
import APTab from './APTab';
import '../../world-market.css';
import '../../concepts.css';

const DEFAULT_YEAR   = '2025';
const DEFAULT_SOURCE = 'apeda';

export default function WorldMarketPage({ onNavigate }) {
  const [tab,    setTab]    = useState('world');
  const [year,   setYear]   = useState(DEFAULT_YEAR);
  const [source, setSource] = useState(DEFAULT_SOURCE);

  const [partnerData, setPartnerData] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null);
    loadPartnerTotals(year, source)
      .then(data => { if (!cancelled) { setPartnerData(data); setLoading(false); } })
      .catch(err  => { if (!cancelled) { setError(err.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, [year, source]);

  const topPartners = useMemo(() => {
    if (!partnerData) return [];
    return Object.entries(partnerData)
      .map(([code, d]) => ({ code: Number(code), ...d }))
      .sort((a, b) => b.value_usd - a.value_usd);
  }, [partnerData]);

  const partnerCount = partnerData ? Object.keys(partnerData).length : 0;

  return (
    <div className="wm-root" style={{
      flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <WorldMarketNavBar
        tab={tab} setTab={setTab}
        topPartners={topPartners}
        partnerCount={partnerCount}
        year={year}   setYear={setYear}
        source={source} setSource={setSource}
        onNavigate={onNavigate}
      />

      <div className={`wm-scroll${tab === 'world' ? ' wm-scroll-map' : ''}`}>
        {tab === 'world' && (
          loading
            ? <div className="wm-loading">Loading…</div>
            : error
              ? <div className="wm-error">Failed to load data: {error}</div>
              : <ConceptB
                  partnerData={partnerData}
                  topPartners={topPartners}
                  standalone={false}
                />
        )}
        {tab === 'ap' && <APTab />}
      </div>
    </div>
  );
}
