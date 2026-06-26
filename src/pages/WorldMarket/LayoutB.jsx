// Layout B — Full-Screen Map
// Map fills entire view · floating top-5 card top-right · slide-up drawer · click for detail popup

import { useState } from 'react';
import { COUNTRY_PATHS, W, H } from './mapGeo';
import { fmtUsd } from './comtradeDataset';

const HUES = [350, 25, 195, 130, 270, 45, 165, 310, 80, 10];

function fill(code, t) {
  if (t == null) return '#e8e0d0';
  return `hsl(${HUES[code % 10]},${45 + t * 25}%,${68 - t * 28}%)`;
}

export default function LayoutB({ partnerData, topPartners }) {
  const [selected,    setSelected]    = useState(null);
  const [hovered,     setHovered]     = useState(null);
  const [drawerOpen,  setDrawerOpen]  = useState(false);

  const maxVal  = topPartners[0]?.value_usd || 1;
  const total   = topPartners.reduce((s, p) => s + p.value_usd, 0);
  const selP    = selected ? partnerData?.[selected] : null;
  const selRank = selected ? topPartners.findIndex(p => p.code === selected) + 1 : null;
  const hovP    = hovered  ? partnerData?.[hovered]  : null;

  function pick(code) { setSelected(code === selected ? null : code); }

  return (
    <div className="lb-root">
      {/* ── Full-screen map ── */}
      <svg viewBox={`0 0 ${W} ${H}`} className="lb-svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <pattern id="lb-hatch" width="6" height="6" patternUnits="userSpaceOnUse">
            <path d="M-1,1 l2,-2 M0,6 l6,-6 M5,7 l2,-2" stroke="rgba(0,0,0,0.13)" strokeWidth="1" fill="none"/>
          </pattern>
        </defs>
        <rect width={W} height={H} fill="#f0e8d8"/>
        {COUNTRY_PATHS.map(({ code, d }) => {
          const pd  = partnerData?.[code];
          const t   = pd ? Math.pow(pd.value_usd / maxVal, 0.38) : null;
          const isP = t != null;
          const isSel = selected === code;
          const isHov = hovered  === code;
          return (
            <g key={code}>
              <path d={d} fill={fill(code, t)} stroke="#2d1207"
                strokeWidth={isSel ? 1.6 : isHov ? 0.9 : 0.3}
                style={{ cursor: isP ? 'pointer' : 'default', transition: 'stroke-width 80ms' }}
                onClick={() => isP && pick(code)}
                onMouseEnter={() => setHovered(code)}
                onMouseLeave={() => setHovered(null)}/>
              {isP && <path d={d} fill="url(#lb-hatch)" stroke="none"
                style={{ pointerEvents: 'none', opacity: isSel ? 0.75 : 0.4 }}/>}
            </g>
          );
        })}
      </svg>

      {/* ── Hover tooltip ── */}
      {hovP && !selected && (
        <div className="lb-hover-tip">
          <strong>{hovP.name}</strong> · {fmtUsd(hovP.value_usd)}
        </div>
      )}

      {/* ── Floating top-5 card ── */}
      <div className="lb-float-card">
        <div className="lb-float-head">Top 5 Importers</div>
        {topPartners.slice(0, 5).map((p, i) => (
          <div key={p.code}
            className={`lb-float-row${selected === p.code ? ' lb-float-sel' : ''}`}
            onClick={() => pick(p.code)}>
            <span className="lb-float-rank">{i + 1}</span>
            <span className="lb-float-name">{p.name}</span>
            <span className="lb-float-val">{fmtUsd(p.value_usd)}</span>
          </div>
        ))}
        <div className="lb-float-total">Total {fmtUsd(total)}</div>
      </div>

      {/* ── Selected country popup ── */}
      {selP && (
        <div className="lb-detail-popup">
          <button className="lb-detail-close" onClick={() => setSelected(null)}>✕</button>
          <div className="lb-detail-rank">#{selRank} Importer</div>
          <div className="lb-detail-name">{selP.name}</div>
          <div className="lb-detail-val">{fmtUsd(selP.value_usd)}</div>
          <div className="lb-detail-share">{(selP.value_usd / total * 100).toFixed(1)}% of India's agri exports</div>
        </div>
      )}

      {/* ── Slide-up drawer ── */}
      <div className={`lb-drawer${drawerOpen ? ' lb-drawer-open' : ''}`}>
        <button className="lb-drawer-toggle" onClick={() => setDrawerOpen(o => !o)}>
          {drawerOpen ? '▾ Close' : `▴ All ${topPartners.length} Destinations`}
        </button>
        {drawerOpen && (
          <div className="lb-drawer-strip">
            {topPartners.slice(0, 30).map((p, i) => {
              const t = p.value_usd / maxVal;
              const isSel = selected === p.code;
              return (
                <div key={p.code}
                  className={`lb-drawer-col${isSel ? ' lb-drawer-sel' : ''}`}
                  onClick={() => pick(p.code)}>
                  <div className="lb-drawer-bar-wrap">
                    <div className="lb-drawer-bar"
                      style={{ height: `${Math.max(4, t * 80)}px`, background: `hsl(${HUES[p.code % 10]},52%,42%)` }}/>
                  </div>
                  <div className="lb-drawer-name">{p.name.split(' ')[0]}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
