import { useState } from 'react';
import { C } from '../tokens';
import Badge from '../components/Badge';
import { useAppData } from '../context/AppContext';

const STATUS_OPTIONS = ['draft', 'progress', 'active', 'stalled'];

export default function ProjectDetailPage({ project, onNavigate }) {
  const { updateProject } = useAppData();
  const p = project || {};
  const [status, setStatus] = useState(p.status || 'draft');
  const [notes, setNotes] = useState(p.notes || '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (p.id) updateProject(p.id, { status, notes });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 48px', background: C.bg0 }}>
      <button onClick={() => onNavigate('projects')} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Projects
      </button>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 30, fontWeight: 700, color: C.fg1, letterSpacing: '-0.02em', lineHeight: 1.2 }}>{p.title}</div>
        <select value={status} onChange={e => setStatus(e.target.value)}
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 4, border: `1px solid ${C.border}`, background: C.bg1, color: C.accent, cursor: 'pointer', outline: 'none' }}>
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s === 'progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.fg3, marginBottom: 24 }}>{p.date}</div>

      {p.kpis && (
        <div style={{ display: 'flex', gap: 20, background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 8, padding: '16px 20px', marginBottom: 28 }}>
          {p.kpis.map(k => (
            <div key={k.label}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 600, color: C.accent }}>{k.value}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: C.fg3, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 3 }}>{k.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 24, marginBottom: 28 }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.fg3, marginBottom: 12 }}>Description</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.fg2, lineHeight: 1.7, maxWidth: 640 }}>{p.desc}</div>
      </div>

      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 24 }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.fg3, marginBottom: 12 }}>Notes</div>
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          style={{ width: '100%', maxWidth: 640, minHeight: 100, background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6, color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: '10px 12px', resize: 'vertical', lineHeight: 1.6, outline: 'none' }}
          placeholder="Next steps, open questions, blockers…"
          onFocus={e => { e.target.style.borderColor = C.accentDim; e.target.style.boxShadow = `0 0 0 2px ${C.accentDim}33`; }}
          onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }} />
      </div>

      <div style={{ marginTop: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
        <button style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '8px 18px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.background = C.accentDim}
          onMouseLeave={e => e.currentTarget.style.background = C.accent}
          onClick={handleSave}>Save Changes</button>
        <button style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: '8px 18px', borderRadius: 6, background: 'transparent', color: C.fg3, border: `1px solid ${C.border}`, cursor: 'pointer' }}
          onClick={() => onNavigate('projects')}>Back</button>
        {saved && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.success }}>Saved</span>}
      </div>
    </div>
  );
}
