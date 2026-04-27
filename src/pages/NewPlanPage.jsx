import { useState } from 'react';
import { C, alpha } from '../tokens';
import { useAppData } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { formatText } from '../utils/textFormatter';
import PdfUploadZone from '../components/PdfUploadZone';

export default function NewPlanPage({ onNavigate }) {
  const { addPlan } = useAppData();
  const { showToast } = useToast();
  const [form, setForm] = useState({ title: '', summary: '', status: 'draft' });
  const [sections, setSections] = useState([{ title: '', content: '' }]);
  const [error, setError] = useState('');

  const inputStyle = { background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6, color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: '9px 12px', outline: 'none', width: '100%', transition: 'border 150ms' };
  const labelStyle = { fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: C.fg2, marginBottom: 5, display: 'block' };
  const focus = e => { e.target.style.borderColor = C.accentDim; e.target.style.boxShadow = `0 0 0 2px ${alpha(C.accentDim, 33)}`; };
  const blur  = e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; };

  const handleExtracted = (parsed) => {
    setForm(f => ({
      ...f,
      title:   parsed.title   || f.title,
      summary: parsed.summary || f.summary,
    }));
    if (parsed.sections?.length > 0) {
      setSections(parsed.sections.map(s => ({ title: s.title, content: s.content })));
    }
    showToast(`PDF applied — ${parsed.sections?.length || 0} sections extracted`, 'success');
  };

  const addSection    = () => setSections(s => [...s, { title: '', content: '' }]);
  const removeSection = (i) => setSections(s => s.filter((_, idx) => idx !== i));
  const updateSection = (i, field, val) => setSections(s => s.map((sec, idx) => idx === i ? { ...sec, [field]: val } : sec));
  const moveSection   = (i, dir) => setSections(s => {
    const next = [...s]; const j = i + dir;
    if (j < 0 || j >= next.length) return next;
    [next[i], next[j]] = [next[j], next[i]]; return next;
  });

  const handleSave = () => {
    if (!form.title.trim()) { setError('Plan title is required.'); return; }
    const validSections = sections.filter(s => s.title.trim() || s.content.trim());
    addPlan({ ...form, title: form.title.trim(), sections: validSections });
    showToast('Business plan saved', 'success');
    onNavigate('plans');
  };

  return (
    <div className="page-pad" style={{ background: C.bg0 }}>
      <div style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>
      <button onClick={() => onNavigate('plans')} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Business Plans
      </button>
      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 700, color: C.fg1, letterSpacing: '-0.02em', marginBottom: 6 }}>New Business Plan</div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, marginBottom: 24 }}>Upload a PDF to auto-extract all sections, or build manually below.</div>

      <PdfUploadZone mode="plan" onExtracted={handleExtracted} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label style={labelStyle}>Plan Title *</label>
          <input style={{ ...inputStyle, borderColor: error ? C.danger : C.border }} value={form.title}
            onChange={e => { setForm({ ...form, title: e.target.value }); setError(''); }}
            placeholder="e.g. Coconut Processing Plant — Feasibility Report"
            onFocus={focus} onBlur={blur} />
          {error && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.danger, marginTop: 4 }}>{error}</div>}
        </div>

        <div>
          <label style={labelStyle}>Status</label>
          <select style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
          </select>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Executive Summary</label>
            {form.summary.trim() && (
              <button type="button" onClick={() => setForm(f => ({ ...f, summary: formatText(f.summary) }))}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.accent, background: C.accentBg, border: `1px solid ${alpha(C.accent, 33)}`, borderRadius: 4, cursor: 'pointer', padding: '3px 9px' }}>
                ✦ Format
              </button>
            )}
          </div>
          <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 100, lineHeight: 1.6 }} value={form.summary}
            onChange={e => setForm({ ...form, summary: e.target.value })}
            placeholder="One-paragraph overview of the plan…"
            onFocus={focus} onBlur={blur} />
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3, marginTop: 4 }}>{form.summary.length} characters</div>
        </div>

        {/* Sections */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.fg3 }}>
              Sections ({sections.length})
            </div>
            <button onClick={addSection}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 500 }}>
              + Add Section
            </button>
          </div>
          {sections.map((sec, i) => (
            <div key={i} style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 16px', marginBottom: 10, animation: 'fadeIn 200ms ease' }}>
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
                placeholder="Section title (e.g. Executive Summary)"
                onFocus={focus} onBlur={blur} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
                {sec.content.trim() && (
                  <button type="button" onClick={() => updateSection(i, 'content', formatText(sec.content))}
                    style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.accent, background: C.accentBg, border: `1px solid ${alpha(C.accent, 33)}`, borderRadius: 4, cursor: 'pointer', padding: '3px 9px' }}>
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
          <button style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '9px 20px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = C.accentDim}
            onMouseLeave={e => e.currentTarget.style.background = C.accent}
            onClick={handleSave}>Save Plan</button>
          <button style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: '9px 20px', borderRadius: 6, background: 'transparent', color: C.fg3, border: `1px solid ${C.border}`, cursor: 'pointer' }}
            onClick={() => onNavigate('plans')}>Cancel</button>
        </div>
      </div>
      </div>
    </div>
  );
}
