import { useState, useEffect, lazy, Suspense, Component } from 'react';
import { C } from './tokens';
import logoImg from './assets/logo.png';
import { useAuth } from './context/AuthContext';
import { useIdeas, usePlans, useFiles, useBackup } from './context/AppContext';
import SideNav from './components/SideNav';
import SignInPage from './pages/SignInPage';
import Footer from './components/Footer';
import CommandPalette from './components/CommandPalette';

// Code-split every authenticated page so initial JS only contains the
// sign-in flow + chrome. Each page becomes its own chunk fetched on first
// navigation; subsequent visits use the HTTP cache. Cuts initial JS by
// roughly 60% and means pdfjs / mammoth / Gemini SDK only load when their
// owning page is visited.
const Dashboard       = lazy(() => import('./pages/Dashboard'));
const IdeasPage       = lazy(() => import('./pages/IdeasPage'));
const NewIdeaPage     = lazy(() => import('./pages/NewIdeaPage'));
const IdeaDetailPage  = lazy(() => import('./pages/IdeaDetailPage'));
const PlansPage       = lazy(() => import('./pages/PlansPage'));
const PlanDetailPage  = lazy(() => import('./pages/PlanDetailPage'));
const NewPlanPage     = lazy(() => import('./pages/NewPlanPage'));
const FilesPage       = lazy(() => import('./pages/FilesPage'));
const FileDetailPage  = lazy(() => import('./pages/FileDetailPage'));
const AboutPage       = lazy(() => import('./pages/AboutPage'));
const AccessPage      = lazy(() => import('./pages/AccessPage'));
const CalculationsPage = lazy(() => import('./pages/CalculationsPage'));

const LINKABLE = ['dashboard', 'ideas', 'plans', 'documents', 'about', 'access', 'calculations'];
const DETAIL   = ['idea-detail', 'plan-detail', 'new-idea', 'new-plan', 'document-detail'];

const parseHash = () => {
  const hash = window.location.hash.replace(/^#\/?/, '');
  const [page, idStr] = hash.split('/');
  const id = idStr ? parseInt(idStr) : null;
  if (LINKABLE.includes(page)) return { page, itemId: null };
  if (DETAIL.includes(page))   return { page, itemId: id };
  return { page: 'dashboard', itemId: null };
};

function Spinner({ label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: C.bg0, gap: 16 }}>
      <img src={logoImg} alt="The New Beginnings" style={{ height: 200, width: 'auto', opacity: 0.9 }} />
      {label && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.fg3 }}>{label}</div>}
    </div>
  );
}

// Detects the family of errors thrown when Vite fails to fetch a lazy
// chunk. We hit this whenever a user has a stale `index.html` cached
// (GitHub Pages serves the HTML with a CDN cache window) and tries to
// load a chunk whose contenthash filename only existed in the previous
// deploy. Patterns observed across browsers:
//   - "Failed to fetch dynamically imported module: <url>" (Vite/Chrome)
//   - "error loading dynamically imported module" (Safari)
//   - "Loading chunk N failed" (older bundlers, kept defensively)
//   - "ChunkLoadError" (error.name on Webpack-style errors)
const isChunkLoadError = (err) => {
  const msg  = String(err?.message || '');
  const name = String(err?.name    || '');
  return name === 'ChunkLoadError'
      || /failed to fetch dynamically imported module/i.test(msg)
      || /error loading dynamically imported module/i.test(msg)
      || /loading chunk \S+ failed/i.test(msg)
      || /importing a module script failed/i.test(msg);
};

// Force a full page reload that bypasses any cached HTML. Adding a
// one-shot query param invalidates the GitHub Pages CDN cache key for
// this request and guarantees the browser fetches a fresh `index.html`
// referencing the chunk hashes that actually exist on the current deploy.
const RELOAD_FLAG = 'nb_chunk_reload';
function bustCacheAndReload() {
  try { sessionStorage.setItem(RELOAD_FLAG, '1'); } catch { /* private mode */ }
  const url = new URL(window.location.href);
  url.searchParams.set('_v', String(Date.now()));
  window.location.replace(url.toString());
}

