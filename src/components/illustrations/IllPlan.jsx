// Vintage engraving silhouette — open ledger / book spread with a ribbon
// bookmark trailing below. Used for the Plans empty-state. Single fill via
// currentColor.
export default function IllPlan({ size = 40 }) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} aria-hidden="true" fill="currentColor">
      {/* book spread — two pages meeting at the spine, slight perspective */}
      <path d="M10 22 L 39 18 L 39 60 L 10 64 Z" />
      <path d="M70 22 L 41 18 L 41 60 L 70 64 Z" />
      {/* spine shadow notch */}
      <rect x="39.4" y="18" width="1.2" height="42" opacity="0.45"/>
      {/* writing lines — left page */}
      <rect x="14" y="28" width="22" height="1" rx="0.5" opacity="0.55"/>
      <rect x="14" y="33" width="20" height="1" rx="0.5" opacity="0.45"/>
      <rect x="14" y="38" width="22" height="1" rx="0.5" opacity="0.45"/>
      <rect x="14" y="43" width="18" height="1" rx="0.5" opacity="0.4"/>
      <rect x="14" y="48" width="20" height="1" rx="0.5" opacity="0.4"/>
      {/* writing lines — right page */}
      <rect x="44" y="28" width="22" height="1" rx="0.5" opacity="0.55"/>
      <rect x="44" y="33" width="20" height="1" rx="0.5" opacity="0.45"/>
      <rect x="44" y="38" width="22" height="1" rx="0.5" opacity="0.45"/>
      <rect x="44" y="43" width="18" height="1" rx="0.5" opacity="0.4"/>
      <rect x="44" y="48" width="20" height="1" rx="0.5" opacity="0.4"/>
      {/* ribbon bookmark trailing from the spine */}
      <path d="M38 30 L 42 30 L 41 73 L 40 71 L 39 73 Z" />
    </svg>
  );
}
