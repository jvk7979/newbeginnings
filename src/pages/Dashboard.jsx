import { C } from '../tokens';
import { useAppData } from '../context/AppContext';
import IdeaCard from '../components/IdeaCard';
import ProjectCard from '../components/ProjectCard';

const btnStyle = { display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '8px 16px', borderRadius: 6, border: 'none', background: C.accent, color: '#fff', cursor: 'pointer', transition: 'background 140ms' };
const statCard = { background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 8, padding: '16px 20px' };

export default function Dashboard({ onNavigate }) {
  const { ideas, projects, plans } = useAppData();
  const recentIdeas = ideas.slice(0, 3);
  const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'progress');

  return (
    <div className="page-pad" style={{ background: C.bg0 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
        <button style={btnStyle}
          onMouseEnter={e => e.currentTarget.style.background = C.accentDim}
          onMouseLeave={e => e.currentTarget.style.background = C.accent}
          onClick={() => onNavigate('new-idea')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Idea
        </button>
      </div>

      <div className="grid-4">
        {[
          { val: String(ideas.length),                                    label: 'Total Ideas',    onClick: () => onNavigate('ideas') },
          { val: String(ideas.filter(i => i.status === 'validating').length), label: 'In Evaluation', onClick: () => onNavigate('ideas') },
          { val: String(activeProjects.length),                           label: 'Active Projects', onClick: () => onNavigate('projects') },
          { val: String(plans.length),                                    label: 'Business Plans', onClick: () => onNavigate('plans') },
        ].map(s => (
          <div key={s.label} style={{ ...statCard, cursor: 'pointer' }} onClick={s.onClick}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 500, color: C.accent }}>{s.val}</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.fg3, marginBottom: 12 }}>Recent Ideas</div>
      <div className="grid-3">
        {recentIdeas.map(i => <IdeaCard key={i.id} {...i} onClick={() => onNavigate('idea-detail', i)} />)}
      </div>

      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.fg3, marginBottom: 12 }}>Active Projects</div>
      <div className="grid-2">
        {activeProjects.map(p => <ProjectCard key={p.id} {...p} onClick={() => onNavigate('project-detail', p)} />)}
      </div>
    </div>
  );
}
