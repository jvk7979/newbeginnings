import { useState, useEffect, useRef } from 'react';
import { C, alpha } from '../tokens';
import { loadViews, saveViews } from '../utils/savedViews';

export default function SavedViewsBar({ scope, currentState, onApply, isStateEqual }) {
  const [views, setViews] = useState(() => loadViews(scope));
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { if (naming) setTimeout(() => inputRef.current?.focus(), 0); }, [naming]);

  const persist = (next) => { setViews(next); saveViews(scope, next); };

  const onSave = () => {
    const n = name.trim();
    if (!n) return;
    const next = [...views, { id: String(Date.now()), name: n.slice(0, 40), state: currentState }];
    persist(next);
    setName(''); setNaming(false);
  };

  const onDelete = (id) => persist(views.filter(v => v.id !== id));

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, marginRight: 4 }}>
        Saved views:
      </span>

      {views.length === 0 && !naming && (
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, fontStyle: 'italic' }}>
          none yet
        </span>
      )}

      {views.map(v => {
        const active = isStateEqual?.(v.state, currentState) ?? false;
        return (
          <span key={v.id}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontFamily: "'DM Sans', sans-serif", fontSize: 13,
              borderRadius: 999, border: `1px solid ${active ? alpha(C.accent, 44) : C.border}`,
              background: active ? C.accentBg : C.bg1,
              color: active ? C.accent : C.fg2,
              padding: '3px 4px 3px 10px',
            }}>
            <button onClick={() => onApply(v.state)}
              title={`Apply view "${v.name}"`}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit',
                fontWeight: active ? 600 : 400, padding: 0,
              }}>
              {v.name}
            </button>
            <button onClick={() => onDelete(v.id)}
              aria-label={`Delete saved view "${v.name}"`}
              style={{
                width: 20, height: 20, borderRadius: '50%', border: 'none',
                background: 'transparent', cursor: 'pointer', color: C.fg3,
                fontSize: 14, lineHeight: 1, padding: 0,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = C.bg2; e.currentTarget.style.color = C.fg1; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.fg3; }}>
              ×
            </button>
          </span>
        );
      })}

      {naming ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <input ref={inputRef} type="text" value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') onSave();
              if (e.key === 'Escape') { setNaming(false); setName(''); }
            }}
            placeholder="Name this view…"
            maxLength={40}
            style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 13,
              padding: '4px 10px', borderRadius: 999,
              border: `1px solid ${C.accentDim}`, background: C.bg1, color: C.fg1,
              outline: 'none', minWidth: 140,
            }} />
          <button onClick={onSave}
            disabled={!name.trim()}
            style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
              padding: '4px 12px', borderRadius: 999,
              background: name.trim() ? C.accent : C.bg2,
              color: name.trim() ? '#fff' : C.fg3,
              border: 'none', cursor: name.trim() ? 'pointer' : 'not-allowed',
            }}>
            Save
          </button>
          <button onClick={() => { setNaming(false); setName(''); }}
            style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3,
              background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 8px',
            }}>
            Cancel
          </button>
        </span>
      ) : (
        <button onClick={() => setNaming(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
            padding: '4px 12px', borderRadius: 999,
            border: `1px dashed ${C.border}`, background: 'transparent', color: C.fg2,
            cursor: 'pointer',
          }}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="11" height="11">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Save current
        </button>
      )}
    </div>
  );
}
