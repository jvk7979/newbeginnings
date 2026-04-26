import { useState, useEffect } from 'react';
import { C } from './tokens';
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

const getPageFromHash = () => {
  const hash = window.location.hash.replace(/^#\/?/, '');
  return LINKABLE.includes(hash) ? hash : 'dashboard';
};

export default function App() {
  const [page, setPage] = useState(getPageFromHash);
  const [pageData, setPageData] = useState(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const onHashChange = () => { setPage(getPageFromHash()); setPageData(null); };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (dest, data = null) => {
    setPage(dest); setPageData(data);
    if (LINKABLE.includes(dest)) {
      const h = '#/' + dest;
      if (window.location.hash !== h) window.location.hash = h;
    }
    if (isMobile) setSidebarOpen(false);
  };

  const renderPage = () => {
    switch (page) {
      case 'dashboard':      return <Dashboard onNavigate={navigate} />;
      case 'ideas':          return <IdeasPage onNavigate={navigate} />;
      case 'new-idea':       return <NewIdeaPage onNavigate={navigate} />;
      case 'idea-detail':    return <IdeaDetailPage idea={pageData} onNavigate={navigate} />;
      case 'projects':       return <ProjectsPage onNavigate={navigate} />;
      case 'project-detail': return <ProjectDetailPage project={pageData} onNavigate={navigate} />;
      case 'plans':          return <PlansPage onNavigate={navigate} />;
      case 'plan-detail':    return <PlanDetailPage plan={pageData} onNavigate={navigate} />;
      case 'new-plan':       return <NewPlanPage onNavigate={navigate} />;
      case 'calculator':     return <CalculatorPage />;
      default:               return <Dashboard onNavigate={navigate} />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Desktop sidebar */}
      {!isMobile && (
        <Sidebar currentPage={page} onNavigate={navigate} isMobile={false} isOpen={true} onClose={() => {}} />
      )}
      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <Sidebar currentPage={page} onNavigate={navigate} isMobile={true} isOpen={true} onClose={() => setSidebarOpen(false)} />
      )}
      {/* Mobile hamburger (only when sidebar closed and on a non-bottom-nav-linkable page) */}
      {isMobile && !sidebarOpen && (
        <button onClick={() => setSidebarOpen(true)} aria-label="Open menu"
          style={{ position: 'fixed', top: 12, left: 12, zIndex: 50, width: 36, height: 36, borderRadius: 6, background: C.bg1, border: `1px solid ${C.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke={C.fg2} strokeWidth="1.5" strokeLinecap="round" width="18" height="18">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      )}
      {renderPage()}
      {/* Mobile bottom navigation */}
      {isMobile && <BottomNav currentPage={page} onNavigate={navigate} />}
    </div>
  );
}
