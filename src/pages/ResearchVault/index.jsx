import { useState, useEffect, useMemo, useCallback } from 'react';
import { C } from '../../tokens';
import { db } from '../../firebase';
import { setDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { planClipsCol, planClipRef } from '../../data/paths.js';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { deleteFileFromDB } from '../../utils/fileStorage';
import VaultHeader from './VaultHeader';
import ClipCard from './ClipCard';
import { TimelineGroups } from './TimelineGroups';
import AddClipModal from './AddClipModal';
import ClipModal from './ClipModal';
import EmptyState from './EmptyState';

// One app-wide view preference (intentionally not per-project) — switching
// to timeline on any project makes timeline the default everywhere.
const VIEW_KEY = 'nb_vault_view';

// Path helpers — now sourced from src/data/paths.js. Locally bind them
// to the imported `db` so the rest of this file keeps the short
// `clipsCol(planId)` / `clipRef(planId, id)` calling convention.
const clipsCol = (planId)     => planClipsCol(db, planId);
const clipRef  = (planId, id) => planClipRef(db, planId, id);

const todayStr = () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// Toast "Undo" window for action toasts is 5s (see ToastContext). Defer the
// blob delete a little past that so an Undo restores the clip with its file
// intact, but a genuine delete still reclaims storage.
const BLOB_DELETE_DELAY = 6000;

export default function ResearchVaultPage({ planId, plan, onNavigate }) {
  const { showToast } = useToast();
  const { user, isViewer } = useAuth();

  const [clips,   setClips]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [view,    setView]    = useState(() => {
    try { return localStorage.getItem(VIEW_KEY) === 'timeline' ? 'timeline' : 'grid'; }
    catch { return 'grid'; }
  });
  const [typeFilter, setTypeFilter] = useState('all');
  const [search,     setSearch]     = useState('');
  const [sort,       setSort]       = useState('newest');
  const [addOpen,    setAddOpen]    = useState(false);
  const [activeClip, setActiveClip] = useState(null);

  // Subscribe to this project's clips subcollection. On error (e.g. the e2e
  // harness has no auth, or a permission-denied) degrade to an empty list
  // rather than crashing — the same defensive pattern as DiscussionThread.
  useEffect(() => {
    if (!planId) { setClips([]); setLoading(false); return; }
    setLoading(true);
    const q = query(clipsCol(planId), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q,
      // Each clip doc stores its own numeric `id` (set in handleAddClip),
      // so d.data() already carries it — consistent with how AppContext
      // reads ideas/plans.
      snap => { setClips(snap.docs.map(d => d.data())); setLoading(false); },
      err  => { console.error('[ResearchVault/onSnapshot]', err); setClips([]); setLoading(false); }
    );
    return () => unsub();
  }, [planId]);

  // Keep the open ClipModal in sync with live data — after an edit saves,
  // onSnapshot refreshes `clips`; mirror that into `activeClip` so the
  // modal's view mode shows the updated values. If the clip was deleted,
  // close the modal.
  useEffect(() => {
    setActiveClip(prev => prev ? (clips.find(c => c.id === prev.id) || null) : prev);
  }, [clips]);

  const changeView = useCallback((next) => {
    setView(next);
    try { localStorage.setItem(VIEW_KEY, next); } catch { /* private mode */ }
  }, []);

  const handleAddClip = useCallback(async (clip) => {
    const id = Date.now();
    const record = {
      ...clip,
      id,
      createdAt: id,
      date: todayStr(),
      addedBy: user?.email || user?.uid || '',
    };
    await setDoc(clipRef(planId, id), record);
  }, [planId, user]);

  const handleUpdateClip = useCallback(async (id, patch) => {
    await updateDoc(clipRef(planId, id), patch);
  }, [planId]);

  const handleDeleteClip = useCallback((clip) => {
    // Delete the Firestore doc immediately; show an Undo toast. The blob
    // delete (pdf/photo) is deferred past the Undo window so Undo restores
    // the clip with its file intact.
    deleteDoc(clipRef(planId, clip.id)).catch(e => console.error('[deleteClip]', e));
    let undone = false;
    showToast('Clip deleted', 'info', {
      label: 'Undo',
      onClick: () => {
        undone = true;
        setDoc(clipRef(planId, clip.id), clip).catch(e => console.error('[restoreClip]', e));
      },
    });
    const blobId = clip.attachedFile?.blobId || clip.photo?.blobId;
    if (blobId) {
      setTimeout(() => { if (!undone) deleteFileFromDB(blobId); }, BLOB_DELETE_DELAY);
    }
  }, [planId, showToast]);

  const openClip = useCallback((clip) => {
    if (clip.type === 'web' && clip.url) {
      window.open(clip.url, '_blank', 'noopener,noreferrer');
    } else {
      setActiveClip(clip);
    }
  }, []);

  // Apply the type filter + text search; grid view additionally sorts.
  const visible = useMemo(() => {
    const s = search.trim().toLowerCase();
    let list = clips.filter(c => {
      if (typeFilter !== 'all' && c.type !== typeFilter) return false;
      if (!s) return true;
      const hay = [
        c.title, c.description, c.sourceLabel, c.quoteText,
        ...(Array.isArray(c.tags) ? c.tags : []),
      ].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(s);
    });
    if (view === 'grid') {
      list = [...list].sort((a, b) =>
        sort === 'newest'
          ? (b.createdAt || 0) - (a.createdAt || 0)
          : (a.createdAt || 0) - (b.createdAt || 0));
    }
    return list;
  }, [clips, typeFilter, search, sort, view]);

  const planTitle = plan?.title || 'Project';
  const canAdd = !isViewer;

  return (
    <div className="page-pad" style={{ background: C.bg0, flex: 1, overflowY: 'auto' }}>
      <VaultHeader
        planTitle={planTitle}
        clipCount={clips.length}
        view={view}
        onChangeView={changeView}
        typeFilter={typeFilter}
        onChangeTypeFilter={setTypeFilter}
        search={search}
        onChangeSearch={setSearch}
        sort={sort}
        onChangeSort={setSort}
        onNewClip={() => setAddOpen(true)}
        onBack={() => onNavigate(plan ? 'project-detail' : 'projects', plan ? { id: plan.id } : null)}
        canAdd={canAdd}
      />

      {loading && (
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.fg3, padding: '40px 0', textAlign: 'center' }}>
          Loading clips…
        </div>
      )}

      {!loading && clips.length === 0 && (
        <EmptyState onAddClip={() => setAddOpen(true)} canAdd={canAdd} />
      )}

      {!loading && clips.length > 0 && visible.length === 0 && (
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.fg3, padding: '40px 0', textAlign: 'center' }}>
          No clips match your filter.
        </div>
      )}

      {!loading && visible.length > 0 && view === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {visible.map(clip => <ClipCard key={clip.id} clip={clip} onOpen={openClip} />)}
        </div>
      )}

      {!loading && visible.length > 0 && view === 'timeline' && (
        <TimelineGroups clips={visible} onOpen={openClip} />
      )}

      {addOpen && (
        <AddClipModal onClose={() => setAddOpen(false)} onAdd={handleAddClip} />
      )}

      {activeClip && (
        <ClipModal
          clip={activeClip}
          onClose={() => setActiveClip(null)}
          onUpdate={handleUpdateClip}
          onDelete={handleDeleteClip}
          canEdit={canAdd}
        />
      )}
    </div>
  );
}
