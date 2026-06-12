import { useState, useEffect, useRef } from 'react';
import { C, alpha } from '../tokens';

export default function QuickEditForm({
  initialTitle, initialStatus, initialCategory,
  initialEstimatedCapex, initialEstimatedPayback,
  statuses, categories,
  onSave, onCancel,
}) {
  const [title, setTitle] = useState(initialTitle || '');
  const [status, setStatus] = useState(initialStatus || '');
  const [category, setCategory] = useState(initialCategory || '');
  const [estimatedCapex, setEstimatedCapex] = useState(initialEstimatedCapex ?? '');
  const [estimatedPayback, setEstimatedPayback] = useState(initialEstimatedPayback ?? '');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 0); }, []);

  const dirty =
    title !== (initialTitle || '') ||
    status !== (initialStatus || '') ||
    category !== (initialCategory || '') ||
    String(estimatedCapex) !== String(initialEstimatedCapex ?? '') ||
    String(estimatedPayback) !== String(initialEstimatedPayback ?? '');

  const submit = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      await onSave({
        title: title.trim(), status, category: category || initialCategory,
        estimatedCapex:   estimatedCapex   !== '' ? Number(estimatedCapex)   : undefined,
        estimatedPayback: estimatedPayback !== '' ? Number(estimatedPayback) : undefined,
      });
    } finally { setSaving(false); }
  };

  return (
    <div onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}
      style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input ref={inputRef} type="text" value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') submit();
          if (e.key === 'Escape') onCancel();
        }}
        maxLength={140}
        placeholder="Title"
        aria-label="Title"
        style={{
          fontFamily: "'Playfair Display', Georgia, serif", fontSize: 17, fontWeight: 600,
          color: C.fg1, background: C.bg1,
          border: `1px solid ${C.accentDim}`, borderRadius: 6,
          padding: '8px 10px', outline: 'none', width: '100%', boxSizing: 'border-box',
          boxShadow: `0 0 0 2px ${alpha(C.accentDim, 22)}`,
        }} />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <label style={{ flex: 1, minWidth: 130, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, color: C.fg3, letterSpacing: 0.4, textTransform: 'uppercase' }}>Status</span>
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="select-wrap"
            style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg1,
              background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6,
              padding: '6px 10px', outline: 'none', cursor: 'pointer',
            }}>
            {statuses.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>

        {categories && (
          <label style={{ flex: 1, minWidth: 130, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, color: C.fg3, letterSpacing: 0.4, textTransform: 'uppercase' }}>Category</span>
            <select value={category} onChange={e => setCategory(e.target.value)}
              style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg1,
                background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6,
                padding: '6px 10px', outline: 'none', cursor: 'pointer',
              }}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <label style={{ flex: 1, minWidth: 130, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, color: C.fg3, letterSpacing: 0.4, textTransform: 'uppercase' }}>Project Cost Est. (₹)</span>
          <input type="number" min={0} value={estimatedCapex} onChange={e => setEstimatedCapex(e.target.value)}
            placeholder="optional"
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg1, background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6, padding: '6px 10px', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
        </label>
        <label style={{ flex: 1, minWidth: 130, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, color: C.fg3, letterSpacing: 0.4, textTransform: 'uppercase' }}>Payback (yrs)</span>
          <input type="number" min={0} step={0.5} value={estimatedPayback} onChange={e => setEstimatedPayback(e.target.value)}
            placeholder="optional"
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg1, background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6, padding: '6px 10px', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
        </label>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
        <button type="button" onClick={onCancel}
          style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg2,
            background: 'transparent', border: `1px solid ${C.border}`,
            borderRadius: 6, padding: '6px 14px', cursor: 'pointer',
          }}>
          Cancel
        </button>
        <button type="button" onClick={submit}
          disabled={!title.trim() || !dirty || saving}
          style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: '#fff',
            background: (!title.trim() || !dirty || saving) ? alpha(C.accent, 44) : C.accent,
            border: 'none', borderRadius: 6, padding: '6px 16px',
            cursor: (!title.trim() || !dirty || saving) ? 'not-allowed' : 'pointer',
          }}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}
