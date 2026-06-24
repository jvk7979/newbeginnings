// src/pages/WorldMarket/WorldTab.jsx
//
// World tab: full-width map + right country panel.
// Year and Source selectors now live in WorldMarketNavBar, not on the map.

import { useState, useMemo } from 'react';
import WorldMap from './WorldMap';
import CountryPanel from './CountryPanel';
import { SOURCE_META } from './comtradeDataset';

export default function WorldTab({ partnerData, loading, error, year, source }) {
  const [selectedCode, setSelectedCode] = useState(null);
  const [hoveredCode,  setHoveredCode]  = useState(null);

  const handleHover  = (code) => setHoveredCode(code || null);
  const handleSelect = (code) => setSelectedCode(prev => prev === code ? null : code);

  const topPartners = useMemo(() => {
    if (!partnerData) return [];
    return Object.entries(partnerData)
      .map(([code, d]) => ({ code: Number(code), ...d }))
      .sort((a, b) => b.value_usd - a.value_usd);
  }, [partnerData]);

  const meta = SOURCE_META[source] || SOURCE_META.apeda;

  return (
    <div className="wm-body">
      {/* Map — fills all space left of the panel */}
      <div className="wm-map-col">
        {/* Source attribution — bottom-left */}
        <div className="wm-map-source">{meta.attribution}</div>

        {loading && <div className="wm-loading">Loading data…</div>}
        {error   && <div className="wm-loading" style={{ color: 'var(--c-danger)' }}>{error}</div>}
        {!loading && !error && (
          <WorldMap
            partnerData={partnerData}
            selectedCode={selectedCode}
            onSelect={handleSelect}
            onHover={handleHover}
          />
        )}
      </div>

      {/* Country detail panel — right */}
      <CountryPanel
        code={selectedCode}
        partnerData={partnerData}
        year={year}
        source={source}
        topPartners={topPartners}
        onSelectCode={setSelectedCode}
      />
    </div>
  );
}
