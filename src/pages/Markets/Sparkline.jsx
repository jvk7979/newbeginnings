import { sortHistory } from './marketsMath';

// A tiny inline-SVG line chart drawn from a commodity's price history.
// Renders nothing meaningful below 2 points — callers should guard on
// history length and show an "awaiting price" state instead.
export default function Sparkline({ history, color, width = 240, height = 56 }) {
  const sorted = sortHistory(history);
  if (sorted.length < 2) return <div style={{ height }} />;

  const prices = sorted.map(e => e.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = max - min || 1;
  const pad = 4;

  const pts = sorted.map((e, i) => {
    const x = pad + (i / (sorted.length - 1)) * (width - pad * 2);
    const y = pad + (1 - (e.price - min) / span) * (height - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const lastX = width - pad;
  const lastY = pad + (1 - (prices[prices.length - 1] - min) / span) * (height - pad * 2);

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none" aria-hidden="true" style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="3" fill={color} />
    </svg>
  );
}
