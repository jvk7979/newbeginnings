import { C } from '../tokens';
import { projects } from '../data/AppData';
import ProjectCard from '../components/ProjectCard';

export default function ProjectsPage({ onNavigate }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 36px', background: C.bg0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 700, color: C.fg1, letterSpacing: '-0.02em' }}>Projects</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, marginTop: 4 }}>{projects.length} projects</div>
        </div>
        <button style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '8px 16px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.background = C.accentDim}
          onMouseLeave={e => e.currentTarget.style.background = C.accent}>+ New Project</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {projects.map(p => <ProjectCard key={p.id} {...p} onClick={() => onNavigate('project-detail', p)} />)}
      </div>
    </div>
  );
}
