import { createContext, useContext, useState, useCallback } from 'react';

const SEED_IDEAS = [
  { id: 1, title: 'Integrated Coconut Processing Plant', status: 'validating', date: 'Apr 20, 2026', tags: ['₹2 Crore', 'Manufacturing', 'Agri-Processing'], desc: 'Three-product-line plant: cocopeat, coir fiber, shell charcoal. Year 1 revenue ₹2.86 Cr at 60% capacity. IRR 28–32%, payback under 3 years.' },
  { id: 2, title: 'Coco Peat Manufacturing Unit', status: 'draft', date: 'Mar 18, 2026', tags: ['₹50–60 Lakh', 'Coir Board', 'Konaseema'], desc: 'Loose pith + grow bags focused unit. Kadiyam nurseries (15 km) as anchor buyer. Subsidy stack: CITUS 25% + AP MSME 4.0 up to 35%.' },
  { id: 3, title: 'Virgin Coconut Oil (VCO) Unit', status: 'draft', date: 'Apr 10, 2026', tags: ['Phase 2', 'High Margin', 'FMCG'], desc: 'Cold-press VCO unit. ₹25–30 lakh add-on. Retail price ₹400–1,200/litre. Indian VCO market growing at 9.3% CAGR.' },
  { id: 4, title: 'Coconut Shell Charcoal Export', status: 'validating', date: 'Apr 15, 2026', tags: ['Export', 'High Margin'], desc: 'Shell charcoal ₹35–88/kg domestic, $536/MT export. Activated carbon manufacturers as buyers.' },
  { id: 5, title: 'Poha / Rice Flakes Mill', status: 'draft', date: 'Apr 22, 2026', tags: ['Alternative', 'Godavari Paddy'], desc: 'Godavari paddy-fed alternative at same ₹50–60L budget. Better risk-adjusted returns than marginal coco peat unit.' },
];

const SEED_PROJECTS = [
  { id: 1, title: 'Coconut Processing Plant', status: 'active', date: 'Apr 20, 2026', desc: 'Feasibility complete. Konaseema site evaluation ongoing. Subsidy applications being prepared for Coir Board CITUS + AP MSME 4.0.', kpis: [{ value: '28–32%', label: 'IRR' }, { value: '<3 Yrs', label: 'Payback' }, { value: '₹2.86 Cr', label: 'Yr1 Rev' }] },
  { id: 2, title: 'Coco Peat Unit (Small Scale)', status: 'progress', date: 'Apr 25, 2026', desc: 'Vendor quotes collected. Husk supply agreement with Konaseema cooperative at ₹1.50/piece. Machine shortlist: decorticator + retting pits.', kpis: null },
  { id: 3, title: 'Poha Mill — Initial Scoping', status: 'draft', date: 'Mar 2026', desc: 'Alternative at ₹50–60L budget. Better risk-adjusted returns than marginal coco peat unit per feasibility advisor.', kpis: [{ value: '₹55 L', label: 'Capex' }, { value: '6–8%', label: 'IRR Est.' }] },
];

