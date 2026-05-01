import { useState, useEffect, useMemo, useRef } from 'react';
import { C, alpha } from '../tokens';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

const kbd = {
  fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.fg3,
  background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 3, padding: '1px 5px',
};

export default function CommandPalette({ open, onClose, onNavigate }) {
  const { isAdmin, signOutUser } = useAuth();
  const { themes, setTheme } = useTheme();
  const { showToast } = useToast();
  const [q, setQ] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);
  const listRef  = useRef(null);
  const previouslyFocused = useRef(null);

  const commands = useMemo(() => {
    const items = [
      { id: 'go-home',      label: 'Go to Home',       group: 'Navigate', keywords: 'home dashboard',           run: () => onNavigate('dashboard') },
      { id: 'go-ideas',     label: 'Go to Ideas',      group: 'Navigate', keywords: 'ideas brainstorm',         run: () => onNavigate('ideas') },
      { id: 'go-plans',     label: 'Go to Plans',      group: 'Navigate', keywords: 'plans business',           run: () => onNavigate('plans') },
      { id: 'go-documents', label: 'Go to Documents',  group: 'Navigate', keywords: 'documents files pdf',      run: () => onNavigate('documents') },
      { id: 'go-about',     label: 'Go to About',      group: 'Navigate', keywords: 'about info',               run: () => onNavigate('about') },
      ...(isAdmin ? [{ id: 'go-access', label: 'Go to Access (admin)', group: 'Navigate', keywords: 'access users admin allow', run: () => onNavigate('access') }] : []),

      { id: 'new-idea', label: 'New idea',          group: 'Create', keywords: 'new add create idea',          run: () => onNavigate('new-idea') },
      { id: 'new-plan', label: 'New business plan', group: 'Create', keywords: 'new add create plan business', run: () => onNavigate('new-plan') },

      ...themes.map(t => ({
        id: `theme-${t.id}`, label: `Theme: ${t.label}`, group: 'Theme',
        keywords: `theme color ${t.label}`,
        run: () => { setTheme(t.id); showToast(`Theme: ${t.label}`, 'success'); },
      })),

      { id: 'sign-out', label: 'Sign out', group: 'Account', keywords: 'sign out logout exit', run: () => signOutUser() },
    ];
    return items;
  }, [isAdmin, themes, onNavigate, setTheme, showToast, signOutUser]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    if (!ql) return commands;
    return commands.filter(c => `${c.label} ${c.keywords}`.toLowerCase().includes(ql));
  }, [commands, q]);

  // Reset state + focus input on open; restore focus on close.
  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement;
    setQ(''); setActiveIdx(0);
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => {
      clearTimeout(t);
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  useEffect(() => { setActiveIdx(0); }, [q]);

  // Body scroll lock while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Keep the active item visible as the user arrows through.
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx, open]);

  if (!open) return null;

  const exec = (cmd) => {
    if (!cmd) return;
    onClose();
    setTimeout(() => cmd.run(), 0);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape')          { e.preventDefault(); onClose(); }
    else if (e.key === 'ArrowDown')  { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp')    { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Home')       { e.preventDefault(); setActiveIdx(0); }
    else if (e.key === 'End')        { e.preventDefault(); setActiveIdx(filtered.length - 1); }
    else if (e.key === 'Enter')      { e.preventDefault(); exec(filtered[activeIdx]); }
  };

  // Group consecutive items so the section header renders once per group.
  const groups = [];
  let last = null;
  filtered.forEach((cmd, i) => {
    if (cmd.group !== last) { groups.push({ group: cmd.group, items: [] }); last = cmd.group; }
    groups[groups.length - 1].items.push({ cmd, idx: i });
  });

  return (
    <div role="dialog" aria-label="Command palette" aria-modal="true"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(28,25,20,0.55)',
        zIndex: 8000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: 'max(60px, 8vh) 16px 16px', backdropFilter: 'blur(3px)',
      }}>
      <div onKeyDown={onKeyDown}
        style={{
          width: '100%', maxWidth: 560, background: C.bg1, border: `1px solid ${C.border}`,
          borderRadius: 12, boxShadow: '0 18px 48px rgba(0,0,0,0.32)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          maxHeight: 'min(70vh, 560px)',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: `1px solid ${C.border}` }}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke={C.fg3} strokeWidth="1.5" strokeLinecap="round" width="16" height="16">
            <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input ref={inputRef} type="text" value={q} onChange={e => setQ(e.target.value)}
            placeholder="Type a command or search…"
            aria-label="Command search" autoComplete="off" spellCheck={false}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.fg1, minWidth: 0 }} />
          <kbd style={kbd}>esc</kbd>
        </div>

        <div ref={listRef} role="listbox" aria-label="Commands"
          style={{ flex: 1, overflowY: 'auto', padding: '6px 6px 8px' }}>
          {filtered.length === 0 && (
            <div style={{ padding: '22px 16px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3 }}>
              No matches.
            </div>
          )}
          {groups.map(g => (
            <div key={g.group}>
              <div style={{ padding: '10px 12px 4px', fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, color: C.fg3, letterSpacing: 0.6, textTransform: 'uppercase' }}>
                {g.group}
              </div>
              {g.items.map(({ cmd, idx }) => {
                const active = idx === activeIdx;
                return (
                  <button key={cmd.id} data-idx={idx}
                    role="option" aria-selected={active}
                    onClick={() => exec(cmd)}
                    onMouseEnter={() => setActiveIdx(idx)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                      textAlign: 'left', padding: '9px 12px', borderRadius: 8, border: 'none',
                      background: active ? C.accentBg : 'transparent',
                      color: active ? C.accent : C.fg2,
                      fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                      fontWeight: active ? 600 : 400, cursor: 'pointer',
                    }}>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {cmd.label}
                    </span>
                    {active && <span aria-hidden="true" style={{ fontSize: 12, color: C.accent }}>↵</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
          padding: '8px 14px', borderTop: `1px solid ${C.border}`, background: C.bg2,
          fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3,
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><kbd style={kbd}>↑</kbd><kbd style={kbd}>↓</kbd> navigate</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><kbd style={kbd}>↵</kbd> run</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><kbd style={kbd}>esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
