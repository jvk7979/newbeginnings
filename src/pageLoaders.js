// Page chunk loaders — one place that knows how to fetch each page's code.
//
// App.jsx wraps these in React.lazy. The sidebar / bottom bar call
// prefetchPage() on hover, focus or touch so the chunk is usually already
// downloaded by the time the click lands, and the route opens instantly
// instead of flashing a loading screen. Import promises are cached, so a
// prefetch followed by the real navigation only downloads once.
const loaders = {
  dashboard:        () => import('./pages/Dashboard'),
  ideas:            () => import('./pages/IdeasPage'),
  'new-idea':       () => import('./pages/NewIdeaPage'),
  'idea-detail':    () => import('./pages/IdeaDetailPage'),
  projects:         () => import('./pages/PlansPage'),
  'project-detail': () => import('./pages/PlanDetailPage'),
  'new-project':    () => import('./pages/NewPlanPage'),
  about:            () => import('./pages/AboutPage'),
  access:           () => import('./pages/AccessPage'),
  calculations:     () => import('./pages/CalculationsPage'),
  scenarios:        () => import('./pages/ScenariosPage'),
  settings:         () => import('./pages/SettingsPage'),
  research:         () => import('./pages/ResearchVault'),
  markets:          () => import('./pages/Markets'),
  'commodity-detail': () => import('./pages/Markets/CommodityDetailPage'),
  suppliers:        () => import('./pages/SuppliersPage'),
  portfolio:        () => import('./pages/PortfolioPage'),
  atlas:            () => import('./pages/Atlas'),
  'world-market':   () => import('./pages/WorldMarket'),
  'world-market-concepts': () => import('./pages/WorldMarket/ConceptsPage'),
};

const started = new Map();

export function loadPage(id) {
  const fn = loaders[id];
  if (!fn) return Promise.resolve(null);
  if (!started.has(id)) {
    // If a prefetch fails (offline blip), forget it so the real navigation
    // retries instead of reusing a rejected promise.
    const p = fn().catch(err => { started.delete(id); throw err; });
    started.set(id, p);
  }
  return started.get(id);
}

/** Fire-and-forget warm-up; never throws. */
export function prefetchPage(id) {
  loadPage(id)?.catch?.(() => {});
}

// The pages people open most, warmed quietly once the app is idle.
const WARM_ON_IDLE = ['dashboard', 'ideas', 'projects', 'calculations', 'markets', 'idea-detail', 'project-detail'];

export function warmCommonPages() {
  const run = () => WARM_ON_IDLE.forEach(prefetchPage);
  if (typeof window === 'undefined') return;
  // Respect data-saver connections.
  if (navigator.connection?.saveData) return;
  if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 4000 });
  else setTimeout(run, 2500);
}
