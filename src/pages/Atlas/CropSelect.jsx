// src/pages/Atlas/CropSelect.jsx
//
// Searchable single-crop dropdown. Picking a crop recolours the whole map
// by that crop; "Any crop" (the default, null) returns the map to the
// all-crops aggregate colouring.

import { useState, useRef, useEffect } from 'react';
import { C } from '../../tokens';

// `crops` is the list of selectable crop names — the real APEDA crops.
export default function CropSelect({ crop, crops, onChange }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const filtered = crops.filter((c) => c.toLowerCase().includes(q.trim().toLowerCase()));
  const active = !!crop;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen((o) => !o)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: active ? C.accentBg : C.bg1,
          border: `1px solid ${active ? 'var(--c-border-accent, #C4A060)' : C.border}`,
          borderRadius: 6, padding: '5px 11px', cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif", fontSize: 11,
          fontWeight: active ? 600 : 500, color: active ? C.accent : C.fg2, minWidth: 120,
        }}>
        <span style={{ flex: 1, textAlign: 'left' }}>{crop || 'Any crop'}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, width: 220, zIndex: 60,
          background: C.bg0, border: `1px solid ${C.borderLight}`, borderRadius: 8,
          boxShadow: '0 12px 40px rgba(45,42,38,0.18)', padding: 8,
        }}>
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search crops…"
            style={{
              width: '100%', boxSizing: 'border-box', background: C.bg1,
              border: `1px solid ${C.border}`, borderRadius: 6, padding: '6px 9px',
              fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg1,
              outline: 'none', marginBottom: 6,
            }} />
          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            <button onClick={() => { onChange(null); setOpen(false); setQ(''); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left', border: 'none',
                background: !crop ? C.accentBg : 'transparent', color: !crop ? C.accent : C.fg2,
                borderRadius: 5, padding: '6px 9px', cursor: 'pointer', fontStyle: 'italic',
                fontFamily: "'DM Sans', sans-serif", fontSize: 13, marginBottom: 2,
              }}>
              — Any crop (all-crops colouring) —
            </button>
            {filtered.length === 0 && (
              <div style={{ padding: '8px 9px', fontSize: 12, color: C.fg3, fontStyle: 'italic' }}>No matches.</div>
            )}
            {filtered.map((c) => (
              <button key={c} onClick={() => { onChange(c); setOpen(false); setQ(''); }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', border: 'none',
                  background: c === crop ? C.accentBg : 'transparent',
                  color: c === crop ? C.accent : C.fg1,
                  borderRadius: 5, padding: '6px 9px', cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                }}
                onMouseEnter={(e) => { if (c !== crop) e.currentTarget.style.background = C.bg2; }}
                onMouseLeave={(e) => { if (c !== crop) e.currentTarget.style.background = 'transparent'; }}>
                {c}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
