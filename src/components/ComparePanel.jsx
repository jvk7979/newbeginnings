import { useState, useEffect, useMemo } from 'react';
import { C, alpha } from '../tokens';
import Badge from './Badge';

const MAX_SLOTS = 3;

export default function ComparePanel({ open, onClose, items, kind, onOpen }) {
  const [pickedIds, setPickedIds] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (open) { setPickedIds([]); setSearch(''); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const picked = useMemo(
    () => pickedIds.map(id => items.find(it => it.id === id)).filter(Boolean),
    [pickedIds, items]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items.slice(0, 50);
    return items.filter(it =>
      (it.title || '').toLowerCase().includes(q) ||
      (it.summary || it.desc || '').toLowerCase().includes(q)
    ).slice(0, 50);
  }, [items, search]);

  if (!open) return null;

  const toggle = (id) => {
    setPickedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= MAX_SLOTS) return prev;
      return [...prev, id];
    });
  };

  return (
    <div role="dialog" aria-label={`Compare ${kind === 'plan' ? 'plans' : 'ideas'}`} aria-modal="true"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(28,25,20,0.55)',
        zIndex: 700, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: 'max(20px, 4vh) 12px 12px', backdropFilter: 'blur(2px)',
      }}>
      <div style={{
        width: '100%', maxWidth: 1100, background: C.bg0, border: `1px solid ${C.border}`,
        borderRadius: 12, boxShadow: '0 18px 48px rgba(0,0,0,0.32)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        maxHeight: 'calc(100vh - max(40px, 8vh))',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12, padding: '14px 16px', borderBottom: `1px solid ${C.border}`,
          background: C.bg1,
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 700, color: C.fg1 }}>
              Compare {kind === 'plan' ? 'plans' : 'ideas'}
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.fg3, background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 5, padding: '1px 8px' }}>
              {picked.length}/{MAX_SLOTS}
            </span>
          </div>
          <button onClick={onClose} aria-label="Close compare"
            style={{
              width: 36, height: 36, borderRadius: 8, border: 'none',
              background: 'transparent', color: C.fg2, fontSize: 22, lineHeight: 1, cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = C.bg2; e.currentTarget.style.color = C.fg1; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.fg2; }}>
            ×
          </button>
        </div>

        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}` }}>
          <input type="text" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${kind === 'plan' ? 'plans' : 'ideas'} to add (max ${MAX_SLOTS})…`}
            aria-label="Search items to compare"
            style={{
              width: '100%', boxSizing: 'border-box',
              fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg1,
              background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6,
              padding: '8px 10px', outline: 'none',
            }} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10, maxHeight: 120, overflowY: 'auto' }}>
            {filtered.length === 0 && (
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, fontStyle: 'italic' }}>
                No matches.
              </span>
            )}
            {filtered.map(it => {
              const on = pickedIds.includes(it.id);
              const disabled = !on && pickedIds.length >= MAX_SLOTS;
              return (
                <button key={it.id} onClick={() => toggle(it.id)} disabled={disabled}
                  title={it.title}
                  style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                    padding: '5px 12px', borderRadius: 999,
                    border: `1px solid ${on ? alpha(C.accent, 55) : C.border}`,
                    background: on ? C.accentBg : C.bg1,
                    color: on ? C.accent : (disabled ? C.fg3 : C.fg2),
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    fontWeight: on ? 600 : 400, opacity: disabled ? 0.5 : 1,
                    maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                  {on ? '✓ ' : '+ '}{it.title}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {picked.length === 0 ? (
            <div style={{ padding: '40px 16px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", color: C.fg3 }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>⚖️</div>
              <div style={{ fontSize: 15 }}>Pick 2 or 3 {kind === 'plan' ? 'plans' : 'ideas'} above to compare side-by-side.</div>
            </div>
          ) : (
            <div style={{
              display: 'grid', gap: 12,
              gridTemplateColumns: `repeat(${picked.length}, minmax(260px, 1fr))`,
            }}>
              {picked.map(it => (
                <CompareColumn key={it.id} item={it} kind={kind}
                  onOpen={onOpen ? () => { onClose(); onOpen(it); } : undefined}
                  onRemove={() => toggle(it.id)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CompareColumn({ item, kind, onOpen, onRemove }) {
  const sections = Array.isArray(item.sections) ? item.sections : [];
  const sources  = Array.isArray(item.sources)  ? item.sources  : [];
  const summary  = item.summary || item.desc || '';
  const dateStr  = item.updated || item.date;

  return (
    <div style={{
      background: C.bg1, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.accent}`,
      borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 16, fontWeight: 700, color: C.fg1, lineHeight: 1.3, minWidth: 0, overflowWrap: 'anywhere' }}>
          {item.title}
        </div>
        <button onClick={onRemove} aria-label="Remove from comparison"
          style={{
            width: 24, height: 24, borderRadius: '50%', border: 'none',
            background: 'transparent', color: C.fg3, fontSize: 18, lineHeight: 1,
            cursor: 'pointer', flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = C.bg2; e.currentTarget.style.color = C.fg1; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.fg3; }}>
          ×
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {item.category && (
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.fg2, background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 5, padding: '2px 8px' }}>
            {item.category}
          </span>
        )}
        <Badge status={item.status} />
        {dateStr && (
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.fg3 }}>
            {item.updated ? `Updated ${dateStr}` : dateStr}
          </span>
        )}
      </div>

      <Section label={kind === 'plan' ? 'Executive summary' : 'Description'}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: summary ? C.fg2 : C.fg3, fontStyle: summary ? 'normal' : 'italic', lineHeight: 1.5, overflowWrap: 'anywhere' }}>
          {summary || 'None'}
        </div>
      </Section>

      {kind === 'plan' && (
        <Section label={`Sections (${sections.length})`}>
          {sections.length === 0
            ? <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, fontStyle: 'italic' }}>None</span>
            : (
              <ol style={{ margin: 0, padding: '0 0 0 18px', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg2, lineHeight: 1.6 }}>
                {sections.slice(0, 8).map((s, i) => (
                  <li key={i} style={{ overflowWrap: 'anywhere' }}>{s.title || `Section ${i + 1}`}</li>
                ))}
                {sections.length > 8 && (
                  <li style={{ color: C.fg3, fontStyle: 'italic' }}>+{sections.length - 8} more</li>
                )}
              </ol>
            )}
        </Section>
      )}

      <Section label={`Sources (${sources.length})`}>
        {sources.length === 0
          ? <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, fontStyle: 'italic' }}>None</span>
          : (
            <ul style={{ margin: 0, padding: '0 0 0 18px', fontFamily: "'DM Sans', sans-serif", fontSize: 13, lineHeight: 1.6 }}>
              {sources.slice(0, 6).map((u, i) => (
                <li key={i} style={{ overflowWrap: 'anywhere' }}>
                  <a href={u} target="_blank" rel="noreferrer noopener" style={{ color: C.accent, textDecoration: 'none' }}>{u}</a>
                </li>
              ))}
              {sources.length > 6 && (
                <li style={{ color: C.fg3, fontStyle: 'italic' }}>+{sources.length - 6} more</li>
              )}
            </ul>
          )}
      </Section>

      {item.attachedFile && (
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.accent, fontWeight: 500 }}>
          📎 {item.attachedFile.type} attached
        </div>
      )}

      {onOpen && (
        <button onClick={onOpen}
          style={{
            marginTop: 'auto',
            fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
            padding: '6px 12px', borderRadius: 6, border: `1px solid ${C.border}`,
            background: C.bg1, color: C.accent, cursor: 'pointer',
          }}>
          Open detail →
        </button>
      )}
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, color: C.fg3, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 4 }}>
        {label}
      </div>
      {children}
    </div>
  );
}
