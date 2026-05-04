import { C } from '../../tokens';

export default function DonutChart({ segments, totalLabel }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return (
    <svg viewBox="0 0 100 100" width={120} height={120}>
      <circle cx="50" cy="50" r="38" fill="none" stroke={C.border} strokeWidth="16" />
    </svg>
  );
  if (segments.length === 1) return (
    <svg viewBox="0 0 100 100" width={130} height={130}>
      <circle cx="50" cy="50" r="38" fill="none" stroke={segments[0].color} strokeWidth="16" />
      <text x="50" y="46" textAnchor="middle" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '9px', fill: C.fg3 }}>TOTAL</text>
      <text x="50" y="60" textAnchor="middle" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: 'bold', fill: C.fg1 }}>{totalLabel}</text>
    </svg>
  );
  const R = 38, IR = 22, cx = 50, cy = 50;
  let angle = -Math.PI / 2;
  const arcs = segments.map(seg => {
    const sweep = (seg.value / total) * 2 * Math.PI;
    const cos1 = Math.cos(angle), sin1 = Math.sin(angle);
    const cos2 = Math.cos(angle + sweep), sin2 = Math.sin(angle + sweep);
    const x1 = cx + R * cos1, y1 = cy + R * sin1;
    const x2 = cx + R * cos2, y2 = cy + R * sin2;
    const ix1 = cx + IR * cos1, iy1 = cy + IR * sin1;
    const ix2 = cx + IR * cos2, iy2 = cy + IR * sin2;
    const large = sweep > Math.PI ? 1 : 0;
    const path = `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} L ${ix2.toFixed(2)} ${iy2.toFixed(2)} A ${IR} ${IR} 0 ${large} 0 ${ix1.toFixed(2)} ${iy1.toFixed(2)} Z`;
    angle += sweep;
    return { ...seg, path };
  });
  return (
    <svg viewBox="0 0 100 100" width={130} height={130}>
      {arcs.map((seg, i) => <path key={i} d={seg.path} fill={seg.color} />)}
      <text x="50" y="46" textAnchor="middle" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '9px', fill: C.fg3 }}>TOTAL</text>
      <text x="50" y="60" textAnchor="middle" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: 'bold', fill: C.fg1 }}>{totalLabel}</text>
    </svg>
  );
}
