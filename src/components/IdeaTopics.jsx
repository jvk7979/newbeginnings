import { useState, useEffect, useMemo } from 'react';
import { C, alpha } from '../tokens';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import DiscussionThread from './DiscussionThread';
import ConfirmModal from './ConfirmModal';

// Fixed category set kept small intentionally — topic categories should
// be skim-readable at a glance, not a long taxonomy. Colors mirror the
// status palette used elsewhere so the UI feels consistent.
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
// live in the legacy ideaDiscussions/{ideaId} path (the pre-Step-3
// single-thread location), preserving every comment posted before topics
// existed. User-created topics have a numeric id derived from Date.now()
// and store their comments under ideaTopicComments/{topicId}.
const GENERAL_TOPIC = {
  id: '__general__',
  title: 'General',
  category: 'general',
  isBuiltIn: true,
};

export default function IdeaTopics({ ideaId }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [topics,         setTopics]         = useState([]);
  const [selectedId,     setSelectedId]     = useState(GENERAL_TOPIC.id);
  const [creating,       setCreating]       = useState(false);
  const [draftTitle,     setDraftTitle]     = useState('');
  const [draftCategory,  setDraftCategory]  = useState('general');
  const [posting,        setPosting]        = useState(false);
  const [confirmDel,     setConfirmDel]     = useState(null);
  const [loadError,      setLoadError]      = useState('');

  const topicsPath = useMemo(
    () => collection(db, 'ideaTopics', String(ideaId), 'topics'),
    [ideaId]
  );

  useEffect(() => {
    setLoadError('');
    const q = query(topicsPath, orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q,
      snap => {
        setTopics(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoadError('');
      },
      err => {
        console.error('[IdeaTopics/onSnapshot]', err);
        setLoadError(
          err?.code === 'permission-denied'
            ? 'You no longer have permission to view topics.'
            : 'Could not load topics. Try refreshing.'
        );
      }
    );
    return () => unsub();
  }, [topicsPath]);

  // Always render General first; user topics in creation order beneath it.
  const allTopics = useMemo(() => [GENERAL_TOPIC, ...topics], [topics]);
  const selected  = useMemo(() => allTopics.find(t => t.id === selectedId) || GENERAL_TOPIC, [allTopics, selectedId]);

  const handleCreate = async () => {
    const title = draftTitle.trim();
    if (!title || posting) return;
    setPosting(true);
    try {
      const ref = await addDoc(topicsPath, {
        title,
        category: draftCategory,
        createdAt: serverTimestamp(),
        authorEmail: user.email || '',
        authorName: user.displayName || user.email || 'Anonymous',
      });
      setDraftTitle('');
      setDraftCategory('general');
      setCreating(false);
      setSelectedId(ref.id);
    } catch (err) {
      console.error('[IdeaTopics/create]', err);
      showToast('Could not create topic. Check Firestore rules.', 'error');
    } finally {
      setPosting(false);
    }
  };

  const confirmDeleteTopic = async () => {
    const topicId = confirmDel;
    setConfirmDel(null);
    try {
      // Delete the topic doc only — orphaned comments under
      // ideaTopicComments/{topicId} can be cleaned up by a maintenance
      // sweep later, the same way attachments are handled. Keeps the
      // delete fast and avoids a long client-side cascade.
      await deleteDoc(doc(db, 'ideaTopics', String(ideaId), 'topics', topicId));
      if (selectedId === topicId) setSelectedId(GENERAL_TOPIC.id);
    } catch {
      showToast('Could not delete topic.', 'error');
    }
  };

  // Discussion thread storage path: General reuses the legacy single-thread
  // location so old comments survive. User topics get their own collection.
  const threadCollection = selected.isBuiltIn ? 'ideaDiscussions'      : 'ideaTopicComments';
  const threadDocId      = selected.isBuiltIn ? ideaId                  : selected.id;

  return (
    <>
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 24, marginTop: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.fg3 }}>
            Discussion Topics · {allTopics.length}
          </div>
          {!creating && (
            <button onClick={() => { setCreating(true); setDraftTitle(''); setDraftCategory('general'); }}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: C.accent, background: C.accentBg, border: `1px solid ${alpha(C.accent, 33)}`, borderRadius: 6, cursor: 'pointer', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span aria-hidden="true">＋</span> New topic
            </button>
          )}
        </div>

        {loadError && (
          <div role="alert" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.danger, background: C.bg1, border: `1px solid ${alpha(C.danger, 33)}`, borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
            {loadError}
          </div>
        )}

        {/* New topic inline form */}
        {creating && (
          <div style={{ background: C.bg1, border: `1px solid ${C.accentDim}`, borderRadius: 10, padding: '14px 16px', marginBottom: 16, boxShadow: `0 0 0 2px ${alpha(C.accentDim, 22)}` }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.fg3, marginBottom: 10 }}>New topic</div>
            <input autoFocus value={draftTitle}
              onChange={e => setDraftTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') setCreating(false); if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleCreate(); }}
              placeholder="Topic title (e.g. Coir supply concerns)"
              maxLength={140}
              style={{ width: '100%', boxSizing: 'border-box', background: C.bg0, border: `1px solid ${C.border}`, borderRadius: 6, color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 15, padding: '9px 12px', outline: 'none', marginBottom: 10 }} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {TOPIC_CATEGORIES.map(c => {
                const active = draftCategory === c.id;
                return (
                  <button key={c.id} onClick={() => setDraftCategory(c.id)}
                    aria-pressed={active}
                    style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: active ? 700 : 500, padding: '4px 12px', borderRadius: 999, border: `1.5px solid ${active ? c.color : C.border}`, background: active ? c.bg : 'transparent', color: active ? c.color : C.fg2, cursor: 'pointer' }}>
                    {c.label}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setCreating(false)}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg2, background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 6, padding: '6px 14px', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleCreate} disabled={posting || !draftTitle.trim()}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: '#fff', background: posting || !draftTitle.trim() ? C.bg2 : C.accent, border: 'none', borderRadius: 6, padding: '6px 16px', cursor: posting || !draftTitle.trim() ? 'not-allowed' : 'pointer' }}>
                {posting ? 'Creating…' : 'Create topic'}
              </button>
            </div>
          </div>
        )}

        {/* Topic list */}
        <div role="list" aria-label="Topics" style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
          {allTopics.map(t => {
            const cat = catFor(t.category);
            const active = selectedId === t.id;
            const isOwn = !t.isBuiltIn && t.authorEmail === user.email;
            return (
              <div key={t.id} role="listitem"
                style={{ display: 'flex', alignItems: 'center', gap: 10, background: active ? C.accentBg : C.bg1, border: `1px solid ${active ? alpha(C.accent, 55) : C.border}`, borderRadius: 8, padding: '8px 12px', transition: 'all 120ms' }}>
                <button onClick={() => setSelectedId(t.id)}
                  aria-pressed={active}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', minWidth: 0 }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: cat.color, background: cat.bg, borderRadius: 4, padding: '2px 7px', flexShrink: 0 }}>
                    {cat.label}
                  </span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: active ? 700 : 500, color: active ? C.accent : C.fg1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                    {t.title}
                  </span>
                  {t.isBuiltIn && (
                    <span title="Built-in topic" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3, fontStyle: 'italic', flexShrink: 0 }}>(default)</span>
                  )}
                </button>
                {isOwn && (
                  <button onClick={() => setConfirmDel(t.id)}
                    aria-label={`Delete topic: ${t.title}`}
                    title="Delete topic"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.fg3, padding: 4, display: 'flex', alignItems: 'center', flexShrink: 0 }}
                    onMouseEnter={e => e.currentTarget.style.color = C.danger}
                    onMouseLeave={e => e.currentTarget.style.color = C.fg3}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Active topic header — gives the thread a clear context line */}
        <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', marginBottom: -1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {(() => {
              const cat = catFor(selected.category);
              return (
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: cat.color, background: cat.bg, borderRadius: 4, padding: '2px 7px' }}>
                  {cat.label}
                </span>
              );
            })()}
            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 17, fontWeight: 700, color: C.fg1, lineHeight: 1.3 }}>
              {selected.title}
            </span>
            {!selected.isBuiltIn && selected.authorName && (
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, marginLeft: 'auto' }}>
                Started by {selected.authorName}
              </span>
            )}
          </div>
        </div>

        {/* Thread itself — DiscussionThread is reused as-is, parameterised by
            (collection, doc) so General points at the legacy thread and
            user topics point at ideaTopicComments. The component renders
            its own "Discussion · N comments" header which acts as the
            thread's separator from the active-topic header above. */}
        <DiscussionThread key={selected.id} collectionName={threadCollection} docId={threadDocId} />
      </div>

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
