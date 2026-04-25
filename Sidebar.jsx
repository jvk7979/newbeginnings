// Sidebar.jsx — Venture Log sidebar navigation
const Sidebar = ({ currentPage, onNavigate }) => {
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
    )},
    { id: 'ideas', label: 'Ideas', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><line x1="9" y1="18" x2="15" y2="18"/><line x1="12" y1="2" x2="12" y2="18"/><path d="M5 12c-2.667-4-2.667-8 0-10 2.667 2 5.333 2 8 0 2.667 2 5.333 2 8 0 2.667 2 2.667 6 0 10"/></svg>
    )},
    { id: 'projects', label: 'Projects', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
    )},
    { id: 'plans', label: 'Business Plans', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
    )},
  ];

  const sidebarStyle = {
    width: '220px', minHeight: '100%',
    background: '#18160F',
    borderRight: '1px solid #2E2B23',
    display: 'flex', flexDirection: 'column',
    padding: '0', flexShrink: 0,
  };
  const logoStyle = {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: '17px', fontWeight: 700, fontStyle: 'italic',
    color: '#D4A853', padding: '20px 16px 16px',
    borderBottom: '1px solid #2E2B23',
    letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px',
  };
  const navStyle = { padding: '10px 8px', flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' };
  const itemStyle = (active) => ({
    display: 'flex', alignItems: 'center', gap: '9px',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSize: '13px', fontWeight: active ? 500 : 400,
    color: active ? '#D4A853' : '#6A6055',
    padding: '8px 10px', borderRadius: '4px',
    cursor: 'pointer',
    background: active ? '#1E1A0F' : 'transparent',
    transition: 'all 120ms',
    border: 'none', outline: 'none', textAlign: 'left', width: '100%',
  });
  const footerStyle = {
    borderTop: '1px solid #2E2B23', padding: '12px 8px',
  };

  return (
    <div style={sidebarStyle}>
      <div style={logoStyle}>
        <svg width="16" height="16" viewBox="0 0 24 24"><polygon points="12,2 22,22 2,22" fill="none" stroke="#D4A853" strokeWidth="1.5" strokeLinejoin="round"/></svg>
        Venture Log
      </div>
      <nav style={navStyle}>
        {items.map(item => (
          <button
            key={item.id}
            style={itemStyle(currentPage === item.id)}
            onClick={() => onNavigate(item.id)}
            onMouseEnter={e => { if (currentPage !== item.id) { e.currentTarget.style.background = '#22201A'; e.currentTarget.style.color = '#A39888'; }}}
            onMouseLeave={e => { if (currentPage !== item.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6A6055'; }}}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>
      <div style={footerStyle}>
        <button style={{...itemStyle(false), color: '#6A6055'}}
          onMouseEnter={e => { e.currentTarget.style.background = '#22201A'; e.currentTarget.style.color = '#A39888'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6A6055'; }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
          Settings
        </button>
      </div>
    </div>
  );
};

Object.assign(window, { Sidebar });
