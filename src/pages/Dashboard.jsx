import { C, alpha } from '../tokens';
import { useAppData } from '../context/AppContext';
import IdeaCard from '../components/IdeaCard';
import Badge from '../components/Badge';
import heroImg from '../assets/hero_wide.png';

const sectionLabel = { fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.fg3, marginBottom: 12 };

export default function Dashboard({ onNavigate }) {
  const { ideas, plans, files } = useAppData();

  // Newest first
  const recentIdeas = [...ideas].sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)).slice(0, 3);
  const recentPlans = [...plans].sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)).slice(0, 3);

  return (
    <div className="page-pad" style={{ background: C.bg0 }}>

      {/* Hero */}
      <div className="hero-bleed" style={{ position: 'relative', background: '#2e2015' }}>
        <img src={heroImg} alt="The New Beginnings — A fresh start. Endless possibilities." style={{ width: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 'clamp(14px,3vw,28px) clamp(16px,4vw,36px)' }}>
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

      {/* Quick Actions */}
      <div style={sectionLabel}>Quick Actions</div>
      <div className="grid-3" style={{ marginBottom: 32 }}>
        {[
          { icon: '💡', label: 'Add New Idea',       sub: 'Capture a venture idea',      action: () => onNavigate('new-idea') },
          { icon: '📋', label: 'Create Business Plan', sub: 'Start a structured plan',     action: () => onNavigate('new-plan') },
          { icon: '📄', label: 'Upload Document',     sub: 'Add a report or PDF',         action: () => onNavigate('documents') },
        ].map(q => (
          <button key={q.label} onClick={q.action}
            style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 8, padding: '16px 18px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: 12, transition: 'border-color 150ms, box-shadow 150ms' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.accentDim; e.currentTarget.style.boxShadow = `0 2px 12px ${alpha(C.accent, 22)}`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = 'none'; }}>
            <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{q.icon}</span>
            <span>
              <span style={{ display: 'block', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: C.fg1 }}>{q.label}</span>
              <span style={{ display: 'block', fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, marginTop: 2 }}>{q.sub}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Recent Ideas */}
      <div style={sectionLabel}>Recent Ideas</div>
      {recentIdeas.length === 0 ? (
        <div style={{ background: C.bg1, border: `1px dashed ${C.border}`, borderRadius: 8, padding: '28px 20px', textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2, marginBottom: 14 }}>No ideas yet — capture your first venture idea.</div>
          <button
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '8px 18px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = C.accentDim}
            onMouseLeave={e => e.currentTarget.style.background = C.accent}
            onClick={() => onNavigate('new-idea')}>+ New Idea</button>
        </div>
      ) : (
        <>
          <div className="grid-3" style={{ marginBottom: 8 }}>
            {recentIdeas.map(i => <IdeaCard key={i.id} {...i} onClick={() => onNavigate('idea-detail', i)} />)}
          </div>
          {ideas.length > 3 ? (
            <button onClick={() => onNavigate('ideas')} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 32 }}>
              View all {ideas.length} ideas →
            </button>
          ) : <div style={{ marginBottom: 32 }} />}
        </>
      )}

      {/* Featured Business Plans */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={sectionLabel}>Business Plans</div>
        {plans.length > 3 && (
          <button onClick={() => onNavigate('plans')} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 12 }}>
            View all →
          </button>
        )}
      </div>
      {recentPlans.length === 0 ? (
        <div style={{ background: C.bg1, border: `1px dashed ${C.border}`, borderRadius: 8, padding: '28px 20px', textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2, marginBottom: 14 }}>No business plans yet.</div>
          <button
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '8px 18px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = C.accentDim}
            onMouseLeave={e => e.currentTarget.style.background = C.accent}
            onClick={() => onNavigate('new-plan')}>+ Create Business Plan</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
          {recentPlans.map(p => (
            <div key={p.id}
              role="button" tabIndex={0}
              style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 18px', cursor: 'pointer', transition: 'border-color 150ms', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}
              onClick={() => onNavigate('plan-detail', p)}
              onKeyDown={e => e.key === 'Enter' && onNavigate('plan-detail', p)}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.accentDim}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: C.fg1, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg3 }}>{p.sectionCount ?? (p.sections?.length ?? 0)} sections · Updated {p.updated}</div>
              </div>
              <Badge status={p.status} />
            </div>
          ))}
        </div>
      )}

      {/* Documents snapshot */}
      {files.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={sectionLabel}>Recent Documents</div>
            <button onClick={() => onNavigate('documents')} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 12 }}>
              View all →
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
            {[...files].slice(0, 3).map(f => (
              <div key={f.id}
                role="button" tabIndex={0}
                style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'border-color 150ms' }}
                onClick={() => onNavigate('document-detail', f)}
                onKeyDown={e => e.key === 'Enter' && onNavigate('document-detail', f)}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.accentDim}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                <svg viewBox="0 0 24 24" fill="none" stroke={C.fg3} strokeWidth="1.5" strokeLinecap="round" width="16" height="16" style={{ flexShrink: 0 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.title}</div>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.fg3, marginLeft: 'auto', flexShrink: 0 }}>{f.fileName?.split('.').pop()?.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </>
      )}

    </div>
  );
}
