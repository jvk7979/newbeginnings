// src/pages/Atlas/RankingPanel.jsx
//
// Ranked-region table — the default right pane of the Crop Atlas. APEDA
// AgriExchange style: every state (or, once drilled into Andhra Pradesh,
// every district) ranked by the active metric, with its share of the
// ranked total and its top crop.
//
// Click a row to open that region's DetailPanel; hover to highlight it on
// the map. The `hover` state lives in index.jsx and is shared with the
// map, so map ↔ table highlighting works both ways.

import { useMemo, useState } from 'react';
import { C } from '../../tokens';
import { CATEGORIES } from './cropData';
import { computeStateMetric, computeDistrictMetric, formatVal } from './geoHelpers';

const METRIC_LABEL = { production: 'Production', area: 'Area', share: 'Share' };
const HOME_DISTRICT = 'Dr. B.R. Ambedkar Konaseema';

export default function RankingPanel({ level, filter, states, apDistricts, hovered, onHover, onSelect }) {
  const isIndia = level === 'india';
  // Default sort: highest value first. Clicking a column header re-sorts.
  const [sort, setSort] = useState({ key: 'value', dir: 'desc' });

  // Districts carry no national-share column, so 'share' falls back to
  // production for them — reflect that in the value column + its label.
  const effectiveMetric = (!isIndia && filter.metric === 'share') ? 'production' : filter.metric;
  const metricLabel = METRIC_LABEL[effectiveMetric] || 'Production';
  // In single-crop mode every row's top crop is the chosen crop — redundant.
  const showTopCrop = !filter.crop;

  // Build the ranked rows for the current filter: metric value, share of
  // the ranked total, and the region's top crop.
  const rows = useMemo(() => {
    const src = isIndia ? states : apDistricts;
    const metricOf = isIndia ? computeStateMetric : computeDistrictMetric;
    const list = Object.keys(src).map((name) => {
      const { value, topCrop } = metricOf(src[name], filter);
      return { name, value: value || 0, topCrop: topCrop ? topCrop[0] : null };
    });
    const total = list.reduce((sum, r) => sum + r.value, 0);
    list.forEach((r) => { r.share = total > 0 ? (r.value / total) * 100 : 0; });
    return list;
  }, [isIndia, filter, states, apDistricts]);

  const sorted = useMemo(() => {
    const { key, dir } = sort;
    const cmp = (a, b) => {
      const d = (key === 'name' || key === 'topCrop')
        ? String(a[key] || '').localeCompare(String(b[key] || ''))
        : (a[key] || 0) - (b[key] || 0);
      return dir === 'asc' ? d : -d;
    };
    return [...rows].sort(cmp);
  }, [rows, sort]);

  const toggleSort = (key) => setSort((s) => (
    s.key === key
      ? { key, dir: s.dir === 'desc' ? 'asc' : 'desc' }
      : { key, dir: (key === 'name' || key === 'topCrop') ? 'asc' : 'desc' }
  ));
  const arrow = (key) => (sort.key === key ? (sort.dir === 'desc' ? ' ▾' : ' ▴') : '');

  const scopeLabel = filter.crop
    || (filter.category === 'all' ? 'All crops' : CATEGORIES[filter.category]?.label || 'All crops');

  // District data (DES) covers food grains only — picking a non-food-grain
  // crop here yields an all-zero table; show an explainer instead.
  const hasData = sorted.some((r) => r.value > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '20px 14px 12px', flexShrink: 0 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.fg3, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          {isIndia ? 'All states · ranked' : 'Andhra Pradesh · districts'}
        </div>
        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, fontWeight: 600, color: C.fg1, lineHeight: 1.15, letterSpacing: '-0.02em', margin: '3px 0 2px' }}>
          {scopeLabel}
        </h2>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3 }}>
          {sorted.length} {isIndia ? 'states' : 'districts'} by {metricLabel.toLowerCase()} · click to inspect
        </div>
      </div>

      {/* Column header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, background: C.bg2, flexShrink: 0 }}>
        <HeadCell width={16}>#</HeadCell>
        <HeadCell flex onClick={() => toggleSort('name')}>{isIndia ? 'STATE' : 'DISTRICT'}{arrow('name')}</HeadCell>
        <HeadCell width={66} align="right" onClick={() => toggleSort('value')}>{metricLabel.toUpperCase()}{arrow('value')}</HeadCell>
        <HeadCell width={42} align="right" onClick={() => toggleSort('share')}>SHARE{arrow('share')}</HeadCell>
        {showTopCrop && <HeadCell width={72} onClick={() => toggleSort('topCrop')}>TOP CROP{arrow('topCrop')}</HeadCell>}
      </div>

      {/* Ranked rows */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {!hasData && (
          <div style={{ padding: '32px 22px', textAlign: 'center' }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg2, lineHeight: 1.5 }}>
              {!isIndia && filter.crop
                ? `${filter.crop} isn't tracked at district level.`
                : 'No data for this selection.'}
            </div>
            {!isIndia && filter.crop && (
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, marginTop: 8, lineHeight: 1.55 }}>
                District figures cover food grains — cereals &amp; pulses — only; DES does not publish {filter.crop.toLowerCase()} by district. Use the all-India view for it.
              </div>
            )}
          </div>
        )}
        {hasData && sorted.map((r, i) => {
          const isHover = hovered === r.name;
          const isHome = r.name === HOME_DISTRICT;   // user's home district
          return (
            <div key={r.name}
                 onClick={() => onSelect?.(r.name)}
                 onMouseEnter={() => onHover?.(r.name)}
                 onMouseLeave={() => onHover?.(null)}
                 style={{
                   display: 'flex', alignItems: 'center', gap: 6,
                   padding: '8px 14px',
                   borderBottom: `1px solid ${C.border}`,
                   borderLeft: `2px solid ${isHome ? 'var(--c-h-gold)' : 'transparent'}`,
                   background: isHover ? C.accentBg : 'transparent',
                   cursor: 'pointer', transition: 'background 100ms',
                 }}>
              <span style={{ width: 16, flexShrink: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.fg3 }}>{i + 1}</span>
              <span style={{ flex: 1, minWidth: 0, fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: C.fg1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</span>
              <span style={{ width: 66, flexShrink: 0, textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg1 }}>{formatVal(r.value, effectiveMetric)}</span>
              <span style={{ width: 42, flexShrink: 0, textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: r.value > 0 ? C.accent : C.fg3 }}>{r.value > 0 ? `${r.share.toFixed(1)}%` : '—'}</span>
              {showTopCrop && (
                <span style={{ width: 72, flexShrink: 0, fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: C.fg3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.topCrop || '—'}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// One sortable column header. `flex` makes it fill remaining width; a fixed
// `width` otherwise. Mirrors the row cell metrics so columns line up.
function HeadCell({ children, width, flex, align, onClick }) {
  return (
    <span onClick={onClick}
          style={{
            width, flex: flex ? 1 : undefined, flexShrink: 0,
            textAlign: align || 'left',
            fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700,
            color: C.fg3, letterSpacing: '0.06em',
            whiteSpace: 'nowrap', overflow: 'hidden',
            cursor: onClick ? 'pointer' : 'default', userSelect: 'none',
          }}>
      {children}
    </span>
  );
}
