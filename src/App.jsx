import { useState, useEffect } from 'react';
import { C } from './tokens';
import { useAuth } from './context/AuthContext';
import { useAppData } from './context/AppContext';
import TopNav from './components/TopNav';
import SignInPage from './pages/SignInPage';
import Dashboard from './pages/Dashboard';
import IdeasPage from './pages/IdeasPage';
import NewIdeaPage from './pages/NewIdeaPage';
import IdeaDetailPage from './pages/IdeaDetailPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import PlansPage from './pages/PlansPage';
import PlanDetailPage from './pages/PlanDetailPage';
import NewPlanPage from './pages/NewPlanPage';
import CalculatorPage from './pages/CalculatorPage';
import FilesPage from './pages/FilesPage';
import FileDetailPage from './pages/FileDetailPage';
import AboutPage from './pages/AboutPage';

const LINKABLE = ['dashboard', 'ideas', 'projects', 'plans', 'calculator', 'files', 'about'];
const DETAIL   = ['idea-detail', 'project-detail', 'plan-detail', 'new-idea', 'new-plan', 'file-detail'];

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
      <svg width="36" height="36" viewBox="0 0 46 46" fill="none">
        <path d="M23 2 C23 2 18 9 23 16 C28 9 23 2 23 2Z" fill={C.accent}/>
        <path d="M4 24 C10 19 16 19 23 24 C30 29 36 29 42 24" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M4 32 C10 27 16 27 23 32 C30 37 36 37 42 32" stroke={C.accent} strokeWidth="1.8" strokeLinecap="round" opacity="0.6"/>
      </svg>
      {label && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3 }}>{label}</div>}
    </div>
  );
}

function NotFound({ label, dest, onNavigate }) {
  return (
    <div className="page-pad" style={{ background: C.bg0 }}>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3, marginTop: 60, textAlign: 'center' }}>
        {label} not found.
        <button onClick={() => onNavigate(dest)} style={{ display: 'block', margin: '12px auto 0', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.accent, background: 'none', border: 'none', cursor: 'pointer' }}>← Go back</button>
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const { ideas, projects, plans, dataLoading } = useAppData();

  const [page,    setPage]    = useState(() => parseHash().page);
  const [itemId,  setItemId]  = useState(() => parseHash().itemId);

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
  if (!user) return <SignInPage />;
  if (dataLoading) return <Spinner label="Loading your data…" />;

  const { files } = useAppData();
  const idea    = ideas.find(i => i.id == itemId);
  const project = projects.find(p => p.id == itemId);
  const plan    = plans.find(p => p.id == itemId);
  const file    = files.find(f => f.id == itemId);

  const renderPage = () => {
    switch (page) {
      case 'dashboard':      return <Dashboard onNavigate={navigate} />;
      case 'ideas':          return <IdeasPage onNavigate={navigate} />;
      case 'new-idea':       return <NewIdeaPage onNavigate={navigate} />;
      case 'idea-detail':
        if (itemId && !idea) return <NotFound label="Idea" dest="ideas" onNavigate={navigate} />;
        return <IdeaDetailPage idea={idea || ideas[0]} onNavigate={navigate} />;
      case 'projects':       return <ProjectsPage onNavigate={navigate} />;
      case 'project-detail':
        if (itemId && !project) return <NotFound label="Project" dest="projects" onNavigate={navigate} />;
        return <ProjectDetailPage project={project || projects[0]} onNavigate={navigate} />;
      case 'plans':          return <PlansPage onNavigate={navigate} />;
      case 'plan-detail':    return <PlanDetailPage plan={plan} onNavigate={navigate} />;
      case 'new-plan':       return <NewPlanPage onNavigate={navigate} />;
      case 'files':          return <FilesPage onNavigate={navigate} />;
      case 'file-detail':
        if (itemId && !file) return <NotFound label="File" dest="files" onNavigate={navigate} />;
        return <FileDetailPage file={file || files[0]} onNavigate={navigate} />;
      case 'about':          return <AboutPage onNavigate={navigate} />;
      case 'calculator':     return <CalculatorPage />;
      default:               return <Dashboard onNavigate={navigate} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <TopNav currentPage={page} onNavigate={navigate} />
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        {renderPage()}
      </div>
    </div>
  );
}
