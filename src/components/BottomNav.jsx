import { C } from '../tokens';

const TABS = [
  { id: 'dashboard', label: 'Home', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
  { id: 'ideas',     label: 'Ideas', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><line x1="9" y1="18" x2="15" y2="18"/><line x1="12" y1="2" x2="12" y2="18"/><path d="M5 12c-2.667-4-2.667-8 0-10 2.667 2 5.333 2 8 0 2.667 2 5.333 2 8 0 2.667 2 2.667 6 0 10"/></svg> },
  { id: 'projects',  label: 'Projects', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> },
  { id: 'plans',     label: 'Plans', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
  { id: 'calculator',label: 'Calc', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="10" y2="14"/><line x1="14" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="10" y2="18"/><line x1="14" y1="18" x2="16" y2="18"/></svg> },
];

const ACTIVE_PAGES = { 'new-idea': 'ideas', 'idea-detail': 'ideas', 'project-detail': 'projects', 'plan-detail': 'plans', 'new-plan': 'plans' };

export default function BottomNav({ currentPage, onNavigate }) {
  const activeTab = ACTIVE_PAGES[currentPage] || currentPage;
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 60, background: C.bg1, borderTop: `1px solid ${C.border}`, display: 'flex', zIndex: 200, paddingBottom: 'env(safe-area-inset-bottom)', boxShadow: '0 -2px 12px rgba(0,0,0,0.06)' }}>
      {TABS.map(tab => {
        const active = activeTab === tab.id;
        return (
          <button key={tab.id} onClick={() => onNavigate(tab.id)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: active ? C.accent : C.fg3, gap: 3, transition: 'color 150ms', outline: 'none' }}>
            {tab.icon}
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: active ? 600 : 400, letterSpacing: '0.03em' }}>{tab.label}</span>
            {active && <span style={{ position: 'absolute', bottom: 0, width: 24, height: 2, background: C.accent, borderRadius: 2 }} />}
          </button>
        );
      })}
    </div>
  );
}