// Catches lazy-chunk load failures (network blip, stale deploy, etc.) and
// any other render-time error. Without this, a thrown error inside
// <Suspense> unmounts the entire tree and the user sees a blank page that
// doesn't recover even after navigation.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, autoReloading: false };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
    // First chunk error in this tab → silently reload with cache-bust.
    // Subsequent chunk errors in the same tab fall through to the manual
    // UI so we can't get stuck in a reload loop on a genuinely broken
    // deploy. The flag lives in sessionStorage so it resets per tab.
    if (isChunkLoadError(error)) {
      let alreadyTried = false;
      try { alreadyTried = sessionStorage.getItem(RELOAD_FLAG) === '1'; } catch { /* */ }
      if (!alreadyTried) {
        this.setState({ autoReloading: true });
        bustCacheAndReload();
      }
    }
  }
  componentDidMount() {
    // Auto-reset on URL change so the user can navigate away from a
    // broken state without a manual page reload.
    this._onHash = () => { if (this.state.error) this.setState({ error: null }); };
    window.addEventListener('hashchange', this._onHash);
  }
  componentWillUnmount() {
    window.removeEventListener('hashchange', this._onHash);
  }
  render() {
    if (this.state.error) {
      // While the auto-reload is in flight render the spinner instead of
      // flashing the error UI for a beat — looks like a normal page load.
      if (this.state.autoReloading) return <Spinner label="Updating to the latest version…" />;
      const chunkErr = isChunkLoadError(this.state.error);
      return (
        <div className="page-pad" style={{ background: C.bg0 }}>
          <div style={{ maxWidth: 520, margin: '60px auto', textAlign: 'center', fontFamily: "'DM Sans', sans-serif" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: C.fg1, marginBottom: 8 }}>
              {chunkErr ? 'Couldn’t load this page' : 'Something went wrong'}
            </div>
            <div style={{ fontSize: 15, color: C.fg3, lineHeight: 1.6, marginBottom: 20 }}>
              {chunkErr
                ? 'A new version is available but didn’t finish loading. Tap reload to fetch it.'
                : 'An unexpected error occurred. Reloading should clear it.'}
            </div>
            <button onClick={bustCacheAndReload}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, padding: '9px 22px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}>
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}


function NotFound({ label, dest, onNavigate }) {
  return (
    <div className="page-pad" style={{ background: C.bg0 }}>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: C.fg3, marginTop: 60, textAlign: 'center' }}>
        {label} not found.
        <button onClick={() => onNavigate(dest)} style={{ display: 'block', margin: '12px auto 0', fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.accent, background: 'none', border: 'none', cursor: 'pointer' }}>← Go back</button>
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const { ideas } = useIdeas();
  const { plans } = usePlans();
  const { files } = useFiles();
  const { dataLoading } = useBackup();

  const [page,   setPage]   = useState(() => parseHash().page);
  const [itemId, setItemId] = useState(() => parseHash().itemId);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const onHashChange = () => {
      const { page: p, itemId: id } = parseHash();
      setPage(p); setItemId(id);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Cmd/Ctrl+K toggles the command palette globally. Ignored while typing
  // in inputs/textareas/contenteditables — the palette has its own input.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setPaletteOpen(o => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Successful render in a tab means chunks did load. Drop the per-tab
  // chunk-reload flag so a *future* legitimate chunk error in the same
  // tab gets its own one-shot auto-reload instead of being gated by an
  // old flag.
  useEffect(() => {
    try {
      if (sessionStorage.getItem(RELOAD_FLAG) === '1') {
        sessionStorage.removeItem(RELOAD_FLAG);
      }
    } catch { /* private mode */ }
  }, []);

  const navigate = (dest, data = null) => {
    const id = data?.id || null;
    setPage(dest); setItemId(id);
    const newHash = id ? `#/${dest}/${id}` : `#/${dest}`;
    if (window.location.hash !== newHash) window.location.hash = newHash;
  };

  // Redirect non-admins away from the access page (e.g. cached URL).
  useEffect(() => {
    if (!authLoading && user && !isAdmin && page === 'access') {
      navigate('dashboard');
    }
  }, [authLoading, user, isAdmin, page]);

  const e2e = import.meta.env.DEV && new URLSearchParams(window.location.search).get('e2e') === '1';
  if (authLoading && !e2e) return <Spinner />;
  if (!user && !e2e)       return <SignInPage />;
  if (dataLoading && !e2e) return <Spinner label="Loading your workspace…" />;

  const idea = ideas.find(i => i.id == itemId);
  const plan = plans.find(p => p.id == itemId);
  const file = files.find(f => f.id == itemId);

  const renderPage = () => {
    switch (page) {
      case 'dashboard':      return <Dashboard onNavigate={navigate} />;
      case 'ideas':          return <IdeasPage onNavigate={navigate} />;
      case 'new-idea':       return <NewIdeaPage onNavigate={navigate} />;
      case 'idea-detail':
        if (!itemId || !idea) return <NotFound label="Idea" dest="ideas" onNavigate={navigate} />;
        return <IdeaDetailPage key={idea.id} idea={idea} onNavigate={navigate} />;
      case 'plans':          return <PlansPage onNavigate={navigate} />;
      case 'plan-detail':
        if (!itemId || !plan) return <NotFound label="Business plan" dest="plans" onNavigate={navigate} />;
        return <PlanDetailPage key={plan.id} plan={plan} onNavigate={navigate} />;
      case 'new-plan':       return <NewPlanPage onNavigate={navigate} />;
      case 'documents':      return <FilesPage onNavigate={navigate} />;
      case 'document-detail':
        if (!itemId || !file) return <NotFound label="Document" dest="documents" onNavigate={navigate} />;
        return <FileDetailPage key={file.id} file={file} onNavigate={navigate} />;
      case 'about':          return <AboutPage onNavigate={navigate} />;
      case 'access':         return <AccessPage onNavigate={navigate} />;
      case 'calculations':   return <CalculationsPage onNavigate={navigate} />;
      default:               return <Dashboard onNavigate={navigate} />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <SideNav currentPage={page} onNavigate={navigate} />
      <div className="main-with-sidebar" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', minWidth: 0 }}>
          <ErrorBoundary>
            <Suspense fallback={<Spinner />}>
              {renderPage()}
            </Suspense>
          </ErrorBoundary>
        </div>
        <Footer />
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onNavigate={navigate} />
    </div>
  );
}
