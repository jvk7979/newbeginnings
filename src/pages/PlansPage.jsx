import { useState, useMemo } from 'react';
import { C, alpha } from '../tokens';
import { usePlans } from '../context/AppContext';
import Badge from '../components/Badge';
import { CATEGORIES } from '../utils/categoryStyles';

const FILTERS = [
  { id: 'all',       label: 'All' },
  { id: 'draft',     label: 'Draft' },
  { id: 'active',    label: 'Active' },
  { id: 'in-review', label: 'In Review' },
  { id: 'completed', label: 'Completed' },
  { id: 'archived',  label: 'Archived' },
];

function PlanCard({ plan, onNavigate }) {
  return (
    <div className="card-rich plan-card"
      style={{ background: C.bg1, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.accent}`, borderRadius: 10, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column' }}
      onClick={() => onNavigate('plan-detail', plan)}>
      <div className="plan-card-head">
        <div className="plan-card-title" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: C.fg1 }}>{plan.title}</div>
        <div className="plan-card-tags">
          {plan.category && (
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.fg2, background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 5, padding: '2px 8px' }}>
              {plan.category}
            </span>
          )}
          <Badge status={plan.status} />
        </div>
      </div>
      <div className="plan-card-meta">
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: C.fg3 }}>Updated {plan.updated}</span>
        {plan.attachedFile && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.accent, background: C.accentBg, border: `1px solid ${alpha(C.accent, 33)}`, borderRadius: 5, padding: '1px 8px', fontWeight: 500 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="11" height="11"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
            {plan.attachedFile.type}
          </span>
        )}
      </div>
      <div className="plan-card-summary"
        style={{ fontFamily: "'DM Sans', sans-serif", color: plan.summary ? C.fg2 : C.fg3, fontStyle: plan.summary ? 'normal' : 'italic' }}>
        {plan.summary || 'No summary yet.'}
      </div>
    </div>
  );
}

export default function PlansPage({ onNavigate }) {
  const { plans } = usePlans();
  const [filter, setFilter]     = useState('all');
  const [catFilter, setCatFilter] = useState('All');
  const [search, setSearch]     = useState('');
  const [sort,   setSort]       = useState('newest');

  const sq = search.trim().toLowerCase();
  // AppContext already sorts plans by id desc; reverse / title-sort here only
  // when needed and memoize to avoid reallocating on every keystroke.
  const filtered = useMemo(() => {
    let arr = plans;
    if (sort === 'oldest')   arr = [...plans].reverse();
    else if (sort === 'az')  arr = [...plans].sort((a, b) => a.title.localeCompare(b.title));
    return arr.filter(p =>
      (filter === 'all' || p.status === filter) &&
      (catFilter === 'All' || p.category === catFilter) &&
      (!sq || p.title.toLowerCase().includes(sq) || (p.summary || '').toLowerCase().includes(sq))
    );
  }, [plans, sort, filter, catFilter, sq]);

  return (
    <div className="page-pad" style={{ background: C.bg0, minHeight: 'calc(100vh - 64px)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
      <div className="plans-page-header">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', minWidth: 0 }}>
          <div className="grad-text page-title">Business Plans</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: C.fg3, background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 5, padding: '1px 8px', whiteSpace: 'nowrap' }}>
            {search || filter !== 'all' || catFilter !== 'All' ? `${filtered.length} / ${plans.length}` : plans.length}
          </div>
        </div>
        <button className="plans-new-btn"
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, padding: '8px 18px', borderRadius: 8, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}
          onMouseEnter={e => e.currentTarget.style.background = C.accentDim}
          onMouseLeave={e => e.currentTarget.style.background = C.accent}
          onClick={() => onNavigate('new-plan')}
          aria-label="New plan">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span className="plans-new-btn-label">New Plan</span>
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} viewBox="0 0 24 24" fill="none" stroke={C.fg3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by title or summary…"
          aria-label="Search plans"
          style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6, color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 15, padding: '8px 36px 8px 32px', outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'border 150ms' }}
          onFocus={e => { e.target.style.borderColor = C.accentDim; e.target.style.boxShadow = `0 0 0 2px ${alpha(C.accentDim, 33)}`; }}
          onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }} />
        {search && (
          <button onClick={() => setSearch('')} aria-label="Clear search"
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.fg3, fontSize: 18, lineHeight: 1 }}>×</button>
        )}
      </div>

      {/* Status filters + sort */}
      <div className="filter-bar">
        <div className="chip-scroll-wrap" style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', flexWrap: 'nowrap', WebkitOverflowScrolling: 'touch', paddingBottom: 2 }}>
            {FILTERS.map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: '5px 12px', borderRadius: 999, border: `1px solid ${filter === f.id ? alpha(C.accent, 44) : C.border}`, background: filter === f.id ? C.accentBg : 'transparent', color: filter === f.id ? C.accent : C.fg3, cursor: 'pointer', fontWeight: filter === f.id ? 500 : 400, flexShrink: 0 }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)} className="filter-sort"
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: '5px 10px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg1, color: C.fg2, cursor: 'pointer', outline: 'none', flexShrink: 0 }}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="az">A – Z</option>
        </select>
      </div>

      {/* Category filters */}
      <div className="chip-scroll-wrap" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', flexWrap: 'nowrap', WebkitOverflowScrolling: 'touch', paddingBottom: 2 }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: '5px 12px', borderRadius: 999, border: `1px solid ${catFilter === c ? alpha(C.accent, 44) : C.border}`, background: catFilter === c ? C.accentBg : 'transparent', color: catFilter === c ? C.accent : C.fg3, cursor: 'pointer', fontWeight: catFilter === c ? 500 : 400, flexShrink: 0 }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Empty states */}
      {plans.length === 0 ? (
        <div style={{ background: C.bg1, border: `2px dashed ${C.border}`, borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>📋</div>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, color: C.fg1, marginBottom: 8 }}>No business plans yet</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.fg3, marginBottom: 20 }}>Create your first structured business plan to get started.</div>
          <button style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, padding: '10px 22px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = C.accentDim}
            onMouseLeave={e => e.currentTarget.style.background = C.accent}
            onClick={() => onNavigate('new-plan')}>+ Create Business Plan</button>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: C.fg3, marginTop: 40, textAlign: 'center' }}>
          {search ? `No plans matching "${search}"` : `No plans with status "${filter}".`}
        </div>
      ) : (
        <div className="grid-2">
          {filtered.map(p => <PlanCard key={p.id} plan={p} onNavigate={onNavigate} />)}
        </div>
      )}
      </div>
    </div>
  );
}
