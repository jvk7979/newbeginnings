import { C } from '../../tokens';

// Mini-charts used in the headline metric band. 100x28 by default; purely
// decorative (the underlying data is the same calc.rows the projection table
// uses).

// Sparkline with a soft area fill underneath. Used for Revenue/EBITDA where
// the year-over-year shape tells you whether the project ramps or fades.
export function Sparkline({ values, color, width = 100, height = 28 }) {
  if (!values || values.length < 2) return null;
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0.001);
  const range = max - min || 1;
  const stepX = width / (values.length - 1);
  const pts = values.map((v, i) => {
    const x = (i * stepX).toFixed(1);
    const y = (height - ((v - min) / range) * (height - 2) - 1).toFixed(1);
    return `${x},${y}`;
  });
  const lastX = (width).toFixed(1);
  const areaPath = `M 0,${height} L ${pts.join(' L ')} L ${lastX},${height} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" style={{ display: 'block' }}>
      <path d={areaPath} fill={color} fillOpacity="0.14" />
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1].split(',')[0]} cy={pts[pts.length - 1].split(',')[1]} r="2" fill={color} />
    </svg>
  );
}

// Centered NPV bar — extends right (positive) or left (negative) from the
// midline, scaled relative to capex. Magnitude AND sign in one glance.
export function NPVBar({ value, scale, color, width = 100, height = 14 }) {
  if (!isFinite(value)) return null;
  const half = width / 2;
  const safeScale = Math.max(Math.abs(scale) || 1, Math.abs(value) || 1);
  const ratio = Math.max(-1, Math.min(1, value / safeScale));
  const barWidth = Math.abs(ratio) * (half - 2);
  const positive = value >= 0;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" style={{ display: 'block' }}>
      <line x1={half} y1="0" x2={half} y2={height} stroke={C.fg3} strokeWidth="1" strokeDasharray="2,2" />
      <rect
        x={positive ? half : half - barWidth}
        y="3"
        width={barWidth}
        height={height - 6}
        fill={color}
        rx="1.5"
      />
    </svg>
  );
}

// Payback track — tenure-length axis with year-tick marks and a dot at
// the payback year.
export function PaybackTrack({ payback, tenure, color, width = 100, height = 14 }) {
  const ticks = Math.max(1, tenure);
  const usable = width - 2;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" style={{ display: 'block' }}>
      <line x1="1" y1={height / 2} x2={width - 1} y2={height / 2} stroke={C.border} strokeWidth="1" />
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const tx = (i / ticks) * usable + 1;
        return <line key={i} x1={tx} y1={height / 2 - 2.5} x2={tx} y2={height / 2 + 2.5} stroke={C.fg3} strokeWidth="1" />;
      })}
      {payback !== null && payback <= ticks && (
        <circle
          cx={Math.max(0, Math.min(1, payback / ticks)) * usable + 1}
          cy={height / 2}
          r="3.5"
          fill={color}
          stroke="#fff"
          strokeWidth="1.5" />
      )}
    </svg>
  );
}
