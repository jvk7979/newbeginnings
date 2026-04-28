import { useState, useRef } from 'react';
import { C, alpha } from '../tokens';
import { useAppData } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { formatText } from '../utils/textFormatter';
import PdfUploadZone from '../components/PdfUploadZone';
import { CATEGORIES } from '../utils/categoryStyles';
import { storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const PLAN_CATEGORIES = CATEGORIES.slice(1);

const PLAN_STATUSES = [
  { value: 'draft',     label: 'Draft' },
  { value: 'active',    label: 'Active' },
  { value: 'in-review', label: 'In Review' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived',  label: 'Archived' },
];

const ALLOWED_TYPES = {
  'application/pdf': 'PDF',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
};
const ALLOWED_EXTS = ['.pdf', '.doc', '.docx'];

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function FileAttachZone({ value, onChange }) {
  const [drag, setDrag]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]  = useState(0);
  const [error, setError]        = useState('');
  const inputRef = useRef(null);

  const upload = async (file) => {
    if (!file) return;
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) {
      setError('Only PDF, DOC, and DOCX files are supported.');
      return;
    }
    setError('');
    setUploading(true);
    setProgress(0);
    try {
      const path = `planFiles/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, path);
      const task = uploadBytesResumable(storageRef, file);
      task.on('state_changed',
        snap => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
        () => { setError('Upload failed. Please try again.'); setUploading(false); },
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          onChange({
            name: file.name,
            type: ALLOWED_TYPES[file.type] || ext.replace('.', '').toUpperCase(),
            size: file.size,
            url,
            storagePath: path,
            uploadedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          });
          setUploading(false);
        }
      );
    } catch {
      setError('Upload failed. Please try again.');
      setUploading(false);
    }
  };

  const onDrop = (e) => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files[0]); };

  if (value) {
    const isPdf = value.type === 'PDF';
    return (
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: C.bg1 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" width="20" height="20" style={{ flexShrink: 0 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: C.fg1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value.name}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg3, marginTop: 2 }}>{value.type} · {formatSize(value.size)} · {value.uploadedAt}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <a href={value.url} target="_blank" rel="noopener noreferrer"
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: C.accent, background: C.accentBg, border: `1px solid ${alpha(C.accent, 33)}`, borderRadius: 5, padding: '5px 12px', textDecoration: 'none' }}>
              {isPdf ? 'View' : 'Open'} ↗
            </a>
            <a href={value.url} download={value.name}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg2, background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 5, padding: '5px 12px', textDecoration: 'none' }}>
              Download ↓
            </a>
            <button onClick={() => onChange(null)}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.danger, background: 'none', border: `1px solid ${alpha(C.danger, 33)}`, borderRadius: 5, padding: '5px 10px', cursor: 'pointer' }}>×</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        onDrop={onDrop}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onClick={() => !uploading && inputRef.current?.click()}
        style={{ border: `2px dashed ${drag ? C.accent : error ? C.danger : C.border}`, borderRadius: 10, padding: '28px 20px', textAlign: 'center', cursor: uploading ? 'default' : 'pointer', background: drag ? C.accentBg : C.bg1, transition: 'all 200ms' }}>
        <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={e => { upload(e.target.files[0]); e.target.value = ''; }} />
        {uploading ? (
          <>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: C.fg1, marginBottom: 12 }}>Uploading… {progress}%</div>
            <div style={{ height: 6, background: C.bg2, borderRadius: 3, overflow: 'hidden', maxWidth: 260, margin: '0 auto' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: C.accent, borderRadius: 3, transition: 'width 200ms' }} />
            </div>
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke={C.fg3} strokeWidth="1.5" strokeLinecap="round" width="28" height="28" style={{ marginBottom: 10 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: C.fg1, marginBottom: 6 }}>Attach a document</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3 }}>Drop here or click to browse — PDF, DOC, DOCX</div>
          </>
        )}
      </div>
      {error && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.danger, marginTop: 6 }}>{error}</div>}
    </div>
  );
}

export default function NewPlanPage({ onNavigate }) {
  const { addPlan } = useAppData();
  const { showToast } = useToast();
  const [form, setForm] = useState({ title: '', summary: '', notes: '', category: 'Business', status: 'draft' });
  const [attachedFile, setAttachedFile] = useState(null);
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
    addPlan({ ...form, title: form.title.trim(), sections: [], attachedFile: attachedFile || null });
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
          <label style={{ ...labelStyle, marginBottom: 10 }}>Attach Document (PDF / DOC / DOCX)</label>
          <FileAttachZone value={attachedFile} onChange={setAttachedFile} />
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
