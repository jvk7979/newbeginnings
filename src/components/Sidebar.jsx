import { useState } from 'react';
import { C } from '../tokens';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppContext';
import { useToast } from '../context/ToastContext';

const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard',     icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
  { id: 'ideas',      label: 'Ideas',          icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><line x1="9" y1="18" x2="15" y2="18"/><line x1="12" y1="2" x2="12" y2="18"/><path d="M5 12c-2.667-4-2.667-8 0-10 2.667 2 5.333 2 8 0 2.667 2 5.333 2 8 0 2.667 2 2.667 6 0 10"/></svg> },
  { id: 'projects',   label: 'Projects',       icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> },
  { id: 'plans',      label: 'Business Plans', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
  { id: 'calculator', label: 'Calculator',     icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="10" y2="14"/><line x1="14" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="10" y2="18"/><line x1="14" y1="18" x2="16" y2="18"/></svg> },
];

export default function Sidebar({ currentPage, onNavigate, isMobile, isOpen, onClose }) {
  const { user, signOutUser }             = useAuth();
  const { ideas, projects, plans, importData } = useAppData();
  const { showToast }                     = useToast();
  const [showSettings, setShowSettings]   = useState(false);
  const isActive = (id) => currentPage === id;

  if (isMobile && !isOpen) return null;

  const handleExport = () => {
    const data = { ideas, projects, plans, exportedAt: new Date().toISOString(), version: 1 };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `newbeginnings-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Exported ${ideas.length + projects.length + plans.length} items`, 'success');
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data  = JSON.parse(ev.target.result);
        const count = (data.ideas?.length || 0) + (data.projects?.length || 0) + (data.plans?.length || 0);
        if (!Array.isArray(data.ideas) && !Array.isArray(data.projects) && !Array.isArray(data.plans)) {
          alert('Invalid backup file.'); return;
        }
        if (window.confirm(`Import ${count} items? This replaces all current data.`)) {
          await importData(data);
          showToast('Data imported', 'success');
        }
      } catch { alert('Could not read file. Use a JSON backup exported from this app.'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearAll = async () => {
    if (window.confirm('Clear all data and start fresh? Export first if you want a backup.')) {
      await importData({ ideas: [], projects: [], plans: [] });
      showToast('All data cleared', 'info');
    }
  };

  const handleSignOut = async () => {
    if (window.confirm('Sign out?')) await signOutUser();
  };

  const btnRow = { fontFamily: "'DM Sans', sans-serif", fontSize: 12, borderRadius: 5, cursor: 'pointer', padding: '7px 10px', width: '100%', border: `1px solid ${C.border}`, background: C.bg0, color: C.fg2, textAlign: 'left', marginBottom: 6 };

  return (
    <>
      {isMobile && <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(28,25,20,0.45)', zIndex: 99, backdropFilter: 'blur(2px)' }} />}
      <div style={{ width: 220, background: C.bg2, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0, height: '100vh', ...(isMobile ? { position: 'fixed', left: 0, top: 0, zIndex: 100 } : {}) }}>

        {/* Brand */}
        <div style={{ padding: '18px 16px 14px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="28" height="28" viewBox="0 0 46 46" fill="none">
            <path d="M23 2 C23 2 18 9 23 16 C28 9 23 2 23 2Z" fill={C.accent}/>
            <path d="M15 6 C15 6 18 13 23 16 C20 10 15 6 15 6Z" fill={C.accent} opacity="0.6"/>
            <path d="M31 6 C31 6 28 13 23 16 C26 10 31 6 31 6Z" fill={C.accent} opacity="0.6"/>
            <path d="M4 24 C10 19 16 19 23 24 C30 29 36 29 42 24" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M4 32 C10 27 16 27 23 32 C30 37 36 37 42 32" stroke={C.accent} strokeWidth="1.8" strokeLinecap="round" opacity="0.6"/>
            <path d="M4 40 C10 35 16 35 23 40 C30 45 36 45 42 40" stroke={C.accent} strokeWidth="1.2" strokeLinecap="round" opacity="0.3"/>
          </svg>
          <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 16, fontWeight: 700, fontStyle: 'italic', color: C.accent, letterSpacing: '-0.02em' }}>The New Beginning</span>
        </div>

        {/* Nav */}
        <nav style={{ padding: '10px 8px', flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => onNavigate(item.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 9, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: isActive(item.id) ? 500 : 400, color: isActive(item.id) ? C.accent : C.fg3, padding: '8px 10px', borderRadius: 4, cursor: 'pointer', background: isActive(item.id) ? C.accentBg : 'transparent', border: 'none', textAlign: 'left', width: '100%', transition: 'all 120ms' }}
              onMouseEnter={e => { if (!isActive(item.id)) { e.currentTarget.style.background = C.bg3; e.currentTarget.style.color = C.fg2; }}}
              onMouseLeave={e => { if (!isActive(item.id)) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.fg3; }}}>
              {item.icon}{item.label}
            </button>
          ))}
        </nav>

        {/* Settings panel */}
        {showSettings && (
          <div style={{ margin: '0 8px 8px', padding: '14px', background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 8 }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: C.fg1, marginBottom: 10 }}>Data</div>
            <button style={btnRow} onClick={handleExport}>↓ Export backup (JSON)</button>
            <label style={{ ...btnRow, display: 'block', cursor: 'pointer' }}>
              ↑ Import backup (JSON)
              <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
            </label>
            <div style={{ borderTop: `1px solid ${C.border}`, margin: '8px 0' }} />
            <button style={{ ...btnRow, color: C.warning, borderColor: C.warning + '44', background: C.warningBg }} onClick={handleClearAll}>Start fresh (clear all)</button>
            <button style={{ ...btnRow, color: C.danger, borderColor: C.danger + '44', background: C.dangerBg, marginBottom: 0 }} onClick={handleSignOut}>Sign out</button>
          </div>
        )}

        {/* User + Settings button */}
        <div style={{ borderTop: `1px solid ${C.border}`, padding: '10px 8px' }}>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', marginBottom: 4 }}>
              {user.photoURL
                ? <img src={user.photoURL} alt="" width={22} height={22} style={{ borderRadius: '50%', flexShrink: 0 }} />
                : <div style={{ width: 22, height: 22, borderRadius: '50%', background: C.accent, flexShrink: 0 }} />
              }
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.displayName || user.email}
              </div>
            </div>
          )}
          <button onClick={() => setShowSettings(s => !s)}
            style={{ display: 'flex', alignItems: 'center', gap: 9, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: showSettings ? C.accent : C.fg3, padding: '7px 10px', borderRadius: 4, cursor: 'pointer', background: showSettings ? C.accentBg : 'transparent', border: 'none', width: '100%', transition: 'all 120ms' }}
            onMouseEnter={e => { if (!showSettings) { e.currentTarget.style.background = C.bg3; e.currentTarget.style.color = C.fg2; }}}
            onMouseLeave={e => { if (!showSettings) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.fg3; }}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            Settings
          </button>
        </div>
      </div>
    </>
  );
}
