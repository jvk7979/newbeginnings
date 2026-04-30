import { useState, useEffect, lazy, Suspense, Component } from 'react';
import { C } from './tokens';
import logoImg from './assets/logo.png';
import { useAuth } from './context/AuthContext';
import { useIdeas, usePlans, useFiles, useBackup } from './context/AppContext';
import SideNav from './components/SideNav';
import SignInPage from './pages/SignInPage';
import Footer from './components/Footer';

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

const LINKABLE = ['dashboard', 'ideas', 'plans', 'documents', 'about', 'access'];
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

// Catches lazy-chunk load failures (network blip, stale deploy, etc.) and
// any other render-time error. Without this, a thrown error inside
// <Suspense> unmounts the entire tree and the user sees a blank page that
// doesn't recover even after navigation.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
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
      const isChunkErr = /chunk|loading|dynamic import|fetch/i.test(String(this.state.error?.message));
      return (
        <div className="page-pad" style={{ background: C.bg0 }}>
          <div style={{ maxWidth: 520, margin: '60px auto', textAlign: 'center', fontFamily: "'DM Sans', sans-serif" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: C.fg1, marginBottom: 8 }}>
              {isChunkErr ? 'Couldn’t load this page' : 'Something went wrong'}
            </div>
            <div style={{ fontSize: 15, color: C.fg3, lineHeight: 1.6, marginBottom: 20 }}>
              {isChunkErr
                ? 'The latest update couldn’t finish loading — usually a one-tap reload fixes it.'
                : 'An unexpected error occurred. Reloading should clear it.'}
            </div>
            <button onClick={() => window.location.reload()}
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
  const { user, loading: authLoading } = useAuth();
  const { ideas } = useIdeas();
  const { plans } = usePlans();
  const { files } = useFiles();
  const { dataLoading } = useBackup();

  const [page,   setPage]   = useState(() => parseHash().page);
  const [itemId, setItemId] = useState(() => parseHash().itemId);

  useEffect(() => {
    const onHashChange = () => {
      const { page: p, itemId: id } = parseHash();
      setPage(p); setItemId(id);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (dest, data = null) => {
    const id = data?.id || null;
    setPage(dest); setItemId(id);
    const newHash = id ? `#/${dest}/${id}` : `#/${dest}`;
    if (window.location.hash !== newHash) window.location.hash = newHash;
  };

  if (authLoading) return <Spinner />;
  if (!user)       return <SignInPage />;
  if (dataLoading) return <Spinner label="Loading your workspace…" />;

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
    </div>
  );
}
