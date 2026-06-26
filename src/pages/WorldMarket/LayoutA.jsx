// Layout A — Split Panel
// Map 60% left · Horizontal-bar ranked list 40% right · cross-highlight on click

import { useState, useRef } from 'react';
import { COUNTRY_PATHS, W, H } from './mapGeo';
import { fmtUsd } from './comtradeDataset';

// Vibrant, well-separated hues for the 10 colour buckets
const HUES = [8, 38, 180, 118, 258, 48, 158, 302, 76, 326];

// Non-partner ocean/land colour
const LAND_BLANK = '#c8bfad';

function countryFill(code, t) {
  if (t == null) return LAND_BLANK;
  const hue = HUES[code % 10];
  const sat = 68 + t * 22;         // 68 → 90 %
  const lit = 62 - t * 34;         // 62 → 28 %
  return `hsl(${hue},${sat}%,${lit}%)`;
}

function barColour(code) {
  return `hsl(${HUES[code % 10]},75%,36%)`;
}

export default function LayoutA({ partnerData, topPartners }) {
  const [selected, setSelected] = useState(null);
  const listRef = useRef(null);
  const maxVal = topPartners[0]?.value_usd || 1;
  const total  = topPartners.reduce((s, p) => s + p.value_usd, 0);

  function pick(code) {
    const next = code === selected ? null : code;
    setSelected(next);
    if (next && listRef.current) {
      const el = listRef.current.querySelector(`[data-code="${next}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  const selP     = selected ? partnerData?.[selected] : null;
  const selRank  = selected ? topPartners.findIndex(p => p.code === selected) + 1 : null;
  const selHue   = selected ? HUES[selected % 10] : null;
  const selColour = selHue != null ? `hsl(${selHue},80%,36%)` : '#2d1207';

  return (
    <div className="la-root">
      {/* ── Map ── */}
      <div className="la-map-col">
        <svg viewBox={`0 0 ${W} ${H}`} className="la-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <pattern id="la-hatch" width="6" height="6" patternUnits="userSpaceOnUse">
              <path d="M-1,1 l2,-2 M0,6 l6,-6 M5,7 l2,-2" stroke="rgba(0,0,0,0.18)" strokeWidth="1.2" fill="none"/>
            </pattern>
          </defs>
          <rect width={W} height={H} fill="#dce8f0"/>
          {COUNTRY_PATHS.map(({ code, d }) => {
            const pd   = partnerData?.[code];
            const t    = pd ? Math.pow(pd.value_usd / maxVal, 0.38) : null;
            const isP  = t != null;
            const isSel = selected === code;
            return (
              <g key={code}>
                <path d={d} fill={countryFill(code, t)}
                  stroke={isSel ? '#fff' : '#6b5c4e'}
                  strokeWidth={isSel ? 1.6 : 0.35}
                  style={{ cursor: isP ? 'pointer' : 'default', transition: 'stroke-width 80ms' }}
                  onClick={() => isP && pick(code)}/>
                {isP && <path d={d} fill="url(#la-hatch)" stroke="none"
                  style={{ pointerEvents: 'none', opacity: isSel ? 0.6 : 0.3 }}/>}
              </g>
            );
          })}
        </svg>

        {/* Selected country overlay */}
        {selP && (
          <div className="la-map-sel-card" style={{ borderColor: selColour }}>
            <div className="la-map-sel-name">{selP.name}</div>
            <div className="la-map-sel-val" style={{ color: selColour }}>{fmtUsd(selP.value_usd)}</div>
            <div className="la-map-sel-rank">#{selRank} · {(selP.value_usd / total * 100).toFixed(1)}% of total</div>
            <button className="la-map-sel-close" onClick={() => setSelected(null)}>✕ Deselect</button>
          </div>
        )}
        <div className="la-map-credit">India Agricultural Exports · FY 2024-25</div>
      </div>

      {/* ── Ranked list ── */}
      <div className="la-list-col">
        <div className="la-list-head">
          <span className="la-list-title">Ranked Markets</span>
          <span className="la-list-sub">{topPartners.length} importers · click to highlight</span>
        </div>
        <div className="la-list-scroll" ref={listRef}>
          {topPartners.map((p, i) => {
            const t     = p.value_usd / maxVal;
            const isSel = selected === p.code;
            const bar   = barColour(p.code);
            return (
              <div key={p.code} data-code={p.code}
                className={`la-row${isSel ? ' la-row-sel' : ''}`}
                style={isSel ? { background: `hsl(${HUES[p.code % 10]},60%,94%)` } : {}}
                onClick={() => pick(p.code)}>
                <div className="la-row-rank"
                  style={isSel ? { color: bar } : {}}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div className="la-row-body">
                  <div className="la-row-name"
                    style={isSel ? { color: bar, fontWeight: 700 } : {}}>
                    {p.name}
                  </div>
                  <div className="la-row-track">
                    <div className="la-row-bar"
                      style={{ width: `${Math.max(2, t * 100)}%`, background: bar }}/>
                  </div>
                </div>
                <div className="la-row-val"
                  style={isSel ? { color: bar, fontWeight: 700 } : {}}>
                  {fmtUsd(p.value_usd)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
