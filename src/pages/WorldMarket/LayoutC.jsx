// Layout C — Dashboard Grid
// Row 1: 4 KPI metric cards
// Row 2: Map (left 65%) + Top-10 leaderboard (right 35%)
// Row 3: Horizontal bar chart

import { useState } from 'react';
import { COUNTRY_PATHS, W, H } from './mapGeo';
import { fmtUsd } from './comtradeDataset';

const HUES = [350, 25, 195, 130, 270, 45, 165, 310, 80, 10];

function fill(code, t) {
  if (t == null) return '#e8e0d0';
  return `hsl(${HUES[code % 10]},${45 + t * 25}%,${68 - t * 28}%)`;
}

export default function LayoutC({ partnerData, topPartners }) {
  const [selected, setSelected] = useState(null);
  const maxVal = topPartners[0]?.value_usd || 1;
  const total  = topPartners.reduce((s, p) => s + p.value_usd, 0);
  const top5   = topPartners.slice(0, 5);
  const top5sum = top5.reduce((s, p) => s + p.value_usd, 0);
  const selP   = selected ? partnerData?.[selected] : null;
  const selRank = selected ? topPartners.findIndex(p => p.code === selected) + 1 : null;

  function pick(code) { setSelected(code === selected ? null : code); }

  return (
    <div className="lc-root">
      {/* ── Row 1: KPI cards ── */}
      <div className="lc-kpi-row">
        <div className="lc-kpi-card">
          <div className="lc-kpi-val">{fmtUsd(total)}</div>
          <div className="lc-kpi-label">Total Exports</div>
        </div>
        <div className="lc-kpi-card">
          <div className="lc-kpi-val">{topPartners.length}</div>
          <div className="lc-kpi-label">Import Markets</div>
        </div>
        <div className="lc-kpi-card lc-kpi-card-accent">
          <div className="lc-kpi-val">{topPartners[0]?.name || '—'}</div>
          <div className="lc-kpi-label">Top Importer</div>
          <div className="lc-kpi-sub">{fmtUsd(topPartners[0]?.value_usd || 0)}</div>
        </div>
        <div className="lc-kpi-card">
          <div className="lc-kpi-val">{(top5sum / total * 100).toFixed(0)}%</div>
          <div className="lc-kpi-label">Top 5 Concentration</div>
          <div className="lc-kpi-sub">{top5.map(p => p.name.split(' ')[0]).join(', ')}</div>
        </div>
      </div>

      {/* ── Row 2: Map + Leaderboard ── */}
      <div className="lc-mid-row">
        {/* Map */}
        <div className="lc-map-col">
          <svg viewBox={`0 0 ${W} ${H}`} className="lc-svg" preserveAspectRatio="xMidYMid meet">
            <defs>
              <pattern id="lc-hatch" width="6" height="6" patternUnits="userSpaceOnUse">
                <path d="M-1,1 l2,-2 M0,6 l6,-6 M5,7 l2,-2" stroke="rgba(0,0,0,0.13)" strokeWidth="1" fill="none"/>
              </pattern>
            </defs>
            <rect width={W} height={H} fill="#f0e8d8"/>
            {COUNTRY_PATHS.map(({ code, d }) => {
              const pd  = partnerData?.[code];
              const t   = pd ? Math.pow(pd.value_usd / maxVal, 0.38) : null;
              const isP = t != null;
              const isSel = selected === code;
              return (
                <g key={code}>
                  <path d={d} fill={fill(code, t)} stroke="#2d1207"
                    strokeWidth={isSel ? 1.4 : 0.3}
                    style={{ cursor: isP ? 'pointer' : 'default' }}
                    onClick={() => isP && pick(code)}/>
                  {isP && <path d={d} fill="url(#lc-hatch)" stroke="none"
                    style={{ pointerEvents: 'none', opacity: isSel ? 0.7 : 0.4 }}/>}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Leaderboard */}
        <div className="lc-leader-col">
          <div className="lc-leader-head">
            {selP
              ? <><span>{selP.name}</span><button className="lc-leader-back" onClick={() => setSelected(null)}>← All</button></>
              : <span>Top Importers</span>}
          </div>
          {selP ? (
            <div className="lc-detail-view">
              <div className="lc-detail-rank">#{selRank} of {topPartners.length}</div>
              <div className="lc-detail-val">{fmtUsd(selP.value_usd)}</div>
              <div className="lc-detail-share">{(selP.value_usd / total * 100).toFixed(2)}% share</div>
              <div className="lc-detail-bar-track">
                <div className="lc-detail-bar" style={{ width: `${selP.value_usd / maxVal * 100}%`, background: `hsl(${HUES[selected % 10]},52%,42%)` }}/>
              </div>
            </div>
          ) : (
            <div className="lc-leader-list">
              {topPartners.slice(0, 15).map((p, i) => {
                const t = p.value_usd / maxVal;
                const isSel = selected === p.code;
                return (
                  <div key={p.code} className={`lc-leader-row${isSel ? ' lc-leader-sel' : ''}`}
                    onClick={() => pick(p.code)}>
                    <span className="lc-leader-rank">{i + 1}</span>
                    <span className="lc-leader-name">{p.name}</span>
                    <div className="lc-leader-track">
                      <div className="lc-leader-bar"
                        style={{ width: `${Math.max(2, t * 100)}%`, background: `hsl(${HUES[p.code % 10]},52%,42%)` }}/>
                    </div>
                    <span className="lc-leader-val">{fmtUsd(p.value_usd)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 3: Horizontal mini bar chart ── */}
      <div className="lc-chart-row">
        <div className="lc-chart-label">Export Distribution — Top 20</div>
        <div className="lc-chart-bars">
          {topPartners.slice(0, 20).map((p, i) => {
            const t = p.value_usd / maxVal;
            const isSel = selected === p.code;
            return (
              <div key={p.code} className={`lc-chart-item${isSel ? ' lc-chart-sel' : ''}`}
                onClick={() => pick(p.code)}>
                <div className="lc-chart-item-name">{p.name.split(' ')[0]}</div>
                <div className="lc-chart-item-track">
                  <div className="lc-chart-item-bar"
                    style={{ width: `${Math.max(2, t * 100)}%`, background: `hsl(${HUES[p.code % 10]},52%,42%)` }}/>
                </div>
                <div className="lc-chart-item-val">{fmtUsd(p.value_usd)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
