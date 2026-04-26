import { useState } from 'react';
import { C } from '../tokens';
import { useAppData } from '../context/AppContext';
import { useToast } from '../context/ToastContext';

const STATUS_OPTIONS = ['draft', 'progress', 'active', 'stalled'];

export default function ProjectDetailPage({ project, onNavigate }) {
  const { updateProject, deleteProject } = useAppData();
  const { showToast } = useToast();
  const p = project || {};

  const [title, setTitle]   = useState(p.title || '');
  const [status, setStatus] = useState(p.status || 'draft');
  const [desc, setDesc]     = useState(p.desc || '');
  const [notes, setNotes]   = useState(p.notes || '');
  const [saved, setSaved]   = useState(false);

  const inputStyle = { background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6, color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: '9px 12px', outline: 'none', width: '100%', transition: 'border 150ms' };
  const focus = e => { e.target.style.borderColor = C.accentDim; e.target.style.boxShadow = `0 0 0 2px ${C.accentDim}33`; };
  const blur  = e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; };

  const handleSave = () => {
    if (p.id) updateProject(p.id, { title: title.trim(), status, desc: desc.trim(), notes: notes.trim() });
    setSaved(true);
    showToast('Project updated', 'success');
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDelete = () => {
    if (!window.confirm('Delete this project? This cannot be undone.')) return;
    if (p.id) deleteProject(p.id);
    showToast('Project deleted', 'info');
    onNavigate('projects');
  };

  return (
    <div className="page-pad" style={{ background: C.bg0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <button onClick={() => onNavigate('projects')} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Projects
        </button>
        <button onClick={handleDelete} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.danger, background: 'none', border: `1px solid ${C.danger}33`, borderRadius: 5, cursor: 'pointer', padding: '5px 12px' }}>Delete</button>
      </div>

      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Project</div>

      {p.kpis && (
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 8, padding: '16px 20px', marginBottom: 24 }}>
          {p.kpis.map(k => (
            <div key={k.label}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 600, color: C.accent }}>{k.value}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: C.fg3, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 3 }}>{k.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: C.fg2, marginBottom: 5, display: 'block' }}>Project Title</label>
          <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} onFocus={focus} onBlur={blur} />
        </div>

        <div>
          <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: C.fg2, marginBottom: 5, display: 'block' }}>Status</label>
          <select style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }} value={status} onChange={e => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === 'progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>

        <div>
          <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: C.fg2, marginBottom: 5, display: 'block' }}>Description</label>
          <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 100, lineHeight: 1.6 }} value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="Goals, scope, current status…"
            onFocus={focus} onBlur={blur} />
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3, marginTop: 4 }}>{p.date && `Created ${p.date}`}</div>
        </div>

        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20 }}>
          <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: C.fg2, marginBottom: 5, display: 'block' }}>Notes & Next Steps</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            style={{ ...inputStyle, resize: 'vertical', minHeight: 100, lineHeight: 1.6 }}
            placeholder="Next steps, blockers, open questions…"
            onFocus={focus} onBlur={blur} />
        </div>

        <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
          <button
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '9px 20px', borderRadius: 6, background: saved ? C.success : C.accent, color: '#fff', border: 'none', cursor: 'pointer', transition: 'background 200ms' }}
            onMouseEnter={e => { if (!saved) e.currentTarget.style.background = C.accentDim; }}
            onMouseLeave={e => { if (!saved) e.currentTarget.style.background = saved ? C.success : C.accent; }}
            onClick={handleSave}>{saved ? 'Saved!' : 'Save Changes'}</button>
          <button style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: '9px 20px', borderRadius: 6, background: 'transparent', color: C.fg3, border: `1px solid ${C.border}`, cursor: 'pointer' }}
            onClick={() => onNavigate('projects')}>Back</button>
        </div>
      </div>
    </div>
  );
}
