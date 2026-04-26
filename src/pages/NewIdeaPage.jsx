import { useState } from 'react';
import { C } from '../tokens';
import { useAppData } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { extractAllText, parseTextForIdea } from '../utils/pdfParser';
import { formatText } from '../utils/textFormatter';

export default function NewIdeaPage({ onNavigate }) {
  const { addIdea } = useAppData();
  const { showToast } = useToast();
  const [form, setForm] = useState({ title: '', status: 'draft', tags: '', desc: '' });
  const [error, setError] = useState('');
  const [pdfState, setPdfState] = useState({ loading: false, error: '' });

  const inputStyle = { background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6, color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: '9px 12px', outline: 'none', width: '100%', transition: 'border 150ms, box-shadow 150ms' };
  const labelStyle = { fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: C.fg2, marginBottom: 5, display: 'block' };
  const focus = e => { e.target.style.borderColor = C.accentDim; e.target.style.boxShadow = `0 0 0 2px ${C.accentDim}33`; };
  const blur  = e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; };

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPdfState({ loading: true, error: '' });
    try {
      const text = await extractAllText(file);
      const parsed = parseTextForIdea(text);
      setForm(f => ({
        ...f,
        title: parsed.title || f.title,
        desc: parsed.desc || f.desc,
      }));
      setPdfState({ loading: false, error: '' });
      showToast('PDF parsed — title and description extracted', 'success');
    } catch {
      setPdfState({ loading: false, error: 'Could not read PDF. Please try a text-based PDF.' });
    }
    e.target.value = '';
  };

  const handleSave = () => {
    if (!form.title.trim()) { setError('Idea title is required.'); return; }
    addIdea({
      title: form.title.trim(),
      status: form.status,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      desc: form.desc.trim(),
    });
    showToast('Idea saved', 'success');
    onNavigate('ideas');
  };

  return (
    <div className="page-pad" style={{ background: C.bg0 }}>
      <button onClick={() => onNavigate('ideas')} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Back to Ideas
      </button>
      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 700, color: C.fg1, letterSpacing: '-0.02em', marginBottom: 20 }}>Capture New Idea</div>

      <div style={{ background: C.bg1, border: `1px dashed ${C.border}`, borderRadius: 8, padding: '14px 18px', marginBottom: 24 }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: C.fg2, marginBottom: 8 }}>Upload PDF — Auto-extract title & description</div>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '8px 16px', borderRadius: 6, border: `1px solid ${C.border}`, color: pdfState.loading ? C.fg3 : C.fg2, cursor: pdfState.loading ? 'not-allowed' : 'pointer', background: C.bg0 }}
          onMouseEnter={e => { if (!pdfState.loading) e.currentTarget.style.borderColor = C.accentDim; }}
          onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
          {pdfState.loading ? 'Reading PDF…' : 'Upload PDF'}
          <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={handlePdfUpload} disabled={pdfState.loading} />
        </label>
        {pdfState.loading && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.accent, marginLeft: 10 }}>Extracting text from all pages…</span>}
        {pdfState.error && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.danger, marginTop: 6 }}>{pdfState.error}</div>}
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3, marginTop: 6 }}>Reads every page. Works best with text-based PDFs.</div>
      </div>

      <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 18 }}>
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
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.accent, background: C.accentBg, border: `1px solid ${C.accent}33`, borderRadius: 4, cursor: 'pointer', padding: '3px 9px' }}>
                ✦ Format
              </button>
            )}
          </div>
          <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 120, lineHeight: 1.6 }} value={form.desc}
            onChange={e => setForm({ ...form, desc: e.target.value })}
            placeholder="Describe the problem, target customer, rough mechanics…"
            onFocus={focus} onBlur={blur} />
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3, marginTop: 4 }}>{form.desc.length} characters · Paste any text then click Format to clean it up</div>
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
  );
}
