// src/pages/Atlas/Legend.jsx
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
    <div style={{
      position: 'absolute', bottom: 18, left: 18,
      background: 'rgba(253,250,242,0.94)',
      border: `1px solid ${C.border}`, borderRadius: 10,
      padding: '12px 16px', backdropFilter: 'blur(8px)',
      boxShadow: '0 8px 24px rgba(45,42,38,0.12)',
      maxWidth: 420,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: C.fg3, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700 }}>
          {metricLabel} · {cropLabel} · {yearLabel}
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.fg3, letterSpacing: '0.04em' }}>
          {view.level === 'india' ? '28 states' : '26 districts'}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {STOPS.map((t, i) => (
          <div key={i} style={{
            flex: 1, height: 12,
            background: intensityColor(t),
            borderRight: i === STOPS.length - 1 ? 'none' : `1px solid ${C.bg0}`,
          }}/>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.fg3 }}>low</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.fg3 }}>high</span>
      </div>
    </div>
  );
}
