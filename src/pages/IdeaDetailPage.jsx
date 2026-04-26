import { useState } from 'react';
import { C } from '../tokens';
import Tag from '../components/Tag';
import { useAppData } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { formatText } from '../utils/textFormatter';

const STATUS_OPTIONS = ['draft', 'validating', 'active', 'archived'];

export default function IdeaDetailPage({ idea, onNavigate }) {
  const { updateIdea, deleteIdea } = useAppData();
  const { showToast } = useToast();
  const i = idea || { title: 'Integrated Coconut Processing Plant', status: 'validating', date: 'Apr 20, 2026', tags: ['Manufacturing'], desc: '' };

  const [status, setStatus]     = useState(i.status);
  const [title, setTitle]       = useState(i.title);
  const [tags, setTags]         = useState((i.tags || []).join(', '));
  const [desc, setDesc]         = useState(i.desc || '');
  const [notes, setNotes]       = useState(i.notes || '');
  const [saved, setSaved]       = useState(false);

  const inputStyle = { background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6, color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: '9px 12px', outline: 'none', width: '100%', transition: 'border 150ms' };
  const focus = e => { e.target.style.borderColor = C.accentDim; e.target.style.boxShadow = `0 0 0 2px ${C.accentDim}33`; };
  const blur  = e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; };

  const handleSave = () => {
    if (i.id) updateIdea(i.id, {
      title: title.trim(),
      status,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      desc: desc.trim(),
      notes: notes.trim(),
    });
    setSaved(true);
    showToast('Idea updated', 'success');
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDelete = () => {
    if (!window.confirm('Delete this idea? This cannot be undone.')) return;
    if (i.id) deleteIdea(i.id);
    showToast('Idea deleted', 'info');
    onNavigate('ideas');
  };

  return (
    <div className="page-pad" style={{ background: C.bg0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <button onClick={() => onNavigate('ideas')} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          All Ideas
        </button>
        <button onClick={handleDelete} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.danger, background: 'none', border: `1px solid ${C.danger}33`, borderRadius: 5, cursor: 'pointer', padding: '5px 12px' }}>Delete</button>
      </div>

      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Idea</div>

      <div style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: C.fg2, marginBottom: 5, display: 'block' }}>Title</label>
          <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} onFocus={focus} onBlur={blur} />
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: C.fg2, marginBottom: 5, display: 'block' }}>Stage</label>
            <select style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }} value={status} onChange={e => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div style={{ flex: 2, minWidth: 220 }}>
            <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: C.fg2, marginBottom: 5, display: 'block' }}>Tags (comma separated)</label>
            <input style={inputStyle} value={tags} onChange={e => setTags(e.target.value)} placeholder="Manufacturing, Export, Agri…" onFocus={focus} onBlur={blur} />
          </div>
        </div>

        {tags && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {tags.split(',').map(t => t.trim()).filter(Boolean).map(t => <Tag key={t} label={t} />)}
          </div>
        )}

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
            <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: C.fg2 }}>Description</label>
            {desc.trim() && (
              <button type="button" onClick={() => setDesc(d => formatText(d))}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.accent, background: C.accentBg, border: `1px solid ${C.accent}33`, borderRadius: 4, cursor: 'pointer', padding: '3px 9px' }}>
                ✦ Format
              </button>
            )}
          </div>
          <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 120, lineHeight: 1.6 }} value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="Problem being solved, target customer, rough mechanics…"
            onFocus={focus} onBlur={blur} />
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3, marginTop: 4 }}>{desc.length} characters · Captured {i.date}</div>
        </div>

        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20 }}>
          <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: C.fg2, marginBottom: 5, display: 'block' }}>Notes & Next Steps</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            style={{ ...inputStyle, resize: 'vertical', minHeight: 100, lineHeight: 1.6 }}
            placeholder="Open questions, validation ideas, next steps…"
            onFocus={focus} onBlur={blur} />
        </div>

        <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
          <button
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '9px 20px', borderRadius: 6, background: saved ? C.success : C.accent, color: '#fff', border: 'none', cursor: 'pointer', transition: 'background 200ms' }}
            onMouseEnter={e => { if (!saved) e.currentTarget.style.background = C.accentDim; }}
            onMouseLeave={e => { if (!saved) e.currentTarget.style.background = saved ? C.success : C.accent; }}
            onClick={handleSave}>{saved ? 'Saved!' : 'Save Changes'}</button>
          <button style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: '9px 20px', borderRadius: 6, background: 'transparent', color: C.fg3, border: `1px solid ${C.border}`, cursor: 'pointer' }}
            onClick={() => onNavigate('ideas')}>Back</button>
        </div>
      </div>
    </div>
  );
}
