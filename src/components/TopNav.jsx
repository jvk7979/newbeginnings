import { useState, useRef, useEffect } from 'react';
import { C } from '../tokens';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import logoImg from '../assets/logo.png';

const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Home' },
  { id: 'ideas',      label: 'Ideas' },
  { id: 'plans',      label: 'Business Plan' },
  { id: 'documents',  label: 'Documents' },
  { id: 'about',      label: 'About' },
];

const ACTIVE_MAP = {
  'new-idea':        'ideas',
  'idea-detail':     'ideas',
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
      <header style={{ height: 68, background: C.bg2, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', paddingInline: 'clamp(12px, 2vw, 20px)', gap: 14, flexShrink: 0, position: 'relative', zIndex: 100 }}>

        {/* Logo */}
        <button
          onClick={() => onNavigate('dashboard')}
          className="logo-btn"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', flexShrink: 0, borderRadius: 8 }}
          aria-label="Go to Home">
          <img src={logoImg} alt="The New Beginnings" style={{ height: 52, width: 'auto', display: 'block', mixBlendMode: 'multiply' }} />
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 28, background: C.border, flexShrink: 0 }} className="hide-on-mobile" />

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

        {/* Right: avatar (desktop) + hamburger (mobile) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto', flexShrink: 0 }} ref={settingsRef}>

          {/* User avatar button — desktop */}
          <button onClick={() => setSettingsOpen(o => !o)} className="hide-on-mobile"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px 5px 6px', borderRadius: 99, background: settingsOpen ? C.accentBg : C.bg1, border: `1px solid ${settingsOpen ? C.accent + '55' : C.border}`, cursor: 'pointer', transition: 'all 140ms' }}
            aria-label="Account menu" aria-expanded={settingsOpen}>
            {user?.photoURL
              ? <img src={user.photoURL} alt="" width={28} height={28} style={{ borderRadius: '50%' }} />
              : <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700 }}>
                  {(user?.displayName || user?.email || '?')[0].toUpperCase()}
                </div>
            }
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg2, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.displayName?.split(' ')[0] || 'Account'}
            </span>
            <svg viewBox="0 0 24 24" fill="none" stroke={C.fg3} strokeWidth="2" strokeLinecap="round" width="12" height="12"><polyline points="6 9 12 15 18 9"/></svg>
          </button>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen(o => !o)} className="hide-on-desktop"
            style={{ width: 40, height: 40, borderRadius: 8, background: C.bg1, border: `1px solid ${C.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.fg1 }}
            aria-label="Open menu" aria-expanded={mobileOpen}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="18" height="18">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          {/* Account dropdown */}
          {settingsOpen && (
            <div style={{ position: 'absolute', top: 72, right: 20, width: 230, background: C.bg0, border: `1px solid ${C.border}`, borderRadius: 10, boxShadow: '0 6px 24px rgba(0,0,0,0.12)', padding: '6px', zIndex: 200 }}>
              {user && (
                <div style={{ padding: '10px 12px 10px', marginBottom: 4, background: C.bg1, borderRadius: 6 }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: C.fg1 }}>{user.displayName || 'Account'}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3, marginTop: 2 }}>{user.email}</div>
                </div>
              )}
              <div style={{ height: 1, background: C.border, margin: '6px 0' }} />
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 600, color: C.fg3, padding: '2px 12px 4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Data</div>
              <button style={dropBtn} onClick={handleExport}
                onMouseEnter={e => e.currentTarget.style.background = C.bg2}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>↓ Export backup</button>
              <label style={{ ...dropBtn, display: 'block', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = C.bg2}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                ↑ Import backup
                <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
              </label>
              <div style={{ height: 1, background: C.border, margin: '6px 0' }} />
              <button style={{ ...dropBtn, color: C.danger }} onClick={handleSignOut}
                onMouseEnter={e => e.currentTarget.style.background = C.dangerBg}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>Sign out</button>
            </div>
          )}
        </div>
      </header>

      {/* Mobile drawer — slides in from right */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setMobileOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(20,16,10,0.5)', zIndex: 150, backdropFilter: 'blur(2px)' }}
          />
          {/* Drawer */}
          <nav
            aria-label="Mobile navigation"
            style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(80vw, 300px)', background: C.bg0, zIndex: 160, boxShadow: '-4px 0 32px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

            {/* Drawer header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: `1px solid ${C.border}` }}>
              <img src={logoImg} alt="The New Beginnings" style={{ height: 36, width: 'auto' }} />
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 6, width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.fg2, fontSize: 20, lineHeight: 1 }}>
                ×
              </button>
            </div>

            {/* Nav items */}
            <div style={{ padding: '12px 12px', flex: 1 }}>
              {NAV_ITEMS.map(item => (
                <button key={item.id}
                  onClick={() => { onNavigate(item.id); setMobileOpen(false); }}
                  aria-current={activeTab === item.id ? 'page' : undefined}
                  style={{ display: 'flex', alignItems: 'center', width: '100%', textAlign: 'left', fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: activeTab === item.id ? 600 : 400, color: activeTab === item.id ? C.accent : C.fg1, background: activeTab === item.id ? C.accentBg : 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer', padding: '14px 16px', marginBottom: 4 }}>
                  {activeTab === item.id && (
                    <span style={{ width: 3, height: 18, background: C.accent, borderRadius: 2, marginRight: 12, flexShrink: 0 }} />
                  )}
                  {item.label}
                </button>
              ))}
            </div>

            {/* User + sign out at bottom */}
            <div style={{ padding: '12px 12px 24px', borderTop: `1px solid ${C.border}` }}>
              {user && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', marginBottom: 8, background: C.bg1, borderRadius: 8 }}>
                  {user.photoURL
                    ? <img src={user.photoURL} alt="" width={32} height={32} style={{ borderRadius: '50%', flexShrink: 0 }} />
                    : <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.accent, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 600 }}>{(user.displayName || user.email || '?')[0].toUpperCase()}</div>
                  }
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: C.fg1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.displayName || 'Account'}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                  </div>
                </div>
              )}
              <button
                onClick={() => { setMobileOpen(false); handleSignOut(); }}
                style={{ display: 'block', width: '100%', textAlign: 'left', fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.danger, background: 'none', border: `1px solid ${C.danger}22`, borderRadius: 8, cursor: 'pointer', padding: '12px 16px' }}>
                Sign out
              </button>
            </div>
          </nav>
        </>
      )}
    </>
  );
}
