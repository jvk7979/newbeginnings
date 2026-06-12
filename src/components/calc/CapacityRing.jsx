// Big SVG ring that lives in the hero band. Reads capacityPct, fills the
// arc proportionally, prints the % in Playfair inside the ring, and
// inscribes three zone labels (Comfortable / Stretched / Overworked)
// along the arc using SVG textPath. The labels make the zones legible
// without a separate legend; they're hidden under reduced-motion-style
// quiet displays, but rendered by default at the standard 92px size.
export default function CapacityRing({ pct, color, track }) {
  const R = 32, cx = 40, cy = 40;
  const circumference = 2 * Math.PI * R;
  const dash = Math.max(0, Math.min(100, pct)) / 100 * circumference;

  // Helper: build an arc path segment that runs clockwise from `aStart`
  // (radians) to `aEnd`, used by textPath so the label follows the ring.
  // We pull the radius outward by 7px so the labels sit just outside the
  // stroke instead of under it.
  const labelR = R + 7;
  const arcPath = (aStart, aEnd) => {
    const x1 = cx + labelR * Math.cos(aStart);
    const y1 = cy + labelR * Math.sin(aStart);
    const x2 = cx + labelR * Math.cos(aEnd);
    const y2 = cy + labelR * Math.sin(aEnd);
    return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${labelR} ${labelR} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  };
  // Twelve o'clock = -π/2. Walk clockwise through the three zones.
  const start = -Math.PI / 2;
  const z1End = start + (Math.PI * 2) * 0.60;   // 0–60 → comfortable
  const z2End = start + (Math.PI * 2) * 0.85;   // 60–85 → stretched
  const z3End = start + (Math.PI * 2) * 1.00;   // 85–100 → overworked

  return (
    <svg viewBox="0 0 80 80" width={92} height={92} role="img" aria-label={`Operating at ${pct}% capacity`}>
      <defs>
        <path id="cap-zone-1" d={arcPath(start, z1End)} />
        <path id="cap-zone-2" d={arcPath(z1End, z2End)} />
        <path id="cap-zone-3" d={arcPath(z2End, z3End)} />
      </defs>
      <circle cx={cx} cy={cy} r={R} fill="none" stroke={track} strokeWidth="6" />
      <circle cx={cx} cy={cy} r={R} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${dash.toFixed(2)} ${circumference.toFixed(2)}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`} />
      <text x={cx} y={cy + 1} textAnchor="middle"
        style={{ fontFamily: "'Inter', Georgia, serif", fontSize: 18, fontWeight: 700, fill: color }}>{pct}%</text>
      <text x={cx} y={cy + 11} textAnchor="middle"
        style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 4.5, letterSpacing: '0.18em', fontWeight: 600, fill: track === '#000' ? '#888' : track }}>CAPACITY</text>
      {/* Inscribed zone labels — small, low-opacity, ride on the outer
          arc. JetBrains Mono so they read as data, not body copy. */}
      <g style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 4.5, fill: 'var(--c-fg3)', letterSpacing: '0.2em', textTransform: 'uppercase' }} opacity="0.55">
        <text>
          <textPath href="#cap-zone-1" startOffset="50%" textAnchor="middle">comfortable</textPath>
        </text>
        <text>
          <textPath href="#cap-zone-2" startOffset="50%" textAnchor="middle">stretched</textPath>
        </text>
        <text>
          <textPath href="#cap-zone-3" startOffset="50%" textAnchor="middle">overworked</textPath>
        </text>
      </g>
    </svg>
  );
}
