// src/pages/Atlas/StatsPanel.jsx
//
// Stats tab for the Atlas right panel. Aggregates the states prop
// (already in memory, no extra fetching) into two views:
//   • Top 5 crops by total production across all states
//   • Production split by category
// Both react to the active filter (category + crop).

import { useMemo } from 'react';
import { CATEGORIES } from './cropData';

const fmt = (v) => {
  if (!v || v === 0) return '—';
  return v >= 1000 ? `${(v / 1000).toFixed(1)} MT` : `${Math.round(v)} KT`;
};

export default function StatsPanel({ filter, states }) {
  const { topCrops, catBreakdown } = useMemo(() => {
    if (!states || Object.keys(states).length === 0)
      return { topCrops: [], catBreakdown: [] };

    const cropMap = {};
    const catMap  = {};

    for (const stateData of Object.values(states)) {
      if (!stateData?.crops) continue;
      const crops = filter.category === 'all'
        ? stateData.crops
        : stateData.crops.filter((c) => c[1] === filter.category);

      for (const c of crops) {
        const name = c[0], cat = c[1], prod = c[2] || 0;
        if (!cropMap[name]) cropMap[name] = { prod: 0, category: cat };
        cropMap[name].prod += prod;
        catMap[cat] = (catMap[cat] || 0) + prod;
      }
    }

    const topCrops = Object.entries(cropMap)
      .sort((a, b) => b[1].prod - a[1].prod)
      .slice(0, 5)
      .map(([name, d]) => ({ name, prod: d.prod, category: d.category }));

    const catBreakdown = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, prod]) => ({
        cat, prod,
        label: CATEGORIES[cat]?.label || cat,
        color: CATEGORIES[cat]?.color || '#aaa',
      }));

    return { topCrops, catBreakdown };
  }, [filter, states]);

  const maxCrop = topCrops[0]?.prod || 1;
  const maxCat  = catBreakdown[0]?.prod || 1;

  return (
    <div className="atlas-stats-panel">

      {/* ── Top crops ──────────────────────────────────── */}
      <div className="atlas-stats-section">
        <div className="atlas-stats-section-label">TOP CROPS BY VOLUME</div>
        {topCrops.length === 0
          ? <div className="atlas-stats-empty">No data for this selection.</div>
          : (
            <div className="atlas-stats-bars">
              {topCrops.map((c) => (
                <div key={c.name} className="atlas-stats-bar-row">
                  <div className="atlas-stats-bar-swatch"
                       style={{ background: CATEGORIES[c.category]?.color || '#aaa' }}/>
                  <div className="atlas-stats-bar-name">{c.name}</div>
                  <div className="atlas-stats-bar-track">
                    <div className="atlas-stats-bar-fill"
                         style={{
                           width: `${(c.prod / maxCrop) * 100}%`,
                           background: CATEGORIES[c.category]?.color || '#aaa',
                         }}/>
                  </div>
                  <div className="atlas-stats-bar-val">{fmt(c.prod)}</div>
                </div>
              ))}
            </div>
          )
        }
      </div>

      {/* ── By category ────────────────────────────────── */}
      <div className="atlas-stats-section">
        <div className="atlas-stats-section-label">BY CATEGORY</div>
        {catBreakdown.length === 0
          ? <div className="atlas-stats-empty">No categories.</div>
          : (
            <div className="atlas-stats-cats">
              {catBreakdown.slice(0, 7).map((c) => (
                <div key={c.cat} className="atlas-stats-cat-row">
                  <div className="atlas-stats-cat-dot" style={{ background: c.color }}/>
                  <div className="atlas-stats-cat-name">{c.label}</div>
                  <div className="atlas-stats-cat-track">
                    <div className="atlas-stats-cat-fill"
                         style={{ width: `${(c.prod / maxCat) * 100}%`, background: c.color }}/>
                  </div>
                  <div className="atlas-stats-cat-val">{fmt(c.prod)}</div>
                </div>
              ))}
            </div>
          )
        }
      </div>

    </div>
  );
}
