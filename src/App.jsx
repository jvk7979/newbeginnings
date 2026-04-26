import { useState, useEffect } from 'react';
import { C } from './tokens';
import { useAppData } from './context/AppContext';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
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

const LINKABLE = ['dashboard', 'ideas', 'projects', 'plans', 'calculator'];
const DETAIL   = ['idea-detail', 'project-detail', 'plan-detail', 'new-idea', 'new-plan'];

const parseHash = () => {
  const hash = window.location.hash.replace(/^#\/?/, '');
  const [page, idStr] = hash.split('/');
  const id = idStr ? parseInt(idStr) : null;
  if (LINKABLE.includes(page)) return { page, itemId: null };
  if (DETAIL.includes(page))   return { page, itemId: id };
  return { page: 'dashboard', itemId: null };
};

function NotFound({ label, dest, onNavigate }) {
  return (
    <div className="page-pad" style={{ background: C.bg0 }}>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3, marginTop: 60, textAlign: 'center' }}>
        {label} not found.
        <button onClick={() => onNavigate(dest)} style={{ display: 'block', margin: '12px auto 0', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.accent, background: 'none', border: 'none', cursor: 'pointer' }}>
          ← Go back
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const { ideas, projects, plans } = useAppData();
  const [page,    setPage]    = useState(() => parseHash().page);
  const [itemId,  setItemId]  = useState(() => parseHash().itemId);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      const { page: p, itemId: id } = parseHash();
      setPage(p);
      setItemId(id);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (dest, data = null) => {
    const id = data?.id || null;
    setPage(dest);
    setItemId(id);

    let newHash;
    if (LINKABLE.includes(dest)) {
      newHash = '#/' + dest;
    } else if (id) {
      newHash = '#/' + dest + '/' + id;
    } else {
      newHash = '#/' + dest;
    }
    if (window.location.hash !== newHash) window.location.hash = newHash;
    if (isMobile) setSidebarOpen(false);
  };

  const renderPage = () => {
    const idea    = ideas.find(i => i.id == itemId);
    const project = projects.find(p => p.id == itemId);
    const plan    = plans.find(p => p.id == itemId);

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
      case 'calculator':     return <CalculatorPage />;
      default:               return <Dashboard onNavigate={navigate} />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {!isMobile && (
        <Sidebar currentPage={page} onNavigate={navigate} isMobile={false} isOpen={true} onClose={() => {}} />
      )}
      {isMobile && sidebarOpen && (
        <Sidebar currentPage={page} onNavigate={navigate} isMobile={true} isOpen={true} onClose={() => setSidebarOpen(false)} />
      )}
      {isMobile && !sidebarOpen && (
        <button onClick={() => setSidebarOpen(true)} aria-label="Open menu"
          style={{ position: 'fixed', top: 12, left: 12, zIndex: 50, width: 36, height: 36, borderRadius: 6, background: C.bg1, border: `1px solid ${C.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke={C.fg2} strokeWidth="1.5" strokeLinecap="round" width="18" height="18">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      )}
      {renderPage()}
      {isMobile && <BottomNav currentPage={page} onNavigate={navigate} />}
    </div>
  );
}
