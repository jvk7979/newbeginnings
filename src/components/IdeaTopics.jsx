import { useState, useEffect, useMemo } from 'react';
import { C, alpha } from '../tokens';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import DiscussionThread from './DiscussionThread';
import ConfirmModal from './ConfirmModal';

// Fixed category set kept small intentionally — topic categories should be
// skim-readable at a glance. Colors mirror the status palette so the UI
// feels consistent with the rest of the app.
const TOPIC_CATEGORIES = [
  { id: 'general',  label: 'General',  color: '#4B5563', bg: '#F3F4F6' },
  { id: 'risk',     label: 'Risk',     color: '#991B1B', bg: '#FEE2E2' },
  { id: 'buyers',   label: 'Buyers',   color: '#065F46', bg: '#D1FAE5' },
  { id: 'pricing',  label: 'Pricing',  color: '#854D0E', bg: '#FEF3C7' },
  { id: 'status',   label: 'Status',   color: '#1E40AF', bg: '#DBEAFE' },
  { id: 'question', label: 'Question', color: '#5B21B6', bg: '#EDE9FE' },
];
const catFor = (id) => TOPIC_CATEGORIES.find(c => c.id === id) || TOPIC_CATEGORIES[0];

// Synthetic ID for the built-in "General" topic. Comments for this topic
// live in the legacy ideaDiscussions/{ideaId} path so every comment posted
// before topics existed is preserved with no migration. User-created topics
// store their comments under ideaTopicComments/{topicId}.
const GENERAL_TOPIC = {
  id: '__general__',
  title: 'General',
  category: 'general',
  isBuiltIn: true,
};

// Sort key extractor: explicit `order` wins, then createdAt millis. New
// topics default order = Date.now(); reorders set fractional values.
const sortKey = (t) => {
  if (typeof t.order === 'number') return t.order;
  return t.createdAt?.toMillis?.() ?? 0;
};

function timeAgo(ts) {
  if (!ts || !ts.toMillis) return '';
  const secs = Math.floor((Date.now() - ts.toMillis()) / 1000);
  if (secs < 60)    return 'just now';
  if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

const VIEW_KEY = 'nb_topic_view'; // localStorage key for the user's view preference

// ─── Topic editor (inline new + inline edit share the same form) ─────────────

function TopicEditor({ initialTitle = '', initialCategory = 'general', onSave, onCancel, busy, mode = 'new' }) {
  const [title,    setTitle]    = useState(initialTitle);
  const [category, setCategory] = useState(initialCategory);
  const isValid = title.trim().length > 0;
  return (
    <div style={{ background: C.bg1, border: `1px solid ${C.accentDim}`, borderRadius: 12, padding: '14px 16px', boxShadow: `0 0 0 2px ${alpha(C.accentDim, 22)}` }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg3, marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {mode === 'edit' ? 'Editing topic' : 'New topic'}
      </div>
      <input autoFocus value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => { if (e.key === 'Escape') onCancel(); if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && isValid) onSave({ title: title.trim(), category }); }}
        placeholder="Topic title (e.g. Coir supply concerns)"
        maxLength={140}
        style={{ width: '100%', boxSizing: 'border-box', fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, fontWeight: 600, color: C.fg1, background: C.bg0, border: `1px solid ${C.border}`, borderRadius: 6, padding: '9px 12px', outline: 'none', marginBottom: 10 }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {TOPIC_CATEGORIES.map(c => {
          const active = category === c.id;
          return (
            <button key={c.id} onClick={() => setCategory(c.id)}
              aria-pressed={active}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: active ? 700 : 500, padding: '4px 12px', borderRadius: 999, border: `1.5px solid ${active ? c.color : C.border}`, background: active ? c.bg : 'transparent', color: active ? c.color : C.fg2, cursor: 'pointer' }}>
              {c.label}
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onCancel}
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg2, background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 6, padding: '6px 14px', cursor: 'pointer' }}>
          Cancel
        </button>
        <button onClick={() => onSave({ title: title.trim(), category })} disabled={busy || !isValid}
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: '#fff', background: busy || !isValid ? C.bg2 : C.accent, border: 'none', borderRadius: 6, padding: '6px 16px', cursor: busy || !isValid ? 'not-allowed' : 'pointer' }}>
          {busy ? 'Saving…' : mode === 'edit' ? 'Save topic' : 'Create topic'}
        </button>
      </div>
    </div>
  );
}

// ─── Action buttons (edit / delete) used by both views ──────────────────────

