import { useState, useEffect, useRef, useMemo } from 'react'; // useRef kept for comments scroll
import { C, alpha } from '../tokens';
import { useAppData } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatText } from '../utils/textFormatter';
import { generatePlanSection, improveSummary } from '../utils/gemini';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import ConfirmModal from '../components/ConfirmModal';
import Badge from '../components/Badge';
import { CATEGORIES } from '../utils/categoryStyles';

function fileFromName(fileName) {
  if (!fileName.trim()) return null;
  const fn = fileName.trim();
  const ext = fn.split('.').pop().toLowerCase();
  const type = { pdf: 'PDF', doc: 'DOC', docx: 'DOCX' }[ext] || ext.toUpperCase();
  return { name: fn, fileName: fn, type, url: `${import.meta.env.BASE_URL}files/${encodeURIComponent(fn)}` };
}

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function FileCard({ file, onReplace, onRemove, editing }) {
  const isPdf = file.type === 'PDF';
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', marginTop: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: C.bg1, flexWrap: 'wrap' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" width="20" height="20" style={{ flexShrink: 0 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: C.fg1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg3, marginTop: 2 }}>
            {file.type}{file.size ? ` · ${formatSize(file.size)}` : ''}{file.uploadedAt ? ` · ${file.uploadedAt}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
          <a href={file.url} target="_blank" rel="noopener noreferrer"
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: C.accent, background: C.accentBg, border: `1px solid ${alpha(C.accent, 33)}`, borderRadius: 5, padding: '5px 12px', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            {isPdf ? 'View PDF' : 'Open'} ↗
          </a>
          <a href={file.url} download={file.name}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg2, background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 5, padding: '5px 12px', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Download ↓
          </a>
          {editing && (
            <>
              <button onClick={onReplace}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg2, background: 'none', border: `1px solid ${C.border}`, borderRadius: 5, padding: '5px 10px', cursor: 'pointer', whiteSpace: 'nowrap' }}>Replace</button>
              <button onClick={onRemove}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.danger, background: 'none', border: `1px solid ${alpha(C.danger, 33)}`, borderRadius: 5, padding: '5px 10px', cursor: 'pointer' }}>×</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const PLAN_CATEGORIES = CATEGORIES.slice(1);

const PLAN_STATUSES = [
  { value: 'draft',     label: 'Draft' },
  { value: 'active',    label: 'Active' },
  { value: 'in-review', label: 'In Review' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived',  label: 'Archived' },
];

function timeAgo(ts) {
  if (!ts) return '';
  const secs = Math.floor((Date.now() - ts.toMillis()) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export default function PlanDetailPage({ plan, onNavigate }) {
  const { updatePlan, deletePlan, restorePlan } = useAppData();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [title,        setTitle]        = useState(plan.title);
  const [summary,      setSummary]      = useState(plan.summary       || '');
  const [notes,        setNotes]        = useState(plan.notes         || '');
  const [category,     setCategory]     = useState(plan.category      || 'Business');
  const [status,       setStatus]       = useState(plan.status        || 'draft');
  const [sections,     setSections]     = useState(plan.sections      || []);
  const [attachedFile, setAttachedFile] = useState(plan.attachedFile  || null);
  const [attachedFileName, setAttachedFileName] = useState(plan.attachedFile?.fileName || plan.attachedFile?.name || '');
  const [isEditing, setIsEditing]   = useState(false);
  const [generatingIdx, setGeneratingIdx] = useState(null);
  const [improvingSummary, setImprovingSummary] = useState(false);
  const [confirmDel,    setConfirmDel]    = useState(false);
  const [confirmComDel, setConfirmComDel] = useState(null);

  // Discussion
  const [comments, setComments]       = useState([]);
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting]         = useState(false);
  const commentsEndRef                = useRef(null);
  const justPosted                    = useRef(false);
  const pagePadRef                    = useRef(null);

  useEffect(() => {
    const scroll = () => { pagePadRef.current?.scrollTo?.({ top: 0 }); window.scrollTo?.({ top: 0 }); };
    scroll();
    const t1 = setTimeout(scroll, 0);
    const t2 = setTimeout(scroll, 100);
    const t3 = setTimeout(scroll, 400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [plan.id]);

  const commentsPath = useMemo(
    () => collection(db, 'planDiscussions', String(plan.id), 'comments'),
    [plan.id]
  );

  useEffect(() => {
    const q = query(commentsPath, orderBy('timestamp', 'asc'));
    const unsub = onSnapshot(q,
      snap => setComments(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      () => {}
    );
    return () => unsub();
  }, [commentsPath]);

  useEffect(() => {
    if (justPosted.current) {
      justPosted.current = false;
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [comments]);

  const inputStyle = { background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6, color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: '9px 12px', outline: 'none', width: '100%', transition: 'border 150ms' };
  const labelStyle = { fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: C.fg2, marginBottom: 5, display: 'block' };
  const focus = e => { e.target.style.borderColor = C.accentDim; e.target.style.boxShadow = `0 0 0 2px ${alpha(C.accentDim, 33)}`; };
  const blur  = e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; };

  const updateSection = (i, field, val) => setSections(s => s.map((sec, idx) => idx === i ? { ...sec, [field]: val } : sec));
  const addSection    = () => setSections(s => [...s, { title: '', content: '' }]);
  const removeSection = (i) => setSections(s => s.filter((_, idx) => idx !== i));
  const moveSection   = (i, dir) => setSections(s => {
    const next = [...s];
    const j = i + dir;
    if (j < 0 || j >= next.length) return next;
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });

  const handleRemoveFile = () => { setAttachedFile(null); setAttachedFileName(''); };

  const handleSave = () => {
    const file = attachedFileName.trim() ? fileFromName(attachedFileName) : (attachedFile || null);
    updatePlan(plan.id, { title: title.trim(), summary: summary.trim(), notes: notes.trim(), category, status, sections, attachedFile: file });
    setAttachedFile(file);
    setIsEditing(false);
    showToast('Plan saved', 'success');
  };

  const handleCancel = () => {
    setTitle(plan.title);
    setSummary(plan.summary       || '');
    setNotes(plan.notes           || '');
    setCategory(plan.category     || 'Business');
    setStatus(plan.status         || 'draft');
    setSections(plan.sections     || []);
    setAttachedFile(plan.attachedFile || null);
    setAttachedFileName(plan.attachedFile?.fileName || plan.attachedFile?.name || '');
    setIsEditing(false);
  };

  const handleDelete = () => setConfirmDel(true);
  const confirmDeletePlan = () => {
    const backup = { ...plan, sections: [...(plan.sections || [])] };
    deletePlan(plan.id);
    showToast('Plan deleted', 'info', { label: 'Undo', onClick: () => restorePlan(backup) });
    onNavigate('plans');
  };

  const handleGenerateSection = async (i) => {
    const sec = sections[i];
    if (!sec.title.trim()) { showToast('Add a section title first', 'info'); return; }
    setGeneratingIdx(i);
    try {
      const result = await generatePlanSection(sec.title, title, sec.content);
      updateSection(i, 'content', result);
    } catch {
      showToast('AI generation failed. Check your connection.', 'error');
    } finally {
      setGeneratingIdx(null);
    }
  };

  const handleImproveSummary = async () => {
    if (!summary.trim()) { showToast('Add a summary first', 'info'); return; }
    setImprovingSummary(true);
    try {
      const result = await improveSummary(title, summary);
      setSummary(result);
    } catch {
      showToast('AI improvement failed. Check your connection.', 'error');
    } finally {
      setImprovingSummary(false);
    }
  };

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
      justPosted.current = true;
    } catch {
      showToast('Could not post comment. Check Firestore rules.', 'error');
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteComment = (commentId) => setConfirmComDel(commentId);
  const confirmDeleteComment = async () => {
    try {
      await deleteDoc(doc(db, 'planDiscussions', String(plan.id), 'comments', confirmComDel));
    } catch {
      showToast('Could not delete comment.', 'error');
    } finally {
      setConfirmComDel(null);
    }
  };

  return (
    <>
    <div ref={pagePadRef} className="page-pad" style={{ background: C.bg0 }}>
      <div style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <button onClick={() => onNavigate('plans')} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Business Plans
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          {!isEditing && (
            <button onClick={() => setIsEditing(true)}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: C.accent, background: C.accentBg, border: `1px solid ${alpha(C.accent, 33)}`, borderRadius: 5, cursor: 'pointer', padding: '5px 14px' }}>
              Edit
            </button>
          )}
          <button onClick={handleDelete}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.danger, background: 'none', border: `1px solid ${alpha(C.danger, 33)}`, borderRadius: 5, cursor: 'pointer', padding: '5px 12px' }}>
            Delete
          </button>
        </div>
      </div>

      <div>

        {/* ── VIEW MODE ── */}
        {!isEditing && (
          <>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Business Plan</div>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(20px,3vw,30px)', fontWeight: 700, color: C.fg1, letterSpacing: '-0.02em', lineHeight: 1.2, margin: '0 0 8px 0' }}>{plan.title}</h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: summary ? 20 : 32 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.fg3 }}>Updated {plan.updated} · {sections.length} sections</span>
              {category && (
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, color: C.fg3, background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 4, padding: '2px 8px' }}>{category}</span>
              )}
              <Badge status={status} />
            </div>

            {summary && (
              <div style={{ background: C.accentBg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 18px', marginBottom: notes ? 14 : 28 }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.fg3, marginBottom: 8 }}>Executive Summary</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{summary}</div>
              </div>
            )}
            {notes && (
              <div style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 18px', marginBottom: attachedFile ? 14 : 28 }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.fg3, marginBottom: 8 }}>Notes</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{notes}</div>
              </div>
            )}
            {attachedFile && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.fg3, marginBottom: 8 }}>Attached Document</div>
                <FileCard file={attachedFile} editing={false} />
              </div>
            )}

            {sections.length === 0 && (
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3, marginBottom: 32 }}>No sections yet. Click Edit to add sections.</div>
            )}
            {sections.map((sec, i) => (
              <div key={i} style={{ marginBottom: 28, paddingBottom: 28, borderBottom: i < sections.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 600, color: C.fg1, marginBottom: 10 }}>{sec.title}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.fg2, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{sec.content}</div>
              </div>
            ))}
          </>
        )}

        {/* ── EDIT MODE ── */}
        {isEditing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 28 }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Editing Business Plan</div>

            <div>
              <label style={labelStyle}>Plan Title</label>
              <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} onFocus={focus} onBlur={blur} />
            </div>

            <div>
              <label style={labelStyle}>Category</label>
              <select style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }} value={category} onChange={e => setCategory(e.target.value)}>
                {PLAN_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Status</label>
              <select style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }} value={status} onChange={e => setStatus(e.target.value)}>
                {PLAN_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Executive Summary</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {summary.trim() && (
                    <button type="button" onClick={() => setSummary(s => formatText(s))}
                      style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.accent, background: C.accentBg, border: `1px solid ${alpha(C.accent, 33)}`, borderRadius: 4, cursor: 'pointer', padding: '3px 9px' }}>
                      ✦ Format
                    </button>
                  )}
                  <button type="button" onClick={handleImproveSummary} disabled={improvingSummary}
                    style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: improvingSummary ? C.fg3 : '#fff', background: improvingSummary ? C.bg2 : C.accent, border: 'none', borderRadius: 4, cursor: improvingSummary ? 'not-allowed' : 'pointer', padding: '3px 10px' }}>
                    {improvingSummary ? 'Improving…' : '✦ AI Improve'}
                  </button>
                </div>
              </div>
              <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 100, lineHeight: 1.6 }} value={summary}
                onChange={e => setSummary(e.target.value)} onFocus={focus} onBlur={blur} />
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3, marginTop: 4 }}>{summary.length} characters</div>
            </div>

            <div>
              <label style={labelStyle}>Notes / Additional Description</label>
              <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 80, lineHeight: 1.6 }} value={notes}
                onChange={e => setNotes(e.target.value)} onFocus={focus} onBlur={blur}
                placeholder="Internal notes, observations, or additional context…" />
            </div>

            {/* File attachment — edit mode */}
            <div>
              <label style={labelStyle}>Attached Document (filename in public/files/)</label>
              {attachedFile && !attachedFileName && (
                <FileCard file={attachedFile} editing onReplace={() => setAttachedFile(null)} onRemove={handleRemoveFile} />
              )}
              {(!attachedFile || attachedFileName !== '') && (
                <>
                  <input style={inputStyle} value={attachedFileName}
                    onChange={e => setAttachedFileName(e.target.value)}
                    placeholder="e.g. coconut-plan.pdf"
                    onFocus={focus} onBlur={blur} />
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3, marginTop: 5, lineHeight: 1.5 }}>
                    Upload the file to your GitHub repo under <code style={{ fontFamily: "'JetBrains Mono', monospace", background: C.bg2, padding: '1px 4px', borderRadius: 3 }}>public/files/</code>, then enter the filename here.
                  </div>
                </>
              )}
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.fg3 }}>Sections ({sections.length})</div>
                <button onClick={addSection} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 500 }}>+ Add Section</button>
              </div>
              {sections.map((sec, i) => (
                <div key={i} style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 16px', marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg3 }}>Section {i + 1}</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {i > 0 && <button onClick={() => moveSection(i, -1)} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>↑</button>}
                      {i < sections.length - 1 && <button onClick={() => moveSection(i, 1)} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>↓</button>}
                      {sections.length > 1 && <button onClick={() => removeSection(i)} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.danger, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Remove</button>}
                    </div>
                  </div>
                  <input style={{ ...inputStyle, marginBottom: 10, background: C.bg0 }} value={sec.title}
                    onChange={e => updateSection(i, 'title', e.target.value)} placeholder="Section title" onFocus={focus} onBlur={blur} />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginBottom: 4 }}>
                    {sec.content.trim() && (
                      <button type="button" onClick={() => updateSection(i, 'content', formatText(sec.content))}
                        style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.accent, background: C.accentBg, border: `1px solid ${alpha(C.accent, 33)}`, borderRadius: 4, cursor: 'pointer', padding: '3px 9px' }}>
                        ✦ Format
                      </button>
                    )}
                    <button type="button" onClick={() => handleGenerateSection(i)} disabled={generatingIdx === i}
                      style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: generatingIdx === i ? C.fg3 : '#fff', background: generatingIdx === i ? C.bg2 : C.accent, border: 'none', borderRadius: 4, cursor: generatingIdx === i ? 'not-allowed' : 'pointer', padding: '3px 10px' }}>
                      {generatingIdx === i ? 'Generating…' : '✦ AI Generate'}
                    </button>
                  </div>
                  <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 100, lineHeight: 1.6, background: C.bg0 }} value={sec.content}
                    onChange={e => updateSection(i, 'content', e.target.value)} placeholder="Section content…" onFocus={focus} onBlur={blur} />
                  {sec.content.length > 0 && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: C.fg3, marginTop: 4 }}>{sec.content.length} characters</div>}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleSave}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '9px 20px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = C.accentDim}
                onMouseLeave={e => e.currentTarget.style.background = C.accent}>
                Save Changes
              </button>
              <button onClick={handleCancel}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: '9px 20px', borderRadius: 6, background: 'transparent', color: C.fg3, border: `1px solid ${C.border}`, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── DISCUSSION — always visible ── */}
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 24, marginTop: isEditing ? 0 : 8 }}>
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

          <div className="comment-row">
            <textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePostComment(); }}
              placeholder="Add a comment, question, or feedback… (Ctrl+Enter to post)"
              style={{ flex: 1, background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 8, color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: '10px 12px', outline: 'none', resize: 'vertical', minHeight: 72, lineHeight: 1.6, transition: 'border 150ms' }}
              onFocus={e => { e.target.style.borderColor = C.accentDim; e.target.style.boxShadow = `0 0 0 2px ${alpha(C.accentDim, 33)}`; }}
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
    </div>
    {confirmDel && (
      <ConfirmModal
        title="Delete business plan?"
        message="Are you sure you want to delete this business plan? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDeletePlan}
        onCancel={() => setConfirmDel(false)} />
    )}
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
