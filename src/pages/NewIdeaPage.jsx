import { useState } from 'react';
import { C } from '../tokens';
import { useAppData } from '../context/AppContext';

const loadPdfJs = () => new Promise((resolve, reject) => {
  if (window.pdfjsLib) { resolve(); return; }
  const s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  s.onload = () => {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    resolve();
  };
  s.onerror = reject;
  document.head.appendChild(s);
});

export default function NewIdeaPage({ onNavigate }) {
  const { addIdea } = useAppData();
  const [form, setForm] = useState({ title: '', status: 'draft', tags: '', desc: '' });
  const [error, setError] = useState('');
  const [pdfState, setPdfState] = useState({ loading: false, error: '' });

  const inputStyle = { background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6, color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: '9px 12px', outline: 'none', width: '100%', transition: 'border 150ms, box-shadow 150ms' };
  const labelStyle = { fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: C.fg2, marginBottom: 5, display: 'block' };

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPdfState({ loading: true, error: '' });
    try {
      await loadPdfJs();
      const buf = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
      let text = '';
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const ct = await page.getTextContent();
        text += ct.items.map(it => it.str).join(' ') + '\n';
      }
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      setForm(f => ({
        ...f,
        title: lines[0] ? lines[0].slice(0, 100) : f.title,
        desc: lines.slice(1, 8).join(' ').slice(0, 500) || f.desc,
      }));
      setPdfState({ loading: false, error: '' });
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
    onNavigate('ideas');
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 36px', background: C.bg0 }}>
      <button onClick={() => onNavigate('ideas')} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Back to Ideas
      </button>
      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 700, color: C.fg1, letterSpacing: '-0.02em', marginBottom: 16 }}>Capture New Idea</div>

      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '8px 16px', borderRadius: 6, border: `1px dashed ${C.border}`, color: C.fg2, cursor: 'pointer', background: C.bg1 }}
          onMouseEnter={e => e.currentTarget.style.borderColor = C.accentDim}
          onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          {pdfState.loading ? 'Reading PDF…' : 'Upload PDF to auto-fill'}
          <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={handlePdfUpload} disabled={pdfState.loading} />
        </label>
        {pdfState.error && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.danger, marginTop: 6 }}>{pdfState.error}</div>}
        {!pdfState.error && !pdfState.loading && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, marginTop: 6 }}>Title and description will be pre-filled from the PDF.</div>}
      </div>

      <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <label style={labelStyle}>Idea Title *</label>
          <input style={{ ...inputStyle, borderColor: error ? C.danger : C.border }} value={form.title}
            onChange={e => { setForm({ ...form, title: e.target.value }); setError(''); }}
            placeholder="What's the idea?"
            onFocus={e => { e.target.style.borderColor = C.accentDim; e.target.style.boxShadow = `0 0 0 2px ${C.accentDim}33`; }}
            onBlur={e => { e.target.style.borderColor = error ? C.danger : C.border; e.target.style.boxShadow = 'none'; }} />
          {error && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.danger, marginTop: 4 }}>{error}</div>}
        </div>
        <div>
          <label style={labelStyle}>Tags (comma separated)</label>
          <input style={inputStyle} value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="Manufacturing, Export, Agri…"
            onFocus={e => { e.target.style.borderColor = C.accentDim; e.target.style.boxShadow = `0 0 0 2px ${C.accentDim}33`; }}
            onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }} />
        </div>
        <div>
          <label style={labelStyle}>Stage</label>
          <select style={{ ...inputStyle, appearance: 'none' }} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            <option value="draft">Draft</option>
            <option value="validating">Validating</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Description</label>
          <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 100, lineHeight: 1.55 }} value={form.desc}
            onChange={e => setForm({ ...form, desc: e.target.value })}
            placeholder="Describe the problem you're solving, target customer, rough mechanics…"
            onFocus={e => { e.target.style.borderColor = C.accentDim; e.target.style.boxShadow = `0 0 0 2px ${C.accentDim}33`; }}
            onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
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
