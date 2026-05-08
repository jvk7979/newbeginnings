// Vintage engraving silhouette — coconut palm tree, three drupes at the base.
// Used in the Ideas empty-state. Echoes the Godavari hero photo and the
// closing-banner palm flourish on the dashboard. Single fill via
// currentColor so the parent badge controls the colour.
export default function IllIdea({ size = 40 }) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} aria-hidden="true" fill="currentColor">
      {/* trunk — gentle curve, narrows toward the top */}
      <path d="M40.6 70 C 40.4 60, 39.8 48, 39.2 36 C 38.9 30, 38.6 24, 39.0 18 C 39.5 12, 40.2 11, 40.5 11 C 40.8 11, 41.2 12, 41.4 18 C 41.6 24, 41.4 30, 41.6 36 C 42.0 48, 42.2 60, 42.0 70 Z" />
      {/* trunk segments — ring scars */}
      <ellipse cx="40.5" cy="32" rx="1.6" ry="0.5" opacity="0.55"/>
      <ellipse cx="40.5" cy="44" rx="1.8" ry="0.5" opacity="0.55"/>
      <ellipse cx="40.5" cy="56" rx="1.9" ry="0.5" opacity="0.55"/>
      {/* crown — six fronds radiating from the top */}
      <path d="M40 16 C 32 14, 22 11, 12 8 C 18 14, 28 18, 38 19 Z"/>
      <path d="M41 16 C 49 14, 59 11, 69 8 C 63 14, 53 18, 43 19 Z"/>
      <path d="M40 17 C 34 17, 24 18, 14 22 C 22 22, 32 21, 39 20 Z"/>
      <path d="M41 17 C 47 17, 57 18, 67 22 C 59 22, 49 21, 42 20 Z"/>
      <path d="M40 14 C 36 10, 30 4, 24 0 C 30 6, 35 11, 39 16 Z"/>
      <path d="M41 14 C 45 10, 51 4, 57 0 C 51 6, 46 11, 42 16 Z"/>
      {/* three coconuts at base of crown */}
      <ellipse cx="36" cy="20" rx="2.2" ry="2.6"/>
      <ellipse cx="40.5" cy="21" rx="2.2" ry="2.6"/>
      <ellipse cx="45" cy="20" rx="2.2" ry="2.6"/>
      {/* ground line — subtle decorative anchor */}
      <rect x="28" y="71" width="25" height="1.2" rx="0.6"/>
    </svg>
  );
}
