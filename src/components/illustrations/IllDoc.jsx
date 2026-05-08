// Vintage engraving silhouette — single closed book viewed slightly from
// the front, foil-stamp ornament on the spine. Used for the Documents
// empty-state. Single fill via currentColor.
export default function IllDoc({ size = 40 }) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} aria-hidden="true" fill="currentColor">
      {/* book body */}
      <rect x="22" y="14" width="36" height="52" rx="2" />
      {/* spine band — top */}
      <rect x="22" y="20" width="36" height="1.5" opacity="0.55" fill="#fff"/>
      {/* spine band — bottom */}
      <rect x="22" y="59" width="36" height="1.5" opacity="0.55" fill="#fff"/>
      {/* central ornament panel — recessed */}
      <rect x="32" y="32" width="16" height="20" rx="1" opacity="0.55" fill="#fff"/>
      {/* foil-stamp diamond inside the ornament */}
      <path d="M40 36 L 44 42 L 40 48 L 36 42 Z" opacity="0.85" />
      {/* dot above the diamond */}
      <circle cx="40" cy="34" r="0.8" />
      {/* pages — peeking from the right edge */}
      <rect x="58" y="16" width="2" height="48" opacity="0.7"/>
      <rect x="60" y="17" width="1" height="46" opacity="0.5"/>
    </svg>
  );
}
