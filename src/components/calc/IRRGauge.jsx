import { C } from '../../tokens';

// Semicircular gauge with red/yellow/green ranges. Each zone is a fixed
// third of the dial (red 0..hurdle, amber hurdle..2×, green 2×..3×) so the
// coloured ranges stay locked in place — only the needle moves. Values
// above 3× hurdle peg the needle at the right.
export default function IRRGauge({ value, hurdle }) {
  const W = 180, H = 100;
  const cx = W / 2;
  const cy = H - 10;
  const R = 64;
  const stroke = 12;

  const safeHurdle = Math.max(1, hurdle);
  const max = safeHurdle * 3;

  const pt = (ratio) => {
    const angle = Math.PI * (1 - Math.max(0, Math.min(1, ratio)));
    return [cx + R * Math.cos(angle), cy - R * Math.sin(angle)];
  };
  const seg = (a, b) => {
    const [x1, y1] = pt(a);
    const [x2, y2] = pt(b);
    return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  };

  const r1 = 1 / 3;
  const r2 = 2 / 3;

  const valRatio = value === null ? 0 : Math.max(0, Math.min(1, value / max));
  const needleAngle = Math.PI * (1 - valRatio);
  const needleR = R - stroke / 2 - 4;
  const nx = cx + needleR * Math.cos(needleAngle);
  const ny = cy - needleR * Math.sin(needleAngle);

  // valRatio = 0 → -90deg (left), 0.5 → 0deg (up), 1 → +90deg (right).
  const needleDeg = (valRatio - 0.5) * 180;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', maxWidth: W }} role="img" aria-label={`IRR gauge`}>
      <path d={seg(0, r1)}  fill="none" stroke="#d96b5b" strokeWidth={stroke} />
      <path d={seg(r1, r2)} fill="none" stroke="#e6b34a" strokeWidth={stroke} />
      <path d={seg(r2, 1)}  fill="none" stroke="#5c8a52" strokeWidth={stroke} />
      {value !== null && (
        <g
          style={{
            transform: `rotate(${needleDeg}deg)`,
            transformOrigin: `${cx}px ${cy}px`,
            transition: 'transform 480ms cubic-bezier(0.34, 1.4, 0.64, 1)',
          }}>
          <line x1={cx} y1={cy} x2={cx} y2={cy - needleR} stroke="#3a3528" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )}
      <circle cx={cx} cy={cy} r="7" fill="#3a3528" />
      <circle cx={cx} cy={cy} r="3" fill="#fff" />
      <text x={cx - R} y={cy + 14} textAnchor="middle" fontFamily="'DM Sans', sans-serif" fontSize="10" fill={C.fg3}>0</text>
      <text x={cx + R} y={cy + 14} textAnchor="middle" fontFamily="'DM Sans', sans-serif" fontSize="10" fill={C.fg3}>{Math.round(max)}%+</text>
      {(() => {
        const a = Math.PI * (1 - r1);
        const tx1 = cx + (R - stroke / 2 - 1) * Math.cos(a);
        const ty1 = cy - (R - stroke / 2 - 1) * Math.sin(a);
        const tx2 = cx + (R + stroke / 2 + 4) * Math.cos(a);
        const ty2 = cy - (R + stroke / 2 + 4) * Math.sin(a);
        return (
          <g>
            <line x1={tx1} y1={ty1} x2={tx2} y2={ty2} stroke={C.fg2} strokeWidth="1.2" />
            <text x={tx2 + 2} y={ty2 - 4} textAnchor="middle" fontFamily="'DM Sans', sans-serif" fontSize="9" fill={C.fg3}>hurdle</text>
          </g>
        );
      })()}
    </svg>
  );
}
