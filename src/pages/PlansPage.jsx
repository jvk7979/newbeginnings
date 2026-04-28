import { useState } from 'react';
import { C, alpha } from '../tokens';
import { useAppData } from '../context/AppContext';
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
    <div className="card-rich"
      style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 10, padding: '20px 22px', marginBottom: 12, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
      onClick={() => onNavigate('plan-detail', plan)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 12 }}>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 17, fontWeight: 600, color: C.fg1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{plan.title}</div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {plan.category && (
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.fg2, background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 5, padding: '2px 8px' }}>
              {plan.category}
            </span>
          )}
          <Badge status={plan.status} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: plan.summary ? 10 : 0 }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg3 }}>Updated {plan.updated}</span>
        {plan.attachedFile && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.accent, background: C.accentBg, border: `1px solid ${alpha(C.accent, 33)}`, borderRadius: 5, padding: '1px 8px', fontWeight: 500 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="11" height="11"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
            {plan.attachedFile.type}
          </span>
        )}
      </div>
      {plan.summary && (
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg2, lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
          {plan.summary}
        </div>
      )}
    </div>
  );
}

export default function PlansPage({ onNavigate }) {
  const { plans } = useAppData();
  const [filter, setFilter]     = useState('all');
  const [catFilter, setCatFilter] = useState('All');
  const [search, setSearch]     = useState('');
  const [sort,   setSort]       = useState('newest');

  const filtered = [...plans]
    .sort((a, b) => {
      if (sort === 'newest') return (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0);
      if (sort === 'oldest') return (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0);
      return a.title.localeCompare(b.title);
    })
    .filter(p => filter === 'all' || p.status === filter)
    .filter(p => catFilter === 'All' || p.category === catFilter)
    .filter(p => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        (p.summary || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.status || '').toLowerCase().includes(q) ||
        (p.fileName || '').toLowerCase().includes(q)
      );
    });

  return (
    <div className="page-pad" style={{ background: C.bg0 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
        <div>
          <div className="grad-text" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>Business Plans</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, marginTop: 4 }}>
            {search || filter !== 'all' || catFilter !== 'All' ? `${filtered.length} of ${plans.length} plans` : `${plans.length} plan${plans.length !== 1 ? 's' : ''}`}
          </div>
        </div>
        <button style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '8px 16px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
          onMouseEnter={e => e.currentTarget.style.background = C.accentDim}
          onMouseLeave={e => e.currentTarget.style.background = C.accent}
          onClick={() => onNavigate('new-plan')}>+ New Plan</button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} viewBox="0 0 24 24" fill="none" stroke={C.fg3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by title, category, status, file…"
          aria-label="Search plans"
          style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6, color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: '8px 36px 8px 32px', outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'border 150ms' }}
          onFocus={e => { e.target.style.borderColor = C.accentDim; e.target.style.boxShadow = `0 0 0 2px ${alpha(C.accentDim, 33)}`; }}
          onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }} />
        {search && (
          <button onClick={() => setSearch('')} aria-label="Clear search"
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.fg3, fontSize: 16, lineHeight: 1 }}>×</button>
        )}
      </div>

      {/* Status filters + sort */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, padding: '5px 12px', borderRadius: 999, border: `1px solid ${filter === f.id ? alpha(C.accent, 44) : C.border}`, background: filter === f.id ? C.accentBg : 'transparent', color: filter === f.id ? C.accent : C.fg3, cursor: 'pointer', fontWeight: filter === f.id ? 500 : 400 }}>
              {f.label}
            </button>
          ))}
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)}
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, padding: '5px 10px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg1, color: C.fg2, cursor: 'pointer', outline: 'none' }}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="az">A – Z</option>
        </select>
      </div>

      {/* Category filters */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCatFilter(c)}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, padding: '5px 12px', borderRadius: 999, border: `1px solid ${catFilter === c ? alpha(C.accent, 44) : C.border}`, background: catFilter === c ? C.accentBg : 'transparent', color: catFilter === c ? C.accent : C.fg3, cursor: 'pointer', fontWeight: catFilter === c ? 500 : 400 }}>
            {c}
          </button>
        ))}
      </div>

      {/* Empty states */}
      {plans.length === 0 ? (
        <div style={{ background: C.bg1, border: `2px dashed ${C.border}`, borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>📋</div>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, color: C.fg1, marginBottom: 8 }}>No business plans yet</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, marginBottom: 20 }}>Create your first structured business plan to get started.</div>
          <button style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, padding: '10px 22px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = C.accentDim}
            onMouseLeave={e => e.currentTarget.style.background = C.accent}
            onClick={() => onNavigate('new-plan')}>+ Create Business Plan</button>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3, marginTop: 40, textAlign: 'center' }}>
          {search ? `No plans matching "${search}"` : `No plans with status "${filter}".`}
        </div>
      ) : (
        filtered.map(p => <PlanCard key={p.id} plan={p} onNavigate={onNavigate} />)
      )}
      </div>
    </div>
  );
}
