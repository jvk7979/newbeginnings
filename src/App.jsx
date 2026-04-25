import { useState } from 'react';
import Sidebar from './components/Sidebar';
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

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [pageData, setPageData] = useState(null);

  const navigate = (dest, data = null) => { setPage(dest); setPageData(data); };

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
      <Sidebar currentPage={page} onNavigate={navigate} />
      {renderPage()}
    </div>
  );
}
