import { ProjectCard } from '../components/Cards';

const ProjectsPage = ({ projects }) => (
  <div style={{ flex: 1, overflowY: 'auto', padding: '32px 36px', background: '#0D0C0A' }}>
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, color: '#F2EDE0' }}>Projects</div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#6A6055', marginTop: 4 }}>{projects.length} projects</div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {projects.map((project) => <ProjectCard key={project.id} {...project} />)}
    </div>
  </div>
);

export default ProjectsPage;
