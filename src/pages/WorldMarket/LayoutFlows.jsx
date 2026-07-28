// Layout Flows — the dynamic "Trade Flows" World view.
//
// The real equirectangular world map (faint land) with value-weighted arcs
// curving from India out to every top importing market. A gold pulse flows
// along each arc toward the buyer; arc thickness + node size scale with
// export value. Hover a market (on the map or in the ranked list) to trace
// its route. Fully theme-token driven — Monsoon (light) / Delta (dark).

import { useState, useMemo, useRef } from 'react';
import { COUNTRY_PATHS, W, H, CENTROIDS, arcPath, starPath } from './mapGeo';
import { fmtUsd } from './comtradeDataset';

const INDIA_CODE = 356;
// Arc the top N markets so the map reads as a clean web rather than 100
// overlapping threads; the ranked list still carries every partner.
const ARC_LIMIT = 40;

// Vibrant, well-separated palette — each export market gets its own colour
// (assigned by rank), so the map reads as distinct countries rather than one
// value ramp. Cycles for the long tail; the top markets stay unique.
const PALETTE = [
  '#E0733A', '#3F9E6B', '#D6564F', '#4A90D9', '#C47F2A', '#9B59D4',
  '#2BBFA0', '#E0913A', '#5B7FD4', '#B8A424', '#D64F94', '#3AA84A',
  '#A048D4', '#3AA8C4', '#C44FB8', '#7AB83A', '#E04F66', '#3A7AC4',
  '#8A6BD4', '#57A83A', '#E0A83A', '#3ABF9E', '#C46A2A', '#6A9E3A',
];

export default function LayoutFlows({ partnerData, topPartners }) {
  const [hover, setHover] = useState(null);
  const listRef = useRef(null);

  const centroids = CENTROIDS;
  const india = centroids[INDIA_CODE] || { x: W * 0.72, y: H * 0.42 };
  const maxVal = topPartners[0]?.value_usd || 1;
  const total = topPartners.reduce((s, p) => s + p.value_usd, 0);

  // code → its own colour, by rank.
  const colorByCode = useMemo(() => {
    const m = {};
    topPartners.forEach((p, i) => { m[p.code] = PALETTE[i % PALETTE.length]; });
    return m;
  }, [topPartners]);

  // Precompute arcs for the top markets that have a map centroid.
  const arcs = useMemo(() => {
    return topPartners.slice(0, ARC_LIMIT).map(p => {
      const c = centroids[p.code];
      if (!c) return null;
      const { d, dist } = arcPath(india, c);
      const t = Math.pow(p.value_usd / maxVal, 0.5);
      return {
        code: p.code, name: p.name, value: p.value_usd,
        d, x: c.x, y: c.y,
        w: 1.2 + t * 6.5,
        r: 2.5 + t * 5.5,
        dur: (0.9 + dist / 900).toFixed(2),
      };
    }).filter(Boolean);
  }, [topPartners, centroids, india, maxVal]);

  function pick(code) {
    setHover(h => (h === code ? null : code));
    const el = listRef.current?.querySelector(`[data-code="${code}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  const star = starPath(india.x, india.y, 10, 5);

  return (
    <div className="la-root">
      {/* ── Flow map ── */}
      <div className="lf-map-col">
        <svg viewBox={`0 0 ${W} ${H}`} className="la-svg" preserveAspectRatio="xMidYMid meet">
          <rect width={W} height={H} className="la-ocean" />
          {/* Choropleth land — importing countries shaded by export value
              (paddy scale), India gold, everyone else muted land. Visible
              borders separate every country. Arcs render on top. */}
          {COUNTRY_PATHS.map(({ code, d }, i) => {
            const isIndia = code === INDIA_CODE;
            const fill = isIndia
              ? 'var(--c-h-gold)'
              : (colorByCode[code] || 'var(--c-bg3)');
            return <path key={i} d={d} className="lf-land" style={{ fill }} />;
          })}
          {/* arcs */}
          <g>
            {arcs.map(a => {
              const hot = hover === a.code;
              return (
                <g key={a.code} className={`lf-arc${hot ? ' hot' : ''}`}
                   onMouseEnter={() => setHover(a.code)} onMouseLeave={() => setHover(null)}
                   onClick={() => pick(a.code)}>
                  <path className="lf-arc-hit" d={a.d} />
                  <path className="lf-arc-base" d={a.d} strokeWidth={a.w} />
                  <path className="lf-arc-flow" d={a.d} strokeWidth={Math.max(1.2, a.w * 0.6)}
                        style={{ animationDuration: `${a.dur}s` }} />
                  <circle className="lf-node" cx={a.x} cy={a.y} r={a.r} />
                </g>
              );
            })}
          </g>
          {/* India hub */}
          <g className="lf-hub" aria-hidden="true">
            <circle className="lf-hub-ring" cx={india.x} cy={india.y} r={12} />
            <path className="lf-hub-star" d={star} />
            <text className="lf-hub-label" x={india.x} y={india.y + 24} textAnchor="middle">INDIA</text>
          </g>
          {/* hovered market label */}
          {hover != null && (() => {
            const a = arcs.find(x => x.code === hover);
            if (!a) return null;
            const anchor = a.x > india.x ? 'start' : 'end';
            const tx = a.x + (a.x > india.x ? 9 : -9);
            return (
              <g className="lf-tip" style={{ pointerEvents: 'none' }}>
                <text className="lf-tip-name" x={tx} y={a.y - 3} textAnchor={anchor}>{a.name}</text>
                <text className="lf-tip-val" x={tx} y={a.y + 9} textAnchor={anchor}>{fmtUsd(a.value)}</text>
              </g>
            );
          })()}
        </svg>

        {/* legend — each country its own colour; gold arcs carry the flow */}
        <div className="la-legend">
          <div className="la-legend-title">Trade flows</div>
          <div className="lf-legend-row"><span className="lf-legend-arc" /> India → market</div>
          <div className="la-legend-origin"><span className="la-legend-origin-dot" /> India · origin</div>
        </div>
        <div className="la-map-credit">India Agricultural Exports · FY 2024–25 · top {arcs.length} routes</div>
      </div>

      {/* ── Ranked list (cross-highlights with the arcs) ── */}
      <div className="la-list-col">
        <div className="la-list-head">
          <span className="la-list-title">Ranked markets</span>
          <span className="la-list-sub">{topPartners.length} importers · hover to trace</span>
        </div>
        <div className="la-list-scroll" ref={listRef}>
          {topPartners.map((p, i) => {
            const t = p.value_usd / maxVal;
            const hot = hover === p.code;
            const share = total ? (p.value_usd / total * 100) : 0;
            return (
              <div key={p.codeStr ?? p.code} data-code={p.code}
                className={`la-row${hot ? ' la-row-sel' : ''}`}
                onMouseEnter={() => setHover(p.code)} onMouseLeave={() => setHover(null)}
                onClick={() => pick(p.code)}>
                <div className="la-row-rank">{String(i + 1).padStart(2, '0')}</div>
                <div className="la-row-body">
                  <div className="la-row-name">{p.name}</div>
                  <div className="la-row-track"><div className="la-row-bar" style={{ width: `${Math.max(2, t * 100)}%`, background: colorByCode[p.code] || 'var(--c-accent)' }} /></div>
                </div>
                <div className="la-row-figs">
                  <div className="la-row-val">{fmtUsd(p.value_usd)}</div>
                  <div className="la-row-share">{share.toFixed(1)}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
