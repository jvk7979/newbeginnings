import { useState } from 'react';
import { C } from '../tokens';
import { useAppData } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { formatText } from '../utils/textFormatter';

export default function PlanDetailPage({ plan, onNavigate }) {
  const { plans, updatePlan, deletePlan } = useAppData();
  const { showToast } = useToast();

  const resolved = plan ?? (plans.length > 0 ? plans[0] : null);

  if (!resolved) {
    return (
      <div className="page-pad" style={{ background: C.bg0 }}>
        <button onClick={() => onNavigate('plans')} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Business Plans
        </button>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3, marginTop: 40, textAlign: 'center' }}>No business plans yet. Create your first plan.</div>
      </div>
    );
  }

  return <PlanEditor plan={resolved} onNavigate={onNavigate} updatePlan={updatePlan} deletePlan={deletePlan} showToast={showToast} />;
}

function PlanEditor({ plan, onNavigate, updatePlan, deletePlan, showToast }) {
  const [title, setTitle]       = useState(plan.title);
  const [summary, setSummary]   = useState(plan.summary || '');
  const [status, setStatus]     = useState(plan.status || 'draft');
  const [sections, setSections] = useState(plan.sections || []);
  const [saved, setSaved]       = useState(false);
  const [editing, setEditing]   = useState(false);

  const inputStyle = { background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6, color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: '9px 12px', outline: 'none', width: '100%', transition: 'border 150ms' };
  const focus = e => { e.target.style.borderColor = C.accentDim; e.target.style.boxShadow = `0 0 0 2px ${C.accentDim}33`; };
  const blur  = e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; };

  const updateSection = (i, field, val) => setSections(s => s.map((sec, idx) => idx === i ? { ...sec, [field]: val } : sec));
  const addSection    = () => setSections(s => [...s, { title: '', content: '' }]);
  const removeSection = (i) => setSections(s => s.filter((_, idx) => idx !== i));
  const moveSection   = (i, dir) => setSections(s => {
    const next = [...s];
    const j = i + dir;
    if (j < 0 || j >= next.length) return next;
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });

  const handleSave = () => {
    updatePlan(plan.id, { title: title.trim(), summary: summary.trim(), status, sections });
    setSaved(true);
    setEditing(false);
    showToast('Plan saved', 'success');
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDelete = () => {
    if (!window.confirm('Delete this business plan? This cannot be undone.')) return;
    deletePlan(plan.id);
    showToast('Plan deleted', 'info');
    onNavigate('plans');
  };

  return (
    <div className="page-pad" style={{ background: C.bg0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <button onClick={() => onNavigate('plans')} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Business Plans
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setEditing(e => !e)} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: editing ? C.fg2 : C.accent, background: 'none', border: `1px solid ${editing ? C.border : C.accent}33`, borderRadius: 5, cursor: 'pointer', padding: '5px 12px' }}>
            {editing ? 'Cancel Edit' : 'Edit Plan'}
          </button>
          <button onClick={handleDelete} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.danger, background: 'none', border: `1px solid ${C.danger}33`, borderRadius: 5, cursor: 'pointer', padding: '5px 12px' }}>Delete</button>
        </div>
      </div>

      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Business Plan</div>

      {editing ? (
        <div style={{ maxWidth: 700, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: C.fg2, marginBottom: 5, display: 'block' }}>Plan Title</label>
            <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} onFocus={focus} onBlur={blur} />
          </div>
          <div>
            <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: C.fg2, marginBottom: 5, display: 'block' }}>Status</label>
            <select style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }} value={status} onChange={e => setStatus(e.target.value)}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
            </select>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: C.fg2 }}>Executive Summary</label>
              {summary.trim() && (
                <button type="button" onClick={() => setSummary(s => formatText(s))}
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.accent, background: C.accentBg, border: `1px solid ${C.accent}33`, borderRadius: 4, cursor: 'pointer', padding: '3px 9px' }}>
                  ✦ Format
                </button>
              )}
            </div>
            <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 100, lineHeight: 1.6 }} value={summary}
              onChange={e => setSummary(e.target.value)}
              onFocus={focus} onBlur={blur} />
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3, marginTop: 4 }}>{summary.length} characters</div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.fg3 }}>Sections ({sections.length})</div>
              <button onClick={addSection} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 500 }}>+ Add Section</button>
            </div>
            {sections.map((sec, i) => (
              <div key={i} style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 16px', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg3 }}>Section {i + 1}</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {i > 0 && <button onClick={() => moveSection(i, -1)} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>↑</button>}
                    {i < sections.length - 1 && <button onClick={() => moveSection(i, 1)} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>↓</button>}
                    {sections.length > 1 && <button onClick={() => removeSection(i)} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.danger, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Remove</button>}
                  </div>
                </div>
                <input style={{ ...inputStyle, marginBottom: 10, background: C.bg0 }} value={sec.title}
                  onChange={e => updateSection(i, 'title', e.target.value)}
                  placeholder="Section title"
                  onFocus={focus} onBlur={blur} />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
                  {sec.content.trim() && (
                    <button type="button" onClick={() => updateSection(i, 'content', formatText(sec.content))}
                      style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.accent, background: C.accentBg, border: `1px solid ${C.accent}33`, borderRadius: 4, cursor: 'pointer', padding: '3px 9px' }}>
                      ✦ Format
                    </button>
                  )}
                </div>
                <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 100, lineHeight: 1.6, background: C.bg0 }} value={sec.content}
                  onChange={e => updateSection(i, 'content', e.target.value)}
                  placeholder="Section content…"
                  onFocus={focus} onBlur={blur} />
                {sec.content.length > 0 && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: C.fg3, marginTop: 4 }}>{sec.content.length} characters</div>}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '9px 20px', borderRadius: 6, background: saved ? C.success : C.accent, color: '#fff', border: 'none', cursor: 'pointer', transition: 'background 200ms' }}
              onMouseEnter={e => { if (!saved) e.currentTarget.style.background = C.accentDim; }}
              onMouseLeave={e => { if (!saved) e.currentTarget.style.background = saved ? C.success : C.accent; }}
              onClick={handleSave}>{saved ? 'Saved!' : 'Save Changes'}</button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 32, fontWeight: 700, color: C.fg1, letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 8 }}>{title}</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.fg3, marginBottom: summary ? 20 : 32 }}>
            Updated {plan.updated} · {sections.length} sections · <span style={{ color: C.success }}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
          </div>
          {summary && (
            <div style={{ background: C.accentBg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 18px', marginBottom: 32 }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.fg3, marginBottom: 8 }}>Executive Summary</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2, lineHeight: 1.7 }}>{summary}</div>
            </div>
          )}
          {sections.length === 0 && (
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3 }}>No sections yet. Click Edit Plan to add sections.</div>
          )}
          {sections.map((sec, i) => (
            <div key={i} style={{ marginBottom: 28, paddingBottom: 28, borderBottom: i < sections.length - 1 ? `1px solid ${C.border}` : 'none' }}>
              <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 600, color: C.fg1, marginBottom: 10 }}>{sec.title}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.fg2, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{sec.content}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
