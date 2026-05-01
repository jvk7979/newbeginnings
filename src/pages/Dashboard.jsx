import { useMemo, useState } from 'react';
import { C, alpha } from '../tokens';
import { useIdeas, usePlans, useFiles } from '../context/AppContext';
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

const IDEA_STATUS_LABELS = { draft: 'Draft', validating: 'Validating', active: 'Active', archived: 'Archived' };
const PLAN_STATUS_LABELS = { draft: 'Draft', active: 'Active', archived: 'Archived' };
const STATUS_COLORS = {
  draft: '#8A6000', validating: '#0070B8', active: '#2E7D32', archived: '#888',
};

function fmtINR(n) {
  if (!n || !isFinite(n)) return '—';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)} L`;
  if (n >= 1000)     return `₹${(n / 1000).toFixed(1)} K`;
  return `₹${n.toFixed(0)}`;
}

function SectionHeader({ label, actionLabel, onAction }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: C.fg3, whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: C.border }} />
      {actionLabel && (
        <button onClick={onAction}
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
          {actionLabel}
          <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>
      )}
    </div>
  );
}

function StatBreakdown({ kind, items }) {
  const groups = useMemo(() => {
    const labelMap = kind === 'ideas' ? IDEA_STATUS_LABELS : kind === 'plans' ? PLAN_STATUS_LABELS : null;
    if (!labelMap) {
      const byType = {};
      items.forEach(f => {
        const ext = f.fileName?.split('.').pop()?.toUpperCase() || 'File';
        byType[ext] = (byType[ext] || 0) + 1;
      });
      return Object.entries(byType).map(([label, count]) => ({ label, count, color: C.accent }));
    }
    return Object.entries(labelMap).map(([status, label]) => ({
      label,
      count: items.filter(i => i.status === status).length,
      color: STATUS_COLORS[status] || C.fg3,
    })).filter(g => g.count > 0);
  }, [kind, items]);

  if (groups.length === 0) return null;
  const total = items.length;

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
      {groups.map(g => (
        <div key={g.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ height: 6, borderRadius: 3, background: g.color, width: `${Math.max(8, (g.count / total) * 100)}%`, transition: 'width 300ms ease' }} />
          </div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: g.color, fontWeight: 700, minWidth: 18, textAlign: 'right' }}>{g.count}</span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, minWidth: 72 }}>{g.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard({ onNavigate }) {
  const { ideas } = useIdeas();
  const { plans } = usePlans();
  const { files } = useFiles();
  const [expandedStat, setExpandedStat] = useState(null);

  const recentIdeas = useMemo(() => ideas.slice(0, 5), [ideas]);
  const recentFiles = useMemo(() => files.slice(0, 3), [files]);

  const stats = [
    { key: 'ideas',     label: 'Ideas',     count: ideas.length, dest: 'ideas',     icon: ICON_IDEA, items: ideas },
    { key: 'plans',     label: 'Plans',     count: plans.length, dest: 'plans',     icon: ICON_PLAN, items: plans },
    { key: 'documents', label: 'Documents', count: files.length, dest: 'documents', icon: ICON_FILE, items: files },
  ];

  const handleStatClick = (s) => {
    if (s.count === 0) { onNavigate(s.dest); return; }
    setExpandedStat(prev => prev === s.key ? null : s.key);
  };

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

      {/* Stats — click to expand breakdown, double-click or click again to navigate */}
      <div className="stat-grid" style={{ marginBottom: 32 }}>
        {stats.map(s => (
          <div key={s.key} style={{ background: C.bg1, border: `1px solid ${expandedStat === s.key ? C.accent : C.border}`, borderRadius: 12, boxShadow: expandedStat === s.key ? `0 0 0 2px ${alpha(C.accent, 22)}` : '0 1px 4px rgba(0,0,0,0.05)', transition: 'border 150ms, box-shadow 150ms', overflow: 'hidden' }}>
            <button onClick={() => handleStatClick(s)} className="stat-card"
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px 14px 16px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
              <span className="stat-icon" style={{ width: 40, height: 40, borderRadius: 10, background: `linear-gradient(135deg, ${C.accentBg} 0%, ${C.bg2} 100%)`, border: `1px solid ${alpha(C.accent, 44)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent, flexShrink: 0 }}>
                {s.icon}
              </span>
              <div style={{ flex: 1 }}>
                <div className="stat-count" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 30, fontWeight: 700, color: C.fg1, lineHeight: 1 }}>{s.count}</div>
                <div className="stat-label" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, marginTop: 3, fontWeight: 500 }}>{s.label}</div>
              </div>
              <div className="stat-actions" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke={C.fg3} strokeWidth="2" strokeLinecap="round" width="12" height="12" style={{ transform: expandedStat === s.key ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }}><polyline points="6 9 12 15 18 9"/></svg>
                <button onClick={e => { e.stopPropagation(); onNavigate(s.dest); }}
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600, whiteSpace: 'nowrap' }}>
                  View all →
                </button>
              </div>
            </button>
            {expandedStat === s.key && (
              <div style={{ padding: '0 20px 14px 16px' }}>
                <StatBreakdown kind={s.key} items={s.items} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
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

      {/* Ideas Pipeline */}
      <div style={{ marginBottom: 40 }}>
        <SectionHeader
          label="Ideas Pipeline"
          actionLabel={ideas.length > 0 ? 'View all →' : null}
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
          <div style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: C.bg2, borderBottom: `1px solid ${C.border}` }}>
                  {['IDEA', 'STAGE', 'COST EST.', 'PAYBACK'].map(h => (
                    <th key={h} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', color: C.fg3, padding: '8px 14px', textAlign: h === 'IDEA' ? 'left' : 'right', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentIdeas.map((idea, i) => {
                  const sc = STATUS_COLORS[idea.status] || C.fg3;
                  return (
                    <tr key={idea.id}
                      style={{ borderBottom: i < recentIdeas.length - 1 ? `1px solid ${C.border}` : 'none', cursor: 'pointer', transition: 'background 120ms' }}
                      onClick={() => onNavigate('idea-detail', idea)}
                      onMouseEnter={e => e.currentTarget.style.background = C.bg2}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '10px 14px', fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: C.fg1, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {idea.title}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: sc }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc, flexShrink: 0 }} />
                          {IDEA_STATUS_LABELS[idea.status] || idea.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, color: C.fg1, whiteSpace: 'nowrap' }}>
                        {fmtINR(idea.estimatedCapex)}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: C.fg2, whiteSpace: 'nowrap' }}>
                        {idea.estimatedPayback ? `${idea.estimatedPayback}y` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
