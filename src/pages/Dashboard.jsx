import { useMemo } from 'react';
import { C, alpha } from '../tokens';
import { useIdeas, usePlans, useFiles } from '../context/AppContext';
import IdeaCard from '../components/IdeaCard';
import heroImg from '../assets/hero_latest.png';

const ICON_IDEA = <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/><path d="M9 21h6"/></svg>;
const ICON_PLAN = <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
const ICON_FILE = <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>;
const ICON_DOC  = <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="13" height="13"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>;

const QUICK_ACTIONS = [
  {
    icon: <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/><path d="M9 21h6"/></svg>,
    label: '+ New Idea', dest: 'new-idea', primary: true,
  },
  {
    icon: <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    label: '+ New Plan', dest: 'new-plan', primary: false,
  },
  {
    icon: <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
    label: 'Upload Document', dest: 'documents', primary: false,
  },
];

function SectionHeader({ label, actionLabel, onAction }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
      <span style={{
        fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700,
        letterSpacing: '0.10em', textTransform: 'uppercase', color: C.fg3, whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: C.border }} />
      {actionLabel && (
        <button onClick={onAction}
          style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.accent,
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontWeight: 600, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5,
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
          {actionLabel}
          <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>
      )}
    </div>
  );
}

export default function Dashboard({ onNavigate }) {
  const { ideas } = useIdeas();
  const { plans } = usePlans();
  const { files } = useFiles();
  // AppContext already sorts ideas/files by id desc on every snapshot, so
  // "recent" is just the head of the array — no extra sort needed.
  // Memoized to keep referential equality stable for IdeaCard children.
  const recentIdeas = useMemo(() => ideas.slice(0, 4), [ideas]);
  const recentFiles = useMemo(() => files.slice(0, 3), [files]);

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

      {/* Stats */}
      <div className="stat-grid" style={{ marginBottom: 32 }}>
        {[
          { label: 'Ideas',     count: ideas.length, dest: 'ideas',     icon: ICON_IDEA },
          { label: 'Plans',     count: plans.length, dest: 'plans',     icon: ICON_PLAN },
          { label: 'Documents', count: files.length, dest: 'documents', icon: ICON_FILE },
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

      {/* Quick Actions — compact horizontal strip */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 36, flexWrap: 'wrap' }}>
        {QUICK_ACTIONS.map(q => (
          <button key={q.label} onClick={() => onNavigate(q.dest)}
            className="card-rich"
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: q.primary ? 600 : 500,
              color: q.primary ? '#fff' : C.fg2,
              background: q.primary ? C.accent : C.bg1,
              border: `1px solid ${q.primary ? 'transparent' : C.border}`,
              borderRadius: 8, padding: '9px 16px', cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = q.primary ? C.accentDim : C.bg2; }}
            onMouseLeave={e => { e.currentTarget.style.background = q.primary ? C.accent : C.bg1; }}>
            <span style={{ color: q.primary ? 'rgba(255,255,255,0.85)' : C.accent, display: 'flex' }}>{q.icon}</span>
            {q.label}
          </button>
        ))}
      </div>

      {/* Recent Ideas — full width */}
      <div style={{ marginBottom: 40 }}>
        <SectionHeader
          label="Recent Ideas"
          actionLabel={ideas.length > 0 ? 'View all Ideas' : null}
          onAction={() => onNavigate('ideas')}
        />
        {recentIdeas.length === 0 ? (
          <div style={{ background: C.bg1, border: `1px dashed ${C.border}`, borderRadius: 10, padding: '36px 24px', textAlign: 'center' }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.fg2, marginBottom: 16 }}>
              No ideas yet — capture your first venture idea.
            </div>
            <button onClick={() => onNavigate('new-idea')}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, padding: '9px 20px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}
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

      {/* Recent Documents */}
      {files.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <SectionHeader
            label="Recent Documents"
            actionLabel="View all Documents"
            onAction={() => onNavigate('documents')}
          />
          <div className="grid-3">
            {recentFiles.map(f => (
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
        </div>
      )}
    </div>
  );
}
