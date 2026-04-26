import { C } from '../tokens';
import { useAppData } from '../context/AppContext';
import IdeaCard from '../components/IdeaCard';
import heroImg from '../assets/hero.png';

const statCard = { background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 8, padding: '16px 20px', cursor: 'pointer', transition: 'border-color 150ms' };

export default function Dashboard({ onNavigate }) {
  const { ideas, plans } = useAppData();
  const recentIdeas  = ideas.slice(0, 3);
  const activePlans  = plans.filter(p => p.status === 'active');

  return (
    <div className="page-pad" style={{ background: C.bg0 }}>

      {/* Hero */}
      <div className="hero-bleed" style={{ position: 'relative', background: '#1a1612' }}>
        <img src={heroImg} alt="The New Beginnings" style={{ width: '100%', maxHeight: 'clamp(320px, 60vh, 540px)', objectFit: 'contain', display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.85) 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 'clamp(14px,3vw,28px) clamp(16px,4vw,36px)' }}>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(22px,4vw,42px)', fontWeight: 700, fontStyle: 'italic', color: '#D4A853', lineHeight: 1.15, marginBottom: 6, textShadow: '0 2px 16px rgba(0,0,0,0.6)', letterSpacing: '-0.01em' }}>The New Beginnings</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 'clamp(13px,2vw,17px)', color: 'rgba(255,255,255,0.92)', marginBottom: 20, letterSpacing: '0.06em', fontWeight: 300, fontStyle: 'italic' }}>A Fresh Start. Endless Possibilities.</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => onNavigate('new-idea')}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, padding: '9px 20px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = C.accentDim}
              onMouseLeave={e => e.currentTarget.style.background = C.accent}>
              + New Idea
            </button>
            <button onClick={() => onNavigate('documents')}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '9px 20px', borderRadius: 6, background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.35)', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.28)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}>
              Open Documents
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-3" style={{ marginBottom: 32 }}>
        {[
          { val: String(ideas.length),                                        label: 'Total Ideas',    dest: 'ideas' },
          { val: String(ideas.filter(i => i.status === 'validating').length), label: 'In Evaluation',  dest: 'ideas' },
          { val: String(plans.length),                                        label: 'Business Plans', dest: 'plans' },
        ].map(s => (
          <div key={s.label} style={statCard} onClick={() => onNavigate(s.dest)}
            role="button" tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && onNavigate(s.dest)}
            onMouseEnter={e => e.currentTarget.style.borderColor = C.accentDim}
            onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 500, color: C.accent }}>{s.val}</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg2, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Ideas */}
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.fg3, marginBottom: 12 }}>Recent Ideas</div>
      {recentIdeas.length === 0 ? (
        <div style={{ background: C.bg1, border: `1px dashed ${C.border}`, borderRadius: 8, padding: '28px 20px', textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2, marginBottom: 14 }}>No ideas yet — capture your first venture idea.</div>
          <button style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '8px 18px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = C.accentDim}
            onMouseLeave={e => e.currentTarget.style.background = C.accent}
            onClick={() => onNavigate('new-idea')}>+ New Idea</button>
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
      {ideas.length > 0 && ideas.length <= 3 && <div style={{ marginBottom: 32 }} />}

      {/* Active Business Plans */}
      {activePlans.length > 0 && (
        <>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.fg3, marginBottom: 12 }}>Active Business Plans</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
            {activePlans.map(p => (
              <div key={p.id}
                role="button" tabIndex={0}
                style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 18px', cursor: 'pointer', transition: 'border-color 150ms' }}
                onClick={() => onNavigate('plan-detail', p)}
                onKeyDown={e => e.key === 'Enter' && onNavigate('plan-detail', p)}
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
