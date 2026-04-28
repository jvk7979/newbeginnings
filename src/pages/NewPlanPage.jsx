import { useState } from 'react';
import { C, alpha } from '../tokens';
import { useAppData } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { formatText } from '../utils/textFormatter';
import PdfUploadZone from '../components/PdfUploadZone';
import { CATEGORIES } from '../utils/categoryStyles';

const PLAN_CATEGORIES = CATEGORIES.slice(1);

const PLAN_STATUSES = [
  { value: 'draft',     label: 'Draft' },
  { value: 'active',    label: 'Active' },
  { value: 'in-review', label: 'In Review' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived',  label: 'Archived' },
];

function fileFromName(fileName) {
  if (!fileName.trim()) return null;
  const fn = fileName.trim();
  const ext = fn.split('.').pop().toLowerCase();
  const type = { pdf: 'PDF', doc: 'DOC', docx: 'DOCX' }[ext] || ext.toUpperCase();
  return { name: fn, fileName: fn, type, url: `${import.meta.env.BASE_URL}files/${encodeURIComponent(fn)}` };
}

export default function NewPlanPage({ onNavigate }) {
  const { addPlan } = useAppData();
  const { showToast } = useToast();
  const [form, setForm] = useState({ title: '', summary: '', notes: '', category: 'Business', status: 'draft' });
  const [attachedFileName, setAttachedFileName] = useState('');
  const [error, setError] = useState('');

  const inputStyle = { background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6, color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: '9px 12px', outline: 'none', width: '100%', transition: 'border 150ms', boxSizing: 'border-box' };
  const labelStyle = { fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: C.fg2, marginBottom: 5, display: 'block' };
  const focus = e => { e.target.style.borderColor = C.accentDim; e.target.style.boxShadow = `0 0 0 2px ${alpha(C.accentDim, 33)}`; };
  const blur  = e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; };

  const handleExtracted = (parsed) => {
    setForm(f => ({ ...f, title: parsed.title || f.title, summary: parsed.summary || f.summary }));
    showToast('PDF content applied — review and save', 'success');
  };

  const handleSave = () => {
    if (!form.title.trim()) { setError('Plan title is required.'); return; }
    addPlan({ ...form, title: form.title.trim(), sections: [], attachedFile: fileFromName(attachedFileName) });
    showToast('Business plan saved', 'success');
    onNavigate('plans');
  };

  return (
    <div className="page-pad" style={{ background: C.bg0 }}>
      <div style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>
      <button onClick={() => onNavigate('plans')} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Business Plans
      </button>
      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 700, color: C.fg1, letterSpacing: '-0.02em', marginBottom: 6 }}>New Business Plan</div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, marginBottom: 24 }}>Upload a PDF to auto-extract all sections, or build manually below.</div>

      <PdfUploadZone mode="plan" onExtracted={handleExtracted} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Title */}
        <div>
          <label style={labelStyle}>Plan Title *</label>
          <input style={{ ...inputStyle, borderColor: error ? C.danger : C.border }} value={form.title}
            onChange={e => { setForm({ ...form, title: e.target.value }); setError(''); }}
            placeholder="e.g. Coconut Processing Plant — Feasibility Report"
            onFocus={focus} onBlur={blur} />
          {error && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.danger, marginTop: 4 }}>{error}</div>}
        </div>

        {/* Category + Status row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={labelStyle}>Category</label>
            <select style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {PLAN_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              {PLAN_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {/* Executive Summary */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Executive Summary</label>
            {form.summary.trim() && (
              <button type="button" onClick={() => setForm(f => ({ ...f, summary: formatText(f.summary) }))}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.accent, background: C.accentBg, border: `1px solid ${alpha(C.accent, 33)}`, borderRadius: 4, cursor: 'pointer', padding: '3px 9px' }}>
                ✦ Format
              </button>
            )}
          </div>
          <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 100, lineHeight: 1.6 }} value={form.summary}
            onChange={e => setForm({ ...form, summary: e.target.value })}
            placeholder="One-paragraph overview of the plan…"
            onFocus={focus} onBlur={blur} />
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3, marginTop: 4 }}>{form.summary.length} characters</div>
        </div>

        {/* Notes */}
        <div>
          <label style={labelStyle}>Notes / Additional Description</label>
          <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 80, lineHeight: 1.6 }} value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            placeholder="Internal notes, observations, or additional context…"
            onFocus={focus} onBlur={blur} />
        </div>

        {/* File attachment */}
        <div>
          <label style={labelStyle}>Attach Document (filename in public/files/)</label>
          <input style={inputStyle} value={attachedFileName}
            onChange={e => setAttachedFileName(e.target.value)}
            placeholder="e.g. coconut-plan.pdf"
            onFocus={focus} onBlur={blur} />
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3, marginTop: 5, lineHeight: 1.5 }}>
            Upload the file to your GitHub repo under <code style={{ fontFamily: "'JetBrains Mono', monospace", background: C.bg2, padding: '1px 4px', borderRadius: 3 }}>public/files/</code> first, then enter the filename here.
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
          <button style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '9px 20px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = C.accentDim}
            onMouseLeave={e => e.currentTarget.style.background = C.accent}
            onClick={handleSave}>Save Plan</button>
          <button style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: '9px 20px', borderRadius: 6, background: 'transparent', color: C.fg3, border: `1px solid ${C.border}`, cursor: 'pointer' }}
            onClick={() => onNavigate('plans')}>Cancel</button>
        </div>
      </div>
      </div>
    </div>
  );
}
