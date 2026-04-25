import { NavLink } from 'react-router-dom';

const items = [
  { to: '/', label: 'Dashboard', icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>) },
  { to: '/ideas', label: 'Ideas', icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><line x1="9" y1="18" x2="15" y2="18"/><line x1="12" y1="2" x2="12" y2="18"/><path d="M5 12c-2.667-4-2.667-8 0-10 2.667 2 5.333 2 8 0 2.667 2 5.333 2 8 0 2.667 2 2.667 6 0 10"/></svg>) },
  { to: '/projects', label: 'Projects', icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>) },
  { to: '/plans', label: 'Business Plans', icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>) },
];

const Sidebar = () => {
  const sidebarStyle = {
    width: 220, minHeight: '100vh', background: '#18160F', borderRight: '1px solid #2E2B23',
    display: 'flex', flexDirection: 'column', flexShrink: 0,
  };

  return (
    <aside style={sidebarStyle}>
      <div style={{
        fontFamily: "'Playfair Display', Georgia, serif", fontSize: 17, fontWeight: 700, fontStyle: 'italic',
        color: '#D4A853', padding: '20px 16px 16px', borderBottom: '1px solid #2E2B23',
        letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24"><polygon points="12,2 22,22 2,22" fill="none" stroke="#D4A853" strokeWidth="1.5" strokeLinejoin="round"/></svg>
        Venture Log
      </div>

      <nav style={{ padding: '10px 8px', flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 9,
              fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13, fontWeight: isActive ? 500 : 400,
              color: isActive ? '#D4A853' : '#6A6055', padding: '8px 10px', borderRadius: 4,
              textDecoration: 'none', background: isActive ? '#1E1A0F' : 'transparent',
            })}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
