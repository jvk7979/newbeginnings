import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import {
  collection, doc, onSnapshot,
  setDoc, updateDoc, deleteDoc,
  getDocs, writeBatch,
} from 'firebase/firestore';

// ── Seed data ──────────────────────────────────────────────────────────────
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
  { id: 1, title: 'Coconut Processing Plant — Feasibility Report', updated: 'Apr 20, 2026', sectionCount: 4, status: 'active', summary: '₹2 crore integrated plant: cocopeat, coir fiber, shell charcoal. Year 1 revenue ₹2.86 Cr at 60% capacity. IRR 28–32%. Subsidy: ₹50–90 lakh from AP + Coir Board + CDB.', sections: [{ title: 'Executive Summary', content: 'A ₹2 crore integrated coconut processing plant in Rajahmundry is financially robust: Year 1 revenue of ₹2.86 crore at 60% capacity, IRR 28–32%, break-even at 22% utilisation.' }, { title: 'Location & Raw Material Advantage', content: 'East Godavari produces 720 million coconuts annually — 45% of AP total output. Konaseema husks cost Rs.0.60-1.50/piece. Kadiyam nursery cluster (600-800 nurseries) is 15 km away.' }, { title: 'Product Mix', content: 'Three revenue streams: Cocopeat (₹6–16/kg loose, ₹65–150/piece grow bags), Coir Fiber (₹15–30/kg), Shell Charcoal (₹35–88/kg domestic, $536/MT export).' }, { title: 'Financials & Subsidies', content: 'Total capex: ₹2 crore. Effective capex after subsidies: ₹1.10–1.50 crore. Payback: under 3 years. Coir Board CITUS: 25%. AP MSME 4.0: 25–35%.' }] },
  { id: 2, title: 'Coco Peat Unit — Viability Analysis', updated: 'Mar 30, 2026', sectionCount: 3, status: 'draft', summary: '₹50–60 lakh small-scale unit. Marginal case EBITDA near break-even. Works only with grow bag mix, subsidy stack, and Kadiyam anchor buyers.', sections: [{ title: 'Executive Summary', content: 'A ₹50–60 lakh small-scale coco peat unit is a marginal opportunity. EBITDA is near break-even without subsidies. Works only with grow-bag focused mix, full subsidy stack, and Kadiyam nursery buyers locked in advance.' }, { title: 'Market & Buyers', content: 'Kadiyam cluster (600–800 nurseries, 15 km away). Grow bags at ₹65–150/piece carry 3–4× the margin of loose peat.' }, { title: 'Recommendation', content: 'Pursue only if Kadiyam buyer MoU is secured first. CITUS and AP MSME subsidies are essential — apply before committing capital.' }] },
];

