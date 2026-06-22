// src/pages/WorldMarket/WorldTab.jsx
//
// World tab: sidebar (year + category) | WorldMap | CountryPanel.

import { useState, useMemo } from 'react';
import { CATEGORIES } from '../Atlas/cropData';
import WorldMap from './WorldMap';
import CountryPanel from './CountryPanel';

// UN Comtrade has annual data; 2024 is the latest available as of 2025-26.
const YEARS = ['2024', '2023', '2022'];

export default function WorldTab({ partnerData, loading, error, year, setYear }) {
  const [selectedCode, setSelectedCode] = useState(null);
  const [hoveredCode, setHoveredCode]   = useState(null);
  const [catFilter, setCatFilter]       = useState('all');

  const handleHover  = (code) => setHoveredCode(code || null);
  const handleSelect = (code) => setSelectedCode(prev => prev === code ? null : code);

  const topPartners = useMemo(() => {
    if (!partnerData) return [];
    return Object.entries(partnerData)
      .map(([code, d]) => ({ code: Number(code), ...d }))
      .sort((a, b) => b.value_usd - a.value_usd);
  }, [partnerData]);

  return (
    <div className="wm-body">
      {/* Sidebar */}
      <div className="wm-sidebar">
        <div className="wm-sb-block">
          <span className="wm-sb-label">Year</span>
          <select className="wm-sb-select" value={year} onChange={e => setYear(e.target.value)}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div className="wm-sb-block">
          <span className="wm-sb-label">Category</span>
          <button
            className={`wm-sb-cat${catFilter === 'all' ? ' active' : ''}`}
            onClick={() => setCatFilter('all')}>
            <span className="wm-sb-dot" style={{ background: 'var(--c-accent)' }} />
            All Exports
          </button>
          {Object.entries(CATEGORIES).map(([key, cat]) => (
            <button key={key}
              className={`wm-sb-cat${catFilter === key ? ' active' : ''}`}
              onClick={() => setCatFilter(key)}>
              <span className="wm-sb-dot" style={{ background: cat.color }} />
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* World map */}
      <div className="wm-map">
        {loading && <div className="wm-loading">Fetching Comtrade data…</div>}
        {error && (
          <div className="wm-loading" style={{ flexDirection: 'column', gap: 8, padding: 20, textAlign: 'center' }}>
            <span style={{ color: 'var(--c-danger)', fontSize: 13 }}>Comtrade API unavailable</span>
            <span style={{ fontSize: 11, color: 'var(--c-fg3)', maxWidth: 280 }}>{error}</span>
          </div>
        )}
        {!loading && !error && (
          <WorldMap
            partnerData={partnerData}
            selectedCode={selectedCode}
            hoveredCode={hoveredCode}
            onSelect={handleSelect}
            onHover={handleHover}
          />
        )}
      </div>

      {/* Country detail panel */}
      <CountryPanel
        code={selectedCode}
        partnerData={partnerData}
        year={year}
        topPartners={topPartners}
        onSelectCode={setSelectedCode}
      />
    </div>
  );
}
