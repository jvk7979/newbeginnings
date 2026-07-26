// Layout A — Split Panel (Godavari redesign)
//
// A single sequential paddy-green choropleth encodes each market's export
// value (darker green = larger importer), India is marked gold as the export
// origin, and a cross-highlighted ranked list sits alongside. Everything is
// theme-token driven, so it repaints for Monsoon (light) / Delta (dark).
//
// Replaces the previous per-country rainbow (HUES[code % 10]) which coloured
// countries by identity rather than value — visually noisy and off-brand.

import { useState, useRef } from 'react';
import { COUNTRY_PATHS, W, H } from './mapGeo';
import { fmtUsd } from './comtradeDataset';

// ISO-numeric code for India — the export origin, painted gold rather than
// treated as a (non-existent) importer of its own goods.
const INDIA_CODE = 356;

// Perceptual value → 0..1 ramp. The <1 exponent lifts the low end so small
// importers stay distinguishable from the land colour instead of washing out.
function ramp(value, max) {
  if (!value || !max) return 0;
  return Math.pow(value / max, 0.45);
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

  const selP    = selected ? partnerData?.[selected] : null;
  const selRank = selected ? topPartners.findIndex(p => p.code === selected) + 1 : null;

  return (
    <div className="la-root">
      {/* ── Map ── */}
      <div className="la-map-col">
        <svg viewBox={`0 0 ${W} ${H}`} className="la-svg" preserveAspectRatio="xMidYMid meet">
          <rect width={W} height={H} className="la-ocean" />
          {/* Keyed by index: some world-atlas features have no `id`, so
              `code` is NaN for several land shapes — index keys stay unique
              (the path list is static and never reorders). */}
          {COUNTRY_PATHS.map(({ code, d }, i) => {
            const pd      = partnerData?.[code];
            const isP     = pd != null;
            const isIndia = code === INDIA_CODE;
            const isSel   = selected === code;
            // Blend from the land colour toward the paddy accent by value —
            // a smooth sequential ramp anchored to the map's own land tone.
            const mix  = isP ? (22 + ramp(pd.value_usd, maxVal) * 78).toFixed(0) : 0;
            const fill = isIndia
              ? 'var(--c-h-gold)'
              : isP
                ? `color-mix(in srgb, var(--c-accent) ${mix}%, var(--c-bg3))`
                : 'var(--c-bg3)';
            return (
              <path key={i} d={d} fill={fill}
                className={`la-country${isSel ? ' la-country-sel' : ''}`}
                style={{ cursor: isP ? 'pointer' : 'default' }}
                onClick={() => isP && pick(code)} />
            );
          })}
        </svg>

        {/* Intensity legend — mirrors the Crop Atlas scale for consistency. */}
        <div className="la-legend">
          <div className="la-legend-title">Export value</div>
          <div className="la-legend-scale" />
          <div className="la-legend-ends"><span>Low</span><span>Top importer</span></div>
          <div className="la-legend-origin"><span className="la-legend-origin-dot" /> India · origin</div>
        </div>

        {/* Selected market card */}
        {selP && (
          <div className="la-map-sel-card">
            <div className="la-map-sel-name">{selP.name}</div>
            <div className="la-map-sel-val">{fmtUsd(selP.value_usd)}</div>
            <div className="la-map-sel-rank">#{selRank} · {(selP.value_usd / total * 100).toFixed(1)}% of total exports</div>
            <button className="la-map-sel-close" onClick={() => setSelected(null)}>✕ Deselect</button>
          </div>
        )}
        <div className="la-map-credit">India Agricultural Exports · FY 2024–25</div>
      </div>

      {/* ── Ranked list ── */}
      <div className="la-list-col">
        <div className="la-list-head">
          <span className="la-list-title">Ranked markets</span>
          <span className="la-list-sub">{topPartners.length} importers · tap to highlight</span>
        </div>
        <div className="la-list-scroll" ref={listRef}>
          {topPartners.map((p, i) => {
            const t     = p.value_usd / maxVal;
            const isSel = selected === p.code;
            const share = total ? (p.value_usd / total * 100) : 0;
            return (
              <div key={p.codeStr ?? p.code} data-code={p.code}
                className={`la-row${isSel ? ' la-row-sel' : ''}`}
                onClick={() => pick(p.code)}>
                <div className="la-row-rank">{String(i + 1).padStart(2, '0')}</div>
                <div className="la-row-body">
                  <div className="la-row-name">{p.name}</div>
                  <div className="la-row-track">
                    <div className="la-row-bar" style={{ width: `${Math.max(2, t * 100)}%` }} />
                  </div>
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
