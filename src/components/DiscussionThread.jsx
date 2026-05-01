import { useState, useEffect, useRef, useMemo } from 'react';
import { C, alpha } from '../tokens';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import ConfirmModal from './ConfirmModal';

const REACTION_EMOJIS = ['👍', '❤️', '🎉', '💡', '🔥'];

function timeAgo(ts) {
  if (!ts) return '';
  const secs = Math.floor((Date.now() - ts.toMillis()) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export default function DiscussionThread({ collectionName, docId }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [comments,       setComments]       = useState([]);
  const [commentText,    setCommentText]    = useState('');
  const [posting,        setPosting]        = useState(false);
  const [confirmComDel,  setConfirmComDel]  = useState(null);
  const [loadError,      setLoadError]      = useState('');
  const [editingId,      setEditingId]      = useState(null);
  const [editDraft,      setEditDraft]      = useState('');
  const [savingEdit,     setSavingEdit]     = useState(false);
  const [replyingToId,   setReplyingToId]   = useState(null);
  const [replyText,      setReplyText]      = useState('');
  const [postingReply,   setPostingReply]   = useState(false);
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
    if (justPosted.current) {
      justPosted.current = false;
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [comments]);

  const topLevel = useMemo(() => comments.filter(c => !c.parentId), [comments]);
  const getReplies = (id) => comments.filter(c => c.parentId === id);

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
        parentId: null,
        reactions: {},
      });
      setCommentText('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      justPosted.current = true;
    } catch {
      showToast('Could not post comment. Check Firestore rules.', 'error');
    } finally {
      setPosting(false);
    }
  };

  const handlePostReply = async (parentId) => {
    const text = replyText.trim();
    if (!text || postingReply) return;
    setPostingReply(true);
    try {
      await addDoc(commentsPath, {
        text,
        authorName: user.displayName || user.email || 'Anonymous',
        authorEmail: user.email || '',
        authorPhoto: user.photoURL || null,
        timestamp: serverTimestamp(),
        parentId,
        reactions: {},
      });
      setReplyText('');
      setReplyingToId(null);
      justPosted.current = true;
    } catch {
      showToast('Could not post reply.', 'error');
    } finally {
      setPostingReply(false);
    }
  };

  const handleReact = async (comment, emoji) => {
    const reactions = comment.reactions || {};
    const current = reactions[emoji] || [];
    const hasReacted = current.includes(user.email);
    const next = hasReacted ? current.filter(e => e !== user.email) : [...current, user.email];
    const nextReactions = { ...reactions, [emoji]: next };
    try {
      await updateDoc(doc(db, collectionName, String(docId), 'comments', comment.id), { reactions: nextReactions });
    } catch {
      showToast('Could not save reaction.', 'error');
    }
  };

  const handleStartEdit = (comment) => {
    setEditingId(comment.id);
    setEditDraft(comment.text);
    setReplyingToId(null);
  };

  const handleSaveEdit = async (commentId) => {
    const text = editDraft.trim();
    if (!text) return;
    setSavingEdit(true);
    try {
      await updateDoc(doc(db, collectionName, String(docId), 'comments', commentId), { text, editedAt: serverTimestamp() });
      setEditingId(null);
      setEditDraft('');
    } catch {
      showToast('Could not save edit.', 'error');
    } finally {
      setSavingEdit(false);
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

  const renderComment = (c, isReply = false) => {
    const initial = (c.authorName || '?')[0].toUpperCase();
    const isOwn = c.authorEmail === user.email;
    const isEditing = editingId === c.id;
    const replies = isReply ? [] : getReplies(c.id);
    const isReplying = replyingToId === c.id;

    return (
      <div key={c.id} style={{ marginLeft: isReply ? 40 : 0 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          {c.authorPhoto
            ? <img src={c.authorPhoto} alt="" width={isReply ? 24 : 30} height={isReply ? 24 : 30} style={{ borderRadius: '50%', flexShrink: 0, marginTop: 2 }} />
            : <div style={{ width: isReply ? 24 : 30, height: isReply ? 24 : 30, borderRadius: '50%', background: C.accent, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: isReply ? 11 : 14, fontWeight: 700, marginTop: 2 }}>{initial}</div>
          }
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: isReply ? 13 : 15, fontWeight: 600, color: C.fg1 }}>{c.authorName}</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3 }}>{timeAgo(c.timestamp)}{c.editedAt ? ' · edited' : ''}</span>
              {isOwn && !isEditing && (
                <>
                  <button onClick={() => handleStartEdit(c)} aria-label="Edit comment"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', color: C.fg3, display: 'flex', alignItems: 'center' }}
                    title="Edit">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="13" height="13"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button onClick={() => setConfirmComDel(c.id)}
                    style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.danger, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 'auto' }}>
                    Delete
                  </button>
                </>
              )}
            </div>

            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <textarea
                  value={editDraft}
                  onChange={e => setEditDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Escape') { setEditingId(null); setEditDraft(''); } if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSaveEdit(c.id); }}
                  autoFocus
                  maxLength={4000}
                  style={{ background: C.bg1, border: `1px solid ${C.accentDim}`, borderRadius: 8, color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 15, padding: '10px 12px', outline: 'none', resize: 'vertical', minHeight: 60, lineHeight: 1.6, boxShadow: `0 0 0 2px ${alpha(C.accentDim, 33)}` }}
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => handleSaveEdit(c.id)} disabled={savingEdit || !editDraft.trim()}
                    style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, padding: '5px 14px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}>
                    {savingEdit ? 'Saving…' : 'Save'}
                  </button>
                  <button onClick={() => { setEditingId(null); setEditDraft(''); }}
                    style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: '5px 12px', borderRadius: 6, background: C.bg2, color: C.fg2, border: `1px solid ${C.border}`, cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: isReply ? 14 : 16, color: C.fg2, lineHeight: 1.6, background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {c.text}
              </div>
            )}

            {/* Reactions row */}
            {!isEditing && (
              <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                {REACTION_EMOJIS.map(emoji => {
                  const users = (c.reactions || {})[emoji] || [];
                  const reacted = users.includes(user.email);
                  return (
                    <button key={emoji} onClick={() => handleReact(c, emoji)}
                      title={users.length > 0 ? users.join(', ') : emoji}
                      aria-pressed={reacted}
                      style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 12, border: `1px solid ${reacted ? alpha(C.accent, 66) : C.border}`, background: reacted ? alpha(C.accent, 11) : 'transparent', cursor: 'pointer', fontSize: 14, fontFamily: "'DM Sans', sans-serif", transition: 'all 120ms' }}>
                      <span>{emoji}</span>
                      {users.length > 0 && <span style={{ fontSize: 11, color: reacted ? C.accent : C.fg3, fontWeight: reacted ? 700 : 400 }}>{users.length}</span>}
                    </button>
                  );
                })}
                {!isReply && (
                  <button onClick={() => { setReplyingToId(isReplying ? null : c.id); setReplyText(''); }}
                    style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', marginLeft: 2 }}>
                    {isReplying ? 'Cancel reply' : 'Reply'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Reply input */}
        {isReplying && (
          <div style={{ marginLeft: 40, marginTop: 8, display: 'flex', gap: 8 }}>
            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePostReply(c.id); }}
              autoFocus
              placeholder="Write a reply… (Ctrl+Enter to post)"
              maxLength={2000}
              style={{ flex: 1, background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 8, color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: '8px 10px', outline: 'none', resize: 'none', minHeight: 52, lineHeight: 1.5 }}
              onFocus={e => { e.target.style.borderColor = C.accentDim; }}
              onBlur={e => { e.target.style.borderColor = C.border; }}
            />
            <button onClick={() => handlePostReply(c.id)} disabled={postingReply || !replyText.trim()}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, padding: '8px 14px', borderRadius: 8, background: replyText.trim() ? C.accent : C.bg2, color: replyText.trim() ? '#fff' : C.fg3, border: 'none', cursor: replyText.trim() ? 'pointer' : 'not-allowed', alignSelf: 'flex-end', flexShrink: 0 }}>
              {postingReply ? '…' : 'Reply'}
            </button>
          </div>
        )}

        {/* Nested replies */}
        {replies.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            {replies.map(r => renderComment(r, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 24 }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.fg3, marginBottom: 16 }}>
          Discussion · {topLevel.length} {topLevel.length === 1 ? 'comment' : 'comments'}
        </div>

        {loadError && (
          <div role="alert" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.danger, background: C.bg1, border: `1px solid ${alpha(C.danger, 33)}`, borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
            {loadError}
          </div>
        )}

        {!loadError && topLevel.length === 0 && (
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.fg3, background: C.bg1, border: `1px dashed ${C.border}`, borderRadius: 8, padding: '16px 18px', marginBottom: 16, textAlign: 'center' }}>
            No comments yet — start the discussion below.
          </div>
        )}

        <div role="log" aria-live="polite" aria-relevant="additions" aria-atomic="false"
          style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>
          {topLevel.map(c => renderComment(c, false))}
          <div ref={commentsEndRef} />
        </div>

        <div className="comment-row">
          <textarea
            ref={textareaRef}
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            onInput={e => {
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
