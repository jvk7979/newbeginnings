import { Navigate, Route, Routes } from 'react-router-dom';
import { useMemo, useState } from 'react';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import { IdeasPage, NewIdeaPage } from './pages/IdeasPage';
import ProjectsPage from './pages/ProjectsPage';
import { PlanDetailPage, PlansPage } from './pages/PlansPage';

const initialIdeas = [
  { id: 1, title: 'AI-Powered Meal Planner', status: 'draft', date: 'Apr 25, 2026', tags: ['SaaS', 'B2C', 'Early Stage'], desc: 'Personalized weekly meal plans from pantry inventory and dietary goals. Integrates with grocery delivery APIs.' },
  { id: 2, title: 'Freelance Contract Generator', status: 'validating', date: 'Mar 18, 2026', tags: ['B2B', 'Legal-Tech'], desc: 'Auto-generate client contracts from a simple form. Export to PDF. Stripe payment for templates.' },
  { id: 3, title: 'Micro-SaaS Idea Tracker', status: 'active', date: 'Apr 22, 2026', tags: ['Meta', 'Personal'], desc: 'Track all my SaaS ideas, notes, and validation status.' },
];

const projects = [
  { id: 1, title: 'Freelance Invoice Tool', status: 'active', date: 'Updated Mar 12, 2026', desc: 'MVP shipped Feb 2026. Stripe-integrated. 47 paying users.', kpis: [{ value: '$3.2K', label: 'MRR' }, { value: '47', label: 'Users' }, { value: '↑ 18%', label: 'Growth' }] },
  { id: 2, title: 'Portfolio Site Redesign', status: 'progress', date: 'Updated Apr 20, 2026', desc: 'Redesigning personal site with Astro. New case studies section in progress.', kpis: null },
];

const plans = [
  {
    id: 1,
    title: 'Freelance Invoice Tool — Business Plan',
    updated: 'Mar 30, 2026',
    status: 'active',
    summary: 'Micro-SaaS targeting freelancers and solopreneurs with Stripe-integrated invoicing.',
    sections: [
      { title: 'Executive Summary', content: 'A simple, powerful invoicing tool for freelancers. Target MRR: $10K within 12 months.' },
      { title: 'Problem & Market', content: 'Freelancers spend hours on invoicing using generic tools and ad hoc workflows.' },
      { title: 'Revenue Model', content: '$9/month subscription, annual plan $80/year, freemium on-ramp.' },
    ],
  },
  {
    id: 2,
    title: 'AI Meal Planner — Draft Plan',
    updated: 'Apr 20, 2026',
    status: 'draft',
    summary: 'Early-stage plan targeting health-conscious adults with personalized meal planning.',
    sections: [
      { title: 'Target Users', content: 'Busy professionals and parents looking for meal automation.' },
      { title: 'MVP Scope', content: 'Pantry-aware recommendations + grocery list generation.' },
    ],
  },
];

function App() {
  const [ideas, setIdeas] = useState(initialIdeas);

  const addIdea = (form) => {
    const idea = {
      id: Date.now(),
      title: form.title.trim(),
      status: form.status,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      desc: form.desc,
    };
    setIdeas((prev) => [idea, ...prev]);
  };

  const layoutStyle = useMemo(() => ({ display: 'flex', minHeight: '100vh', background: '#0D0C0A' }), []);

  return (
    <div style={layoutStyle}>
      <Sidebar />
      <main style={{ flex: 1, minWidth: 0 }}>
        <Routes>
          <Route path="/" element={<DashboardPage ideas={ideas} projects={projects} />} />
          <Route path="/ideas" element={<IdeasPage ideas={ideas} />} />
          <Route path="/ideas/new" element={<NewIdeaPage onAddIdea={addIdea} />} />
          <Route path="/projects" element={<ProjectsPage projects={projects} />} />
          <Route path="/plans" element={<PlansPage plans={plans} />} />
          <Route path="/plans/:planId" element={<PlanDetailPage plans={plans} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
