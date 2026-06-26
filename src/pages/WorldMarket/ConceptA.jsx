// Concept A — "Night City"
// Deep navy background, amber-gold glowing import partners,
// animated great-circle arcs from India to each top importer,
// frosted-glass right panel.

import { useState, useMemo } from 'react';
import { COUNTRY_PATHS, W, H } from './mapGeo';
import { fmtUsd } from './comtradeDataset';

// Approximate SVG centroids for top APEDA partners
// Computed from project(lng, lat) for each country's rough geographic centre.
const CENTROIDS = {
  840: [213, 149],  // USA
   50: [720, 203],  // Bangladesh
  784: [624, 203],  // UAE
  156: [760, 166],  // China
  524: [704, 189],  // Nepal
  704: [768, 237],  // Vietnam
  682: [600, 203],  // Saudi Arabia
  360: [781, 301],  // Indonesia
  458: [773, 270],  // Malaysia
  144: [696, 257],  // Sri Lanka
  392: [848, 162],  // Japan
  818: [560, 193],  // Egypt
  826: [475, 108],  // United Kingdom
  276: [507, 111],  // Germany
  124: [227, 81 ],  // Canada
};

const INDIA_XY = [690, 214];

function arcD(x1, y1, x2, y2) {
  const cx = (x1 + x2) / 2;
  const cy = Math.min(y1, y2) - 75;
  return `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`;
}

