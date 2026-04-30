import { C, alpha } from '../tokens';

// Reusable sources/references field — a list of URLs persisted as
// `sources: string[]` on ideas and plans. Two presentations:
//
//   <SourcesEditor sources={...} onChange={...} />  — editable list
//   <SourcesView   sources={...} />                 — clickable list
//
// We persist a flat string[] (not {label,url}) to keep storage shape
// simple; the URL itself is the link text.

const inputStyle = {
  flex: 1, minWidth: 0,
  background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6,
  color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 15,
  padding: '8px 12px', outline: 'none', boxSizing: 'border-box',
  transition: 'border 150ms, box-shadow 150ms',
};

export function SourcesEditor({ sources, onChange }) {
  const list = Array.isArray(sources) ? sources : [];
  const update = (i, val) => onChange(list.map((s, idx) => idx === i ? val : s));
  const add    = () => onChange([...list, '']);
  const remove = (i) => onChange(list.filter((_, idx) => idx !== i));

  return (
    <div>
      {list.length === 0 && (
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3, marginBottom: 8 }}>
          No sources yet. Add reference URLs that informed this entry.
        </div>
      )}
      {list.map((url, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
          <input
            value={url}
            onChange={e => update(i, e.target.value)}
            placeholder="https://example.com/article"
            inputMode="url"
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = C.accentDim; e.target.style.boxShadow = `0 0 0 2px ${alpha(C.accentDim, 33)}`; }}
            onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            aria-label="Remove source"
            title="Remove source"
            style={{ flexShrink: 0, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.danger, background: 'none', border: `1px solid ${alpha(C.danger, 33)}`, borderRadius: 6, cursor: 'pointer', padding: '6px 10px' }}>
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.accent, background: C.accentBg, border: `1px solid ${alpha(C.accent, 33)}`, borderRadius: 4, cursor: 'pointer', padding: '5px 12px', marginTop: 2 }}>
        + Add URL
      </button>
    </div>
  );
}

export function SourcesView({ sources }) {
  const valid = (Array.isArray(sources) ? sources : []).map(s => (s || '').trim()).filter(Boolean);
  if (!valid.length) return null;
  return (
    <ul style={{ listStyle: 'disc', paddingLeft: 20, margin: 0 }}>
      {valid.map((url, i) => (
        <li key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.fg2, lineHeight: 1.7, wordBreak: 'break-all' }}>
          <a href={url} target="_blank" rel="noreferrer noopener"
            style={{ color: C.accent, textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
            {url}
          </a>
        </li>
      ))}
    </ul>
  );
}
