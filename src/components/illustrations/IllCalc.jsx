// Vintage engraving silhouette — old-school balance scale, perfectly
// level. Used for the Calculations "no eligible projects" empty-state.
// Single fill via currentColor.
export default function IllCalc({ size = 40 }) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} aria-hidden="true" fill="currentColor">
      {/* central post */}
      <rect x="39" y="20" width="2" height="40" />
      {/* base — wider trapezoid */}
      <path d="M28 64 L 52 64 L 56 68 L 24 68 Z" />
      {/* finial cap on top of post */}
      <circle cx="40" cy="18" r="2.2" />
      {/* horizontal beam */}
      <rect x="14" y="22.5" width="52" height="2.2" rx="1" />
      {/* left chains — two strands */}
      <line x1="18" y1="25" x2="14" y2="36" stroke="currentColor" strokeWidth="0.9"/>
      <line x1="22" y1="25" x2="26" y2="36" stroke="currentColor" strokeWidth="0.9"/>
      {/* right chains — two strands */}
      <line x1="58" y1="25" x2="54" y2="36" stroke="currentColor" strokeWidth="0.9"/>
      <line x1="62" y1="25" x2="66" y2="36" stroke="currentColor" strokeWidth="0.9"/>
      {/* left pan — shallow bowl */}
      <path d="M11 36 L 29 36 L 24 42 L 16 42 Z" />
      {/* right pan — shallow bowl */}
      <path d="M51 36 L 69 36 L 64 42 L 56 42 Z" />
    </svg>
  );
}
