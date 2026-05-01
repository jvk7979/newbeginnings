import { useState, useEffect, useRef } from 'react';
import { C, alpha } from '../tokens';

export default function BulkSelectionBar({
  count,
  itemLabel = 'item',
  statuses,
  onChangeStatus,
  onDelete,
  onClear,
}) {
  const [statusOpen, setStatusOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!statusOpen) return;
    const onDoc = (e) => { if (!menuRef.current?.contains(e.target)) setStatusOpen(false); };
    const onEsc = (e) => { if (e.key === 'Escape') setStatusOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [statusOpen]);

  if (count === 0) return null;

  return (
    <div role="region" aria-label="Bulk actions"
      style={{
        position: 'fixed', left: 0, right: 0,
        bottom: 'max(16px, env(safe-area-inset-bottom))',
        zIndex: 600, display: 'flex', justifyContent: 'center',
        padding: '0 12px', pointerEvents: 'none',
      }}>
      <div style={{
        pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 8,
        background: C.bg1, border: `1px solid ${C.border}`,
        borderRadius: 999, padding: '6px 8px 6px 14px',
        boxShadow: '0 12px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
        maxWidth: 'calc(100vw - 24px)', flexWrap: 'wrap',
      }}>
        <span aria-live="polite"
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: C.fg1, whiteSpace: 'nowrap' }}>
          {count} {itemLabel}{count === 1 ? '' : 's'} selected
        </span>

        <button onClick={onClear} aria-label="Clear selection"
          style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg2,
            background: 'transparent', border: `1px solid ${C.border}`,
            borderRadius: 999, padding: '6px 12px', cursor: 'pointer',
          }}>
          Cancel
        </button>

        {statuses && statuses.length > 0 && (
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button onClick={() => setStatusOpen(o => !o)}
              aria-haspopup="menu" aria-expanded={statusOpen}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg1,
                background: C.bg2, border: `1px solid ${C.border}`,
                borderRadius: 999, padding: '6px 12px', cursor: 'pointer',
              }}>
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                <path d="M3 6h18M6 12h12M10 18h4"/>
              </svg>
              Status
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="10" height="10"
                style={{ transform: statusOpen ? 'rotate(180deg)' : 'none', transition: 'transform 120ms' }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {statusOpen && (
              <div role="menu"
                style={{
                  position: 'absolute', bottom: 'calc(100% + 6px)', right: 0,
                  background: C.bg1, border: `1px solid ${C.border}`,
                  borderRadius: 8, boxShadow: '0 10px 28px rgba(0,0,0,0.18)',
                  minWidth: 160, padding: 4, zIndex: 1,
                }}>
                {statuses.map(s => (
                  <button key={s.id} role="menuitem"
                    onClick={() => { setStatusOpen(false); onChangeStatus(s.id); }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2,
                      background: 'transparent', border: 'none', borderRadius: 6,
                      padding: '8px 12px', cursor: 'pointer',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = C.bg2; e.currentTarget.style.color = C.fg1; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.fg2; }}>
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <button onClick={onDelete}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: '#fff',
            background: C.danger, border: `1px solid ${C.danger}`,
            borderRadius: 999, padding: '6px 14px', cursor: 'pointer',
          }}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
          </svg>
          Delete
        </button>
      </div>
    </div>
  );
}
