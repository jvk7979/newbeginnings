import Skeleton from './Skeleton';

// Shown inside the page area while a page's code is downloading (the
// Suspense fallback in App.jsx). It sketches a page header and a few cards
// instead of the old full-screen logo splash, and only fades in after
// ~120ms, so fast loads never flash it at all.
export default function RouteLoading() {
  return (
    <div className="route-loading" role="status" aria-label="Loading page">
      <Skeleton width={90} height={10} />
      <Skeleton width={260} height={30} />
      <Skeleton width="min(480px, 80%)" height={14} />
      <div className="route-loading-grid">
        {[0, 1, 2].map(i => <Skeleton key={i} height={132} radius={12} />)}
      </div>
    </div>
  );
}
