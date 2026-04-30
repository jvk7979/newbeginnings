import { useState, useEffect } from 'react';
import { C, alpha } from '../tokens';
import { useAuth, ADMIN_EMAIL } from '../context/AuthContext';
import { useAppData } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import logoImg from '../assets/logo.png';
import ConfirmModal from './ConfirmModal';

const NAV_ITEMS = [
  {
    id: 'dashboard', label: 'Home',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  },
  {
    id: 'ideas', label: 'Ideas',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/><path d="M9 21h6"/></svg>,
  },
  {
    id: 'plans', label: 'Plans',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  },
  {
    id: 'documents', label: 'Documents',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  },
  {
    id: 'about', label: 'About',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  },
];

const ACTIVE_MAP = {
  'new-idea': 'ideas', 'idea-detail': 'ideas',
  'plan-detail': 'plans', 'new-plan': 'plans',
  'document-detail': 'documents',
};

function NavContent({ activeTab, onNavigate, themes, theme, setTheme, user, isAdmin, onSignOut, onExport, onImport, mobile = false }) {
  const [themeOpen, setThemeOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: C.bg1, borderRight: `1px solid ${C.border}`,
      width: mobile ? 'min(84vw, 276px)' : '240px',
    }}>
      {/* Logo */}
      <div style={{ padding: '14px 16px 12px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <button className="sidenav-logo-btn" onClick={() => onNavigate('dashboard')}>
          <img src={logoImg} alt="The New Beginnings" className="logo-img sidenav-logo-img" />
        </button>
        {mobile && (
          <button onClick={() => onNavigate(null)}
            style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 6, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.fg2, fontSize: 18, lineHeight: 1, flexShrink: 0 }}>
            ×
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
        {NAV_ITEMS.map(item => {
          const active = activeTab === item.id;
          return (
            <button key={item.id} onClick={() => onNavigate(item.id)}
              aria-current={active ? 'page' : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                textAlign: 'left', padding: '10px 14px', borderRadius: 8, border: 'none',
                marginBottom: 2, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif", fontSize: 15,
                fontWeight: active ? 600 : 400,
                color: active ? C.accent : C.fg2,
                background: active ? C.accentBg : 'transparent',
                transition: 'all 130ms ease',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = C.bg2; e.currentTarget.style.color = C.fg1; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.fg2; } }}>
              <span style={{ color: active ? C.accent : C.fg3, flexShrink: 0, display: 'flex' }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {active && <span style={{ width: 3, height: 14, background: C.accent, borderRadius: 2, flexShrink: 0 }} />}
            </button>
          );
        })}
        {isAdmin && (() => {
          const active = activeTab === 'access';
          return (
            <button onClick={() => onNavigate('access')}
              aria-current={active ? 'page' : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                textAlign: 'left', padding: '10px 14px', borderRadius: 8, border: 'none',
                marginBottom: 2, marginTop: 4, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif", fontSize: 15,
                fontWeight: active ? 600 : 400,
                color: active ? C.accent : C.fg2,
                background: active ? C.accentBg : 'transparent',
                transition: 'all 130ms ease',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = C.bg2; e.currentTarget.style.color = C.fg1; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.fg2; } }}>
              <span style={{ color: active ? C.accent : C.fg3, flexShrink: 0, display: 'flex' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </span>
              <span style={{ flex: 1 }}>Access</span>
              {active && <span style={{ width: 3, height: 14, background: C.accent, borderRadius: 2, flexShrink: 0 }} />}
            </button>
          );
        })()}
      </nav>

      {/* Theme picker */}
      <div style={{ padding: '8px 8px 6px', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
        <button onClick={() => setThemeOpen(o => !o)}
          style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: '5px 8px', borderRadius: 6 }}
          onMouseEnter={e => e.currentTarget.style.background = C.bg2}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}>
          <svg viewBox="0 0 24 24" fill="none" stroke={C.fg3} strokeWidth="1.5" strokeLinecap="round" width="13" height="13"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: C.fg3, flex: 1, textAlign: 'left' }}>Theme</span>
          <svg viewBox="0 0 24 24" fill="none" stroke={C.fg3} strokeWidth="2" strokeLinecap="round" width="10" height="10"
            style={{ transform: themeOpen ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        {themeOpen && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, margin: '6px 0 2px' }}>
            {themes.map(t => {
              const active = theme === t.id;
              return (
                <button key={t.id} onClick={() => setTheme(t.id)} title={t.label} aria-pressed={active}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 7px', borderRadius: 6, background: active ? C.accentBg : C.bg2, border: `1px solid ${active ? alpha(C.accent, 55) : C.border}`, cursor: 'pointer', transition: 'all 120ms' }}>
                  <span style={{ display: 'inline-flex', flexShrink: 0, borderRadius: 3, overflow: 'hidden', border: `1px solid ${C.border}` }}>
                    {t.swatch.map((s, i) => <span key={i} style={{ width: 7, height: 14, background: s, display: 'block' }} />)}
                  </span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: active ? 600 : 400, color: active ? C.accent : C.fg2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* User + settings */}
      <div style={{ padding: '8px 8px 14px', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 8, background: C.bg2, marginBottom: 6 }}>
          {user?.photoURL
            ? <img src={user.photoURL} alt="" width={26} height={26} style={{ borderRadius: '50%', flexShrink: 0 }} />
            : <div style={{ width: 26, height: 26, borderRadius: '50%', background: C.accent, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700 }}>
                {(user?.displayName || user?.email || '?')[0].toUpperCase()}
              </div>
          }
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: C.fg1, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.displayName?.split(' ')[0] || 'Account'}
          </span>
          <button onClick={() => setSettingsOpen(o => !o)} title="Settings"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, color: settingsOpen ? C.accent : C.fg3, flexShrink: 0, display: 'flex', borderRadius: 4 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="14" height="14"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
          </button>
        </div>
        {settingsOpen && (
          <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', marginBottom: 6 }}>
            <button onClick={onExport}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2, background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px' }}
              onMouseEnter={e => e.currentTarget.style.background = C.bg3}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="12" height="12"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export backup
            </button>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2, cursor: 'pointer', padding: '8px 12px', borderTop: `1px solid ${C.border}` }}
              onMouseEnter={e => e.currentTarget.style.background = C.bg3}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="12" height="12"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Import backup
              <input type="file" accept=".json" style={{ display: 'none' }} onChange={onImport} />
            </label>
          </div>
        )}
        <button onClick={onSignOut}
          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.danger, background: 'none', border: `1px solid ${alpha(C.danger, 22)}`, borderRadius: 6, cursor: 'pointer', padding: '7px 10px' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="12" height="12"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function SideNav({ currentPage, onNavigate }) {
  const { user, signOutUser, isAdmin }          = useAuth();
  const { ideas, projects, plans, importData } = useAppData();
  const { showToast }                          = useToast();
  const { theme, setTheme, themes }            = useTheme();
  const [mobileOpen, setMobileOpen]            = useState(false);
  const [confirmSignOut, setConfirmSignOut]    = useState(false);
  const [confirmImport, setConfirmImport]      = useState(null);

  const activeTab = ACTIVE_MAP[currentPage] || currentPage;

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') setMobileOpen(false); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
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
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data  = JSON.parse(ev.target.result);
        const count = (data.ideas?.length || 0) + (data.projects?.length || 0) + (data.plans?.length || 0);
        if (!Array.isArray(data.ideas) && !Array.isArray(data.projects) && !Array.isArray(data.plans)) {
          alert('Invalid backup file.'); return;
        }
        setConfirmImport({ data, count });
      } catch { alert('Could not read file. Use a JSON backup exported from this app.'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const doImport = async () => {
    if (!confirmImport) return;
    await importData(confirmImport.data);
    showToast('Data imported', 'success');
    setConfirmImport(null);
  };

  const navProps = {
    activeTab, themes, theme, setTheme, user, isAdmin,
    onSignOut: () => setConfirmSignOut(true),
    onExport: handleExport,
    onImport: handleImport,
  };

  return (
    <>
      {/* Desktop sidebar */}
      <div className="sidenav-desktop">
        <NavContent {...navProps} onNavigate={onNavigate} />
      </div>

      {/* Mobile top bar */}
      <header className="sidenav-topbar" style={{ background: C.bg1, borderBottom: `1px solid ${C.border}`, padding: '0 14px', zIndex: 100, height: 54, alignItems: 'center', gap: 12 }}>
        <button onClick={() => setMobileOpen(true)}
          style={{ width: 38, height: 38, borderRadius: 8, background: C.bg2, border: `1px solid ${C.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.fg1, flexShrink: 0 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="18" height="18">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <div style={{ flex: 1 }} />
        <button onClick={() => onNavigate('dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <img src={logoImg} alt="The New Beginnings" className="logo-img" style={{ height: 36, width: 'auto', display: 'block' }} />
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div onClick={() => setMobileOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.48)', zIndex: 150, backdropFilter: 'blur(2px)' }} />
          <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 160 }}>
            <NavContent {...navProps} mobile onNavigate={(id) => { if (id) onNavigate(id); setMobileOpen(false); }} />
          </div>
        </>
      )}

      {confirmSignOut && (
        <ConfirmModal title="Sign out?" message="You'll need to sign back in to access your workspace."
          confirmLabel="Sign out" variant="danger"
          onConfirm={async () => { await signOutUser(); setConfirmSignOut(false); }}
          onCancel={() => setConfirmSignOut(false)} />
      )}
      {confirmImport && (
        <ConfirmModal title="Import backup?"
          message={`Import ${confirmImport.count} items? This will replace all current data.`}
          confirmLabel="Import" variant="danger"
          onConfirm={doImport} onCancel={() => setConfirmImport(null)} />
      )}
    </>
  );
}
