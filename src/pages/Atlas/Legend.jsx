// src/pages/Atlas/Legend.jsx
//
// Slim horizontal legend strip — sits directly below the map (not floating
// over the landmass). One row: the metric/crop/year label, the low→high
// production colour ramp, and a region count.
import { C } from '../../tokens';
import { intensityColor } from './geoHelpers';

const STOPS = [0, 0.2, 0.4, 0.6, 0.8, 1.0];

export default function Legend({ filter, view, year }) {
  const metricLabel = filter.metric === 'area' ? 'Sown area' : 'Production';
  // When a crop is picked the map is recoloured by it; otherwise the
  // legend reflects the all-crops aggregate.
  const cropLabel = filter.crop || 'All crops';
  // The legend names the financial year being shown. Once drilled into AP
  // districts the data is always DES 2024-25 (district drill-down still
  // uses DES), so the district view names that fixed year; the India view
  // names the chosen year.
  const yearLabel = view.level === 'state' ? '2024-25' : year;

  return (
    <div className="atlas-legend-strip" style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '0 16px', height: 40,
      background: C.bg1,
      borderTop: `1px solid ${C.border}`,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Metric / crop / year label — may ellipsis on a very narrow strip */}
      <div className="atlas-legend-label" style={{
        fontSize: 10, color: C.fg3, letterSpacing: '0.1em',
        textTransform: 'uppercase', fontWeight: 600,
        whiteSpace: 'nowrap', flexShrink: 1,
        overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {metricLabel} · {cropLabel} · {yearLabel}
      </div>

      {/* Colour ramp with low/high captions, flexes to fill the strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 80 }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.fg3, flexShrink: 0 }}>
          low
        </span>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 60, borderRadius: 4, overflow: 'hidden', border: `1px solid ${C.border}` }}>
          {STOPS.map((t, i) => (
            <div key={i} style={{
              flex: 1, height: 10,
              background: intensityColor(t),
            }}/>
          ))}
        </div>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.fg3, flexShrink: 0 }}>
          high
        </span>
      </div>

      {/* Region count — hidden on narrow strips where space is tight */}
      <div className="atlas-legend-count" style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
        color: C.fg3, letterSpacing: '0.04em',
        whiteSpace: 'nowrap', flexShrink: 0,
      }}>
        {view.level === 'india' ? '28 states' : '26 districts'}
      </div>
    </div>
  );
}