function todayStr() {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const col = (uid, name) => collection(db, 'users', uid, name);
const ref = (uid, name, id) => doc(db, 'users', uid, name, String(id));

// Write seed + any existing localStorage data to Firestore on first sign-in
async function initializeUser(uid) {
  const snap = await getDocs(col(uid, 'ideas'));
  if (!snap.empty) return; // already has data

  const lsIdeas    = (() => { try { return JSON.parse(localStorage.getItem('nb_ideas'))    || SEED_IDEAS;    } catch { return SEED_IDEAS;    } })();
  const lsProjects = (() => { try { return JSON.parse(localStorage.getItem('nb_projects')) || SEED_PROJECTS; } catch { return SEED_PROJECTS; } })();
  const lsPlans    = (() => { try { return JSON.parse(localStorage.getItem('nb_plans'))    || SEED_PLANS;    } catch { return SEED_PLANS;    } })();

  const batch = writeBatch(db);
  lsIdeas.forEach(i    => batch.set(ref(uid, 'ideas',    i.id), i));
  lsProjects.forEach(p => batch.set(ref(uid, 'projects', p.id), p));
  lsPlans.forEach(p    => batch.set(ref(uid, 'plans',    p.id), p));
  await batch.commit();

  // Clear localStorage after migration
  localStorage.removeItem('nb_ideas');
  localStorage.removeItem('nb_projects');
  localStorage.removeItem('nb_plans');
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { user } = useAuth();
  const [ideas,    setIdeas]    = useState([]);
  const [projects, setProjects] = useState([]);
  const [plans,    setPlans]    = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const loadedCount = useRef(0);

  useEffect(() => {
    if (!user) { setIdeas([]); setProjects([]); setPlans([]); setDataLoading(false); return; }

    loadedCount.current = 0;
    setDataLoading(true);

    const uid = user.uid;
    initializeUser(uid);

    const tick = () => { loadedCount.current++; if (loadedCount.current >= 3) setDataLoading(false); };
    const sort = arr => [...arr].sort((a, b) => Number(b.id) - Number(a.id));

    // Safety timeout — if Firestore doesn't respond in 5s, unblock the UI
    const timeout = setTimeout(() => setDataLoading(false), 5000);

    const u1 = onSnapshot(col(uid, 'ideas'),    s => { setIdeas(sort(s.docs.map(d => d.data())));    tick(); }, () => tick());
    const u2 = onSnapshot(col(uid, 'projects'), s => { setProjects(sort(s.docs.map(d => d.data()))); tick(); }, () => tick());
    const u3 = onSnapshot(col(uid, 'plans'),    s => { setPlans(sort(s.docs.map(d => d.data())));    tick(); }, () => tick());

    return () => { u1(); u2(); u3(); clearTimeout(timeout); };
  }, [user]);

  // ── Ideas ────────────────────────────────────────────────────────────────
  const addIdea = useCallback(async (idea) => {
    if (!user) return;
    const item = { ...idea, id: Date.now(), date: todayStr() };
    await setDoc(ref(user.uid, 'ideas', item.id), item);
  }, [user]);

  const updateIdea = useCallback(async (id, patch) => {
    if (!user) return;
    await updateDoc(ref(user.uid, 'ideas', id), patch);
  }, [user]);

  const deleteIdea = useCallback(async (id) => {
    if (!user) return;
    await deleteDoc(ref(user.uid, 'ideas', id));
  }, [user]);

  const restoreIdea = useCallback(async (idea) => {
    if (!user) return;
    await setDoc(ref(user.uid, 'ideas', idea.id), idea);
  }, [user]);

  // ── Projects ─────────────────────────────────────────────────────────────
  const addProject = useCallback(async (project) => {
    if (!user) return;
    const item = { ...project, id: Date.now(), date: todayStr(), kpis: null };
    await setDoc(ref(user.uid, 'projects', item.id), item);
  }, [user]);

  const updateProject = useCallback(async (id, patch) => {
    if (!user) return;
    await updateDoc(ref(user.uid, 'projects', id), patch);
  }, [user]);

  const deleteProject = useCallback(async (id) => {
    if (!user) return;
    await deleteDoc(ref(user.uid, 'projects', id));
  }, [user]);

  const restoreProject = useCallback(async (project) => {
    if (!user) return;
    await setDoc(ref(user.uid, 'projects', project.id), project);
  }, [user]);

  // ── Plans ────────────────────────────────────────────────────────────────
  const addPlan = useCallback(async (plan) => {
    if (!user) return;
    const secs = plan.sections || [];
    const item = { ...plan, id: Date.now(), updated: todayStr(), sectionCount: secs.length };
    await setDoc(ref(user.uid, 'plans', item.id), item);
  }, [user]);

  const updatePlan = useCallback(async (id, patch) => {
    if (!user) return;
    const existing = plans.find(p => p.id === id);
    const secs = patch.sections ?? existing?.sections ?? [];
    await setDoc(ref(user.uid, 'plans', id), {
      ...existing, ...patch, updated: todayStr(), sectionCount: secs.length,
    });
  }, [user, plans]);

  const deletePlan = useCallback(async (id) => {
    if (!user) return;
    await deleteDoc(ref(user.uid, 'plans', id));
  }, [user]);

  const restorePlan = useCallback(async (plan) => {
    if (!user) return;
    await setDoc(ref(user.uid, 'plans', plan.id), plan);
  }, [user]);

  // ── Bulk ─────────────────────────────────────────────────────────────────
  const importData = useCallback(async (data) => {
    if (!user) return;
    const uid = user.uid;
    for (const name of ['ideas', 'projects', 'plans']) {
      const snap = await getDocs(col(uid, name));
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
    }
    if (Array.isArray(data.ideas) || Array.isArray(data.projects) || Array.isArray(data.plans)) {
      const batch = writeBatch(db);
      (data.ideas    || []).forEach(i => batch.set(ref(uid, 'ideas',    i.id), i));
      (data.projects || []).forEach(i => batch.set(ref(uid, 'projects', i.id), i));
      (data.plans    || []).forEach(i => batch.set(ref(uid, 'plans',    i.id), i));
      await batch.commit();
    }
  }, [user]);

  return (
    <AppContext.Provider value={{
      ideas, projects, plans, dataLoading,
      addIdea, updateIdea, deleteIdea, restoreIdea,
      addProject, updateProject, deleteProject, restoreProject,
      addPlan, updatePlan, deletePlan, restorePlan,
      importData,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppData() { return useContext(AppContext); }
