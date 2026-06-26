// Concept B — "Editorial Atlas"
// Warm paper background, diagonal-hatch import countries, large Playfair serif
// headlines, scrollable country strip across the bottom.
// Click a country → full editorial detail panel (products + stats + note).

import { useState, useMemo, useEffect } from 'react';
import { COUNTRY_PATHS, W, H } from './mapGeo';
import { fmtUsd, loadCountryCommodities, COUNTRY_META } from './comtradeDataset';

const HUES = [350, 25, 195, 130, 270, 45, 165, 310, 80, 10];

function editorialFill(code, t) {
  if (t == null) return '#e8e0d0';
  const hue = HUES[code % 10];
  const sat = 45 + t * 25;
  const lig = 68 - t * 28;
  return `hsl(${hue},${sat}%,${lig}%)`;
}

function GrowthBadge({ pct }) {
  if (pct == null) return null;
  const up = pct >= 0;
  return (
    <span className={`cb-growth${up ? ' cb-growth-up' : ' cb-growth-dn'}`}>
      {up ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

export default function ConceptB({ partnerData, topPartners, standalone = true }) {
  const [selected, setSelected]       = useState(null);
  const [hovered,  setHovered]        = useState(null);
  const [products, setProducts]       = useState(null);
  const [loadingProd, setLoadingProd] = useState(false);

  const maxVal  = useMemo(() => topPartners.length ? topPartners[0].value_usd : 1, [topPartners]);
  const total   = useMemo(() => topPartners.reduce((s, p) => s + p.value_usd, 0), [topPartners]);

  // Load commodity breakdown whenever selection changes
  useEffect(() => {
    if (!selected) { setProducts(null); return; }
    setLoadingProd(true);
    loadCountryCommodities(selected, '2025', 'apeda')
      .then(d => { setProducts(d); setLoadingProd(false); })
      .catch(() => { setProducts([]); setLoadingProd(false); });
  }, [selected]);

  const selectedPartner = selected ? partnerData?.[selected] : null;
  const selectedRank    = selected ? topPartners.findIndex(p => p.code === selected) + 1 : null;
  const selectedShare   = selectedPartner ? (selectedPartner.value_usd / total * 100).toFixed(1) : null;
  const selectedMeta    = selected ? COUNTRY_META[String(selected)] : null;
  const maxProd         = products?.length ? products[0].value_usd : 1;

  function closePanel() { setSelected(null); setProducts(null); }

  return (
    <div className="cb-root">
      {/* ── Masthead — hidden when embedded in the main World Market page ── */}
      {standalone && <div className="cb-masthead">
        <div className="cb-masthead-left">
          <div className="cb-rule"/>
          <div className="cb-masthead-label">India · Agricultural Export Atlas · FY 2024-25</div>
          <div className="cb-rule"/>
        </div>
        <div className="cb-masthead-title">
          <span className="cb-title-small">World</span>
          <span className="cb-title-big">Market</span>
        </div>
        <div className="cb-masthead-right">
          <div className="cb-stat-block">
            <div className="cb-stat-val">{fmtUsd(total)}</div>
            <div className="cb-stat-lab">TOTAL EXPORTS</div>
          </div>
          <div className="cb-stat-sep"/>
          <div className="cb-stat-block">
            <div className="cb-stat-val">{topPartners.length}</div>
            <div className="cb-stat-lab">MARKETS</div>
          </div>
          <div className="cb-stat-sep"/>
          <div className="cb-stat-block">
            <div className="cb-stat-val">{topPartners[0]?.name || '—'}</div>
            <div className="cb-stat-lab">TOP IMPORTER</div>
          </div>
          {standalone && <div className="cb-concept-tag">Concept B — Editorial</div>}
        </div>
      </div>}

      {/* ── Map ──────────────────────────────────────────────── */}
      <div className="cb-map-wrap">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          className="cb-svg"
        >
          <defs>
            <pattern id="cb-hatch" width="6" height="6" patternUnits="userSpaceOnUse">
              <path d="M-1,1 l2,-2 M0,6 l6,-6 M5,7 l2,-2"
                stroke="rgba(0,0,0,0.18)" strokeWidth="1.2" fill="none"/>
            </pattern>
            <pattern id="cb-hatch-sel" width="4" height="4" patternUnits="userSpaceOnUse">
              <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2"
                stroke="rgba(0,0,0,0.38)" strokeWidth="1" fill="none"/>
            </pattern>
          </defs>

          <rect width={W} height={H} fill="#f0e8d8"/>

          {COUNTRY_PATHS.map(({ code, d }) => {
            const pd = partnerData?.[code];
            const t  = pd ? Math.pow(pd.value_usd / maxVal, 0.38) : null;
            const fill = editorialFill(code, t);
            const isPartner = t != null;
            const isSel = selected === code;
            const isHov = hovered === code;
            return (
              <g key={code}>
                <path
                  d={d} fill={fill}
                  stroke="#2d1207"
                  strokeWidth={isSel ? 1.2 : isHov ? 0.8 : 0.35}
                  style={{ cursor: isPartner ? 'pointer' : 'default', transition: 'stroke-width 100ms' }}
                  onClick={() => isPartner && setSelected(code === selected ? null : code)}
                  onMouseEnter={() => setHovered(code)}
                  onMouseLeave={() => setHovered(null)}
                />
                {isPartner && (
                  <path
                    d={d}
                    fill={`url(#${isSel ? 'cb-hatch-sel' : 'cb-hatch'})`}
                    stroke="none"
                    style={{ pointerEvents: 'none', opacity: isSel ? 0.85 : 0.55 }}
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* ── Editorial detail panel ─────────────────────────── */}
        {selected && selectedPartner && (
          <div className="cb-detail">
            {/* Close */}
            <button className="cb-detail-close" onClick={closePanel}>×</button>

            {/* Country headline */}
            <div className="cb-detail-section-label">COUNTRY IMPORT PROFILE</div>
            <div className="cb-detail-rule"/>
            <div className="cb-detail-country">{selectedPartner.name}</div>
            <div className="cb-detail-rule"/>
            <div className="cb-detail-byline">
              <span className="cb-detail-rank">#{selectedRank} importer</span>
              <span className="cb-detail-dot">·</span>
              <span className="cb-detail-total">{fmtUsd(selectedPartner.value_usd)}</span>
              <span className="cb-detail-dot">·</span>
              <span className="cb-detail-share">{selectedShare}% of India's agri exports</span>
            </div>

            {/* Products */}
            <div className="cb-detail-products-head">TOP PRODUCTS</div>
            {loadingProd && <div className="cb-detail-loading">Loading…</div>}
            {!loadingProd && products?.length === 0 && (
              <div className="cb-detail-no-data">
                Detailed commodity data not available for this market.<br/>
                This country is tracked at the aggregate level only.
              </div>
            )}
            {!loadingProd && products?.length > 0 && (
              <div className="cb-detail-prod-list">
                {products.map((p, i) => {
                  const share = Math.round(p.value_usd / selectedPartner.value_usd * 100);
                  const barW  = Math.max(4, p.value_usd / maxProd * 100);
                  return (
                    <div key={p.hsCode + i} className="cb-detail-prod-row">
                      <div className="cb-detail-prod-meta">
                        <span className="cb-detail-prod-num">{String(i + 1).padStart(2, '0')}</span>
                        <span className="cb-detail-prod-name">{p.name}</span>
                        <span className="cb-detail-prod-pct">{share}%</span>
                      </div>
                      <div className="cb-detail-bar-track">
                        <div className="cb-detail-bar-fill" style={{ width: `${barW}%` }}/>
                      </div>
                      <div className="cb-detail-prod-val">{fmtUsd(p.value_usd)}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Stats */}
            <div className="cb-detail-rule cb-detail-rule-mt"/>
            <div className="cb-detail-stats-head">QUICK FACTS</div>
            <div className="cb-detail-stats-grid">
              <div className="cb-detail-stat">
                <div className="cb-detail-stat-label">GLOBAL RANK</div>
                <div className="cb-detail-stat-val">#{selectedRank} <span className="cb-detail-stat-of">of {topPartners.length}</span></div>
              </div>
              <div className="cb-detail-stat">
                <div className="cb-detail-stat-label">EXPORT SHARE</div>
                <div className="cb-detail-stat-val">{selectedShare}%</div>
              </div>
              <div className="cb-detail-stat">
                <div className="cb-detail-stat-label">LEADING PRODUCT</div>
                <div className="cb-detail-stat-val cb-detail-stat-sm">
                  {products?.[0]?.name || '—'}
                </div>
              </div>
              <div className="cb-detail-stat">
                <div className="cb-detail-stat-label">YoY CHANGE</div>
                <div className="cb-detail-stat-val">
                  {selectedMeta
                    ? <GrowthBadge pct={selectedMeta.growth_pct}/>
                    : '—'}
                </div>
              </div>
            </div>

            {/* Trade note */}
            {selectedMeta?.note && (
              <div className="cb-detail-note">
                <div className="cb-detail-note-label">TRADE NOTE</div>
                <div className="cb-detail-note-text">{selectedMeta.note}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Bottom country strip ─────────────────────────────── */}
      <div className="cb-strip-wrap">
        <div className="cb-strip-header">
          <div className="cb-strip-label">Top Export Destinations</div>
          <div className="cb-strip-hint">hover for details · click to explore</div>
        </div>
        <div className="cb-strip">
          {topPartners.slice(0, 30).map((p, i) => {
            const t = p.value_usd / maxVal;
            const hue = HUES[p.code % 10];
            const isSel = selected === p.code;
            const barH = Math.max(6, t * 120);
            return (
              <div
                key={p.code}
                className={`cb-strip-col${isSel ? ' cb-strip-sel' : ''}`}
                onClick={() => setSelected(p.code === selected ? null : p.code)}
              >
                {/* Hover tooltip */}
                <div className="cb-strip-tooltip">
                  <div className="cb-strip-tooltip-name">{p.name}</div>
                  <div className="cb-strip-tooltip-val">#{i + 1} · {fmtUsd(p.value_usd)}</div>
                </div>
                <div className="cb-strip-rank">{String(i + 1).padStart(2, '0')}</div>
                <div className="cb-strip-bar-wrap">
                  <div
                    className="cb-strip-bar"
                    style={{ height: `${barH}px`, background: `hsl(${hue},52%,42%)`, opacity: isSel ? 1 : 0.75 }}
                  />
                </div>
                <div className="cb-strip-name">{p.name.split(' ')[0]}</div>
                <div className="cb-strip-val">{fmtUsd(p.value_usd)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
