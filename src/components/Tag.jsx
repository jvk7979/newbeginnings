import { C, alpha } from '../tokens';

export default function Tag({ label, accent }) {
  return (
    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: '3px 9px', borderRadius: 999, background: accent ? C.accentBg : C.bg2, color: accent ? C.accent : C.fg2, border: `1px solid ${accent ? alpha(C.accent, 33) : C.border}` }}>
      {label}
    </span>
  );
}
