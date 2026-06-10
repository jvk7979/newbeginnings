// Shared loading-skeleton block. Theme-aware shimmer (CSS in styles.css);
// static under prefers-reduced-motion. Compose several to sketch the
// shape of the content being fetched instead of showing a blank pane.
export default function Skeleton({ width = '100%', height = 16, radius = 8, style }) {
  return (
    <div
      className="skeleton"
      aria-hidden="true"
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}
