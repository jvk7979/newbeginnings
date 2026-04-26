import { useState } from 'react';
import { C } from '../tokens';
import { useAppData } from '../context/AppContext';
import { useToast } from '../context/ToastContext';

const CATEGORIES = ['All', 'Business', 'Agriculture', 'Technology', 'Finance', 'Real Estate', 'Community', 'Personal', 'Other'];

const CAT_STYLE = {
  Business:    { bg: '#FDF5E4', color: '#B8892A' },
  Agriculture: { bg: '#EAF5EE', color: '#2E7D52' },
  Technology:  { bg: '#EAF0FA', color: '#2B5FA6' },
  Finance:     { bg: '#FDF0E4', color: '#C4681C' },
  'Real Estate':{ bg: '#F0EAF8', color: '#6B3FA6' },
  Community:   { bg: '#EAF5EE', color: '#2E7D52' },
  Personal:    { bg: '#EDE8DE', color: '#9A8E80' },
  Other:       { bg: '#EDE8DE', color: '#9A8E80' },
};

const inputStyle = (C) => ({ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6, color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: '9px 12px', outline: 'none', width: '100%', transition: 'border 150ms' });
const labelStyle = (C) => ({ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: C.fg2, marginBottom: 5, display: 'block' });

function AddFileModal({ onClose, onSave }) {
  const [form, setForm] = useState({ title: '', summary: '', category: 'Business', fileName: '', tags: '', relatedProject: '' });
  const [error, setError] = useState('');
  const iStyle = inputStyle(C);
  const lStyle = labelStyle(C);
  const focus = e => { e.target.style.borderColor = C.accentDim; e.target.style.boxShadow = `0 0 0 2px ${C.accentDim}33`; };
  const blur  = e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; };

  const handleSave = () => {
    if (!form.title.trim()) { setError('Title is required.'); return; }
    if (!form.fileName.trim()) { setError('File name is required (e.g. report.pdf)'); return; }
    onSave({ ...form, title: form.title.trim(), fileName: form.fileName.trim(), tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,25,20,0.45)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: C.bg0, borderRadius: 12, padding: '28px 28px', width: '100%', maxWidth: 500, boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 700, color: C.fg1, marginBottom: 20 }}>Add File</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={lStyle}>Title *</label>
            <input style={{ ...iStyle, borderColor: error && !form.title.trim() ? C.danger : C.border }} value={form.title} onChange={e => { setForm({ ...form, title: e.target.value }); setError(''); }} placeholder="e.g. Coconut Processing Plan" onFocus={focus} onBlur={blur} />
          </div>
          <div>
            <label style={lStyle}>File name in GitHub (public/files/) *</label>
            <input style={{ ...iStyle, borderColor: error && !form.fileName.trim() ? C.danger : C.border }} value={form.fileName} onChange={e => { setForm({ ...form, fileName: e.target.value }); setError(''); }} placeholder="e.g. coconut-plan.pdf" onFocus={focus} onBlur={blur} />
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3, marginTop: 4 }}>Upload the file to your GitHub repo at public/files/ first</div>
          </div>
          <div>
            <label style={lStyle}>Category</label>
            <select style={{ ...iStyle, appearance: 'none', cursor: 'pointer' }} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={lStyle}>Summary</label>
            <textarea style={{ ...iStyle, resize: 'vertical', minHeight: 80, lineHeight: 1.55 }} value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} placeholder="Brief description of this file…" onFocus={focus} onBlur={blur} />
          </div>
          <div>
            <label style={lStyle}>Tags (comma separated)</label>
            <input style={iStyle} value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="Feasibility, Coconut, Rajahmundry…" onFocus={focus} onBlur={blur} />
          </div>
          <div>
            <label style={lStyle}>Related Project (optional)</label>
            <input style={iStyle} value={form.relatedProject} onChange={e => setForm({ ...form, relatedProject: e.target.value })} placeholder="e.g. Coconut Processing Plant" onFocus={focus} onBlur={blur} />
          </div>
          {error && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.danger }}>{error}</div>}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '9px 20px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = C.accentDim}
              onMouseLeave={e => e.currentTarget.style.background = C.accent}
              onClick={handleSave}>Add File</button>
            <button style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: '9px 20px', borderRadius: 6, background: 'transparent', color: C.fg3, border: `1px solid ${C.border}`, cursor: 'pointer' }} onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FileCard({ file, onClick, onDelete }) {
  const [hov, setHov] = useState(false);
  const cat = CAT_STYLE[file.category] || CAT_STYLE.Other;
  const fileUrl = `${import.meta.env.BASE_URL}files/${file.fileName}`;

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: C.bg1, border: `1px solid ${hov ? C.borderLight : C.border}`, borderRadius: 8, padding: '18px 20px', boxShadow: hov ? '0 4px 16px rgba(60,40,10,0.10)' : '0 1px 3px rgba(60,40,10,0.06)', transition: 'all 180ms ease', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <span style={{ display: 'inline-block', fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: cat.color, background: cat.bg, padding: '2px 7px', borderRadius: 4, marginBottom: 6 }}>{file.category || 'Document'}</span>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 16, fontWeight: 500, color: C.fg1, lineHeight: 1.3 }}>{file.title}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke={C.fg3} strokeWidth="1.5" strokeLinecap="round" width="16" height="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.fg3 }}>{file.fileName?.split('.').pop()?.toUpperCase()}</span>
        </div>
      </div>
      {file.summary && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg2, lineHeight: 1.55, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>{file.summary}</div>}
      {(file.tags || []).length > 0 && (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {file.tags.map(t => <span key={t} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3, background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 4, padding: '1px 7px' }}>{t}</span>)}
        </div>
      )}
      {file.relatedProject && (
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3 }}>
          <span style={{ color: C.fg3 }}>Project: </span><span style={{ color: C.fg2 }}>{file.relatedProject}</span>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: `1px solid ${C.border}`, marginTop: 4 }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg3 }}>{file.date}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => onClick(file)} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.accent, background: C.accentBg, border: `1px solid ${C.accent}33`, borderRadius: 5, cursor: 'pointer', padding: '4px 10px', fontWeight: 500 }}>View Content</button>
          <a href={fileUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg2, background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 5, cursor: 'pointer', padding: '4px 10px', textDecoration: 'none' }}>Open PDF ↗</a>
          <button onClick={e => { e.stopPropagation(); onDelete(file.id); }} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.danger, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px' }}>×</button>
        </div>
      </div>
    </div>
  );
}

