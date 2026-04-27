import { useState } from 'react';
import { C, alpha } from '../tokens';
import { useAppData } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { formatText } from '../utils/textFormatter';
import PdfUploadZone from '../components/PdfUploadZone';

export default function NewIdeaPage({ onNavigate }) {
  const { addIdea } = useAppData();
  const { showToast } = useToast();
  const [form, setForm] = useState({ title: '', status: 'draft', tags: '', desc: '' });
  const [error, setError] = useState('');

  const inputStyle = { background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6, color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: '9px 12px', outline: 'none', width: '100%', transition: 'border 150ms, box-shadow 150ms' };
  const labelStyle = { fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: C.fg2, marginBottom: 5, display: 'block' };
  const focus = e => { e.target.style.borderColor = C.accentDim; e.target.style.boxShadow = `0 0 0 2px ${alpha(C.accentDim, 33)}`; };
  const blur  = e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; };

  const handleExtracted = (parsed) => {
    setForm(f => ({
      ...f,
      title: parsed.title || f.title,
      desc:  parsed.desc  || f.desc,
    }));
    showToast('PDF content applied to form', 'success');
  };

  const handleSave = () => {
    if (!form.title.trim()) { setError('Idea title is required.'); return; }
    addIdea({
      title:  form.title.trim(),
      status: form.status,
      tags:   form.tags.split(',').map(t => t.trim()).filter(Boolean),
      desc:   form.desc.trim(),
    });
    showToast('Idea saved', 'success');
    onNavigate('ideas');
  };

  return (
    <div className="page-pad" style={{ background: C.bg0 }}>
      <div style={{ maxWidth: 760, margin: '0 auto', width: '100%' }}>
      <button onClick={() => onNavigate('ideas')} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Back to Ideas
      </button>
      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 700, color: C.fg1, letterSpacing: '-0.02em', marginBottom: 6 }}>Capture New Idea</div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, marginBottom: 24 }}>Upload a PDF to auto-fill, or type manually below.</div>

      <PdfUploadZone mode="idea" onExtracted={handleExtracted} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <label style={labelStyle}>Idea Title *</label>
          <input style={{ ...inputStyle, borderColor: error ? C.danger : C.border }} value={form.title}
            onChange={e => { setForm({ ...form, title: e.target.value }); setError(''); }}
            placeholder="What's the idea?"
            onFocus={focus} onBlur={blur} />
          {error && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.danger, marginTop: 4 }}>{error}</div>}
        </div>
        <div>
          <label style={labelStyle}>Tags (comma separated)</label>
          <input style={inputStyle} value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })}
            placeholder="Manufacturing, Export, Agri…"
            onFocus={focus} onBlur={blur} />
        </div>
        <div>
          <label style={labelStyle}>Stage</label>
          <select style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            <option value="draft">Draft</option>
            <option value="validating">Validating</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Description</label>
            {form.desc.trim() && (
              <button type="button" onClick={() => setForm(f => ({ ...f, desc: formatText(f.desc) }))}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.accent, background: C.accentBg, border: `1px solid ${alpha(C.accent, 33)}`, borderRadius: 4, cursor: 'pointer', padding: '3px 9px' }}>
                ✦ Format
              </button>
            )}
          </div>
          <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 120, lineHeight: 1.6 }} value={form.desc}
            onChange={e => setForm({ ...form, desc: e.target.value })}
            placeholder="Describe the problem, target customer, rough mechanics…"
            onFocus={focus} onBlur={blur} />
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3, marginTop: 4 }}>{form.desc.length} characters</div>
        </div>
        <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
          <button style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '9px 20px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = C.accentDim}
            onMouseLeave={e => e.currentTarget.style.background = C.accent}
            onClick={handleSave}>Save Idea</button>
          <button style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: '9px 20px', borderRadius: 6, background: 'transparent', color: C.fg3, border: `1px solid ${C.border}`, cursor: 'pointer' }}
            onClick={() => onNavigate('ideas')}>Cancel</button>
        </div>
      </div>
      </div>
    </div>
  );
}
