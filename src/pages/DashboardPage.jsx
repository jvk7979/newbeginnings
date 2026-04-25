import { useNavigate } from 'react-router-dom';
import { IdeaCard, ProjectCard } from '../components/Cards';

const DashboardPage = ({ ideas, projects }) => {
  const navigate = useNavigate();

  const s = {
    wrap: { flex: 1, overflowY: 'auto', padding: '32px 36px', background: '#0D0C0A' },
    header: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 },
    title: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: 32, fontWeight: 600, color: '#F2EDE0', letterSpacing: '-0.02em', lineHeight: 1.1 },
    subtitle: { fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#6A6055', marginTop: 6 },
    sectionLabel: { fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6A6055', marginBottom: 14 },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 32 },
    grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 32 },
    btn: {
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
      padding: '8px 16px', borderRadius: 6, border: 'none',
      background: '#D4A853', color: '#0D0C0A', cursor: 'pointer',
    },
    statCard: { background: '#18160F', border: '1px solid #2E2B23', borderRadius: 8, padding: '16px 20px' },
    statVal: { fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 500, color: '#D4A853' },
    statLabel: { fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#6A6055', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 },
  };

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div>
          <div style={s.title}>Good afternoon.</div>
          <div style={s.subtitle}>React app structure enabled · {projects.length} active projects · {ideas.length} ideas tracked</div>
        </div>
        <button style={s.btn} onClick={() => navigate('/ideas/new')}>New Idea</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 32 }}>
        {[
          { val: String(ideas.length), label: 'Total Ideas' },
          { val: String(projects.length), label: 'Active Projects' },
          { val: '$3.2K', label: 'MRR (All)' },
          { val: '2', label: 'Business Plans' },
        ].map((s2) => (
          <div key={s2.label} style={s.statCard}>
            <div style={s.statVal}>{s2.val}</div>
            <div style={s.statLabel}>{s2.label}</div>
          </div>
        ))}
      </div>

      <div style={s.sectionLabel}>Recent Ideas</div>
      <div style={s.grid3}>
        {ideas.slice(0, 3).map((idea) => (
          <IdeaCard key={idea.id} {...idea} onClick={() => navigate('/ideas')} />
        ))}
      </div>

      <div style={s.sectionLabel}>Active Projects</div>
      <div style={s.grid2}>
        {projects.map((project) => (
          <ProjectCard key={project.id} {...project} onClick={() => navigate('/projects')} />
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;
