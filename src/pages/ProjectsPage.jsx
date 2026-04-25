import { useState } from 'react';
import { C } from '../tokens';
import { useAppData } from '../context/AppContext';
import ProjectCard from '../components/ProjectCard';

const STATUS_OPTIONS = ['draft', 'progress', 'active', 'stalled'];

export default function ProjectsPage({ onNavigate }) {
  const { projects, addProject } = useAppData();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', desc: '', status: 'draft' });
  const [error, setError] = useState('');

  const inputStyle = { background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6, color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: '9px 12px', outline: 'none', width: '100%' };
  const labelStyle = { fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: C.fg2, marginBottom: 5, display: 'block' };

  const handleSave = () => {
    if (!form.title.trim()) { setError('Project title is required.'); return; }
    addProject({ title: form.title.trim(), desc: form.desc.trim(), status: form.status });
    setForm({ title: '', desc: '', status: 'draft' });
    setShowForm(false);
    setError('');
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 36px', background: C.bg0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 700, color: C.fg1, letterSpacing: '-0.02em' }}>Projects</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, marginTop: 4 }}>{projects.length} projects</div>
        </div>
        <button style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '8px 16px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.background = C.accentDim}
          onMouseLeave={e => e.currentTarget.style.background = C.accent}
          onClick={() => setShowForm(s => !s)}>{showForm ? 'Cancel' : '+ New Project'}</button>
      </div>

      {showForm && (
        <div style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 8, padding: '20px 22px', marginBottom: 24, maxWidth: 560 }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: C.fg1, marginBottom: 16 }}>New Project</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Project Title *</label>
              <input style={{ ...inputStyle, borderColor: error ? C.danger : C.border }} value={form.title}
                onChange={e => { setForm({ ...form, title: e.target.value }); setError(''); }}
                placeholder="What are you building?" />
              {error && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.danger, marginTop: 4 }}>{error}</div>}
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select style={{ ...inputStyle, appearance: 'none' }} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === 'progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 80, lineHeight: 1.55 }} value={form.desc}
                onChange={e => setForm({ ...form, desc: e.target.value })}
                placeholder="Current status, goals, open items…" />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '8px 18px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = C.accentDim}
                onMouseLeave={e => e.currentTarget.style.background = C.accent}
                onClick={handleSave}>Save Project</button>
              <button style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: '8px 18px', borderRadius: 6, background: 'transparent', color: C.fg3, border: `1px solid ${C.border}`, cursor: 'pointer' }}
                onClick={() => { setShowForm(false); setError(''); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {projects.map(p => <ProjectCard key={p.id} {...p} onClick={() => onNavigate('project-detail', p)} />)}
      </div>
    </div>
  );
}
