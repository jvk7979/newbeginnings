import { useEffect, useState } from 'react';
import { C, alpha } from '../tokens';

function timeAgo(ts) {
  if (!ts) return '';
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 5)    return 'just now';
  if (secs < 60)   return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

/**
 * Visual status pill for useAutosave. Pass through the hook's
 * { status, lastSavedAt, retry } and an optional `compact` flag
 * to drop the "All changes saved" wording when there's tight space.
 */
export default function AutosaveStatus({ status, lastSavedAt, retry, compact = false }) {
  // Tick the lastSavedAt label once a second so "just now" -> "5s ago" without
  // requiring the parent to re-render.
  const [, force] = useState(0);
  useEffect(() => {
    if (!lastSavedAt) return;
    const t = setInterval(() => force(n => n + 1), 1000);
    return () => clearInterval(t);
  }, [lastSavedAt]);

  const baseStyle = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500,
    padding: '4px 10px', borderRadius: 999,
  };

  if (status === 'saving') {
    return (
      <span style={{ ...baseStyle, color: '#92700A', background: '#FEF3C7', border: '1px solid #FCD34D55' }}
        role="status" aria-live="polite">
        <span style={{ display: 'inline-block', width: 9, height: 9, border: '1.5px solid #FCD34D', borderTopColor: '#92700A', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        Saving…
      </span>
    );
  }

  if (status === 'saved') {
    return (
      <span style={{ ...baseStyle, color: '#065F46', background: '#D1FAE5', border: '1px solid #065F4633' }}
        role="status" aria-live="polite">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="11" height="11"><polyline points="20 6 9 17 4 12"/></svg>
        Saved {lastSavedAt ? timeAgo(lastSavedAt) : ''}
      </span>
    );
  }

  if (status === 'error') {
    return (
      <span style={{ ...baseStyle, color: C.danger, background: alpha(C.danger, 22), border: `1px solid ${alpha(C.danger, 55)}` }} role="alert">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="11" height="11"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        Couldn't save
        {retry && (
          <button onClick={retry}
            style={{ background: 'none', border: 'none', color: C.danger, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, textDecoration: 'underline', padding: 0, marginLeft: 4 }}>
            Retry
          </button>
        )}
      </span>
    );
  }

  // Idle
  if (compact) return null;
  return (
    <span style={{ ...baseStyle, color: C.fg3, background: 'transparent' }}>
      {lastSavedAt ? `Saved ${timeAgo(lastSavedAt)}` : 'All changes saved'}
    </span>
  );
}
