import { useState } from 'react';
import { C, alpha } from '../tokens';
import { useAppData } from '../context/AppContext';
import IdeaCard from '../components/IdeaCard';
import { IDEA_CATEGORIES } from '../utils/categoryStyles';

const FILTERS = [
  { id: 'all',       label: 'All' },
  { id: 'draft',     label: 'Draft' },
  { id: 'validating',label: 'Researching' },
  { id: 'active',    label: 'Active' },
  { id: 'archived',  label: 'Archived' },
];

export default function IdeasPage({ onNavigate }) {
  const { ideas } = useAppData();
  const [filter, setFilter]     = useState('all');
  const [catFilter, setCatFilter] = useState('');
  const [search, setSearch]     = useState('');
  const [sort,   setSort]       = useState('newest');

  const sq = search.trim().toLowerCase();
  const filtered = [...ideas]
    .sort((a, b) => {
      if (sort === 'newest') return (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0);
      if (sort === 'oldest') return (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0);
      return a.title.localeCompare(b.title);
    })
    .filter(i =>
      (filter === 'all' || i.status === filter) &&
      (!catFilter || i.category === catFilter) &&
      (!sq || i.title.toLowerCase().includes(sq) || (i.desc || '').toLowerCase().includes(sq))
    );

  return (
    <div className="page-pad" style={{ background: C.bg0 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <div className="grad-text page-title">Ideas</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: C.fg3, background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 5, padding: '1px 8px', whiteSpace: 'nowrap' }}>
            {search || filter !== 'all' || catFilter ? `${filtered.length} / ${ideas.length}` : ideas.length}
          </div>
        </div>
        <button style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, padding: '8px 18px', borderRadius: 8, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}
          onMouseEnter={e => e.currentTarget.style.background = C.accentDim}
          onMouseLeave={e => e.currentTarget.style.background = C.accent}
          onClick={() => onNavigate('new-idea')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="13" height="13"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Idea
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} viewBox="0 0 24 24" fill="none" stroke={C.fg3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title or description…"
            aria-label="Search ideas"
            style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6, color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 15, padding: '8px 36px 8px 32px', outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'border 150ms' }}
            onFocus={e => { e.target.style.borderColor = C.accentDim; e.target.style.boxShadow = `0 0 0 2px ${alpha(C.accentDim, 33)}`; }}
            onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }}
          />
          {search && (
            <button onClick={() => setSearch('')} aria-label="Clear search"
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.fg3, fontSize: 18, lineHeight: 1 }}>×</button>
          )}
        </div>
      </div>

      {/* Filters row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: '6px 10px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg1, color: C.fg2, cursor: 'pointer', outline: 'none' }}>
          {FILTERS.map(f => <option key={f.id} value={f.id}>{f.label === 'All' ? 'All Status' : f.label}</option>)}
        </select>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: '6px 10px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg1, color: C.fg2, cursor: 'pointer', outline: 'none' }}>
          <option value="">All Categories</option>
          {IDEA_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={sort} onChange={e => setSort(e.target.value)}
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: '6px 10px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg1, color: C.fg2, cursor: 'pointer', outline: 'none', marginLeft: 'auto' }}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="az">A – Z</option>
        </select>
      </div>

      {/* Empty states */}
      {ideas.length === 0 ? (
        <div style={{ background: C.bg1, border: `2px dashed ${C.border}`, borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>💡</div>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, color: C.fg1, marginBottom: 8 }}>No ideas yet</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.fg3, marginBottom: 20 }}>Capture your first venture idea to get started.</div>
          <button style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, padding: '10px 22px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = C.accentDim}
            onMouseLeave={e => e.currentTarget.style.background = C.accent}
            onClick={() => onNavigate('new-idea')}>+ New Idea</button>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: C.fg3, marginTop: 40, textAlign: 'center' }}>
          {search ? `No ideas matching "${search}"` : `No ideas with status "${FILTERS.find(f => f.id === filter)?.label ?? filter}".`}
        </div>
      ) : (
        <div className="grid-2">
          {filtered.map(i => <IdeaCard key={i.id} {...i} onClick={() => onNavigate('idea-detail', i)} />)}
        </div>
      )}
      </div>
    </div>
  );
}
