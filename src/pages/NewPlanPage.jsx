import { useState } from 'react';
import { C, alpha } from '../tokens';
import { useAppData } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { formatText } from '../utils/textFormatter';
import PdfUploadZone from '../components/PdfUploadZone';
import UploadZone from '../components/UploadZone';
import { uploadFileToDB } from '../utils/fileStorage';
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

export default function NewPlanPage({ onNavigate }) {
  const { addPlan } = useAppData();
  const { showToast } = useToast();
  const [form, setForm] = useState({ title: '', summary: '', notes: '', category: 'Business', status: 'draft' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [error, setError] = useState('');

  const inputStyle = { background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6, color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 16, padding: '9px 12px', outline: 'none', width: '100%', transition: 'border 150ms', boxSizing: 'border-box' };
  const labelStyle = { fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: C.fg2, marginBottom: 5, display: 'block' };
  const focus = e => { e.target.style.borderColor = C.accentDim; e.target.style.boxShadow = `0 0 0 2px ${alpha(C.accentDim, 33)}`; };
  const blur  = e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; };

  const handleExtracted = (parsed) => {
    setForm(f => ({ ...f, title: parsed.title || f.title, summary: parsed.summary || f.summary }));
    showToast('PDF content applied — review and save', 'success');
  };

  const handleGenerateSummary = async () => {
    if (!selectedFile) return;
    setSummarizing(true);
    try {
      const summary = await generateSummaryFromFile(selectedFile);
      setForm(f => ({ ...f, summary }));
      showToast('AI summary generated', 'success');
    } catch (err) {
      showToast(err?.message || 'Failed to generate summary.', 'error');
    } finally {
      setSummarizing(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Plan title is required.'); return; }
    setSaving(true);
    try {
      let attachedFile = null;
      if (selectedFile) attachedFile = await uploadFileToDB(selectedFile);
      addPlan({ ...form, title: form.title.trim(), sections: [], attachedFile });
      showToast('Business plan saved', 'success');
      onNavigate('plans');
    } catch (err) {
      console.error('[Save error]', err);
      showToast(err?.message || 'Failed to save. Please try again.', 'error');
      setSaving(false);
    }
  };

  return (
    <div className="page-pad" style={{ background: C.bg0 }}>
      <div style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>
      <button onClick={() => onNavigate('plans')} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Business Plans
      </button>
      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 30, fontWeight: 700, color: C.fg1, letterSpacing: '-0.02em', marginBottom: 6 }}>New Business Plan</div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.fg3, marginBottom: 24 }}>Upload a PDF to auto-extract all sections, or build manually below.</div>

      <PdfUploadZone mode="plan" onExtracted={handleExtracted} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Title */}
        <div>
          <label style={labelStyle}>Plan Title *</label>
          <input style={{ ...inputStyle, borderColor: error ? C.danger : C.border }} value={form.title}
            onChange={e => { setForm({ ...form, title: e.target.value }); setError(''); }}
            placeholder="e.g. Coconut Processing Plant — Feasibility Report"
            onFocus={focus} onBlur={blur} />
          {error && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.danger, marginTop: 4 }}>{error}</div>}
        </div>

        {/* Category + Status row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={labelStyle}>Category</label>
            <div className="select-wrap">
              <select style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {PLAN_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <div className="select-wrap">
              <select style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {PLAN_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* File attachment — above summary so AI button activates immediately */}
        <div>
          <label style={labelStyle}>Attach Document (optional)</label>
          <UploadZone file={selectedFile} onFile={setSelectedFile} onRemove={() => setSelectedFile(null)} />
          {isSummarySupported(selectedFile) && (
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.accent, marginTop: 6 }}>
              ✦ Document attached — click "Generate AI Summary" below to auto-fill the executive summary
            </div>
          )}
        </div>

        {/* Executive Summary */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Executive Summary</label>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {isSummarySupported(selectedFile) && (
                <button type="button" onClick={handleGenerateSummary} disabled={summarizing}
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: summarizing ? C.fg3 : '#fff', background: summarizing ? C.bg2 : C.accent, border: 'none', borderRadius: 4, cursor: summarizing ? 'not-allowed' : 'pointer', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
                  {summarizing
                    ? <><span style={{ display: 'inline-block', width: 10, height: 10, border: `1.5px solid ${C.fg3}`, borderTopColor: C.fg1, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Generating…</>
                    : <>✦ Generate AI Summary</>}
                </button>
              )}
              {form.summary.trim() && (
                <button type="button" onClick={() => setForm(f => ({ ...f, summary: formatText(f.summary) }))}
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.accent, background: C.accentBg, border: `1px solid ${alpha(C.accent, 33)}`, borderRadius: 4, cursor: 'pointer', padding: '3px 9px' }}>
                  ✦ Format
                </button>
              )}
            </div>
          </div>
          <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 100, lineHeight: 1.6 }} value={form.summary}
            onChange={e => setForm({ ...form, summary: e.target.value })}
            placeholder={isSummarySupported(selectedFile) ? 'Click ✦ Generate AI Summary above to auto-fill from the attached document…' : 'One-paragraph overview of the plan…'}
            onFocus={focus} onBlur={blur} />
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, marginTop: 4 }}>{form.summary.length} characters</div>
        </div>

        {/* Notes */}
        <div>
          <label style={labelStyle}>Notes / Additional Description</label>
          <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 80, lineHeight: 1.6 }} value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            placeholder="Internal notes, observations, or additional context…"
            onFocus={focus} onBlur={blur} />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
          <button disabled={saving} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500, padding: '9px 20px', borderRadius: 6, background: saving ? C.bg2 : C.accent, color: saving ? C.fg3 : '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.background = C.accentDim; }}
            onMouseLeave={e => { if (!saving) e.currentTarget.style.background = C.accent; }}
            onClick={handleSave}>{saving ? 'Saving…' : 'Save Plan'}</button>
          <button style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, padding: '9px 20px', borderRadius: 6, background: 'transparent', color: C.fg3, border: `1px solid ${C.border}`, cursor: 'pointer' }}
            onClick={() => onNavigate('plans')}>Cancel</button>
        </div>
      </div>
      </div>
    </div>
  );
}