export default function FilesPage({ onNavigate }) {
  const { files, addFile, deleteFile } = useAppData();
  const { showToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');

  const filtered = files
    .filter(f => catFilter === 'All' || f.category === catFilter)
    .filter(f => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return f.title.toLowerCase().includes(q) || (f.summary || '').toLowerCase().includes(q) || (f.tags || []).some(t => t.toLowerCase().includes(q));
    });

  const handleSave = async (data) => {
    await addFile(data);
    setShowModal(false);
    showToast('File added', 'success');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Remove this file entry?')) {
      await deleteFile(id);
      showToast('File removed', 'info');
    }
  };

  return (
    <div className="page-pad" style={{ background: C.bg0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 700, color: C.fg1, letterSpacing: '-0.02em' }}>Files & Documents</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, marginTop: 4 }}>
            {filtered.length !== files.length ? `${filtered.length} of ${files.length} files` : `${files.length} file${files.length !== 1 ? 's' : ''}`}
          </div>
        </div>
        <button style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '8px 16px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.background = C.accentDim}
          onMouseLeave={e => e.currentTarget.style.background = C.accent}
          onClick={() => setShowModal(true)}>+ Add File</button>
      </div>

      <div style={{ position: 'relative', marginBottom: 12 }}>
        <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} viewBox="0 0 24 24" fill="none" stroke={C.fg3} strokeWidth="1.5" strokeLinecap="round" width="15" height="15"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search files by title, summary, tag…"
          style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6, color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: '8px 12px 8px 32px', outline: 'none', width: '100%' }}
          onFocus={e => { e.target.style.borderColor = C.accentDim; }}
          onBlur={e => { e.target.style.borderColor = C.border; }} />
        {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.fg3, fontSize: 16 }}>×</button>}
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCatFilter(c)}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, padding: '5px 12px', borderRadius: 999, border: `1px solid ${catFilter === c ? C.accent + '44' : C.border}`, background: catFilter === c ? C.accentBg : 'transparent', color: catFilter === c ? C.accent : C.fg3, cursor: 'pointer', fontWeight: catFilter === c ? 500 : 400 }}>
            {c}
          </button>
        ))}
      </div>

      {files.length === 0 ? (
        <div style={{ background: C.bg1, border: `2px dashed ${C.border}`, borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📄</div>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, color: C.fg1, marginBottom: 8 }}>No files yet</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, marginBottom: 20 }}>Upload PDFs to your GitHub repo at public/files/, then add entries here.</div>
          <button style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '9px 20px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}
            onClick={() => setShowModal(true)}>+ Add your first file</button>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3, textAlign: 'center', padding: '40px 0' }}>No files match your search.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map(f => <FileCard key={f.id} file={f} onClick={() => onNavigate('file-detail', f)} onDelete={handleDelete} />)}
        </div>
      )}

      {showModal && <AddFileModal onClose={() => setShowModal(false)} onSave={handleSave} />}
    </div>
  );
}