const SEED_PLANS = [
  {
    id: 1, title: 'Coconut Processing Plant — Feasibility Report', updated: 'Apr 20, 2026', sectionCount: 4, status: 'active',
    summary: '₹2 crore integrated plant: cocopeat, coir fiber, shell charcoal. Year 1 revenue ₹2.86 Cr at 60% capacity. IRR 28–32%. Subsidy: ₹50–90 lakh from AP + Coir Board + CDB.',
    sections: [
      { title: 'Executive Summary', content: 'A ₹2 crore integrated coconut processing plant in Rajahmundry is financially robust: Year 1 revenue of ₹2.86 crore at 60% capacity, IRR 28–32%, break-even at 22% utilisation. Government subsidies of ₹50–90 lakh available from AP State, Coir Board, and Coconut Development Board.' },
      { title: 'Location & Raw Material Advantage', content: 'East Godavari produces 720 million coconuts annually — 45% of AP total output. Konaseema husks cost Rs.0.60-1.50/piece, the cheapest in India. Kadiyam nursery cluster (600-800 nurseries, the largest in India) is 15 km away — a captive grow-bag buyer.' },
      { title: 'Product Mix', content: 'Three revenue streams from a single raw material: Cocopeat (₹6–16/kg loose, ₹65–150/piece grow bags), Coir Fiber (₹15–30/kg, mattress grade ₹25–40/kg), Shell Charcoal (₹35–88/kg domestic, $536/MT export). Grow bags carry 3–4× the margin of loose peat.' },
      { title: 'Financials & Subsidies', content: 'Total capex: ₹2 crore. Effective capex after subsidies: ₹1.10–1.50 crore. Payback: under 3 years. Coir Board CITUS: 25% subsidy. AP MSME 4.0: 25–35% subsidy. Phase 2 additions: VCO unit (₹25–30 lakh) and shell powder grinding (₹5–7 lakh).' },
    ],
  },
  {
    id: 2, title: 'Coco Peat Unit — Viability Analysis', updated: 'Mar 30, 2026', sectionCount: 3, status: 'draft',
    summary: '₹50–60 lakh small-scale unit. Marginal case EBITDA near break-even. Works only with grow bag mix, subsidy stack, and Kadiyam anchor buyers. 8–10 yr payback without subsidies.',
    sections: [
      { title: 'Executive Summary', content: 'A ₹50–60 lakh small-scale coco peat unit is a marginal opportunity. EBITDA is near break-even without subsidies. The case only works with a grow-bag focused mix, full subsidy stack, and Kadiyam nursery buyers locked in advance.' },
      { title: 'Market & Buyers', content: 'Kadiyam cluster (600–800 nurseries, 15 km away) is the natural anchor buyer. Grow bags at ₹65–150/piece carry 3–4× the margin of loose peat. Without this buyer, unit economics do not work.' },
      { title: 'Recommendation', content: 'Pursue only if Kadiyam buyer MoU is secured first. Otherwise the risk-adjusted return is inferior to the Poha Mill alternative at the same budget. CITUS and AP MSME subsidies are essential — apply before committing capital.' },
    ],
  },
];

function load(key, fallback) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}
function todayStr() {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [ideas, setIdeas] = useState(() => load('nb_ideas', SEED_IDEAS));
  const [projects, setProjects] = useState(() => load('nb_projects', SEED_PROJECTS));
  const [plans, setPlans] = useState(() => load('nb_plans', SEED_PLANS));

  const addIdea = useCallback((idea) => {
    const next = [{ ...idea, id: Date.now(), date: todayStr() }, ...ideas];
    setIdeas(next); save('nb_ideas', next);
  }, [ideas]);

  const updateIdea = useCallback((id, patch) => {
    const next = ideas.map(i => i.id === id ? { ...i, ...patch } : i);
    setIdeas(next); save('nb_ideas', next);
  }, [ideas]);

  const deleteIdea = useCallback((id) => {
    const next = ideas.filter(i => i.id !== id);
    setIdeas(next); save('nb_ideas', next);
  }, [ideas]);

  const addProject = useCallback((project) => {
    const next = [{ ...project, id: Date.now(), date: todayStr(), kpis: null }, ...projects];
    setProjects(next); save('nb_projects', next);
  }, [projects]);

  const updateProject = useCallback((id, patch) => {
    const next = projects.map(p => p.id === id ? { ...p, ...patch } : p);
    setProjects(next); save('nb_projects', next);
  }, [projects]);

  const deleteProject = useCallback((id) => {
    const next = projects.filter(p => p.id !== id);
    setProjects(next); save('nb_projects', next);
  }, [projects]);

  const addPlan = useCallback((plan) => {
    const secs = plan.sections || [];
    const next = [{ ...plan, id: Date.now(), updated: todayStr(), sectionCount: secs.length }, ...plans];
    setPlans(next); save('nb_plans', next);
  }, [plans]);

  const updatePlan = useCallback((id, patch) => {
    const secs = patch.sections ?? plans.find(p => p.id === id)?.sections ?? [];
    const next = plans.map(p => p.id === id ? { ...p, ...patch, updated: todayStr(), sectionCount: secs.length } : p);
    setPlans(next); save('nb_plans', next);
  }, [plans]);

  const deletePlan = useCallback((id) => {
    const next = plans.filter(p => p.id !== id);
    setPlans(next); save('nb_plans', next);
  }, [plans]);

  return (
    <AppContext.Provider value={{ ideas, projects, plans, addIdea, updateIdea, deleteIdea, addProject, updateProject, deleteProject, addPlan, updatePlan, deletePlan }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppData() { return useContext(AppContext); }
