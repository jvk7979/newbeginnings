import { useState, useEffect, useRef } from 'react';
import { C } from '../tokens';
import Tag from '../components/Tag';
import { useAppData } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatText } from '../utils/textFormatter';
import { analyzeIdea } from '../utils/gemini';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';

function timeAgo(ts) {
  if (!ts) return '';
  const secs = Math.floor((Date.now() - ts.toMillis()) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

const STATUS_OPTIONS = ['draft', 'validating', 'active', 'archived'];

export default function IdeaDetailPage({ idea, onNavigate }) {
  const { updateIdea, deleteIdea, restoreIdea } = useAppData();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [status, setStatus]         = useState(idea.status);
  const [title, setTitle]           = useState(idea.title);
  const [tags, setTags]             = useState((idea.tags || []).join(', '));
  const [desc, setDesc]             = useState(idea.desc || '');
  const [notes, setNotes]           = useState(idea.notes || '');
  const [saved, setSaved]           = useState(false);
  const [analysis, setAnalysis]     = useState(null);
  const [analyzing, setAnalyzing]   = useState(false);
  const [comments, setComments]     = useState([]);
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting]       = useState(false);
  const commentsEndRef              = useRef(null);

  const commentsCol = collection(db, 'ideaDiscussions', String(idea.id), 'comments');

  useEffect(() => {
    const q = query(commentsCol, orderBy('timestamp', 'asc'));
    const unsub = onSnapshot(q, snap => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});
    return () => unsub();
  }, [idea.id]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handlePostComment = async () => {
    const text = commentText.trim();
    if (!text || posting) return;
    setPosting(true);
    try {
      await addDoc(commentsCol, {
        text,
        authorName: user.displayName || user.email || 'Anonymous',
        authorEmail: user.email || '',
        authorPhoto: user.photoURL || null,
        timestamp: serverTimestamp(),
      });
      setCommentText('');
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    await deleteDoc(doc(db, 'ideaDiscussions', String(idea.id), 'comments', commentId));
  };

  const inputStyle = { background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6, color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: '9px 12px', outline: 'none', width: '100%', transition: 'border 150ms' };
  const labelStyle = { fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: C.fg2, marginBottom: 5, display: 'block' };
  const focus = e => { e.target.style.borderColor = C.accentDim; e.target.style.boxShadow = `0 0 0 2px ${C.accentDim}33`; };
  const blur  = e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; };

  const handleSave = () => {
    updateIdea(idea.id, {
      title: title.trim(),
      status,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      desc: desc.trim(),
      notes: notes.trim(),
    });
    setSaved(true);
    showToast('Idea updated', 'success');
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAnalyze = async () => {
    if (!desc.trim() && !title.trim()) return;
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const result = await analyzeIdea(title, desc);
      setAnalysis(result);
    } catch {
      showToast('AI analysis failed. Check your connection.', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDelete = () => {
    if (!window.confirm('Delete this idea?')) return;
    const backup = { ...idea };
    deleteIdea(idea.id);
    showToast('Idea deleted', 'info', { label: 'Undo', onClick: () => restoreIdea(backup) });
    onNavigate('ideas');
  };

  return (
    <div className="page-pad" style={{ background: C.bg0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <button onClick={() => onNavigate('ideas')} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          All Ideas
        </button>
        <button onClick={handleDelete} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.danger, background: 'none', border: `1px solid ${C.danger}33`, borderRadius: 5, cursor: 'pointer', padding: '5px 12px' }}>Delete</button>
      </div>

      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Idea</div>

      <div style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label style={labelStyle}>Title</label>
          <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} onFocus={focus} onBlur={blur} />
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={labelStyle}>Stage</label>
            <select style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }} value={status} onChange={e => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div style={{ flex: 2, minWidth: 220 }}>
            <label style={labelStyle}>Tags (comma separated)</label>
            <input style={inputStyle} value={tags} onChange={e => setTags(e.target.value)} placeholder="Manufacturing, Export, Agri…" onFocus={focus} onBlur={blur} />
          </div>
        </div>

        {tags && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {tags.split(',').map(t => t.trim()).filter(Boolean).map(t => <Tag key={t} label={t} />)}
          </div>
        )}

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Description</label>
            {desc.trim() && (
              <button type="button" onClick={() => setDesc(d => formatText(d))}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.accent, background: C.accentBg, border: `1px solid ${C.accent}33`, borderRadius: 4, cursor: 'pointer', padding: '3px 9px' }}>
                ✦ Format
              </button>
            )}
          </div>
          <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 120, lineHeight: 1.6 }} value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="Problem being solved, target customer, rough mechanics…"
            onFocus={focus} onBlur={blur} />
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3, marginTop: 4 }}>{desc.length} characters · Captured {idea.date}</div>
        </div>

        {/* AI Analysis */}
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: analysis ? 14 : 0 }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.fg3 }}>AI Analysis</div>
            <button onClick={handleAnalyze} disabled={analyzing}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: analyzing ? C.fg3 : '#fff', background: analyzing ? C.bg2 : C.accent, border: 'none', borderRadius: 5, cursor: analyzing ? 'not-allowed' : 'pointer', padding: '6px 14px', transition: 'all 150ms' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              {analyzing ? 'Analyzing…' : 'Analyze with AI'}
            </button>
          </div>
          {analysis && (
            <div style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 8, padding: '16px 18px', whiteSpace: 'pre-wrap', fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2, lineHeight: 1.7 }}>
              {analysis}
            </div>
          )}
        </div>

        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20 }}>
          <label style={labelStyle}>Notes & Next Steps</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            style={{ ...inputStyle, resize: 'vertical', minHeight: 100, lineHeight: 1.6 }}
            placeholder="Open questions, validation ideas, next steps…"
            onFocus={focus} onBlur={blur} />
        </div>

        <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
          <button
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '9px 20px', borderRadius: 6, background: saved ? C.success : C.accent, color: '#fff', border: 'none', cursor: 'pointer', transition: 'background 200ms' }}
            onMouseEnter={e => { if (!saved) e.currentTarget.style.background = C.accentDim; }}
            onMouseLeave={e => { e.currentTarget.style.background = saved ? C.success : C.accent; }}
            onClick={handleSave}>{saved ? 'Saved!' : 'Save Changes'}</button>
          <button style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: '9px 20px', borderRadius: 6, background: 'transparent', color: C.fg3, border: `1px solid ${C.border}`, cursor: 'pointer' }}
            onClick={() => onNavigate('ideas')}>Back</button>
        </div>

        {/* Discussion */}
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 24 }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.fg3, marginBottom: 16 }}>
            Discussion · {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
          </div>

          {comments.length === 0 && (
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, background: C.bg1, border: `1px dashed ${C.border}`, borderRadius: 8, padding: '16px 18px', marginBottom: 16, textAlign: 'center' }}>
              No comments yet — start the discussion below.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            {comments.map(c => {
              const initial = (c.authorName || '?')[0].toUpperCase();
              const isOwn = c.authorEmail === user.email;
              return (
                <div key={c.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  {c.authorPhoto
                    ? <img src={c.authorPhoto} alt="" width={30} height={30} style={{ borderRadius: '50%', flexShrink: 0, marginTop: 2 }} />
                    : <div style={{ width: 30, height: 30, borderRadius: '50%', background: C.accent, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, marginTop: 2 }}>{initial}</div>
                  }
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: C.fg1 }}>{c.authorName}</span>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3 }}>{timeAgo(c.timestamp)}</span>
                      {isOwn && (
                        <button onClick={() => handleDeleteComment(c.id)}
                          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.danger, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 'auto' }}>
                          Delete
                        </button>
                      )}
                    </div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2, lineHeight: 1.6, background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {c.text}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={commentsEndRef} />
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePostComment(); }}
              placeholder="Add a comment, brainstorm point, or question… (Ctrl+Enter to post)"
              style={{ flex: 1, background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 8, color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: '10px 12px', outline: 'none', resize: 'vertical', minHeight: 72, lineHeight: 1.6, transition: 'border 150ms' }}
              onFocus={e => { e.target.style.borderColor = C.accentDim; e.target.style.boxShadow = `0 0 0 2px ${C.accentDim}33`; }}
              onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }}
            />
            <button onClick={handlePostComment} disabled={posting || !commentText.trim()}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '10px 18px', borderRadius: 8, background: posting || !commentText.trim() ? C.bg2 : C.accent, color: posting || !commentText.trim() ? C.fg3 : '#fff', border: 'none', cursor: posting || !commentText.trim() ? 'not-allowed' : 'pointer', transition: 'all 150ms', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {posting ? 'Posting…' : 'Post'}
            </button>
          </div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3, marginTop: 6 }}>Visible to all signed-in family members.</div>
        </div>
      </div>
    </div>
  );
}
