// src/pages/Atlas/RankingPanel.jsx
//
// Default right pane of the Atlas tab — an editorial ranking: every
// state (or, drilled into Andhra Pradesh, every district) as a card,
// ranked by the active metric, showing its top crop and a magnitude
// bar. Click a card to open that region's chapter (DetailPanel); hover
// to highlight it on the map.

import { useMemo } from 'react';
import { CATEGORIES } from './cropData';
import { computeStateMetric, computeDistrictMetric, formatVal } from './geoHelpers';

const HOME_DISTRICT = 'Dr. B.R. Ambedkar Konaseema';

export default function RankingPanel({ level, filter, states, apDistricts, hovered, onHover, onSelect }) {
  const isIndia = level === 'india';
  // Districts carry no national-share column, so 'share' falls back to
  // production for them.
  const effectiveMetric = (!isIndia && filter.metric === 'share') ? 'production' : filter.metric;

  // Build + rank the rows for the current filter, highest value first.
  const rows = useMemo(() => {
    const src = isIndia ? states : apDistricts;
    const metricOf = isIndia ? computeStateMetric : computeDistrictMetric;
    return Object.keys(src)
      .map((name) => {
        const { value, topCrop } = metricOf(src[name], filter);
        return { name, value: value || 0, topCrop };
      })
      .sort((a, b) => b.value - a.value);
  }, [isIndia, filter, states, apDistricts]);

  const ranked = rows.filter((r) => r.value > 0);
  const max = ranked[0]?.value || 1;

  const scope = filter.crop
    || (filter.category && filter.category !== 'all'
        ? (CATEGORIES[filter.category]?.label || 'all crops')
        : 'all crops');
  const metricWord = effectiveMetric === 'area' ? 'area' : 'production';
  const unit = isIndia ? 'states' : 'districts';

  return (
    <div className="rank-pane">
      <div className="rank-head">
        <div className="rk-eyebrow">Ranking · {String(scope).toUpperCase()}</div>
        <h2 className="rk-title">
          Top {unit} for <span className="it">{String(scope).toLowerCase()}</span>
        </h2>
        <div className="rk-sub">
          {ranked.length > 0
            ? `${ranked.length} ${unit} ranked by ${metricWord}. Click a row to open the chapter.`
            : 'No data for this selection.'}
        </div>
      </div>

      <div className="rank-list">
        {ranked.length === 0 && (
          <div className="rank-empty">
            {!isIndia && filter.crop
              ? `${filter.crop} isn't tracked at district level — district figures cover food grains only.`
              : 'Nothing to rank for this selection.'}
          </div>
        )}
        {ranked.map((r, i) => {
          const tc = r.topCrop;
          const w = Math.max(3, (r.value / max) * 100);
          return (
            <button key={r.name} type="button"
              className={`rank-card${hovered === r.name ? ' hover' : ''}${r.name === HOME_DISTRICT ? ' home' : ''}`}
              onClick={() => onSelect?.(r.name)}
              onMouseEnter={() => onHover?.(r.name)}
              onMouseLeave={() => onHover?.(null)}>
              <span className="rk-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="rk-body">
                <span className="rk-name">{r.name}</span>
                {tc && (
                  <span className="rk-crop">
                    {String(tc[0]).toUpperCase()} · {String(tc[1]).toUpperCase()}
                  </span>
                )}
              </span>
              <span className="rk-val">{formatVal(r.value, effectiveMetric)}</span>
              <span className="rk-bar"><span style={{ width: `${w}%` }}/></span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
