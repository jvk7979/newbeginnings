// Vintage engraving silhouette — three stacked books on a shelf with a
// small triangle pediment. Reserved for a future library / shelf empty
// state. Single fill via currentColor.
export default function IllLibrary({ size = 40 }) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} aria-hidden="true" fill="currentColor">
      {/* triangle pediment */}
      <path d="M28 14 L 40 6 L 52 14 Z" />
      {/* top book — slightly leaning */}
      <path d="M22 22 L 56 18 L 56 32 L 22 36 Z" />
      <rect x="24" y="25" width="2" height="6" opacity="0.55" fill="#fff"/>
      <rect x="51" y="22" width="2" height="6" opacity="0.55" fill="#fff"/>
      {/* middle book */}
      <rect x="20" y="38" width="40" height="14" rx="0.5" />
      <rect x="22" y="42" width="2" height="6" opacity="0.55" fill="#fff"/>
      <rect x="56" y="42" width="2" height="6" opacity="0.55" fill="#fff"/>
      {/* bottom book */}
      <rect x="18" y="54" width="44" height="14" rx="0.5" />
      <rect x="20" y="58" width="2" height="6" opacity="0.55" fill="#fff"/>
      <rect x="58" y="58" width="2" height="6" opacity="0.55" fill="#fff"/>
      {/* shelf line */}
      <rect x="14" y="69" width="52" height="1.4" rx="0.7"/>
    </svg>
  );
}