export default function ConceptA({ partnerData, topPartners }) {
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered]   = useState(null);

  const maxVal = useMemo(() =>
    topPartners.length ? topPartners[0].value_usd : 1, [topPartners]);

  const totalExports = useMemo(() =>
    topPartners.reduce((s, p) => s + p.value_usd, 0), [topPartners]);

  return (
    <div className="ca-root">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="ca-header">
        <div className="ca-header-left">
          <div className="ca-eyebrow">India · Agricultural Exports · 2025</div>
          <div className="ca-title">World <em>Market</em></div>
        </div>
        <div className="ca-kpis">
          <div className="ca-kpi">
            <span className="ca-kpi-val">{fmtUsd(totalExports)}</span>
            <span className="ca-kpi-lab">Total Agri Exports</span>
          </div>
          <div className="ca-kpi">
            <span className="ca-kpi-val">{topPartners.length}</span>
            <span className="ca-kpi-lab">Markets</span>
          </div>
          {topPartners[0] && (
            <div className="ca-kpi">
              <span className="ca-kpi-val">{topPartners[0].name}</span>
              <span className="ca-kpi-lab">Top Importer</span>
            </div>
          )}
        </div>
        <div className="ca-concept-badge">Concept A — Night City</div>
      </div>

      {/* ── Body ──────────────────────────────────────────────── */}
      <div className="ca-body">
        {/* Map column */}
        <div className="ca-map-col">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="xMidYMid meet"
            className="ca-svg"
          >
            <defs>
              <filter id="ca-glow-lg" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur"/>
                <feMerge>
                  <feMergeNode in="blur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <filter id="ca-glow-sm" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
                <feMerge>
                  <feMergeNode in="blur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <filter id="ca-glow-dot" x="-200%" y="-200%" width="500%" height="500%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur"/>
                <feMerge>
                  <feMergeNode in="blur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <radialGradient id="ca-vignette" cx="50%" cy="50%" r="55%">
                <stop offset="0%" stopColor="transparent"/>
                <stop offset="100%" stopColor="#020408" stopOpacity="0.6"/>
              </radialGradient>
            </defs>

            {/* Ocean */}
            <rect width={W} height={H} fill="#060b18"/>

            {/* Countries */}
            {COUNTRY_PATHS.map(({ code, d }) => {
              const pd = partnerData?.[code];
              const isPartner = pd != null;
              const t = isPartner ? Math.pow(pd.value_usd / maxVal, 0.38) : 0;
              const lig = isPartner ? Math.round(28 + t * 38) : null;
              const fill = isPartner ? `hsl(42,95%,${lig}%)` : '#0c1728';
              const isSel = selected === code;
              const isHov = hovered === code;
              return (
                <path
                  key={code} d={d} fill={fill}
                  stroke={isPartner ? 'rgba(255,215,60,0.2)' : 'rgba(255,255,255,0.04)'}
                  strokeWidth={0.4}
                  filter={isPartner ? 'url(#ca-glow-sm)' : undefined}
                  style={{
                    cursor: isPartner ? 'pointer' : 'default',
                    transition: 'fill 200ms, opacity 100ms',
                    opacity: isSel ? 1 : isHov ? 1 : isPartner ? 0.88 : 1,
                    outline: isSel ? '2px solid rgba(255,190,30,0.8)' : 'none',
                  }}
                  onClick={() => isPartner && setSelected(code === selected ? null : code)}
                  onMouseEnter={() => setHovered(code)}
                  onMouseLeave={() => setHovered(null)}
                />
              );
            })}

            {/* Animated arcs */}
            {topPartners.slice(0, 12).map((p, i) => {
              const dest = CENTROIDS[p.code];
              if (!dest) return null;
              const t = p.value_usd / maxVal;
              const opacity = 0.25 + t * 0.6;
              const sw = Math.max(0.6, t * 3);
              return (
                <path
                  key={p.code}
                  d={arcD(INDIA_XY[0], INDIA_XY[1], dest[0], dest[1])}
                  fill="none"
                  stroke={`rgba(255,200,50,${opacity})`}
                  strokeWidth={sw}
                  pathLength="1"
                  strokeDasharray="1"
                  strokeDashoffset="1"
                  className="ca-arc"
                  style={{ '--d': `${0.3 + i * 0.12}s` }}
                />
              );
            })}

            {/* India marker */}
            <circle cx={INDIA_XY[0]} cy={INDIA_XY[1]} r="12" fill="rgba(255,100,30,0.18)" filter="url(#ca-glow-dot)"/>
            <circle cx={INDIA_XY[0]} cy={INDIA_XY[1]} r="5"  fill="#ff6b35" filter="url(#ca-glow-sm)" className="ca-india-pulse"/>
            <circle cx={INDIA_XY[0]} cy={INDIA_XY[1]} r="2"  fill="#fff"/>

            {/* Vignette overlay */}
            <rect width={W} height={H} fill="url(#ca-vignette)" style={{ pointerEvents: 'none' }}/>
          </svg>

          {/* Attribution */}
          <div className="ca-attribution">Source: APEDA AgriExchange / DGFT · Agricultural &amp; Allied Products</div>
        </div>

        {/* Right frosted-glass panel */}
        <div className="ca-panel">
          <div className="ca-panel-head">
            <div className="ca-panel-eye">TOP IMPORTERS · 2025</div>
            <div className="ca-panel-title">Agricultural &amp; Allied</div>
          </div>
          <div className="ca-panel-list">
            {topPartners.slice(0, 15).map((p, i) => {
              const t = p.value_usd / maxVal;
              const isSel = selected === p.code;
              const isHov = hovered === p.code;
              return (
                <div
                  key={p.code}
                  className={`ca-row${isSel ? ' ca-row-sel' : isHov ? ' ca-row-hov' : ''}`}
                  onClick={() => setSelected(p.code === selected ? null : p.code)}
                  onMouseEnter={() => setHovered(p.code)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <span className="ca-row-rank">{String(i + 1).padStart(2, '0')}</span>
                  <div className="ca-row-mid">
                    <div className="ca-row-name">{p.name}</div>
                    <div className="ca-row-track">
                      <div className="ca-row-fill" style={{ width: `${t * 100}%` }}/>
                    </div>
                  </div>
                  <span className="ca-row-val">{fmtUsd(p.value_usd)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
