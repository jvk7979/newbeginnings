// src/pages/WorldMarket/WorldTab.jsx
//
// World tab: full-width map with floating year select overlay + country panel.

import { useState, useMemo } from 'react';
import WorldMap from './WorldMap';
import CountryPanel from './CountryPanel';

const YEARS = ['2024', '2023', '2022'];

export default function WorldTab({ partnerData, loading, error, year, setYear }) {
  const [selectedCode, setSelectedCode] = useState(null);
  const [hoveredCode, setHoveredCode]   = useState(null);

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
      {/* Map fills all space left of the panel */}
      <div className="wm-map-col">
        {/* Floating year control — top-left of map */}
        <div className="wm-map-overlay-controls">
          <span className="wm-overlay-label">Year</span>
          <select
            className="wm-overlay-year"
            value={year}
            onChange={e => setYear(e.target.value)}
          >
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Source note — bottom-left of map */}
        <div className="wm-map-source">
          Source: APEDA / DGFT · India Agricultural Exports
        </div>

        {loading && <div className="wm-loading">Loading data…</div>}
        {error   && <div className="wm-loading" style={{ color: 'var(--c-danger)' }}>{error}</div>}
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

      {/* Country detail panel — right side */}
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
