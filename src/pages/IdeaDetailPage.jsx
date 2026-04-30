import { useState, useEffect, useRef } from 'react';
import { C, alpha } from '../tokens';
import { getCategoryStyle, IDEA_CATEGORIES } from '../utils/categoryStyles';
import { useIdeas } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { formatText } from '../utils/textFormatter';
import { analyzeIdea } from '../utils/gemini';
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
      let file = attachedFile;
      if (pendingFile) {
        if (attachedFile?.blobId) deleteFileFromDB(attachedFile.blobId);
        file = await uploadFileToDB(pendingFile);
      } else if (replacingFile && !pendingFile) {
        if (attachedFile?.blobId) deleteFileFromDB(attachedFile.blobId);
        file = null;
      }
      const cleanSources = sources.map(s => (s || '').trim()).filter(Boolean);
      updateIdea(idea.id, { title: title.trim(), status, category: category || '', desc: desc.trim(), notes: notes.trim(), sources: cleanSources, attachedFile: file });
      setAttachedFile(file);
      setPendingFile(null);
      setReplacingFile(false);
      showToast('Idea updated', 'success');
      setIsEditing(false);
    } catch {
      showToast('Failed to upload file. Please try again.', 'error');
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          All Ideas
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          {!isEditing && (
            <button onClick={() => setIsEditing(true)}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: C.accent, background: C.accentBg, border: `1px solid ${alpha(C.accent, 33)}`, borderRadius: 5, cursor: 'pointer', padding: '5px 14px' }}>
              Edit
            </button>
          )}
          <button onClick={handleDelete}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.danger, background: 'none', border: `1px solid ${alpha(C.danger, 33)}`, borderRadius: 5, cursor: 'pointer', padding: '5px 12px' }}>
            Delete
          </button>
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
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
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
              <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} onFocus={focus} onBlur={blur} />
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
                onRemove={handleRemoveFile} />
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
