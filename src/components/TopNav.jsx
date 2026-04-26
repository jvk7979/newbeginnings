import { useState, useRef, useEffect } from 'react';
import { C } from '../tokens';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import logoImg from '../assets/logo.png';

const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Home' },
  { id: 'ideas',      label: 'Ideas' },
  { id: 'projects',   label: 'Projects' },
  { id: 'plans',      label: 'Plans' },
  { id: 'documents',  label: 'Documents' },
  { id: 'about',      label: 'About' },
];

const ACTIVE_MAP = {
  'new-idea':        'ideas',
  'idea-detail':     'ideas',
  'project-detail':  'projects',
  'plan-detail':     'plans',
  'new-plan':        'plans',
  'document-detail': 'documents',
};

export default function TopNav({ currentPage, onNavigate }) {
  const { user, signOutUser }                  = useAuth();
  const { ideas, projects, plans, importData } = useAppData();
  const { showToast }                          = useToast();
  const [settingsOpen, setSettingsOpen]        = useState(false);
  const [mobileOpen,   setMobileOpen]          = useState(false);
  const settingsRef = useRef(null);
  const activeTab = ACTIVE_MAP[currentPage] || currentPage;

  useEffect(() => {
    const handler = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target))
        setSettingsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleExport = () => {
    const data = { ideas, projects, plans, exportedAt: new Date().toISOString(), version: 1 };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `newbeginnings-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Exported ${ideas.length + projects.length + plans.length} items`, 'success');
    setSettingsOpen(false);
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
    setSettingsOpen(false);
  };

  const handleClearAll = async () => {
    if (window.confirm('Clear all data and start fresh? Export first if you want a backup.')) {
      await importData({ ideas: [], projects: [], plans: [] });
      showToast('All data cleared', 'info');
    }
    setSettingsOpen(false);
  };

  const handleSignOut = async () => {
    if (window.confirm('Sign out?')) await signOutUser();
    setSettingsOpen(false);
  };

  const navBtn = (id) => ({
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    fontWeight: activeTab === id ? 500 : 400,
    color: activeTab === id ? C.accent : C.fg2,
    background: activeTab === id ? C.accentBg : 'transparent',
    border: 'none',
    borderRadius: 5,
    cursor: 'pointer',
    padding: '6px 12px',
    transition: 'all 120ms',
    whiteSpace: 'nowrap',
  });

  const dropBtn = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    width: '100%',
    textAlign: 'left',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px 14px',
    color: C.fg2,
    borderRadius: 4,
  };

  return (
    <>
      <header style={{ height: 54, background: C.bg2, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', paddingInline: 20, gap: 16, flexShrink: 0, position: 'relative', zIndex: 100 }}>

        {/* Logo */}
        <button
          onClick={() => onNavigate('dashboard')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', flexShrink: 0 }}
          aria-label="Go to Home">
          <img
            src={logoImg}
            alt="The New Beginnings"
            style={{ height: 36, width: 'auto', display: 'block', mixBlendMode: 'multiply' }}
          />
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 22, background: C.border, flexShrink: 0 }} />

        {/* Desktop nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, overflowX: 'auto' }} className="hide-on-mobile" aria-label="Main navigation">
          {NAV_ITEMS.map(item => (
            <button key={item.id} style={navBtn(item.id)} onClick={() => onNavigate(item.id)}
              aria-current={activeTab === item.id ? 'page' : undefined}
              onMouseEnter={e => { if (activeTab !== item.id) { e.currentTarget.style.background = C.bg3; e.currentTarget.style.color = C.fg1; }}}
              onMouseLeave={e => { if (activeTab !== item.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.fg2; }}}>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right: settings + hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto', flexShrink: 0 }} ref={settingsRef}>

          {/* Settings gear */}
          <button onClick={() => setSettingsOpen(o => !o)}
            style={{ width: 34, height: 34, borderRadius: 6, background: settingsOpen ? C.accentBg : 'transparent', border: `1px solid ${settingsOpen ? C.accent + '44' : C.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: settingsOpen ? C.accent : C.fg3, transition: 'all 120ms' }}
            aria-label="Settings" aria-expanded={settingsOpen}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen(o => !o)} className="hide-on-desktop"
            style={{ width: 34, height: 34, borderRadius: 6, background: 'transparent', border: `1px solid ${C.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.fg2 }}
            aria-label="Open menu" aria-expanded={mobileOpen}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="16" height="16">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          {/* Settings dropdown */}
          {settingsOpen && (
            <div style={{ position: 'absolute', top: 58, right: 20, width: 220, background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.10)', padding: '8px 6px', zIndex: 200 }}>
              {user && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px 10px' }}>
                    {user.photoURL
                      ? <img src={user.photoURL} alt="" width={28} height={28} style={{ borderRadius: '50%', flexShrink: 0 }} />
                      : <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.accent, flexShrink: 0 }} />
                    }
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.displayName || user.email}
                    </div>
                  </div>
                  <div style={{ height: 1, background: C.border, margin: '0 8px 6px' }} />
                </>
              )}
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, color: C.fg3, padding: '2px 14px 6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Data</div>
              <button style={dropBtn} onClick={handleExport}
                onMouseEnter={e => e.currentTarget.style.background = C.bg3}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>↓ Export backup (JSON)</button>
              <label style={{ ...dropBtn, display: 'block', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = C.bg3}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                ↑ Import backup (JSON)
                <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
              </label>
              <div style={{ height: 1, background: C.border, margin: '6px 8px' }} />
              <button style={{ ...dropBtn, color: C.warning }} onClick={handleClearAll}
                onMouseEnter={e => e.currentTarget.style.background = C.warningBg}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>Start fresh (clear all)</button>
              <button style={{ ...dropBtn, color: C.danger }} onClick={handleSignOut}
                onMouseEnter={e => e.currentTarget.style.background = C.dangerBg}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>Sign out</button>
            </div>
          )}
        </div>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <>
          <div onClick={() => setMobileOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(28,25,20,0.35)', zIndex: 150 }} />
          <nav style={{ position: 'fixed', top: 54, left: 0, right: 0, background: C.bg2, borderBottom: `1px solid ${C.border}`, zIndex: 160, padding: '8px 12px 14px', boxShadow: '0 6px 24px rgba(0,0,0,0.10)' }} aria-label="Mobile navigation">
            {NAV_ITEMS.map(item => (
              <button key={item.id} onClick={() => { onNavigate(item.id); setMobileOpen(false); }}
                aria-current={activeTab === item.id ? 'page' : undefined}
                style={{ display: 'block', width: '100%', textAlign: 'left', fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: activeTab === item.id ? 600 : 400, color: activeTab === item.id ? C.accent : C.fg1, background: activeTab === item.id ? C.accentBg : 'transparent', border: 'none', borderRadius: 6, cursor: 'pointer', padding: '12px 14px', marginBottom: 2 }}>
                {item.label}
              </button>
            ))}
            <div style={{ height: 1, background: C.border, margin: '8px 0' }} />
            <button style={{ display: 'block', width: '100%', textAlign: 'left', fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.fg2, background: 'none', border: 'none', cursor: 'pointer', padding: '12px 14px', borderRadius: 6 }}
              onClick={() => { setMobileOpen(false); setSettingsOpen(o => !o); }}>
              Settings
            </button>
          </nav>
        </>
      )}
    </>
  );
}
