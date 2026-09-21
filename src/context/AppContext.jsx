import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { deleteFileFromDB } from '../utils/fileStorage';
import { validateBackup, planImport, chunk, BACKUP_COLLECTIONS } from '../utils/backup.js';
import { seedDecision } from '../utils/seeding.js';
import {
  onSnapshot, setDoc, updateDoc, deleteDoc,
  getDocs, writeBatch, getDoc,
} from 'firebase/firestore';
import {
  ideasCol, ideaRef, projectsCol, projectRef, plansCol, planRef,
  commoditiesCol, commodityRef, suppliersCol, supplierRef,
  legacyUserIdeasCol, legacyUserProjectsCol, legacyUserPlansCol,
  activityRef, appSeedMarkerRef,
} from '../data/paths.js';

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

// Starter commodities seeded on first load — each carries one initial price
// point so the Markets overview grid renders meaningfully from day one.
// IDs are deterministic (slug of name) — previously Date.now() + i meant two
// tabs racing through `ensureCommoditiesSeed` would write distinct doc ids
// and double-seed the collection. With deterministic ids, a re-seed by the
// loser of the race silently overwrites identical docs (idempotent).
const SEED_COMMODITIES = (() => {
  const ts = Date.now();
  const date = new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const slug = (name) => `seed-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
  return [
    { name: 'Coconut Husk',    unit: '₹/piece',   mandi: 'Rajahmundry mandi', color: 'amber', price: 0.95 },
    { name: 'Coir Fiber',      unit: '₹/kg',      mandi: 'Rajahmundry mandi', color: 'sage',  price: 24.5 },
    { name: 'Copra (Milling)', unit: '₹/quintal', mandi: 'Rajahmundry mandi', color: 'clay',  price: 11850 },
    { name: 'Shell Charcoal',  unit: '₹/kg',      mandi: 'Rajahmundry mandi', color: 'rust',  price: 38.0 },
  ].map((c) => ({
    id: slug(c.name),
    name: c.name, unit: c.unit, mandi: c.mandi, color: c.color, notes: '',
    addedBy: 'seed', createdAt: ts,
    history: [{ ts, date, price: c.price }],
  }));
})();

// How long an uploaded file outlives its deleted idea/project. The Undo toast
// stays for 5s (ToastContext); this is comfortably longer.
const UNDO_BLOB_DELETE_DELAY_MS = 15_000;

function todayStr() {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// All data lives in shared top-level collections — visible to every
// signed-in family member. Path constants moved to src/data/paths.js so
// a rename ('sharedPlans' → 'sharedProjects', say) only has to land in
// one place instead of cascading through 14 files.
const COL_BUILDERS = {
  ideas:       ideasCol,
  projects:    projectsCol,
  plans:       plansCol,
  commodities: commoditiesCol,
  suppliers:   suppliersCol,
};
const REF_BUILDERS = {
  ideas:       ideaRef,
  projects:    projectRef,
  plans:       planRef,
  commodities: commodityRef,
  suppliers:   supplierRef,
};
const sharedCol = (name) => COL_BUILDERS[name](db);
const sharedRef = (name, id) => REF_BUILDERS[name](db, id);

// Seeding marker (appMeta/seed). Unreadable (offline, rules not yet deployed)
// is reported as such so the caller can fail safe and skip seeding.
async function readSeedMarker() {
  try {
    const snap = await getDoc(appSeedMarkerRef(db));
    return { readable: true, data: snap.exists() ? snap.data() : {} };
  } catch (err) {
    console.warn('[seed] marker unreadable — skipping seeding', err);
    return { readable: false, data: {} };
  }
}
async function markSeeded(field) {
  try {
    await setDoc(appSeedMarkerRef(db), { [field]: true, [`${field}At`]: Date.now() }, { merge: true });
  } catch (err) {
    console.warn('[seed] could not write marker', err);
  }
}

// On first ever load, seed shared collections (migrating from per-user storage
// if present). Runs ONLY into a completely empty workspace that has never been
// seeded — see utils/seeding.js. Emptying the ideas collection alone used to
// count as "fresh install" and overwrote real projects with the samples.
async function ensureSharedData(uid) {
  const marker = await readSeedMarker();
  if (marker.readable && marker.data.workspace) return; // already seeded once

  const [ideasSnap, projectsSnap, plansSnap] = await Promise.all([
    getDocs(sharedCol('ideas')), getDocs(sharedCol('projects')), getDocs(sharedCol('plans')),
  ]);
  const decision = seedDecision({
    markerReadable: marker.readable,
    markerSeeded:   !!marker.data.workspace,
    hasData: !ideasSnap.empty || !projectsSnap.empty || !plansSnap.empty,
  });
  if (decision === 'mark') { await markSeeded('workspace'); return; }
  if (decision !== 'seed') return;

  // Try to migrate data the primary account already saved under users/{uid}/…
  const [uIdeas, uProjects, uPlans] = await Promise.all([
    getDocs(legacyUserIdeasCol(db, uid)),
    getDocs(legacyUserProjectsCol(db, uid)),
    getDocs(legacyUserPlansCol(db, uid)),
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
  await markSeeded('workspace');

  localStorage.removeItem('nb_ideas');
  localStorage.removeItem('nb_projects');
  localStorage.removeItem('nb_plans');
}

// Seed the four starter commodities on first load. Independent of
// ensureSharedData's ideas/projects/plans migration so it also runs on
// installs that already have idea data.
async function ensureCommoditiesSeed() {
  const marker = await readSeedMarker();
  if (marker.readable && marker.data.commodities) return;
  const snap = await getDocs(sharedCol('commodities'));
  const decision = seedDecision({
    markerReadable: marker.readable,
    markerSeeded:   !!marker.data.commodities,
    hasData: !snap.empty,
  });
  if (decision === 'mark') { await markSeeded('commodities'); return; }
  if (decision !== 'seed') return;
  const batch = writeBatch(db);
  SEED_COMMODITIES.forEach(c => batch.set(sharedRef('commodities', c.id), c));
  await batch.commit();
  await markSeeded('commodities');
}

// ── Five separate contexts ─────────────────────────────────────────────────
// Each one is exposed by a focused hook (useIdeas / usePlans /
// useProjects / useBackup / useCommodities). Pages that subscribe to only one collection no
// longer re-render when an unrelated collection changes — the original
// single-context architecture echoed every Firestore snapshot to every
// consumer.
const IdeasContext       = createContext(null);
const PlansContext       = createContext(null);
const ProjectsContext    = createContext(null);
const BackupContext      = createContext(null);
const CommoditiesContext = createContext(null);
const SuppliersContext   = createContext(null);

export function AppProvider({ children }) {
  const { user } = useAuth();
  const [ideas,       setIdeas]       = useState([]);
  const [projects,    setProjects]    = useState([]);
  const [plans,       setPlans]       = useState([]);
  const [commodities, setCommodities] = useState([]);
  const [suppliers,   setSuppliers]   = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const loadedCount = useRef(0);

  useEffect(() => {
    if (!user) { setIdeas([]); setProjects([]); setPlans([]); setCommodities([]); setSuppliers([]); setDataLoading(false); return; }

    loadedCount.current = 0;
    setDataLoading(true);

    const uid = user.uid;
    // Await both seed routines BEFORE attaching the live snapshots so:
    // (1) two tabs racing don't both observe "empty" and double-seed; and
    // (2) the very first snapshot that fires already includes the seeded
    //     docs (no "no data" flash followed by a re-render).
    // `cancelled` guards against the user signing out / `user` changing
    // while the seed await is in flight — without it, late-arriving
    // snapshots from a stale session would try to set state on an
    // unmounted provider.
    let cancelled = false;
    let unsubs = [];
    const timeout = setTimeout(() => setDataLoading(false), 5000);

    (async () => {
      try {
        await Promise.all([
          ensureSharedData(uid),
          ensureCommoditiesSeed(),
        ]);
      } catch (e) {
        console.warn('[AppProvider] seed failed; will still attach listeners:', e);
      }
      if (cancelled) return;

      const tick = () => { loadedCount.current++; if (loadedCount.current >= 5) setDataLoading(false); };
      const sort = arr => [...arr].sort((a, b) => Number(b.id) - Number(a.id));

      unsubs = [
        onSnapshot(sharedCol('ideas'),       s => { if (cancelled) return; setIdeas(sort(s.docs.map(d => d.data())));       tick(); }, () => tick()),
        onSnapshot(sharedCol('projects'),    s => { if (cancelled) return; setProjects(sort(s.docs.map(d => d.data())));    tick(); }, () => tick()),
        onSnapshot(sharedCol('plans'),       s => { if (cancelled) return; setPlans(sort(s.docs.map(d => d.data())));       tick(); }, () => tick()),
        onSnapshot(sharedCol('commodities'), s => { if (cancelled) return; setCommodities(sort(s.docs.map(d => d.data()))); tick(); }, () => tick()),
        onSnapshot(sharedCol('suppliers'),   s => { if (cancelled) return; setSuppliers(sort(s.docs.map(d => d.data())));   tick(); }, () => tick()),
      ];
    })();

    return () => {
      cancelled = true;
      unsubs.forEach(u => { try { u(); } catch {} });
      clearTimeout(timeout);
    };
  }, [user]);

  // ── Activity feed ────────────────────────────────────────────────────────
  // Fire-and-forget "who did what" events for the Dashboard feed. Logs only
  // meaningful moments (create / delete / status change / promote) — never
  // routine autosave patches — so the feed stays signal-rich. A logging
  // failure must never break the operation that triggered it, hence the
  // swallowed catch.
  const logActivity = useCallback((kind, entity, title, detail = null) => {
    if (!user) return;
    // Small random suffix so two events landing in the same millisecond
    // (e.g. promote = plan-created + idea-status) get distinct doc ids.
    const id = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    setDoc(activityRef(db, id), {
      id, kind, entity, title: title || '', detail,
      by: user.displayName || user.email || 'Someone',
      at: Date.now(),
    }).catch(() => {});
  }, [user]);

  // ── Ideas ────────────────────────────────────────────────────────────────
  const addIdea = useCallback(async (idea) => {
    if (!user) return;
    const item = { ...idea, id: Date.now(), date: todayStr() };
    await setDoc(sharedRef('ideas', item.id), item);
    logActivity('created', 'idea', item.title);
  }, [user, logActivity]);

  const updateIdea = useCallback(async (id, patch) => {
    if (!user) return;
    await updateDoc(sharedRef('ideas', id), patch);
  }, [user]);

  // Deleting an idea/project removes its record immediately but keeps the
  // uploaded file for the Undo window: the file used to be deleted FIRST, so
  // Undo restored a record pointing at a file that no longer existed. The file
  // is removed only after UNDO_BLOB_DELETE_DELAY_MS, and Undo cancels that.
  const pendingBlobDeletes = useRef(new Map()); // blobId -> timeout id
  const scheduleBlobDelete = useCallback((blobId) => {
    if (!blobId) return;
    clearTimeout(pendingBlobDeletes.current.get(blobId));
    pendingBlobDeletes.current.set(blobId, setTimeout(() => {
      pendingBlobDeletes.current.delete(blobId);
      deleteFileFromDB(blobId);
    }, UNDO_BLOB_DELETE_DELAY_MS));
  }, []);
  const cancelBlobDelete = useCallback((blobId) => {
    if (!blobId) return;
    clearTimeout(pendingBlobDeletes.current.get(blobId));
    pendingBlobDeletes.current.delete(blobId);
  }, []);

  const deleteIdea = useCallback(async (id) => {
    if (!user) return;
    let title = '';
    let blobId = null;
    try {
      const snap = await getDoc(sharedRef('ideas', id));
      title = snap.data()?.title || '';
      blobId = snap.data()?.attachedFile?.blobId || null;
    } catch { /* best-effort metadata — still delete the record */ }
    // Rejects if the record can't be deleted, so callers must await this and
    // only report success afterwards. The file is untouched in that case.
    await deleteDoc(sharedRef('ideas', id));
    scheduleBlobDelete(blobId);
    logActivity('deleted', 'idea', title);
  }, [user, logActivity, scheduleBlobDelete]);

  const restoreIdea = useCallback(async (idea) => {
    if (!user) return;
    cancelBlobDelete(idea.attachedFile?.blobId); // Undo: keep the attachment
    await setDoc(sharedRef('ideas', idea.id), idea);
  }, [user, cancelBlobDelete]);

  // ── Projects (kept as scaffolding for a future feature) ──────────────────
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
    if (!user) return null;
    const secs = plan.sections || [];
    const item = { ...plan, id: Date.now(), updated: todayStr(), sectionCount: secs.length };
    await setDoc(sharedRef('plans', item.id), item);
    logActivity(plan.linkedIdeaId ? 'promoted' : 'created', 'project', item.title);
    // Callers like "Promote to project" need the generated id to navigate
    // straight to the new project's detail page.
    return item.id;
  }, [user, logActivity]);

  const updatePlan = useCallback(async (id, patch) => {
    if (!user) return;
    const ref = sharedRef('plans', id);
    // The pre-write read exists ONLY to detect a real status transition (so
    // autosave patches repeating the same status don't spam the activity
    // feed); it never feeds the write, and is skipped when no status is set.
    let existing = null;
    if (patch.status) {
      const snap = await getDoc(ref);
      existing = snap.exists() ? snap.data() : null;
    }
    // Write ONLY the fields being changed. This used to read the whole plan,
    // merge the patch locally and setDoc() the result, so any change another
    // user saved between our read and write was silently overwritten (and a
    // plan deleted in that window was resurrected). updateDoc replaces just
    // the named top-level fields and rejects if the plan no longer exists.
    const changes = { ...patch, updated: todayStr() };
    if (patch.sections) changes.sectionCount = patch.sections.length;
    await updateDoc(ref, changes);
    if (existing && patch.status !== existing.status) {
      logActivity('status', 'project', patch.title ?? existing.title, patch.status);
    }
  }, [user, logActivity]);

  const deletePlan = useCallback(async (id) => {
    if (!user) return;
    let title = '';
    let blobId = null;
    try {
      const snap = await getDoc(sharedRef('plans', id));
      title = snap.data()?.title || '';
      blobId = snap.data()?.attachedFile?.blobId || null;
    } catch { /* best-effort metadata — still delete the record */ }
    // See deleteIdea: await-able, and the file outlives the Undo window.
    await deleteDoc(sharedRef('plans', id));
    scheduleBlobDelete(blobId);
    logActivity('deleted', 'project', title);
  }, [user, logActivity, scheduleBlobDelete]);

  const restorePlan = useCallback(async (plan) => {
    if (!user) return;
    cancelBlobDelete(plan.attachedFile?.blobId); // Undo: keep the attachment
    await setDoc(sharedRef('plans', plan.id), plan);
  }, [user, cancelBlobDelete]);

  // ── Commodities ──────────────────────────────────────────────────────────
  const addCommodity = useCallback(async (commodity) => {
    if (!user) return;
    const id = Date.now();
    const item = {
      ...commodity,
      id,
      createdAt: id,
      addedBy: user.email || user.uid,
      history: commodity.history || [],
    };
    await setDoc(sharedRef('commodities', id), item);
    logActivity('created', 'commodity', item.name);
  }, [user, logActivity]);

  const updateCommodity = useCallback(async (id, patch) => {
    if (!user) return;
    await updateDoc(sharedRef('commodities', id), patch);
  }, [user]);

  const deleteCommodity = useCallback(async (id) => {
    if (!user) return;
    const name = commodities.find(c => c.id === id)?.name || '';
    await deleteDoc(sharedRef('commodities', id));
    logActivity('deleted', 'commodity', name);
  }, [user, commodities, logActivity]);

  const restoreCommodity = useCallback(async (commodity) => {
    if (!user) return;
    await setDoc(sharedRef('commodities', commodity.id), commodity);
  }, [user]);

  // ── Suppliers ────────────────────────────────────────────────────────────
  const addSupplier = useCallback(async (supplier) => {
    if (!user) return;
    const id = Date.now();
    await setDoc(sharedRef('suppliers', id), {
      ...supplier,
      id,
      createdAt: id,
      addedBy: user.email || user.uid,
      projectIds: supplier.projectIds || [],
    });
    logActivity('created', 'supplier', supplier.name);
  }, [user, logActivity]);

  const updateSupplier = useCallback(async (id, patch) => {
    if (!user) return;
    await updateDoc(sharedRef('suppliers', id), patch);
  }, [user]);

  const deleteSupplier = useCallback(async (id) => {
    if (!user) return;
    const name = suppliers.find(s => s.id === id)?.name || '';
    await deleteDoc(sharedRef('suppliers', id));
    logActivity('deleted', 'supplier', name);
  }, [user, suppliers, logActivity]);

  // ── Bulk import ──────────────────────────────────────────────────────────
  // Applies set/delete operations in batches under Firestore's 500-op cap.
  const commitOps = async (ops) => {
    for (const part of chunk(ops, 400)) {
      const batch = writeBatch(db);
      for (const op of part) {
        if (op.type === 'set') batch.set(op.ref, op.data);
        else batch.delete(op.ref);
      }
      await batch.commit();
    }
  };

  const importData = useCallback(async (data) => {
    if (!user) return;
    // 1. Validate the WHOLE backup before touching anything.
    const check = validateBackup(data);
    if (!check.ok) throw new Error(check.error);

    // 2. Snapshot what exists so a failure can be undone.
    // Commodities are intentionally excluded — market price data is live, not part of a user backup.
    const existing = {};
    for (const name of BACKUP_COLLECTIONS) {
      const snap = await getDocs(sharedCol(name));
      existing[name] = snap.docs.map(d => ({ id: d.id, data: d.data() }));
    }
    const plan = planImport(existing, check.records);

    // 3. Write the new records FIRST, then delete what the backup doesn't
    //    contain. Deleting first is what used to leave an empty workspace.
    const forward = [];
    const restore = [];
    for (const name of BACKUP_COLLECTIONS) {
      plan[name].writes.forEach(w => forward.push({ type: 'set', ref: sharedRef(name, w.id), data: w.data }));
      existing[name].forEach(e => restore.push({ type: 'set', ref: sharedRef(name, e.id), data: e.data }));
      plan[name].created.forEach(id => restore.push({ type: 'delete', ref: sharedRef(name, id) }));
    }
    for (const name of BACKUP_COLLECTIONS) {
      plan[name].stale.forEach(id => forward.push({ type: 'delete', ref: sharedRef(name, id) }));
    }

    try {
      await commitOps(forward);
    } catch (err) {
      // 4. Roll back to the snapshot so a failed import never loses data.
      try {
        await commitOps(restore);
      } catch (restoreErr) {
        console.error('[importData] rollback failed', restoreErr);
        throw new Error(`Import failed (${err.message}) and your previous data could not be fully restored. Re-import your last backup file.`);
      }
      throw new Error(`Import failed, so nothing was changed. (${err.message})`);
    }
  }, [user]);

  // Per-context memoised values. Each value object only re-renders when its
  // own collection or callbacks change — the previous single-value design
  // forced every consumer to re-render on any collection update.
  const ideasValue       = useMemo(() => ({ ideas, addIdea, updateIdea, deleteIdea, restoreIdea }),
    [ideas, addIdea, updateIdea, deleteIdea, restoreIdea]);
  const plansValue       = useMemo(() => ({ plans, addPlan, updatePlan, deletePlan, restorePlan }),
    [plans, addPlan, updatePlan, deletePlan, restorePlan]);
  const projectsValue    = useMemo(() => ({ projects, addProject, updateProject, deleteProject, restoreProject }),
    [projects, addProject, updateProject, deleteProject, restoreProject]);
  const backupValue      = useMemo(() => ({ dataLoading, importData }),
    [dataLoading, importData]);
  const commoditiesValue = useMemo(() => ({ commodities, addCommodity, updateCommodity, deleteCommodity, restoreCommodity }),
    [commodities, addCommodity, updateCommodity, deleteCommodity, restoreCommodity]);
  const suppliersValue   = useMemo(() => ({ suppliers, addSupplier, updateSupplier, deleteSupplier }),
    [suppliers, addSupplier, updateSupplier, deleteSupplier]);

  return (
    <SuppliersContext.Provider value={suppliersValue}>
      <CommoditiesContext.Provider value={commoditiesValue}>
        <ProjectsContext.Provider value={projectsValue}>
          <PlansContext.Provider value={plansValue}>
            <IdeasContext.Provider value={ideasValue}>
              <BackupContext.Provider value={backupValue}>
                {children}
              </BackupContext.Provider>
            </IdeasContext.Provider>
          </PlansContext.Provider>
        </ProjectsContext.Provider>
      </CommoditiesContext.Provider>
    </SuppliersContext.Provider>
  );
}

// ── Public hooks ───────────────────────────────────────────────────────────
export function useIdeas()       { return useContext(IdeasContext); }
export function usePlans()       { return useContext(PlansContext); }
export function useProjects()    { return useContext(ProjectsContext); }
export function useBackup()      { return useContext(BackupContext); }
export function useCommodities() { return useContext(CommoditiesContext); }
export function useSuppliers()   { return useContext(SuppliersContext); }

// Backward-compatible aggregated hook. New code should prefer the focused
// hooks above; useAppData is retained so existing consumers keep working
// during the migration.
export function useAppData() {
  return {
    ...useIdeas(),
    ...usePlans(),
    ...useProjects(),
    ...useBackup(),
    ...useCommodities(),
    ...useSuppliers(),
  };
}
