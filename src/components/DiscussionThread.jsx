import { useState, useEffect, useRef, useMemo } from 'react';
import { C, alpha } from '../tokens';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import ConfirmModal from './ConfirmModal';

function timeAgo(ts) {
  if (!ts) return '';
  const secs = Math.floor((Date.now() - ts.toMillis()) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

// Reusable comments thread used by IdeaDetailPage and PlanDetailPage.
// `collectionName` selects the Firestore root collection ('ideaDiscussions'
// or 'planDiscussions'); `docId` is the parent idea/plan id stringified.
export default function DiscussionThread({ collectionName, docId }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [comments,    setComments]    = useState([]);
  const [commentText, setCommentText] = useState('');
  const [posting,     setPosting]     = useState(false);
  const [confirmComDel, setConfirmComDel] = useState(null);
  const [loadError,   setLoadError]   = useState('');
  const commentsEndRef = useRef(null);
  const textareaRef    = useRef(null);
  const justPosted     = useRef(false);

  const commentsPath = useMemo(
    () => collection(db, collectionName, String(docId), 'comments'),
    [collectionName, docId]
  );

  useEffect(() => {
    setLoadError('');
    const q = query(commentsPath, orderBy('timestamp', 'asc'));
    const unsub = onSnapshot(q,
      snap => {
        setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoadError('');
      },
      err => {
        // Without this, a rules rejection shows a silently empty thread —
        // indistinguishable from "no comments yet". Surface the failure
        // so users (and we) know the read was denied vs. genuinely empty.
        console.error('[DiscussionThread/onSnapshot]', err);
        setLoadError(
          err?.code === 'permission-denied'
            ? 'You no longer have permission to view this thread.'
            : 'Could not load comments. Try refreshing the page.'
        );
      }
    );
    return () => unsub();
  }, [commentsPath]);

  useEffect(() => {
    // Only scroll when THIS user just posted — never on initial load or other users' posts.
    if (justPosted.current) {
      justPosted.current = false;
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [comments]);

  const handlePostComment = async () => {
    const text = commentText.trim();
    if (!text || posting) return;
    setPosting(true);
    try {
      await addDoc(commentsPath, {
        text,
        authorName: user.displayName || user.email || 'Anonymous',
        authorEmail: user.email || '',
        authorPhoto: user.photoURL || null,
        timestamp: serverTimestamp(),
      });
      setCommentText('');
      // Reset auto-grown height so the textarea shrinks back after post.
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      justPosted.current = true;
    } catch {
      showToast('Could not post comment. Check Firestore rules.', 'error');
    } finally {
      setPosting(false);
    }
  };

  const confirmDeleteComment = async () => {
    try {
      await deleteDoc(doc(db, collectionName, String(docId), 'comments', confirmComDel));
    } catch {
      showToast('Could not delete comment.', 'error');
    } finally {
      setConfirmComDel(null);
    }
  };

  return (
    <>
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 24 }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.fg3, marginBottom: 16 }}>
          Discussion · {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
        </div>

        {loadError && (
          <div role="alert" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.danger, background: C.bg1, border: `1px solid ${alpha(C.danger, 33)}`, borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
            {loadError}
          </div>
        )}

        {!loadError && comments.length === 0 && (
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.fg3, background: C.bg1, border: `1px dashed ${C.border}`, borderRadius: 8, padding: '16px 18px', marginBottom: 16, textAlign: 'center' }}>
            No comments yet — start the discussion below.
          </div>
        )}

        {/* role="log" + aria-live="polite" so newly-posted comments are
            announced to screen readers without interrupting current speech.
            aria-relevant="additions" prevents the entire list from being
            re-read every time a single comment is added. */}
        <div role="log" aria-live="polite" aria-relevant="additions" aria-atomic="false"
          style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          {comments.map(c => {
            const initial = (c.authorName || '?')[0].toUpperCase();
            const isOwn = c.authorEmail === user.email;
            return (
              <div key={c.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                {c.authorPhoto
                  ? <img src={c.authorPhoto} alt="" width={30} height={30} style={{ borderRadius: '50%', flexShrink: 0, marginTop: 2 }} />
                  : <div style={{ width: 30, height: 30, borderRadius: '50%', background: C.accent, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 700, marginTop: 2 }}>{initial}</div>
                }
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: C.fg1 }}>{c.authorName}</span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3 }}>{timeAgo(c.timestamp)}</span>
                    {isOwn && (
                      <button onClick={() => setConfirmComDel(c.id)}
                        style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.danger, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 'auto' }}>
                        Delete
                      </button>
                    )}
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: C.fg2, lineHeight: 1.6, background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {c.text}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={commentsEndRef} />
        </div>

        <div className="comment-row">
          <textarea
            ref={textareaRef}
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            onInput={e => {
              // Auto-grow the textarea up to 240px so a long comment on
              // mobile doesn't get squashed into a 3-line scrollable box.
              // Capped so a runaway rant can't push the Post button off-screen.
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 240) + 'px';
            }}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePostComment(); }}
            placeholder="Add a comment, brainstorm point, or question… (Ctrl+Enter to post)"
            maxLength={4000}
            style={{ flex: 1, background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 8, color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 16, padding: '10px 12px', outline: 'none', resize: 'vertical', minHeight: 72, maxHeight: 240, lineHeight: 1.6, transition: 'border 150ms', overflow: 'auto' }}
            onFocus={e => { e.target.style.borderColor = C.accentDim; e.target.style.boxShadow = `0 0 0 2px ${alpha(C.accentDim, 33)}`; }}
            onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }}
          />
          <button onClick={handlePostComment} disabled={posting || !commentText.trim()}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500, padding: '10px 18px', borderRadius: 8, background: posting || !commentText.trim() ? C.bg2 : C.accent, color: posting || !commentText.trim() ? C.fg3 : '#fff', border: 'none', cursor: posting || !commentText.trim() ? 'not-allowed' : 'pointer', transition: 'all 150ms', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {posting ? 'Posting…' : 'Post'}
          </button>
        </div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, marginTop: 6 }}>Visible to all signed-in family members.</div>
      </div>

      {confirmComDel && (
        <ConfirmModal
          title="Delete comment?"
          message="Are you sure you want to delete this comment?"
          confirmLabel="Delete"
          onConfirm={confirmDeleteComment}
          onCancel={() => setConfirmComDel(null)} />
      )}
    </>
  );
}
