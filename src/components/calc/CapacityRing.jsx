// Big SVG ring that lives in the hero band. Reads capacityPct, fills the
// arc proportionally, and prints the % in Playfair inside the ring.
export default function CapacityRing({ pct, color, track }) {
  const R = 32, cx = 40, cy = 40;
  const circumference = 2 * Math.PI * R;
  const dash = Math.max(0, Math.min(100, pct)) / 100 * circumference;
  return (
    <svg viewBox="0 0 80 80" width={92} height={92} role="img" aria-label={`Operating at ${pct}% capacity`}>
      <circle cx={cx} cy={cy} r={R} fill="none" stroke={track} strokeWidth="6" />
      <circle cx={cx} cy={cy} r={R} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${dash.toFixed(2)} ${circumference.toFixed(2)}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`} />
      <text x={cx} y={cy + 1} textAnchor="middle"
        style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, fontWeight: 700, fill: color }}>{pct}%</text>
      <text x={cx} y={cy + 11} textAnchor="middle"
        style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 5, letterSpacing: '0.14em', fontWeight: 700, fill: track === '#000' ? '#888' : track }}>CAPACITY</text>
    </svg>
  );
}
