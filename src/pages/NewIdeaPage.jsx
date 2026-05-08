import { useState } from 'react';
import { C, alpha } from '../tokens';
import { useIdeas } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { formatText } from '../utils/textFormatter';
import PdfUploadZone from '../components/PdfUploadZone';
import UploadZone from '../components/UploadZone';
import { SourcesEditor } from '../components/SourcesField';
import { uploadFileToDB } from '../utils/fileStorage';
import { IDEA_CATEGORIES } from '../utils/categoryStyles';

export default function NewIdeaPage({ onNavigate }) {
  const { addIdea } = useIdeas();
  const { showToast } = useToast();
  const [form, setForm] = useState({ title: '', status: 'draft', category: '', desc: '', sources: [], estimatedCapex: '', estimatedPayback: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form chrome handled by `.form-input` / `.form-label` / `.form-error`
  // classes in styles.css — themed focus halo, hover hint, and error
  // border via --c-accent-rgb / --c-danger so all five themes light up
  // their own accent on focus.

  const handleExtracted = (parsed) => {
    setForm(f => ({
      ...f,
      title: parsed.title || f.title,
      desc:  parsed.desc  || f.desc,
    }));
    showToast('PDF content applied to form', 'success');
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Idea title is required.'); return; }
    setSaving(true);
    try {
      let attachedFile = null;
      if (selectedFile) attachedFile = await uploadFileToDB(selectedFile);
      const sources = (form.sources || []).map(s => (s || '').trim()).filter(Boolean);
      addIdea({
        title: form.title.trim(), status: form.status, category: form.category || '',
        desc: form.desc.trim(), sources, attachedFile,
        ...(form.estimatedCapex  ? { estimatedCapex:   Number(form.estimatedCapex)  } : {}),
        ...(form.estimatedPayback ? { estimatedPayback: Number(form.estimatedPayback) } : {}),
      });
      showToast('Idea saved', 'success');
      onNavigate('ideas');
    } catch {
      showToast('Failed to upload file. Please try again.', 'error');
      setSaving(false);
    }
  };

  return (
    <div className="page-pad page-hero-atmo" style={{ background: C.bg0 }}>
      <div style={{ maxWidth: 760, margin: '0 auto', width: '100%' }}>
      <button onClick={() => onNavigate('ideas')} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
        <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Back to Ideas
      </button>
      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 30, fontWeight: 700, color: C.fg1, letterSpacing: '-0.02em', marginBottom: 6 }}>Capture New Idea</div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.fg3, marginBottom: 24 }}>Upload a PDF to auto-fill, or type manually below.</div>

      <PdfUploadZone mode="idea" onExtracted={handleExtracted} onFileAttached={setSelectedFile} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <label className="form-label">Idea Title *</label>
          <input className={`form-input${error ? ' has-error' : ''}`} value={form.title}
            onChange={e => { setForm({ ...form, title: e.target.value }); setError(''); }}
            placeholder="What's the idea?"
            maxLength={120} />
          {error && <div className="form-error">{error}</div>}
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label className="form-label">Stage</label>
            <div className="select-wrap">
              <select className="form-input" style={{ appearance: 'none', cursor: 'pointer' }} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="draft">Draft</option>
                <option value="validating">Validating</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label className="form-label">Category</label>
            <div className="select-wrap">
              <select className="form-input" style={{ appearance: 'none', cursor: 'pointer' }} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option value="">— None —</option>
                {IDEA_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label className="form-label" style={{ marginBottom: 0 }}>Description</label>
            {form.desc.trim() && (
              <button type="button" onClick={() => setForm(f => ({ ...f, desc: formatText(f.desc) }))}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.accent, background: C.accentBg, border: `1px solid ${alpha(C.accent, 33)}`, borderRadius: 4, cursor: 'pointer', padding: '3px 9px' }}>
                ✦ Format
              </button>
            )}
          </div>
          <textarea className="form-input" value={form.desc}
            onChange={e => setForm({ ...form, desc: e.target.value })}
            placeholder="Describe the problem, target customer, rough mechanics…" />
          <div className="form-helper">{form.desc.length} characters</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label className="form-label">Project Cost Est. (₹) <span style={{ fontWeight: 400, color: C.fg3, textTransform: 'none', letterSpacing: 0 }}>— optional</span></label>
            <input type="number" min={0} className="form-input" value={form.estimatedCapex}
              onChange={e => setForm({ ...form, estimatedCapex: e.target.value })} />
          </div>
          <div>
            <label className="form-label">Estimated Payback (yrs) <span style={{ fontWeight: 400, color: C.fg3, textTransform: 'none', letterSpacing: 0 }}>— optional</span></label>
            <input type="number" min={0} step={0.5} className="form-input" value={form.estimatedPayback}
              onChange={e => setForm({ ...form, estimatedPayback: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="form-label">Sources (optional)</label>
          <SourcesEditor sources={form.sources} onChange={s => setForm(f => ({ ...f, sources: s }))} />
        </div>
        <div>
          <label className="form-label">Attach Document (optional)</label>
          <UploadZone file={selectedFile} onFile={setSelectedFile} onRemove={() => setSelectedFile(null)} />
        </div>
        <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
          <button disabled={saving} className="themed-cta"
            onClick={handleSave}>{saving ? 'Saving…' : 'Save Idea'}</button>
          <button style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, padding: '9px 20px', borderRadius: 6, background: 'transparent', color: C.fg3, border: `1px solid ${C.border}`, cursor: 'pointer' }}
            onClick={() => onNavigate('ideas')}>Cancel</button>
        </div>
      </div>
      </div>
    </div>
  );
}
