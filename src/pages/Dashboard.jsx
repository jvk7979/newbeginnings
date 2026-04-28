import { C, alpha } from '../tokens';
import { useAppData } from '../context/AppContext';
import IdeaCard from '../components/IdeaCard';
import heroImg from '../assets/hero_wide.png';

const sectionLabel = { fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.fg3, marginBottom: 14 };

export default function Dashboard({ onNavigate }) {
  const { ideas, plans, files } = useAppData();

  // Newest first
  const recentIdeas = [...ideas].sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)).slice(0, 3);

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

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Ideas', count: ideas.length, action: () => onNavigate('ideas'), icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/><path d="M9 21h6"/></svg> },
          { label: 'Business Plans', count: plans.length, action: () => onNavigate('plans'), icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
          { label: 'Documents', count: files.length, action: () => onNavigate('documents'), icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg> },
        ].map(s => (
          <button key={s.label} onClick={s.action} className="stat-card"
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderRadius: 10, background: C.bg1, border: `1px solid ${C.border}`, cursor: 'pointer', textAlign: 'left' }}>
            <span style={{ width: 34, height: 34, borderRadius: 8, background: C.accentBg, border: `1px solid ${alpha(C.accent, 33)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent, flexShrink: 0 }}>{s.icon}</span>
            <div>
              <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 700, color: C.fg1, lineHeight: 1 }}>{s.count}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3, marginTop: 2 }}>{s.label}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={sectionLabel}>Quick Actions</div>
      <div className="grid-3" style={{ marginBottom: 32 }}>
        {[
          {
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/><path d="M9 21h6"/><path d="M12 17v4"/></svg>,
            label: 'Add New Idea', sub: 'Capture a venture idea', action: () => onNavigate('new-idea'),
          },
          {
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></svg>,
            label: 'Create Business Plan', sub: 'Start a structured plan', action: () => onNavigate('new-plan'),
          },
          {
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
            label: 'Upload Document', sub: 'Add a report or PDF', action: () => onNavigate('documents'),
          },
        ].map(q => (
          <button key={q.label} onClick={q.action} className="card-rich"
            style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 10, padding: '18px 20px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <span style={{ width: 44, height: 44, borderRadius: 10, background: C.accentBg, border: `1px solid ${alpha(C.accent, 33)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent, flexShrink: 0 }}>
              {q.icon}
            </span>
            <span style={{ paddingTop: 2 }}>
              <span style={{ display: 'block', fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: C.fg1, marginBottom: 3 }}>{q.label}</span>
              <span style={{ display: 'block', fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, lineHeight: 1.4 }}>{q.sub}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Recent Ideas */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={sectionLabel}>Recent Ideas</div>
        {ideas.length > 0 && (
          <button onClick={() => onNavigate('ideas')} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 500 }}>
            View all →
          </button>
        )}
      </div>
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
          <div style={{ marginBottom: 32 }} />
        </>
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
