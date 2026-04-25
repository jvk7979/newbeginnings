// IdeasPage.jsx — Ideas listing + detail view
const IdeasPage = ({ onNavigate }) => {
  const [filter, setFilter] = React.useState('all');
  const [ideas, setIdeas] = React.useState(window.AppData.ideas);

  const filters = ['all', 'draft', 'validating', 'active', 'archived'];
  const filtered = filter === 'all' ? ideas : ideas.filter(i => i.status === filter);

  const s = {
    wrap: { flex: 1, overflowY: 'auto', padding: '32px 36px', background: '#0D0C0A' },
    topbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 },
    title: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 600, color: '#F2EDE0', letterSpacing: '-0.02em' },
    filterRow: { display: 'flex', gap: 6, marginBottom: 20 },
    filterBtn: (active) => ({
      fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: active ? 500 : 400,
      padding: '5px 12px', borderRadius: 999, border: `1px solid ${active ? '#D4A85333' : '#2E2B23'}`,
      background: active ? '#1E1A0F' : 'transparent', color: active ? '#D4A853' : '#6A6055',
      cursor: 'pointer', transition: 'all 120ms',
    }),
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
    btn: {
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
      padding: '8px 16px', borderRadius: 6, border: 'none',
      background: '#D4A853', color: '#0D0C0A', cursor: 'pointer',
    },
  };

  return (
    <div style={s.wrap}>
      <div style={s.topbar}>
        <div>
          <div style={s.title}>Ideas</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#6A6055', marginTop: 4 }}>{ideas.length} ideas tracked</div>
        </div>
        <button style={s.btn}
          onMouseEnter={e => e.currentTarget.style.background = '#E8C47A'}
          onMouseLeave={e => e.currentTarget.style.background = '#D4A853'}
          onClick={() => onNavigate('new-idea', { onSave: (idea) => { setIdeas([...window.AppData.ideas]); } })}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Idea
        </button>
      </div>
      <div style={s.filterRow}>
        {filters.map(f => (
          <button key={f} style={s.filterBtn(filter === f)} onClick={() => setFilter(f)}
            onMouseEnter={e => { if (filter !== f) e.currentTarget.style.color = '#A39888'; }}
            onMouseLeave={e => { if (filter !== f) e.currentTarget.style.color = '#6A6055'; }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      <div style={s.grid}>
        {filtered.map(i => <IdeaCard key={i.id} {...i} onClick={() => onNavigate('idea-detail', i)} />)}
      </div>
    </div>
  );
};

// New Idea form
const NewIdeaPage = ({ onNavigate }) => {
  const [form, setForm] = React.useState({ title: '', status: 'draft', tags: '', desc: '' });
  const [error, setError] = React.useState('');
  const [pdfState, setPdfState] = React.useState({ loading: false, error: '' });

  const loadPdfJs = () => new Promise((resolve, reject) => {
    if (window.pdfjsLib) { resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    s.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; resolve(); };
    s.onerror = reject;
    document.head.appendChild(s);
  });

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
      setForm(f => ({ ...f, title: lines[0] ? lines[0].slice(0, 100) : f.title, desc: lines.slice(1, 8).join(' ').slice(0, 500) || f.desc }));
      setPdfState({ loading: false, error: '' });
    } catch {
      setPdfState({ loading: false, error: 'Could not read PDF. Please try a text-based PDF.' });
    }
    e.target.value = '';
  };

  const inputStyle = {
    background: '#18160F', border: '1px solid #2E2B23', borderRadius: 6,
    color: '#F2EDE0', fontFamily: "'DM Sans', sans-serif", fontSize: 14,
    padding: '9px 12px', outline: 'none', width: '100%', transition: 'border 150ms, box-shadow 150ms',
  };
  const labelStyle = { fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: '#A39888', marginBottom: 5, display: 'block' };

  const handleSave = () => {
    if (!form.title.trim()) {
      setError('Idea title is required.');
      return;
    }
    window.AppData.addIdea({
      title: form.title.trim(),
      status: form.status,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      desc: form.desc.trim(),
    });
    onNavigate('ideas');
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 36px', background: '#0D0C0A' }}>
      <button onClick={() => onNavigate('ideas')} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#6A6055', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Back to Ideas
      </button>
      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 600, color: '#F2EDE0', letterSpacing: '-0.02em', marginBottom: 16 }}>Capture New Idea</div>
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '8px 16px', borderRadius: 6, border: '1px dashed #2E2B23', color: '#A39888', cursor: 'pointer', background: '#18160F' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#9A7530'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#2E2B23'}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          {pdfState.loading ? 'Reading PDF…' : 'Upload PDF to auto-fill'}
          <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={handlePdfUpload} disabled={pdfState.loading} />
        </label>
        {pdfState.error && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#C45E5E', marginTop: 6 }}>{pdfState.error}</div>}
        {!pdfState.error && !pdfState.loading && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#6A6055', marginTop: 6 }}>Title and description will be pre-filled from the PDF.</div>}
      </div>
      <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <label style={labelStyle}>Idea Title *</label>
          <input style={{ ...inputStyle, borderColor: error ? '#C45E5E' : '#2E2B23' }}
            value={form.title}
            onChange={e => { setForm({...form, title: e.target.value}); setError(''); }}
            placeholder="What's the idea?"
            onFocus={e => { e.target.style.borderColor = '#9A7530'; e.target.style.boxShadow = '0 0 0 1px #9A7530, 0 4px 16px rgba(212,168,83,0.12)'; }}
            onBlur={e => { e.target.style.borderColor = error ? '#C45E5E' : '#2E2B23'; e.target.style.boxShadow = 'none'; }} />
          {error && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#C45E5E', marginTop: 4 }}>{error}</div>}
        </div>
        <div>
          <label style={labelStyle}>Stage</label>
          <select style={{...inputStyle, appearance: 'none'}} value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
            <option value="draft">Draft</option>
            <option value="validating">Validating</option>
            <option value="active">Active</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Tags (comma separated)</label>
          <input style={inputStyle} value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} placeholder="SaaS, B2B, Fintech…"
            onFocus={e => { e.target.style.borderColor = '#9A7530'; e.target.style.boxShadow = '0 0 0 1px #9A7530, 0 4px 16px rgba(212,168,83,0.12)'; }}
            onBlur={e => { e.target.style.borderColor = '#2E2B23'; e.target.style.boxShadow = 'none'; }} />
        </div>
        <div>
          <label style={labelStyle}>Description</label>
          <textarea style={{...inputStyle, resize: 'vertical', minHeight: 100, lineHeight: 1.55}}
            value={form.desc} onChange={e => setForm({...form, desc: e.target.value})}
            placeholder="Describe the problem you're solving, target customer, rough mechanics…"
            onFocus={e => { e.target.style.borderColor = '#9A7530'; e.target.style.boxShadow = '0 0 0 1px #9A7530, 0 4px 16px rgba(212,168,83,0.12)'; }}
            onBlur={e => { e.target.style.borderColor = '#2E2B23'; e.target.style.boxShadow = 'none'; }} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '9px 20px', borderRadius: 6, background: '#D4A853', color: '#0D0C0A', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = '#E8C47A'}
            onMouseLeave={e => e.currentTarget.style.background = '#D4A853'}
            onClick={handleSave}>
            Save Idea
          </button>
          <button style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: '9px 20px', borderRadius: 6, background: 'transparent', color: '#6A6055', border: '1px solid #2E2B23', cursor: 'pointer' }}
            onClick={() => onNavigate('ideas')}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { IdeasPage, NewIdeaPage });
