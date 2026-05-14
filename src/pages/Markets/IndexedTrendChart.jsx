import { C } from '../../tokens';
import { colorFor } from './commodityColors';
import { sortHistory } from './marketsMath';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Multi-commodity normalised line chart. Each commodity's prices within the
// window are scaled 0→1 by that commodity's own min/max, so commodities with
// very different price ranges (₹0.95 husk vs ₹11,850 copra) share one band.
export default function IndexedTrendChart({ commodities, weeks }) {
  const W = 720, H = 280, padL = 8, padR = 8, padT = 12, padB = 28;
  const now = Date.now();
  const cutoff = weeks ? now - weeks * WEEK_MS : 0;

  // Per-commodity: window-filtered, sorted, normalised series with >= 2 points.
  const series = commodities.map(c => {
    const pts = sortHistory(c.history).filter(p => (p.ts || 0) >= cutoff);
    if (pts.length < 2) return null;
    const prices = pts.map(p => p.price);
    const min = Math.min(...prices), max = Math.max(...prices);
    return { id: c.id, name: c.name, color: colorFor(c.color), pts, min, span: (max - min) || 1 };
  }).filter(Boolean);

  if (series.length === 0) {
    return (
      <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3, fontStyle: 'italic' }}>
        Not enough price history in this window yet — add more weekly prices.
      </div>
    );
  }

  // Shared time axis across all series.
  const allTs = series.flatMap(s => s.pts.map(p => p.ts || 0));
  const tMin = Math.min(...allTs);
  const tMax = Math.max(...allTs);
  const tSpan = (tMax - tMin) || 1;

  const xOf = (ts) => padL + ((ts - tMin) / tSpan) * (W - padL - padR);
  const yOf = (norm) => padT + (1 - norm) * (H - padT - padB);
  const fmtDate = (ts) => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', height: 'auto' }}>
        {/* Y gridlines at 0 / 0.5 / 1 of the normalised band */}
        {[0, 0.5, 1].map(g => (
          <line key={g} x1={padL} x2={W - padR} y1={yOf(g)} y2={yOf(g)} stroke={C.border} strokeWidth="1" />
        ))}
        {series.map(s => {
          const d = s.pts
            .map((p, i) => `${i === 0 ? 'M' : 'L'}${xOf(p.ts || 0).toFixed(1)},${yOf((p.price - s.min) / s.span).toFixed(1)}`)
            .join(' ');
          const last = s.pts[s.pts.length - 1];
          return (
            <g key={s.id}>
              <path d={d} fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx={xOf(last.ts || 0)} cy={yOf((last.price - s.min) / s.span)} r="3" fill={s.color} />
            </g>
          );
        })}
        <text x={padL} y={H - 8} fontFamily="'JetBrains Mono', monospace" fontSize="10" fill={C.fg3}>{fmtDate(tMin)}</text>
        <text x={W - padR} y={H - 8} fontFamily="'JetBrains Mono', monospace" fontSize="10" fill={C.fg3} textAnchor="end">{fmtDate(tMax)}</text>
      </svg>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 10 }}>
        {series.map(s => (
          <span key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg2 }}>
            <span style={{ width: 12, height: 3, borderRadius: 2, background: s.color }} />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}
