import { useState, useEffect } from 'react';
import { C } from './tokens';
import logoImg from './assets/logo.png';
import { useAuth } from './context/AuthContext';
import { useAppData } from './context/AppContext';
import SideNav from './components/SideNav';
import SignInPage from './pages/SignInPage';
import Dashboard from './pages/Dashboard';
import IdeasPage from './pages/IdeasPage';
import NewIdeaPage from './pages/NewIdeaPage';
import IdeaDetailPage from './pages/IdeaDetailPage';
import PlansPage from './pages/PlansPage';
import PlanDetailPage from './pages/PlanDetailPage';
import NewPlanPage from './pages/NewPlanPage';
import FilesPage from './pages/FilesPage';
import FileDetailPage from './pages/FileDetailPage';
import AboutPage from './pages/AboutPage';
import Footer from './components/Footer';

const LINKABLE = ['dashboard', 'ideas', 'plans', 'documents', 'about'];
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
  const { ideas, plans, files, dataLoading } = useAppData();

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
      default:               return <Dashboard onNavigate={navigate} />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <SideNav currentPage={page} onNavigate={navigate} />
      <div className="main-with-sidebar" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', minWidth: 0 }}>
          {renderPage()}
        </div>
        <Footer />
      </div>
    </div>
  );
}