function TopicActions({ topic, onEdit, onDelete, isOwn }) {
  if (!isOwn) return null;
  return (
    <>
      <button onClick={(e) => { e.stopPropagation(); onEdit(topic); }}
        aria-label={`Edit topic: ${topic.title}`}
        title="Edit topic"
        style={{ width: 32, height: 32, borderRadius: 6, border: 'none', background: 'transparent', color: C.fg3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onMouseEnter={e => { e.currentTarget.style.background = C.bg2; e.currentTarget.style.color = C.accent; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.fg3; }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <button onClick={(e) => { e.stopPropagation(); onDelete(topic.id); }}
        aria-label={`Delete topic: ${topic.title}`}
        title="Delete topic"
        style={{ width: 32, height: 32, borderRadius: 6, border: 'none', background: 'transparent', color: C.fg3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onMouseEnter={e => { e.currentTarget.style.background = C.bg2; e.currentTarget.style.color = C.danger; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.fg3; }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
      </button>
    </>
  );
}

// ─── Board view — sticky-note grid (default) ────────────────────────────────

function BoardView({ topics, selectedId, onSelect, currentUserEmail, onEdit, onDelete, onDragStart, onDragOver, onDrop, onDragEnd, dragId, dragOverId }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 14 }}>
      {topics.map(t => {
        const cat = catFor(t.category);
        const isOwn = !t.isBuiltIn && t.authorEmail === currentUserEmail;
        const draggable = !t.isBuiltIn;
        const isDragging = dragId === t.id;
        const isDragOver = dragOverId === t.id && dragId !== t.id;
        const active = selectedId === t.id;
        return (
          <button key={t.id}
            onClick={() => onSelect(t.id)}
            draggable={draggable}
            onDragStart={() => onDragStart(t.id)}
            onDragOver={(e) => onDragOver(e, t.id)}
            onDragLeave={() => {}}
            onDrop={() => onDrop(t.id)}
            onDragEnd={onDragEnd}
            aria-label={`Open topic: ${t.title}`}
            style={{
              textAlign: 'left',
              background: cat.bg,
              border: `1.5px solid ${active ? cat.color : alpha(cat.color, 33)}`,
              borderLeft: `5px solid ${cat.color}`,
              borderRadius: 12,
              padding: '14px 16px',
              minHeight: 130,
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 10,
              cursor: 'pointer',
              opacity: isDragging ? 0.4 : 1,
              outline: isDragOver ? `2px solid ${cat.color}` : 'none',
              outlineOffset: -2,
              transition: 'transform 120ms, box-shadow 120ms, opacity 120ms',
              boxShadow: active ? `0 4px 12px ${alpha(cat.color, 33)}` : '0 2px 4px rgba(0,0,0,0.06)',
              transform: active ? 'translateY(-1px)' : 'none',
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 4px 10px ${alpha(cat.color, 33)}`; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = active ? `0 4px 12px ${alpha(cat.color, 33)}` : '0 2px 4px rgba(0,0,0,0.06)'; }}>
            {/* Top row: category label + actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: cat.color }}>
                {cat.label}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, opacity: 0.85 }}>
                <TopicActions topic={t} onEdit={onEdit} onDelete={onDelete} isOwn={isOwn} />
              </div>
            </div>
            {/* Title */}
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 17, fontWeight: 700, color: C.fg1, lineHeight: 1.3, flex: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
              {t.title}
            </div>
            {/* Footer: author / time / built-in marker */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: alpha(cat.color, 200) }}>
              {t.isBuiltIn ? (
                <span style={{ fontStyle: 'italic' }}>📌 default · always available</span>
              ) : (
                <>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.authorName || 'Anonymous'}</span>
                  <span style={{ flexShrink: 0 }}>{timeAgo(t.createdAt)}</span>
                </>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── List view — sidebar of topics + active thread on the right ─────────────

function ListView({ topics, selectedId, onSelect, currentUserEmail, onEdit, onDelete, threadFor, onDragStart, onDragOver, onDrop, onDragEnd, dragId, dragOverId }) {
  return (
    <div className="topic-list-view"
      style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 280px) 1fr', gap: 14, marginBottom: 14, alignItems: 'start' }}>
      {/* Sidebar — topic list */}
      <div style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 12, padding: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {topics.map(t => {
          const cat = catFor(t.category);
          const active = selectedId === t.id;
          const isOwn = !t.isBuiltIn && t.authorEmail === currentUserEmail;
          const draggable = !t.isBuiltIn;
          const isDragging = dragId === t.id;
          const isDragOver = dragOverId === t.id && dragId !== t.id;
          return (
            <div key={t.id}
              draggable={draggable}
              onDragStart={() => onDragStart(t.id)}
              onDragOver={(e) => onDragOver(e, t.id)}
              onDrop={() => onDrop(t.id)}
              onDragEnd={onDragEnd}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 10px', borderRadius: 8,
                background: active ? alpha(cat.color, 22) : 'transparent',
                border: `1px solid ${active ? alpha(cat.color, 55) : 'transparent'}`,
                opacity: isDragging ? 0.4 : 1,
                outline: isDragOver ? `2px solid ${C.accentDim}` : 'none',
                cursor: 'pointer',
              }}
              onClick={() => onSelect(t.id)}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = C.bg2; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
              <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: active ? 700 : 500, color: active ? cat.color : C.fg1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {t.title}
              </span>
              {t.isBuiltIn && <span aria-hidden="true" title="Built-in topic" style={{ fontSize: 12, flexShrink: 0 }}>📌</span>}
              {isOwn && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 1, opacity: active ? 1 : 0.6 }}>
                  <TopicActions topic={t} onEdit={onEdit} onDelete={onDelete} isOwn={isOwn} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Right pane — active thread */}
      <div>
        {threadFor}
      </div>
    </div>
  );
}

// ─── Active thread panel (used by drawer in board view + right pane in list view) ──

function ActiveThreadPanel({ topic, ideaId, onCloseDrawer = null, currentUserEmail, onEdit, onDelete }) {
  if (!topic) return null;
  const cat = catFor(topic.category);
  const isOwn = !topic.isBuiltIn && topic.authorEmail === currentUserEmail;
  const collectionName = topic.isBuiltIn ? 'ideaDiscussions' : 'ideaTopicComments';
  const docId          = topic.isBuiltIn ? ideaId : topic.id;
  return (
    <div style={{ background: C.bg1, border: `1px solid ${C.border}`, borderTop: `4px solid ${cat.color}`, borderRadius: 12, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Topic header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: cat.color, background: cat.bg, borderRadius: 4, padding: '2px 8px' }}>
          {cat.label}
        </span>
        <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 19, fontWeight: 700, color: C.fg1, lineHeight: 1.3, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {topic.title}
        </span>
        <div style={{ display: 'flex', gap: 2 }}>
          <TopicActions topic={topic} onEdit={onEdit} onDelete={onDelete} isOwn={isOwn} />
          {onCloseDrawer && (
            <button onClick={onCloseDrawer} aria-label="Close thread"
              style={{ width: 32, height: 32, borderRadius: 6, border: 'none', background: 'transparent', color: C.fg3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, lineHeight: 1 }}
              onMouseEnter={e => { e.currentTarget.style.background = C.bg2; e.currentTarget.style.color = C.fg1; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.fg3; }}>
              ×
            </button>
          )}
        </div>
      </div>
      {!topic.isBuiltIn && topic.authorName && (
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3 }}>
          Started by {topic.authorName} · {timeAgo(topic.createdAt)}
        </div>
      )}
      {/* The thread itself (re-keyed on docId so switching topics resets state cleanly) */}
      <DiscussionThread key={docId} collectionName={collectionName} docId={docId} />
    </div>
  );
}

// ─── Drawer wrapper (board view only) ────────────────────────────────────────

function ThreadDrawer({ topic, ideaId, onClose, currentUserEmail, onEdit, onDelete }) {
  // Lock body scroll while open + close on Esc.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prevOverflow; };
  }, [onClose]);

  if (!topic) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label={`${topic.title} thread`}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(28,25,20,0.45)', zIndex: 700, display: 'flex', justifyContent: 'flex-end', backdropFilter: 'blur(2px)' }}>
      <div style={{ background: C.bg0, width: 'min(640px, 100vw)', height: '100%', overflowY: 'auto', boxShadow: '-8px 0 32px rgba(0,0,0,0.18)', padding: 16, boxSizing: 'border-box' }}>
        <ActiveThreadPanel topic={topic} ideaId={ideaId} onCloseDrawer={onClose}
          currentUserEmail={currentUserEmail} onEdit={onEdit} onDelete={onDelete} />
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function IdeaTopics({ ideaId }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [topics,     setTopics]     = useState([]);
  const [selectedId, setSelectedId] = useState(null); // user topic OR general id
  const [view, setView] = useState(() => {
    try { const saved = localStorage.getItem(VIEW_KEY); return saved === 'list' || saved === 'board' ? saved : 'board'; }
    catch { return 'board'; }
  });
  useEffect(() => { try { localStorage.setItem(VIEW_KEY, view); } catch { /* */ } }, [view]);

  const [creating,    setCreating]    = useState(false);
  const [posting,     setPosting]     = useState(false);
  const [editingId,   setEditingId]   = useState(null);
  const [editingInit, setEditingInit] = useState({ title: '', category: 'general' });
  const [savingEdit,  setSavingEdit]  = useState(false);
  const [confirmDel,  setConfirmDel]  = useState(null);
  const [loadError,   setLoadError]   = useState('');
  const [dragId,      setDragId]      = useState(null);
  const [dragOverId,  setDragOverId]  = useState(null);

  const topicsPath = useMemo(
    () => collection(db, 'ideaTopics', String(ideaId), 'topics'),
    [ideaId]
  );

  useEffect(() => {
    setLoadError('');
    const q = query(topicsPath, orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q,
      snap => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        docs.sort((a, b) => sortKey(a) - sortKey(b));
        setTopics(docs);
        setLoadError('');
      },
      err => {
        console.error('[IdeaTopics/onSnapshot]', err);
        setLoadError(err?.code === 'permission-denied'
          ? 'You no longer have permission to view topics.'
          : 'Could not load topics. Try refreshing.');
      }
    );
    return () => unsub();
  }, [topicsPath]);

  // General is always first in the rendered list.
  const allTopics = useMemo(() => [GENERAL_TOPIC, ...topics], [topics]);
  const selectedTopic = useMemo(
    () => allTopics.find(t => t.id === selectedId) || null,
    [allTopics, selectedId]
  );

  // In list view, default-select General when nothing's selected so the
  // right pane has something to show.
  useEffect(() => {
    if (view === 'list' && !selectedId) setSelectedId(GENERAL_TOPIC.id);
  }, [view, selectedId]);

  const handleCreate = async ({ title, category }) => {
    if (!title || posting) return;
    setPosting(true);
    try {
      const ref = await addDoc(topicsPath, {
        title, category,
        createdAt: serverTimestamp(),
        order: Date.now(),
        authorEmail: user.email || '',
        authorName: user.displayName || user.email || 'Anonymous',
      });
      setCreating(false);
      // Auto-open the newly created topic so the user can post the first comment.
      setSelectedId(ref.id);
    } catch (err) {
      console.error('[IdeaTopics/create]', err);
      showToast('Could not create topic. Check Firestore rules.', 'error');
    } finally {
      setPosting(false);
    }
  };

  const startEdit = (t) => { setEditingId(t.id); setEditingInit({ title: t.title, category: t.category || 'general' }); };
  const cancelEdit = () => { setEditingId(null); };

  const saveEdit = async (topicId, { title, category }) => {
    if (!title || savingEdit) return;
    setSavingEdit(true);
    try {
      await updateDoc(doc(db, 'ideaTopics', String(ideaId), 'topics', topicId), { title, category });
      setEditingId(null);
    } catch {
      showToast('Could not save topic.', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const confirmDeleteTopic = async () => {
    const topicId = confirmDel;
    setConfirmDel(null);
    try {
      await deleteDoc(doc(db, 'ideaTopics', String(ideaId), 'topics', topicId));
      if (selectedId === topicId) setSelectedId(view === 'list' ? GENERAL_TOPIC.id : null);
    } catch {
      showToast('Could not delete topic.', 'error');
    }
  };

  // Drag-and-drop reorder (user topics only; General is pinned)
  const handleDragStart = (id) => { if (id !== GENERAL_TOPIC.id) setDragId(id); };
  const handleDragOver  = (e, id) => {
    if (!dragId || id === GENERAL_TOPIC.id || id === dragId) return;
    e.preventDefault();
    setDragOverId(id);
  };
  const handleDrop = async (targetId) => {
    if (!dragId || dragId === targetId || targetId === GENERAL_TOPIC.id) {
      setDragId(null); setDragOverId(null); return;
    }
    const target = topics.find(t => t.id === targetId);
    if (!target) { setDragId(null); setDragOverId(null); return; }
    const targetOrder = sortKey(target);
    try {
      await updateDoc(doc(db, 'ideaTopics', String(ideaId), 'topics', dragId), {
        order: targetOrder - 0.5,
      });
    } catch {
      showToast('Could not reorder.', 'error');
    } finally {
      setDragId(null); setDragOverId(null);
    }
  };
  const handleDragEnd = () => { setDragId(null); setDragOverId(null); };

  const dragProps = {
    onDragStart: handleDragStart,
    onDragOver: handleDragOver,
    onDrop: handleDrop,
    onDragEnd: handleDragEnd,
    dragId, dragOverId,
  };

  // Build the active-thread element (used as right pane in List view, and
  // as drawer body in Board view via ThreadDrawer)
  const threadElement = selectedTopic ? (
    <ActiveThreadPanel topic={selectedTopic} ideaId={ideaId}
      currentUserEmail={user.email}
      onEdit={startEdit} onDelete={(id) => setConfirmDel(id)} />
  ) : (
    <div style={{ background: C.bg1, border: `1px dashed ${C.border}`, borderRadius: 12, padding: '40px 20px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", color: C.fg3 }}>
      Pick a topic from the list to open its thread.
    </div>
  );

  return (
    <>
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 24, marginTop: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.fg3 }}>
            Discussion Topics · {allTopics.length}
          </span>
          {/* View toggle: Board ↔ List. Preference is persisted per device. */}
          <div role="tablist" aria-label="Topic view"
            style={{ display: 'inline-flex', background: C.bg2, borderRadius: 8, padding: 3 }}>
            {[
              { id: 'board', label: 'Board', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
              { id: 'list',  label: 'List',  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> },
            ].map(opt => {
              const active = view === opt.id;
              return (
                <button key={opt.id} role="tab" aria-selected={active}
                  onClick={() => setView(opt.id)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: active ? 700 : 500, background: active ? C.bg1 : 'transparent', color: active ? C.fg1 : C.fg3, boxShadow: active ? '0 1px 3px rgba(0,0,0,0.10)' : 'none', transition: 'all 120ms' }}>
                  {opt.icon}{opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {loadError && (
          <div role="alert" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.danger, background: C.bg1, border: `1px solid ${alpha(C.danger, 33)}`, borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
            {loadError}
          </div>
        )}

        {/* Inline edit form replaces the body when editing */}
        {editingId && (
          <div style={{ marginBottom: 14 }}>
            <TopicEditor mode="edit"
              initialTitle={editingInit.title}
              initialCategory={editingInit.category}
              busy={savingEdit}
              onCancel={cancelEdit}
              onSave={(payload) => saveEdit(editingId, payload)} />
          </div>
        )}

        {/* The view itself */}
        {view === 'board' ? (
          <BoardView topics={allTopics} selectedId={selectedId} onSelect={setSelectedId}
            currentUserEmail={user.email} onEdit={startEdit} onDelete={(id) => setConfirmDel(id)}
            {...dragProps} />
        ) : (
          <ListView topics={allTopics} selectedId={selectedId} onSelect={setSelectedId}
            currentUserEmail={user.email} onEdit={startEdit} onDelete={(id) => setConfirmDel(id)}
            threadFor={threadElement}
            {...dragProps} />
        )}

        {/* Add-topic affordance */}
        {creating ? (
          <TopicEditor mode="new" busy={posting}
            onCancel={() => setCreating(false)}
            onSave={handleCreate} />
        ) : (
          <button onClick={() => setCreating(true)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: C.accent, background: 'transparent', border: `1.5px dashed ${alpha(C.accent, 55)}`, borderRadius: 12, padding: '12px 16px', cursor: 'pointer', transition: 'background 120ms, border-color 120ms' }}
            onMouseEnter={e => { e.currentTarget.style.background = alpha(C.accent, 8); e.currentTarget.style.borderColor = C.accent; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = alpha(C.accent, 55); }}>
            <span aria-hidden="true" style={{ fontSize: 16, lineHeight: 1 }}>＋</span>
            Add topic
          </button>
        )}
      </div>

      {/* Drawer overlay — only used in board view */}
      {view === 'board' && selectedTopic && (
        <ThreadDrawer topic={selectedTopic} ideaId={ideaId}
          onClose={() => setSelectedId(null)}
          currentUserEmail={user.email}
          onEdit={startEdit} onDelete={(id) => setConfirmDel(id)} />
      )}

      {confirmDel && (
        <ConfirmModal
          title="Delete topic?"
          message="Comments on this topic will become inaccessible from the UI but stay in the database. Continue?"
          confirmLabel="Delete"
          variant="danger"
          onConfirm={confirmDeleteTopic}
          onCancel={() => setConfirmDel(null)} />
      )}
    </>
  );
}
