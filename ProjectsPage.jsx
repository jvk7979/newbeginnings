// ProjectsPage.jsx — Projects listing
const ProjectsPage = ({ onNavigate }) => {
  const projects = window.AppData.projects;

  const s = {
    wrap: { flex: 1, overflowY: 'auto', padding: '32px 36px', background: '#0D0C0A' },
    title: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 600, color: '#F2EDE0', letterSpacing: '-0.02em' },
    btn: {
      fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
      padding: '8px 16px', borderRadius: 6, background: '#D4A853',
      color: '#0D0C0A', border: 'none', cursor: 'pointer',
    },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
    emptyState: {
      textAlign: 'center', padding: '64px 32px',
      fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#6A6055',
    },
  };

  return (
    <div style={s.wrap}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <div style={s.title}>Projects</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#6A6055', marginTop: 4 }}>
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </div>
        </div>
        <button style={s.btn}
          onMouseEnter={e => e.currentTarget.style.background = '#E8C47A'}
          onMouseLeave={e => e.currentTarget.style.background = '#D4A853'}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="14" height="14" style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div style={s.emptyState}>No projects yet. Start one from an idea.</div>
      ) : (
        <div style={s.grid}>
          {projects.map(p => (
            <ProjectCard key={p.id} {...p} onClick={() => onNavigate('project-detail', p)} />
          ))}
        </div>
      )}
    </div>
  );
};

Object.assign(window, { ProjectsPage });
