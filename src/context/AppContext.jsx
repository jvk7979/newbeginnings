import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { deleteFileFromDB } from '../utils/fileStorage';
import {
  collection, doc, onSnapshot,
  setDoc, updateDoc, deleteDoc,
  getDocs, writeBatch, getDoc,
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

// All data lives in shared top-level collections — visible to every signed-in family member
const SHARED = { ideas: 'sharedIdeas', projects: 'sharedProjects', plans: 'sharedPlans' };
const sharedCol = (name) => collection(db, SHARED[name]);
const sharedRef = (name, id) => doc(db, SHARED[name], String(id));

// On first ever load, seed shared collections (migrating from per-user storage if present)
async function ensureSharedData(uid) {
  const snap = await getDocs(sharedCol('ideas'));
  if (!snap.empty) return; // shared data already exists

  // Try to migrate data the primary account already saved under users/{uid}/…
  const [uIdeas, uProjects, uPlans] = await Promise.all([
    getDocs(collection(db, 'users', uid, 'ideas')),
    getDocs(collection(db, 'users', uid, 'projects')),
    getDocs(collection(db, 'users', uid, 'plans')),
  ]);

  const lsIdeas    = (() => { try { return JSON.parse(localStorage.getItem('nb_ideas'))    || null; } catch { return null; } })();
  const lsProjects = (() => { try { return JSON.parse(localStorage.getItem('nb_projects')) || null; } catch { return null; } })();
  const lsPlans    = (() => { try { return JSON.parse(localStorage.getItem('nb_plans'))    || null; } catch { return null; } })();

  const ideas    = !uIdeas.empty    ? uIdeas.docs.map(d => d.data())    : lsIdeas    || SEED_IDEAS;
  const projects = !uProjects.empty ? uProjects.docs.map(d => d.data()) : lsProjects || SEED_PROJECTS;
  const plans    = !uPlans.empty    ? uPlans.docs.map(d => d.data())    : lsPlans    || SEED_PLANS;

  const batch = writeBatch(db);
  ideas.forEach(i    => batch.set(sharedRef('ideas',    i.id), i));
  projects.forEach(p => batch.set(sharedRef('projects', p.id), p));
  plans.forEach(p    => batch.set(sharedRef('plans',    p.id), p));
  await batch.commit();

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
  const [files,    setFiles]    = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const loadedCount = useRef(0);

  useEffect(() => {
    if (!user) { setIdeas([]); setProjects([]); setPlans([]); setFiles([]); setDataLoading(false); return; }

    loadedCount.current = 0;
    setDataLoading(true);

    const uid = user.uid;
    ensureSharedData(uid);

    const tick = () => { loadedCount.current++; if (loadedCount.current >= 4) setDataLoading(false); };
    const sort = arr => [...arr].sort((a, b) => Number(b.id) - Number(a.id));

    const timeout = setTimeout(() => setDataLoading(false), 5000);

    const u1 = onSnapshot(sharedCol('ideas'),    s => { setIdeas(sort(s.docs.map(d => d.data())));    tick(); }, () => tick());
    const u2 = onSnapshot(sharedCol('projects'), s => { setProjects(sort(s.docs.map(d => d.data()))); tick(); }, () => tick());
    const u3 = onSnapshot(sharedCol('plans'),    s => { setPlans(sort(s.docs.map(d => d.data())));    tick(); }, () => tick());
    const u4 = onSnapshot(collection(db, 'sharedFiles'), s => { setFiles(sort(s.docs.map(d => d.data()))); tick(); }, () => tick());

    return () => { u1(); u2(); u3(); u4(); clearTimeout(timeout); };
  }, [user]);

  // ── Ideas ────────────────────────────────────────────────────────────────
  const addIdea = useCallback(async (idea) => {
    if (!user) return;
    const item = { ...idea, id: Date.now(), date: todayStr() };
    await setDoc(sharedRef('ideas', item.id), item);
  }, [user]);

  const updateIdea = useCallback(async (id, patch) => {
    if (!user) return;
    await updateDoc(sharedRef('ideas', id), patch);
  }, [user]);

  const deleteIdea = useCallback(async (id) => {
    if (!user) return;
    try {
      const snap = await getDoc(sharedRef('ideas', id));
      const blobId = snap.data()?.attachedFile?.blobId;
      if (blobId) await deleteFileFromDB(blobId);
    } catch { /* ignore — proceed with Firestore delete regardless */ }
    await deleteDoc(sharedRef('ideas', id));
  }, [user]);

  const restoreIdea = useCallback(async (idea) => {
    if (!user) return;
    await setDoc(sharedRef('ideas', idea.id), idea);
  }, [user]);

  // ── Projects ─────────────────────────────────────────────────────────────
  const addProject = useCallback(async (project) => {
    if (!user) return;
    const item = { ...project, id: Date.now(), date: todayStr(), kpis: null };
    await setDoc(sharedRef('projects', item.id), item);
  }, [user]);

  const updateProject = useCallback(async (id, patch) => {
    if (!user) return;
    await updateDoc(sharedRef('projects', id), patch);
  }, [user]);

  const deleteProject = useCallback(async (id) => {
    if (!user) return;
    await deleteDoc(sharedRef('projects', id));
  }, [user]);

  const restoreProject = useCallback(async (project) => {
    if (!user) return;
    await setDoc(sharedRef('projects', project.id), project);
  }, [user]);

  // ── Plans ────────────────────────────────────────────────────────────────
  const addPlan = useCallback(async (plan) => {
    if (!user) return;
    const secs = plan.sections || [];
    const item = { ...plan, id: Date.now(), updated: todayStr(), sectionCount: secs.length };
    await setDoc(sharedRef('plans', item.id), item);
  }, [user]);

  const updatePlan = useCallback(async (id, patch) => {
    if (!user) return;
    const existing = plans.find(p => p.id === id);
    const secs = patch.sections ?? existing?.sections ?? [];
    await setDoc(sharedRef('plans', id), {
      ...existing, ...patch, updated: todayStr(), sectionCount: secs.length,
    });
  }, [user, plans]);

  const deletePlan = useCallback(async (id) => {
    if (!user) return;
    try {
      const snap = await getDoc(sharedRef('plans', id));
      const blobId = snap.data()?.attachedFile?.blobId;
      if (blobId) await deleteFileFromDB(blobId);
    } catch { /* ignore — proceed with Firestore delete regardless */ }
    await deleteDoc(sharedRef('plans', id));
  }, [user]);

  const restorePlan = useCallback(async (plan) => {
    if (!user) return;
    await setDoc(sharedRef('plans', plan.id), plan);
  }, [user]);

  // ── Bulk import ──────────────────────────────────────────────────────────
  const importData = useCallback(async (data) => {
    if (!user) return;
    for (const name of ['ideas', 'projects', 'plans']) {
      const snap = await getDocs(sharedCol(name));
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
    }
    if (Array.isArray(data.ideas) || Array.isArray(data.projects) || Array.isArray(data.plans)) {
      const batch = writeBatch(db);
      (data.ideas    || []).forEach(i => batch.set(sharedRef('ideas',    i.id), i));
      (data.projects || []).forEach(i => batch.set(sharedRef('projects', i.id), i));
      (data.plans    || []).forEach(i => batch.set(sharedRef('plans',    i.id), i));
      await batch.commit();
    }
  }, [user]);

  // ── Shared Files ─────────────────────────────────────────────────────────
  const fileRef = (id) => doc(db, 'sharedFiles', String(id));

  const addFile = useCallback(async (file) => {
    if (!user) return;
    const item = { ...file, id: Date.now(), date: todayStr(), addedBy: user.email || user.uid };
    await setDoc(fileRef(item.id), item);
  }, [user]);

  const updateFile = useCallback(async (id, patch) => {
    if (!user) return;
    await updateDoc(fileRef(id), patch);
  }, [user]);

  const deleteFile = useCallback(async (id) => {
    if (!user) return;
    try {
      const snap = await getDoc(fileRef(id));
      const data = snap.data();
      const blobId = data?.blobId || data?.attachedFile?.blobId;
      if (blobId) await deleteFileFromDB(blobId);
    } catch { /* ignore — proceed with Firestore delete regardless */ }
    await deleteDoc(fileRef(id));
  }, [user]);

  return (
    <AppContext.Provider value={{
      ideas, projects, plans, files, dataLoading,
      addIdea, updateIdea, deleteIdea, restoreIdea,
      addProject, updateProject, deleteProject, restoreProject,
      addPlan, updatePlan, deletePlan, restorePlan,
      addFile, updateFile, deleteFile,
      importData,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppData() { return useContext(AppContext); }
