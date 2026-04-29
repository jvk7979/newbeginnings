import { C, alpha } from '../tokens';
import { useAppData } from '../context/AppContext';
import IdeaCard from '../components/IdeaCard';
import heroImg from '../assets/hero_wide.png';

const ICON_IDEA = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/><path d="M9 21h6"/></svg>;
const ICON_PLAN = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
const ICON_FILE = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>;
const ICON_DOC  = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="13" height="13"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>;

const QUICK_ACTIONS = [
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/><path d="M9 21h6"/></svg>,
    label: 'New Idea', sub: 'Capture a venture idea', dest: 'new-idea',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    label: 'New Plan', sub: 'Start a structured plan', dest: 'new-plan',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
    label: 'Documents', sub: 'Upload or browse files', dest: 'documents',
  },
];

export default function Dashboard({ onNavigate }) {
  const { ideas, plans, files } = useAppData();
  const recentIdeas = [...ideas]
    .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
    .slice(0, 4);

  return (
    <div className="page-pad" style={{ background: C.bg0 }}>

      {/* Hero */}
      <div className="hero-bleed" style={{ position: 'relative', background: '#2e2015' }}>
        <img src={heroImg} alt="The New Beginnings" style={{ width: '100%', display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 'clamp(14px,3vw,28px) clamp(16px,4vw,36px)' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => onNavigate('new-idea')}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, padding: '9px 20px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = C.accentDim}
              onMouseLeave={e => e.currentTarget.style.background = C.accent}>
              + New Idea
            </button>
            <button onClick={() => onNavigate('ideas')}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500, padding: '9px 20px', borderRadius: 6, background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.35)', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.28)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}>
              View All Ideas
            </button>
          </div>
        </div>
      </div>

      {/* Stats — 3 key numbers always visible at a glance */}
      <div className="stat-grid" style={{ marginBottom: 28 }}>
        {[
          { label: 'Ideas',          count: ideas.length, dest: 'ideas',     icon: ICON_IDEA },
          { label: 'Business Plans', count: plans.length, dest: 'plans',     icon: ICON_PLAN },
          { label: 'Documents',      count: files.length, dest: 'documents', icon: ICON_FILE },
        ].map(s => (
          <button key={s.label} onClick={() => onNavigate(s.dest)} className="stat-card"
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px 14px 16px', borderRadius: 12, background: C.bg1, border: `1px solid ${C.border}`, cursor: 'pointer', textAlign: 'left', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', width: '100%' }}>
            <span className="stat-icon" style={{ width: 40, height: 40, borderRadius: 10, background: `linear-gradient(135deg, ${C.accentBg} 0%, ${C.bg2} 100%)`, border: `1px solid ${alpha(C.accent, 44)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent, flexShrink: 0 }}>
              {s.icon}
            </span>
            <div>
              <div className="stat-count" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 30, fontWeight: 700, color: C.fg1, lineHeight: 1 }}>{s.count}</div>
              <div className="stat-label" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, marginTop: 3, fontWeight: 500 }}>{s.label}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Two-column: Recent Ideas (wider) + Quick Actions (narrower) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, marginBottom: 28, alignItems: 'start' }} className="dash-two-col">

        {/* Recent Ideas */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: C.fg3 }}>Recent Ideas</div>
            {ideas.length > 0 && (
              <button onClick={() => onNavigate('ideas')}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 500 }}>
                View all →
              </button>
            )}
          </div>
          {recentIdeas.length === 0 ? (
            <div style={{ background: C.bg1, border: `1px dashed ${C.border}`, borderRadius: 10, padding: '32px 20px', textAlign: 'center' }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: C.fg2, marginBottom: 14 }}>No ideas yet — capture your first venture idea.</div>
              <button onClick={() => onNavigate('new-idea')}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500, padding: '8px 18px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = C.accentDim}
                onMouseLeave={e => e.currentTarget.style.background = C.accent}>
                + New Idea
              </button>
            </div>
          ) : (
            <div className="grid-2">
              {recentIdeas.map(i => <IdeaCard key={i.id} {...i} onClick={() => onNavigate('idea-detail', i)} />)}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: C.fg3, marginBottom: 14 }}>Quick Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {QUICK_ACTIONS.map(q => (
              <button key={q.label} onClick={() => onNavigate(q.dest)} className="card-rich"
                style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 16px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <span style={{ width: 38, height: 38, borderRadius: 9, background: `linear-gradient(135deg, ${C.accentBg} 0%, ${C.bg2} 100%)`, border: `1px solid ${alpha(C.accent, 33)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent, flexShrink: 0 }}>
                  {q.icon}
                </span>
                <span>
                  <span style={{ display: 'block', fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700, color: C.fg1, marginBottom: 2 }}>{q.label}</span>
                  <span style={{ display: 'block', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3 }}>{q.sub}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Documents — only shown when they exist */}
      {files.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: C.fg3 }}>Recent Documents</div>
            <button onClick={() => onNavigate('documents')}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 500 }}>
              View all →
            </button>
          </div>
          <div className="grid-3">
            {[...files].slice(0, 3).map(f => (
              <div key={f.id} role="button" tabIndex={0} className="card-rich"
                style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 18px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
                onClick={() => onNavigate('document-detail', f)}
                onKeyDown={e => e.key === 'Enter' && onNavigate('document-detail', f)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${C.accentBg} 0%, ${C.bg2} 100%)`, border: `1px solid ${alpha(C.accent, 33)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent, flexShrink: 0 }}>
                    {ICON_DOC}
                  </span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: C.accent, background: C.accentBg, border: `1px solid ${alpha(C.accent, 33)}`, borderRadius: 4, padding: '2px 6px', letterSpacing: '0.05em' }}>
                    {f.fileName?.split('.').pop()?.toUpperCase() || 'PDF'}
                  </span>
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: C.fg1, lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{f.title}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: `1px solid ${C.border}`, marginTop: 'auto' }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.fg3 }}>{f.date}</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.accent, fontWeight: 600 }}>Open →</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
