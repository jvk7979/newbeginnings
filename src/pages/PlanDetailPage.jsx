import { useState, useEffect, useRef } from 'react';
import { C, alpha } from '../tokens';
import { usePlans } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { formatText } from '../utils/textFormatter';
import { generatePlanSection, improveSummary } from '../utils/gemini';
import ConfirmModal from '../components/ConfirmModal';
import Badge from '../components/Badge';
import AttachedFileViewer from '../components/AttachedFileViewer';
import AttachmentEditor from '../components/AttachmentEditor';
import DiscussionThread from '../components/DiscussionThread';
import { SourcesEditor, SourcesView } from '../components/SourcesField';
import { uploadFileToDB, deleteFileFromDB, mimeForType, fetchFileBlob } from '../utils/fileStorage';
import { generateSummaryFromFile, isSummarySupported } from '../utils/aiSummary';
import { CATEGORIES } from '../utils/categoryStyles';

const PLAN_CATEGORIES = CATEGORIES.slice(1);

const PLAN_STATUSES = [
  { value: 'draft',     label: 'Draft' },
  { value: 'active',    label: 'Active' },
  { value: 'in-review', label: 'In Review' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived',  label: 'Archived' },
];

export default function PlanDetailPage({ plan, onNavigate }) {
  const { updatePlan, deletePlan, restorePlan } = usePlans();
  const { showToast } = useToast();

  const [title,        setTitle]        = useState(plan.title);
  const [summary,      setSummary]      = useState(plan.summary       || '');
  const [notes,        setNotes]        = useState(plan.notes         || '');
  const [category,     setCategory]     = useState(plan.category      || 'Business');
  const [status,       setStatus]       = useState(plan.status        || 'draft');
  const [sections,     setSections]     = useState(plan.sections      || []);
  const [sources,      setSources]      = useState(Array.isArray(plan.sources) ? plan.sources : []);
  const [attachedFile, setAttachedFile] = useState(plan.attachedFile  || null);
  const [pendingFile,  setPendingFile]  = useState(null);
  const [replacingFile, setReplacingFile] = useState(false);
  const [saving, setSaving]           = useState(false);
  const [isEditing, setIsEditing]     = useState(false);
  const [generatingIdx, setGeneratingIdx] = useState(null);
  const [improvingSummary, setImprovingSummary] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const pagePadRef = useRef(null);
  const [editingSecIdx,   setEditingSecIdx]   = useState(null);
  const [editingSecDraft, setEditingSecDraft] = useState(null);
  const [dragIdx,         setDragIdx]         = useState(null);
  const [dragOverIdx,     setDragOverIdx]     = useState(null);

  useEffect(() => {
    const scroll = () => { pagePadRef.current?.scrollTo?.({ top: 0 }); window.scrollTo?.({ top: 0 }); };
    scroll();
    const t1 = setTimeout(scroll, 0);
    const t2 = setTimeout(scroll, 100);
    const t3 = setTimeout(scroll, 400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [plan.id]);

  const inputStyle = { background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6, color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 16, padding: '9px 12px', outline: 'none', width: '100%', transition: 'border 150ms' };
  const labelStyle = { fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: C.fg2, marginBottom: 5, display: 'block' };
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
      // NOTE: replacingFile && !pendingFile is intentionally a NO-OP — see
      // IdeaDetailPage.handleSave for the full reasoning. Clearing an
      // attachment requires an explicit Remove click, never a save with
      // an unconfirmed replace.
      const cleanSources = sources.map(s => (s || '').trim()).filter(Boolean);
      await updatePlan(plan.id, { title: title.trim(), summary: summary.trim(), notes: notes.trim(), category, status, sections, sources: cleanSources, attachedFile: nextFile });
      if (blobToDelete) {
        try { await deleteFileFromDB(blobToDelete); }
        catch (e) { console.warn('[orphan blob]', blobToDelete, e); }
      }
      setAttachedFile(nextFile);
      setPendingFile(null);
      setReplacingFile(false);
      setIsEditing(false);
      showToast('Plan saved', 'success');
    } catch (err) {
      console.error('[savePlan]', err);
      showToast(err?.message || 'Failed to save. Please try again.', 'error');
      // Stay in edit mode so the user can retry without losing their input.
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setTitle(plan.title);
    setSummary(plan.summary       || '');
    setNotes(plan.notes           || '');
    setCategory(plan.category     || 'Business');
    setStatus(plan.status         || 'draft');
    setSections(plan.sections     || []);
    setSources(Array.isArray(plan.sources) ? plan.sources : []);
    setAttachedFile(plan.attachedFile || null);
    setPendingFile(null);
    setReplacingFile(false);
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

  const handleGenerateSummary = async () => {
    let fileToUse = null;
    if (pendingFile) {
      fileToUse = pendingFile;
    } else if (attachedFile?.blobId) {
      try {
        const blob = await fetchFileBlob(attachedFile);
        fileToUse = new File([blob], attachedFile.name || 'document', { type: mimeForType(attachedFile.type) });
      } catch (err) {
        console.error('[fetchFileBlob]', err);
        showToast(`Could not load file: ${err?.code || err?.message || 'unknown error'}`, 'error');
        return;
      }
    } else {
      showToast('Attach a document first.', 'info');
      return;
    }
    setGeneratingSummary(true);
    try {
      const result = await generateSummaryFromFile(fileToUse);
      setSummary(result);
      showToast('AI summary generated', 'success');
    } catch (err) {
      showToast(err?.message || 'AI summary failed. Check your connection.', 'error');
    } finally {
      setGeneratingSummary(false);
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

  const escHtml = (s) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const toggleSectionDone = async (i) => {
    const next = sections.map((s, idx) => idx === i ? { ...s, done: !s.done } : s);
    setSections(next);
    await updatePlan(plan.id, { sections: next });
  };

  const handleSaveSection = async (i, draft) => {
    const next = sections.map((s, idx) => idx === i ? { ...s, ...draft } : s);
    setSections(next);
    setEditingSecIdx(null);
    setEditingSecDraft(null);
    await updatePlan(plan.id, { sections: next });
    showToast('Section saved', 'success');
  };

  const handleDrop = async (dropIdx) => {
    if (dragIdx === null || dragIdx === dropIdx) { setDragIdx(null); setDragOverIdx(null); return; }
    const next = [...sections];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(dropIdx, 0, moved);
    setSections(next);
    setDragIdx(null);
    setDragOverIdx(null);
    await updatePlan(plan.id, { sections: next });
    showToast('Sections reordered', 'success');
  };

  const handleDeleteSection = async (i) => {
    const next = sections.filter((_, idx) => idx !== i);
    setSections(next);
    await updatePlan(plan.id, { sections: next });
    showToast('Section deleted', 'info');
  };

  const handleExportPDF = () => {
    const w = window.open('', '_blank');
    if (!w) { showToast('Allow pop-ups to export PDF', 'info'); return; }
    const doneCount = sections.filter(s => s.done).length;
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escHtml(title)}</title>
      <style>
        body{font-family:Georgia,serif;max-width:700px;margin:40px auto;padding:0 20px;color:#1a1a1a;line-height:1.6}
        h1{font-size:26px;font-weight:700;margin-bottom:6px}
        .meta{font-size:13px;color:#666;margin-bottom:22px}
        .summary{background:#f5f3ff;border-left:3px solid #7c3aed;padding:12px 16px;margin-bottom:22px;border-radius:4px;font-size:15px;white-space:pre-wrap}
        h2{font-size:19px;font-weight:600;margin:28px 0 6px}
        .done-tag{font-size:12px;font-weight:400;color:#16a34a;margin-left:8px}
        .content{font-size:15px;white-space:pre-wrap;margin-top:6px}
        hr{border:none;border-top:1px solid #e5e7eb;margin:20px 0}
        @media print{@page{margin:20mm}body{margin:0}}
      </style>
    </head><body>
    <h1>${escHtml(title)}</h1>
    <div class="meta">${escHtml(category)} · ${escHtml(status)} · Updated ${escHtml(plan.updated)}${sections.length ? ` · ${doneCount}/${sections.length} complete` : ''}</div>
    ${summary ? `<div class="summary"><strong>Executive Summary</strong><br><br>${escHtml(summary)}</div>` : ''}
    ${notes ? `<hr><p><strong>Notes</strong></p><p style="white-space:pre-wrap;font-size:15px">${escHtml(notes)}</p>` : ''}
    ${sections.map((s, i) => `<hr><h2>${i + 1}. ${escHtml(s.title || 'Untitled')}${s.done ? '<span class="done-tag">✓ Done</span>' : ''}</h2><div class="content">${escHtml(s.content || '')}</div>`).join('')}
    </body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
  };

  return (
    <>
    <div ref={pagePadRef} className="page-pad" style={{ background: C.bg0 }}>
      <div style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <button onClick={() => onNavigate('plans')} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
          <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Business Plans
        </button>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {!isEditing && sections.length > 0 && (
            <button onClick={handleExportPDF}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2, background: 'none', border: `1px solid ${C.border}`, borderRadius: 5, cursor: 'pointer', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
              Export PDF
            </button>
          )}
          {!isEditing && (
            <button onClick={() => { setIsEditing(true); setEditingSecIdx(null); setEditingSecDraft(null); }}
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

      <div>

        {/* ── VIEW MODE ── */}
        {!isEditing && (
          <>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Business Plan</div>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(20px,3vw,30px)', fontWeight: 700, color: C.fg1, letterSpacing: '-0.02em', lineHeight: 1.2, margin: '0 0 8px 0' }}>{plan.title}</h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: C.fg3 }}>Updated {plan.updated}</span>
              {category && (
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: C.fg3, background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 4, padding: '2px 8px' }}>{category}</span>
              )}
              <Badge status={status} />
            </div>

            {/* Order intentional: source document up top so the user
                lands on it first, then Executive Summary derived from
                that document, then notes, then sources, then sections. */}
            {sections.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.fg3 }}>Progress</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.fg3 }}>{sections.filter(s => s.done).length} / {sections.length}</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: C.bg2, overflow: 'hidden' }}>
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
                          <button aria-label={`Delete section: ${sec.title}`} onClick={() => handleDeleteSection(i)} style={{ width: 44, height: 44, borderRadius: 8, border: 'none', background: 'transparent', color: C.fg3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseEnter={e => { e.currentTarget.style.background = C.bg2; e.currentTarget.style.color = C.danger; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.fg3; }}>
                            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                          </button>
                        </div>
                      </div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, color: sec.done ? C.fg3 : C.fg2, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{sec.content}</div>
                    </div>
                  </div>
                </div>
              )
            ))}

            {attachedFile && (
              <div style={{ marginBottom: summary || notes ? 14 : 28 }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.fg3, marginBottom: 8 }}>Attached Document</div>
                <AttachedFileViewer file={attachedFile} editing={false} />
              </div>
            )}
            {summary && (
              <div style={{ background: C.accentBg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 18px', marginBottom: notes ? 14 : 28 }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.fg3, marginBottom: 8 }}>Executive Summary</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: C.fg2, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{summary}</div>
              </div>
            )}
            {notes && (
              <div style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 18px', marginBottom: 28 }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.fg3, marginBottom: 8 }}>Notes</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: C.fg2, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{notes}</div>
              </div>
            )}

            {Array.isArray(plan.sources) && plan.sources.filter(s => (s || '').trim()).length > 0 && (
              <div style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 18px', marginBottom: 28 }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.fg3, marginBottom: 10 }}>Sources</div>
                <SourcesView sources={plan.sources} />
              </div>
            )}

            {sections.length === 0 && (
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: C.fg3, marginBottom: 32 }}>No sections yet. Click Edit to add sections.</div>
            )}
          </>
        )}

        {/* ── EDIT MODE ── */}
        {isEditing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 28 }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Editing Business Plan</div>

            <div>
              <label style={labelStyle}>Plan Title</label>
              <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} maxLength={140} onFocus={focus} onBlur={blur} />
            </div>

            <div>
              <label style={labelStyle}>Category</label>
              <div className="select-wrap">
                <select style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }} value={category} onChange={e => setCategory(e.target.value)}>
                  {PLAN_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Status</label>
              <div className="select-wrap">
                <select style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }} value={status} onChange={e => setStatus(e.target.value)}>
                  {PLAN_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Executive Summary</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {summary.trim() && (
                    <button type="button" onClick={() => setSummary(s => formatText(s))}
                      style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.accent, background: C.accentBg, border: `1px solid ${alpha(C.accent, 33)}`, borderRadius: 4, cursor: 'pointer', padding: '3px 9px' }}>
                      ✦ Format
                    </button>
                  )}
                  {/* Available whenever a supported doc is attached, not
                      only when the summary is empty — otherwise users who
                      replace an old PDF with a new one have no way to
                      regenerate the summary against the new content
                      without first manually clearing the textarea. */}
                  {isSummarySupported(pendingFile || attachedFile) && (
                    <button type="button" onClick={handleGenerateSummary} disabled={generatingSummary}
                      style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: generatingSummary ? C.fg3 : '#fff', background: generatingSummary ? C.bg2 : C.accent, border: 'none', borderRadius: 4, cursor: generatingSummary ? 'not-allowed' : 'pointer', padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
                      {generatingSummary
                        ? <><span style={{ display: 'inline-block', width: 10, height: 10, border: `1.5px solid ${C.fg3}`, borderTopColor: C.fg1, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Generating…</>
                        : summary.trim()
                          ? <>✦ Regenerate from doc</>
                          : <>✦ Generate AI Summary</>}
                    </button>
                  )}
                  {summary.trim() && (
                    <button type="button" onClick={handleImproveSummary} disabled={improvingSummary}
                      style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: improvingSummary ? C.fg3 : '#fff', background: improvingSummary ? C.bg2 : C.accent, border: 'none', borderRadius: 4, cursor: improvingSummary ? 'not-allowed' : 'pointer', padding: '3px 10px' }}>
                      {improvingSummary ? 'Improving…' : '✦ AI Improve'}
                    </button>
                  )}
                </div>
              </div>
              <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 100, lineHeight: 1.6 }} value={summary}
                onChange={e => setSummary(e.target.value)} onFocus={focus} onBlur={blur} />
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, marginTop: 4 }}>{summary.length} characters</div>
            </div>

            <div>
              <label style={labelStyle}>Notes / Additional Description</label>
              <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 80, lineHeight: 1.6 }} value={notes}
                onChange={e => setNotes(e.target.value)} onFocus={focus} onBlur={blur}
                placeholder="Internal notes, observations, or additional context…" />
            </div>

            {/* File attachment — edit mode */}
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
              <label style={labelStyle}>Sources</label>
              <SourcesEditor sources={sources} onChange={setSources} />
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
                      {/* Always show Remove. Previously this was gated on
                          sections.length > 1, which meant a user who
                          accidentally added a single mistaken section
                          had no way to delete it. Empty sections array
                          renders the existing "No sections yet." view. */}
                      <button onClick={() => removeSection(i)} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.danger, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Remove</button>
                    </div>
                  </div>
                  <input style={{ ...inputStyle, marginBottom: 10, background: C.bg0 }} value={sec.title}
                    onChange={e => updateSection(i, 'title', e.target.value)} placeholder="Section title" onFocus={focus} onBlur={blur} />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginBottom: 4 }}>
                    {sec.content.trim() && (
                      <button type="button" onClick={() => updateSection(i, 'content', formatText(sec.content))}
                        style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.accent, background: C.accentBg, border: `1px solid ${alpha(C.accent, 33)}`, borderRadius: 4, cursor: 'pointer', padding: '3px 9px' }}>
                        ✦ Format
                      </button>
                    )}
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

        {/* ── DISCUSSION — always visible ── */}
        <DiscussionThread collectionName="planDiscussions" docId={plan.id} />
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
    </>
  );
}
