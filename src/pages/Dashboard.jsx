import { C } from '../tokens';
import { useAppData } from '../context/AppContext';
import IdeaCard from '../components/IdeaCard';
import ProjectCard from '../components/ProjectCard';
import heroImg from '../assets/hero.png';

const statCard = { background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 8, padding: '16px 20px' };

export default function Dashboard({ onNavigate }) {
  const { ideas, projects, plans } = useAppData();
  const recentIdeas = ideas.slice(0, 3);
  const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'progress');
  const activePlans = plans.filter(p => p.status === 'active');

  return (
    <div className="page-pad" style={{ background: C.bg0 }}>
      {/* Hero image with gradient overlay */}
      <div className="hero-bleed" style={{ position: 'relative' }}>
        <img src={heroImg} alt="The New Beginnings" style={{ width: '100%', height: 'auto', display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.78) 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '28px 36px' }}>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(22px,4vw,40px)', fontWeight: 700, color: '#fff', letterSpacing: '-0.01em', lineHeight: 1.2, marginBottom: 6, textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>The New Beginnings</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 'clamp(13px,2vw,17px)', color: 'rgba(255,255,255,0.92)', marginBottom: 8, fontWeight: 500, letterSpacing: '0.02em' }}>Ideas. Plans. Projects. Progress.</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 'clamp(11px,1.5vw,13px)', color: 'rgba(255,255,255,0.72)', maxWidth: 560, lineHeight: 1.55, marginBottom: 20 }}>
            A digital space to capture ideas, organize plans, store documents, and build meaningful projects inspired by Rajahmundry, Godavari, and Konaseema.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { label: 'Explore Ideas', dest: 'ideas' },
              { label: 'View Projects', dest: 'projects' },
              { label: 'Read Plans', dest: 'plans' },
              { label: 'Open Files', dest: 'files' },
            ].map(btn => (
              <button key={btn.dest} onClick={() => onNavigate(btn.dest)}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '8px 16px', borderRadius: 6, background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.35)', cursor: 'pointer', backdropFilter: 'blur(4px)', transition: 'background 140ms' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.28)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}>
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28, marginTop: 24 }}>
        {[
          { label: '+ New Idea', dest: 'new-idea', primary: true },
          { label: 'New Plan', dest: 'new-plan', primary: false },
        ].map(btn => (
          <button key={btn.dest}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '8px 16px', borderRadius: 6, background: btn.primary ? C.accent : 'transparent', color: btn.primary ? '#fff' : C.fg2, border: btn.primary ? 'none' : `1px solid ${C.border}`, cursor: 'pointer', transition: 'background 140ms' }}
            onMouseEnter={e => e.currentTarget.style.background = btn.primary ? C.accentDim : C.bg1}
            onMouseLeave={e => e.currentTarget.style.background = btn.primary ? C.accent : 'transparent'}
            onClick={() => onNavigate(btn.dest)}>{btn.label}</button>
        ))}
      </div>

      <div className="grid-4" style={{ marginBottom: 32 }}>
        {[
          { val: String(ideas.length),                                        label: 'Total Ideas',     onClick: () => onNavigate('ideas') },
          { val: String(ideas.filter(i => i.status === 'validating').length), label: 'In Evaluation',  onClick: () => onNavigate('ideas') },
          { val: String(activeProjects.length),                               label: 'Active Projects', onClick: () => onNavigate('projects') },
          { val: String(plans.length),                                        label: 'Business Plans',  onClick: () => onNavigate('plans') },
        ].map(s => (
          <div key={s.label} style={{ ...statCard, cursor: 'pointer' }} onClick={s.onClick}
            onMouseEnter={e => e.currentTarget.style.borderColor = C.accentDim}
            onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 500, color: C.accent }}>{s.val}</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.fg3, marginBottom: 12 }}>Recent Ideas</div>
      {recentIdeas.length === 0 ? (
        <div style={{ background: C.bg1, border: `1px dashed ${C.border}`, borderRadius: 8, padding: '24px 20px', textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3, marginBottom: 12 }}>No ideas yet — capture your first venture idea.</div>
          <button style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '7px 16px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = C.accentDim}
            onMouseLeave={e => e.currentTarget.style.background = C.accent}
            onClick={() => onNavigate('new-idea')}>+ Add Idea</button>
        </div>
      ) : (
        <div className="grid-3" style={{ marginBottom: 8 }}>
          {recentIdeas.map(i => <IdeaCard key={i.id} {...i} onClick={() => onNavigate('idea-detail', i)} />)}
        </div>
      )}
      {ideas.length > 3 && (
        <button onClick={() => onNavigate('ideas')} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 32 }}>
          View all {ideas.length} ideas →
        </button>
      )}
      {ideas.length <= 3 && ideas.length > 0 && <div style={{ marginBottom: 32 }} />}

      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.fg3, marginBottom: 12 }}>Active Projects</div>
      {activeProjects.length === 0 ? (
        <div style={{ background: C.bg1, border: `1px dashed ${C.border}`, borderRadius: 8, padding: '24px 20px', textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3, marginBottom: 12 }}>No active projects. Start tracking your ventures.</div>
          <button style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '7px 16px', borderRadius: 6, background: 'transparent', color: C.fg2, border: `1px solid ${C.border}`, cursor: 'pointer' }}
            onClick={() => onNavigate('projects')}>Go to Projects</button>
        </div>
      ) : (
        <div className="grid-2" style={{ marginBottom: 32 }}>
          {activeProjects.map(p => <ProjectCard key={p.id} {...p} onClick={() => onNavigate('project-detail', p)} />)}
        </div>
      )}

      {activePlans.length > 0 && (
        <>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.fg3, marginBottom: 12 }}>Active Business Plans</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
            {activePlans.map(p => (
              <div key={p.id} style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 18px', cursor: 'pointer' }}
                onClick={() => onNavigate('plan-detail', p)}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.accentDim}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: C.fg1, marginBottom: 4 }}>{p.title}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg3 }}>{p.sectionCount} sections · Updated {p.updated}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
