import { useState, useEffect, useRef } from 'react';
import { C, alpha } from '../tokens';
import { getCategoryStyle, IDEA_CATEGORIES } from '../utils/categoryStyles';
import { useIdeas } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { formatText } from '../utils/textFormatter';
import { analyzeIdea, generatePlanSection } from '../utils/gemini';
import ConfirmModal from '../components/ConfirmModal';
import AttachedFileViewer from '../components/AttachedFileViewer';
import AttachmentEditor from '../components/AttachmentEditor';
import DiscussionThread from '../components/DiscussionThread';
import { SourcesEditor, SourcesView } from '../components/SourcesField';
import { uploadFileToDB, deleteFileFromDB } from '../utils/fileStorage';

const STATUS_BADGE = {
  draft:      { bg: C.bg2,      color: C.fg3,      label: 'Draft' },
  validating: { bg: '#FFF3CD',  color: '#92700A',  label: 'Validating' },
  active:     { bg: '#D4EDDA',  color: '#1E6B3A',  label: 'Active' },
  archived:   { bg: C.bg2,      color: C.fg3,      label: 'Archived' },
};

const STATUS_OPTIONS = ['draft', 'validating', 'active', 'archived'];

export default function IdeaDetailPage({ idea, onNavigate }) {
  const { updateIdea, deleteIdea, restoreIdea } = useIdeas();
  const { showToast } = useToast();
  const { isViewer } = useAuth();

  // Edit form state — mirrors idea fields
  const [isEditing, setIsEditing]     = useState(false);
  const [status, setStatus]           = useState(idea.status);
  const [title, setTitle]             = useState(idea.title);
  const [category, setCategory]       = useState(idea.category || '');
  const [desc, setDesc]               = useState(idea.desc || '');
  const [notes, setNotes]             = useState(idea.notes || '');
  const [sources, setSources]         = useState(Array.isArray(idea.sources) ? idea.sources : []);
  const [attachedFile, setAttachedFile] = useState(idea.attachedFile || null);
  const [pendingFile,  setPendingFile]  = useState(null);
  const [replacingFile, setReplacingFile] = useState(false);
  const [saving, setSaving]           = useState(false);
  const [sections,     setSections]     = useState(idea.sections || []);
  const [editingSecIdx,   setEditingSecIdx]   = useState(null);
  const [editingSecDraft, setEditingSecDraft] = useState(null);
  const [dragIdx,         setDragIdx]         = useState(null);
  const [dragOverIdx,     setDragOverIdx]     = useState(null);
  const [generatingIdx,   setGeneratingIdx]   = useState(null);
  const [analysis, setAnalysis]       = useState(null);
  const [analyzing, setAnalyzing]     = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const pagePadRef = useRef(null);

  // Force scroll to top whenever we open a new idea — guards against any
  // late-firing scroll, browser hash-jumps, or stale scroll position.
  useEffect(() => {
    const scroll = () => { pagePadRef.current?.scrollTo?.({ top: 0 }); window.scrollTo?.({ top: 0 }); };
    scroll();
    const t1 = setTimeout(scroll, 0);
    const t2 = setTimeout(scroll, 100);
    const t3 = setTimeout(scroll, 400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [idea.id]);

  const inputStyle = { background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6, color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 16, padding: '9px 12px', outline: 'none', width: '100%', transition: 'border 150ms' };
  const labelStyle = { fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: C.fg2, marginBottom: 5, display: 'block' };
  const focus = e => { e.target.style.borderColor = C.accentDim; e.target.style.boxShadow = `0 0 0 2px ${alpha(C.accentDim, 33)}`; };
  const blur  = e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; };

  const handleRemoveFile = () => { setAttachedFile(null); setPendingFile(null); setReplacingFile(false); };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Order matters here:
      //   1. Upload the NEW blob first (if any).
      //   2. Commit the Firestore record — and await it so a rules
      //      rejection / network drop surfaces in the catch instead of
      //      a silent unhandled-promise-rejection.
      //   3. Only then delete the OLD blob — best-effort, swallowed on
      //      failure since the orphan scan can clean it up later.
      // Previously the old blob was deleted *before* the new upload
      // started; if the upload then failed, the user lost both files.
      let nextFile     = attachedFile;
      let blobToDelete = null;
      if (pendingFile) {
        nextFile     = await uploadFileToDB(pendingFile);
        blobToDelete = attachedFile?.blobId || null;
      }
      // NOTE: replacingFile && !pendingFile is intentionally a NO-OP. The
      // user clicked Replace and then either cancelled or saved without
      // picking a new file — preserve the existing attachment instead of
      // silently deleting it. The only way to clear the file is the
      // explicit Remove button (which calls handleRemoveFile and sets
      // attachedFile to null directly).
      const cleanSources = sources.map(s => (s || '').trim()).filter(Boolean);
      await updateIdea(idea.id, { title: title.trim(), status, category: category || '', desc: desc.trim(), notes: notes.trim(), sources: cleanSources, sections, attachedFile: nextFile });
      if (blobToDelete) {
        try { await deleteFileFromDB(blobToDelete); }
        catch (e) { console.warn('[orphan blob]', blobToDelete, e); }
      }
      setAttachedFile(nextFile);
      setPendingFile(null);
      setReplacingFile(false);
      showToast('Idea updated', 'success');
      setIsEditing(false);
    } catch (err) {
      console.error('[saveIdea]', err);
      showToast(err?.message || 'Failed to save. Please try again.', 'error');
      // Stay in edit mode so the user can retry without losing their input.
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setTitle(idea.title);
    setStatus(idea.status);
    setCategory(idea.category || '');
    setDesc(idea.desc || '');
    setNotes(idea.notes || '');
    setSources(Array.isArray(idea.sources) ? idea.sources : []);
    setSections(idea.sections || []);
    setAttachedFile(idea.attachedFile || null);
    setPendingFile(null);
    setReplacingFile(false);
    setIsEditing(false);
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

  const toggleSectionDone = async (i) => {
    const next = sections.map((s, idx) => idx === i ? { ...s, done: !s.done } : s);
    setSections(next);
    await updateIdea(idea.id, { sections: next });
  };

  const handleSaveSection = async (i, draft) => {
    const next = sections.map((s, idx) => idx === i ? { ...s, ...draft } : s);
    setSections(next);
    setEditingSecIdx(null);
    setEditingSecDraft(null);
    await updateIdea(idea.id, { sections: next });
    showToast('Section saved', 'success');
  };

  const handleDeleteSection = async (i) => {
    const next = sections.filter((_, idx) => idx !== i);
    setSections(next);
    await updateIdea(idea.id, { sections: next });
    showToast('Section deleted', 'info');
  };

  const handleDrop = async (dropIdx) => {
    if (dragIdx === null || dragIdx === dropIdx) { setDragIdx(null); setDragOverIdx(null); return; }
    const next = [...sections];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(dropIdx, 0, moved);
    setSections(next);
    setDragIdx(null);
    setDragOverIdx(null);
    await updateIdea(idea.id, { sections: next });
    showToast('Sections reordered', 'success');
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

  const handleDelete = () => setConfirmDel(true);
  const confirmDeleteIdea = () => {
    const backup = { ...idea };
    deleteIdea(idea.id);
    showToast('Idea deleted', 'info', { label: 'Undo', onClick: () => restoreIdea(backup) });
    onNavigate('ideas');
  };

  const badge = STATUS_BADGE[idea.status] || STATUS_BADGE.draft;
  const cat = getCategoryStyle(idea.category);

  return (
    <>
    <div ref={pagePadRef} className="page-pad" style={{ background: C.bg0 }}>
      <div style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <button onClick={() => onNavigate('ideas')}
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
          <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          All Ideas
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          {!isEditing && (
            <button onClick={() => setIsEditing(true)}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: C.accent, background: C.accentBg, border: `1px solid ${alpha(C.accent, 33)}`, borderRadius: 5, cursor: 'pointer', padding: '5px 14px' }}>
              Edit
            </button>
          )}
          {!isViewer && (
            <button onClick={handleDelete}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.danger, background: 'none', border: `1px solid ${alpha(C.danger, 33)}`, borderRadius: 5, cursor: 'pointer', padding: '5px 12px' }}>
              Delete
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* ── VIEW MODE ── */}
        {!isEditing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
            <div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Idea</div>
              <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(20px,3vw,28px)', fontWeight: 700, color: C.fg1, margin: '0 0 10px 0', lineHeight: 1.25 }}>{idea.title}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: badge.bg, color: badge.color }}>{badge.label}</span>
                {idea.category && (
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: cat.color, background: cat.bg, padding: '2px 8px', borderRadius: 4 }}>{idea.category}</span>
                )}
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, marginLeft: 'auto' }}>Captured {idea.date}</span>
              </div>
            </div>

            {sections.length > 0 && (
              <div style={{ marginBottom: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.fg3 }}>Progress</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.fg3 }}>{sections.filter(s => s.done).length} / {sections.length}</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: C.bg2, overflow: 'hidden', marginBottom: 20 }}>
                  <div style={{ height: '100%', borderRadius: 3, background: C.accent, width: `${(sections.filter(s => s.done).length / sections.length) * 100}%`, transition: 'width 350ms ease' }} />
                </div>
              </div>
            )}

            {sections.map((sec, i) => (
              editingSecIdx === i ? (
                <div key={i} style={{ background: C.bg1, border: `1px solid ${C.accentDim}`, borderRadius: 10, padding: '16px 18px', marginBottom: 20, boxShadow: `0 0 0 2px ${alpha(C.accentDim, 22)}` }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.fg3, marginBottom: 10 }}>Section {i + 1}</div>
                  <input autoFocus value={editingSecDraft.title} onChange={e => setEditingSecDraft(d => ({ ...d, title: e.target.value }))} placeholder="Section title" style={{ ...inputStyle, marginBottom: 10, fontFamily: "'Playfair Display', Georgia, serif", fontSize: 17 }} onFocus={focus} onBlur={blur} />
                  <textarea value={editingSecDraft.content} onChange={e => setEditingSecDraft(d => ({ ...d, content: e.target.value }))} placeholder="Section content…" style={{ ...inputStyle, resize: 'vertical', minHeight: 120, lineHeight: 1.7 }} onFocus={focus} onBlur={blur} />
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10, flexWrap: 'wrap' }}>
                    <button onClick={() => { setEditingSecIdx(null); setEditingSecDraft(null); }} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg2, background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 6, padding: '7px 16px', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={() => handleSaveSection(i, editingSecDraft)} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: '#fff', background: C.accent, border: 'none', borderRadius: 6, padding: '7px 18px', cursor: 'pointer' }}>Save</button>
                  </div>
                </div>
              ) : (
                <div key={i} draggable onDragStart={() => setDragIdx(i)} onDragOver={e => { e.preventDefault(); setDragOverIdx(i); }} onDragLeave={() => setDragOverIdx(prev => prev === i ? null : prev)} onDrop={() => handleDrop(i)} onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                  style={{ marginBottom: 28, paddingBottom: 28, borderBottom: i < sections.length - 1 ? `1px solid ${C.border}` : 'none', opacity: dragIdx === i ? 0.4 : 1, outline: dragOverIdx === i && dragIdx !== i ? `2px solid ${C.accentDim}` : 'none', borderRadius: dragOverIdx === i && dragIdx !== i ? 8 : 0, transition: 'opacity 150ms' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <div role="img" aria-hidden="true" title="Drag to reorder" style={{ cursor: 'grab', color: C.fg3, flexShrink: 0, paddingTop: 6, fontSize: 17, lineHeight: 1, userSelect: 'none', touchAction: 'none', minWidth: 20 }}>⠿</div>
                    <button aria-label={sec.done ? `Mark "${sec.title}" incomplete` : `Mark "${sec.title}" complete`} onClick={() => toggleSectionDone(i)} style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 8, marginTop: -10, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                      <span style={{ width: 20, height: 20, borderRadius: 5, flexShrink: 0, border: `2px solid ${sec.done ? C.accent : C.border}`, background: sec.done ? C.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {sec.done && <svg viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="10" height="10"><polyline points="2 6 5 9 10 3"/></svg>}
                      </span>
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 600, color: sec.done ? C.fg3 : C.fg1, textDecoration: sec.done ? 'line-through' : 'none', lineHeight: 1.3, marginBottom: 8 }}>{sec.title}</div>
                        <div style={{ display: 'flex', flexShrink: 0, marginTop: -8, marginRight: -8 }}>
                          <button aria-label={`Edit section: ${sec.title}`} onClick={() => { setEditingSecIdx(i); setEditingSecDraft({ title: sec.title, content: sec.content }); }} style={{ width: 44, height: 44, borderRadius: 8, border: 'none', background: 'transparent', color: C.fg3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseEnter={e => { e.currentTarget.style.background = C.bg2; e.currentTarget.style.color = C.accent; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.fg3; }}>
                            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          {!isViewer && (
                            <button aria-label={`Delete section: ${sec.title}`} onClick={() => handleDeleteSection(i)} style={{ width: 44, height: 44, borderRadius: 8, border: 'none', background: 'transparent', color: C.fg3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseEnter={e => { e.currentTarget.style.background = C.bg2; e.currentTarget.style.color = C.danger; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.fg3; }}>
                              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                            </button>
                          )}
                        </div>
                      </div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, color: sec.done ? C.fg3 : C.fg2, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{sec.content}</div>
                    </div>
                  </div>
                </div>
              )
            ))}

            {idea.desc && (
              <div style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 8, padding: '16px 18px' }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: C.fg3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Description</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: C.fg2, lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{idea.desc}</div>
              </div>
            )}

            {idea.notes && (
              <div style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 8, padding: '16px 18px' }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: C.fg3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Notes & Next Steps</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: C.fg2, lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{idea.notes}</div>
              </div>
            )}

            {Array.isArray(idea.sources) && idea.sources.filter(s => (s || '').trim()).length > 0 && (
              <div style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 8, padding: '16px 18px' }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: C.fg3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Sources</div>
                <SourcesView sources={idea.sources} />
              </div>
            )}

            {attachedFile && (
              <div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: C.fg3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Attached Document</div>
                <AttachedFileViewer file={attachedFile} editing={false} />
              </div>
            )}

            {/* AI Analysis in view mode */}
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: analysis ? 14 : 0 }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.fg3 }}>AI Analysis</div>
                <button onClick={handleAnalyze} disabled={analyzing}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: analyzing ? C.fg3 : '#fff', background: analyzing ? C.bg2 : C.accent, border: 'none', borderRadius: 5, cursor: analyzing ? 'not-allowed' : 'pointer', padding: '6px 14px', transition: 'all 150ms' }}>
                  <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                  {analyzing ? 'Analyzing…' : 'Analyze with AI'}
                </button>
              </div>
              {analysis && (
                <div style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 8, padding: '16px 18px', whiteSpace: 'pre-wrap', fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: C.fg2, lineHeight: 1.7, marginTop: 14 }}>
                  {analysis}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── EDIT MODE ── */}
        {isEditing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 28 }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Editing Idea</div>

            <div>
              <label style={labelStyle}>Title</label>
              <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} maxLength={120} onFocus={focus} onBlur={blur} />
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <label style={labelStyle}>Stage</label>
                <div className="select-wrap">
                  <select style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }} value={status} onChange={e => setStatus(e.target.value)}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <label style={labelStyle}>Category</label>
                <div className="select-wrap">
                  <select style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }} value={category} onChange={e => setCategory(e.target.value)}>
                    <option value="">— None —</option>
                    {IDEA_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Description</label>
                {desc.trim() && (
                  <button type="button" onClick={() => setDesc(d => formatText(d))}
                    style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.accent, background: C.accentBg, border: `1px solid ${alpha(C.accent, 33)}`, borderRadius: 4, cursor: 'pointer', padding: '3px 9px' }}>
                    ✦ Format
                  </button>
                )}
              </div>
              <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 120, lineHeight: 1.6 }} value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="Problem being solved, target customer, rough mechanics…"
                onFocus={focus} onBlur={blur} />
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, marginTop: 4 }}>{desc.length} characters · Captured {idea.date}</div>
            </div>

            <div>
              <label style={labelStyle}>Notes & Next Steps</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                style={{ ...inputStyle, resize: 'vertical', minHeight: 100, lineHeight: 1.6 }}
                placeholder="Open questions, validation ideas, next steps…"
                onFocus={focus} onBlur={blur} />
            </div>

            <div>
              <label style={labelStyle}>Sources</label>
              <SourcesEditor sources={sources} onChange={setSources} />
            </div>

            <div>
              <label style={labelStyle}>Attached Document</label>
              <AttachmentEditor
                attachedFile={attachedFile}
                pendingFile={pendingFile}
                replacingFile={replacingFile}
                onPendingFile={setPendingFile}
                onReplaceClick={() => setReplacingFile(true)}
                onCancelReplace={() => { setReplacingFile(false); setPendingFile(null); }}
                onRemove={handleRemoveFile} />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.fg3 }}>Sections ({sections.length})</div>
                <button onClick={addSection} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 500 }}>+ Add Section</button>
              </div>
              {sections.map((sec, i) => (
                <div key={i} style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 16px', marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: C.fg3 }}>Section {i + 1}</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {i > 0 && <button onClick={() => moveSection(i, -1)} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>↑</button>}
                      {i < sections.length - 1 && <button onClick={() => moveSection(i, 1)} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>↓</button>}
                      <button onClick={() => removeSection(i)} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.danger, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Remove</button>
                    </div>
                  </div>
                  <input style={{ ...inputStyle, marginBottom: 10, background: C.bg0 }} value={sec.title}
                    onChange={e => updateSection(i, 'title', e.target.value)} placeholder="Section title" onFocus={focus} onBlur={blur} />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginBottom: 4 }}>
                    <button type="button" onClick={() => handleGenerateSection(i)} disabled={generatingIdx === i}
                      style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: generatingIdx === i ? C.fg3 : '#fff', background: generatingIdx === i ? C.bg2 : C.accent, border: 'none', borderRadius: 4, cursor: generatingIdx === i ? 'not-allowed' : 'pointer', padding: '3px 10px' }}>
                      {generatingIdx === i ? 'Generating…' : '✦ AI Generate'}
                    </button>
                  </div>
                  <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 100, lineHeight: 1.6, background: C.bg0 }} value={sec.content}
                    onChange={e => updateSection(i, 'content', e.target.value)} placeholder="Section content…" onFocus={focus} onBlur={blur} />
                  {sec.content.length > 0 && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, marginTop: 4 }}>{sec.content.length} characters</div>}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleSave} disabled={saving}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500, padding: '9px 20px', borderRadius: 6, background: saving ? C.bg2 : C.accent, color: saving ? C.fg3 : '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}
                onMouseEnter={e => { if (!saving) e.currentTarget.style.background = C.accentDim; }}
                onMouseLeave={e => { if (!saving) e.currentTarget.style.background = C.accent; }}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button onClick={handleCancel}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, padding: '9px 20px', borderRadius: 6, background: 'transparent', color: C.fg3, border: `1px solid ${C.border}`, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── DISCUSSION ── always visible */}
        <DiscussionThread collectionName="ideaDiscussions" docId={idea.id} />
      </div>
      </div>
    </div>
    {confirmDel && (
      <ConfirmModal
        title="Delete idea?"
        message="Are you sure you want to delete this idea? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDeleteIdea}
        onCancel={() => setConfirmDel(false)} />
    )}
    </>
  );
}
