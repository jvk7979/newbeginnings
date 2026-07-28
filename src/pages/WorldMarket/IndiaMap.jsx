// IndiaMap.jsx — Andhra Pradesh state map (AP only).
//
// Shows just the Andhra Pradesh outline, fitted to the frame and shaded in the
// selected commodity's colour — the origin state for the destination flows on
// the right. Uses the same Survey-of-India GeoJSON + Mercator projection as the
// Crop Atlas so the border matches everywhere.

import { useState, useEffect, useMemo } from 'react';
import { buildPathGen, stateNameOf } from '../Atlas/geoHelpers';
import { CATEGORIES } from '../Atlas/cropData';
import { fmtUsd } from './comtradeDataset';

const IW = 500, IH = 580;
const DATA_URL = `${import.meta.env.BASE_URL}atlas/india-states.geojson`;

export default function IndiaMap({ commodity, onStateClick }) {
  const [geo, setGeo] = useState(null);

  useEffect(() => {
    fetch(DATA_URL).then(r => r.json()).then(setGeo).catch(console.error);
  }, []);

  // Isolate the Andhra Pradesh feature, then fit the projection to it alone so
  // the single state fills the frame.
  const apFeature = useMemo(
    () => geo?.features.find(f => stateNameOf(f.properties) === 'Andhra Pradesh') || null,
    [geo]
  );
  const pathGen = useMemo(
    () => apFeature ? buildPathGen({ type: 'FeatureCollection', features: [apFeature] }, IW, IH, 34) : null,
    [apFeature]
  );

  const color = commodity ? (CATEGORIES[commodity.category]?.color || 'var(--c-accent)') : 'var(--c-accent)';

  if (!geo || !pathGen || !apFeature) {
    return (
      <div className="im-root">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%',
          fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: 'var(--c-fg3)' }}>
          Loading Andhra Pradesh map…
        </div>
      </div>
    );
  }

  const d   = pathGen.path(apFeature);
  const cen = pathGen.centroid(apFeature);

  return (
    <div className="im-root">
      <div className="im-header">
        <span className="im-header-state">Andhra Pradesh</span>
        <span className="im-header-sep">·</span>
        <span className="im-header-label">India's Agri-Export Powerhouse</span>
      </div>

      <div className="im-svg-wrap">
        <svg viewBox={`0 0 ${IW} ${IH}`} className="im-svg" preserveAspectRatio="xMidYMid meet">
          <path d={d}
            fill={color}
            stroke="var(--c-bg1)"
            strokeWidth={2}
            onClick={() => onStateClick?.()}
            style={{ cursor: onStateClick ? 'pointer' : 'default',
                     filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.30))' }}
          />
          {cen && (
            <text x={cen[0]} y={cen[1]} textAnchor="middle" dominantBaseline="middle"
              fill="#fff" fontWeight="700" fontSize="14" fontFamily="'DM Sans',sans-serif"
              style={{ pointerEvents: 'none', paintOrder: 'stroke',
                       stroke: 'rgba(0,0,0,0.25)', strokeWidth: 3 }}>
              Andhra Pradesh
            </text>
          )}
        </svg>

        {commodity && (
          <div className="im-ap-chip" style={{ borderColor: color, color }}>
            <span className="im-ap-chip-name">{commodity.name}</span>
            <span className="im-ap-chip-val">{fmtUsd(commodity.value_usd_m * 1e6)}</span>
          </div>
        )}
      </div>

      <div className="im-legend">
        <span className="im-legend-dot" style={{ background: color }} />
        <span className="im-legend-text">
          Andhra Pradesh {commodity ? `· ${commodity.name}` : '· Select a commodity'}
        </span>
      </div>
    </div>
  );
}
