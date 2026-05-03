import { useState, useMemo } from 'react';
import { C, alpha } from '../tokens';
import { usePlans } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import Badge from '../components/Badge';
import QuickEditForm from '../components/QuickEditForm';
import SavedViewsBar from '../components/SavedViewsBar';
import ComparePanel from '../components/ComparePanel';
import { CATEGORIES } from '../utils/categoryStyles';

const FILTERS = [
  { id: 'all',       label: 'All' },
  { id: 'draft',     label: 'Draft' },
  { id: 'active',    label: 'Active' },
  { id: 'in-review', label: 'In Review' },
  { id: 'completed', label: 'Completed' },
  { id: 'archived',  label: 'Archived' },
];

const STATUS_CHIP_COLORS = {
  all:          { color: C.accent,   bg: C.accentBg,  border: alpha(C.accent, 55) },
  draft:        { color: '#1E40AF',  bg: '#DBEAFE',   border: '#1E40AF55' },
  active:       { color: '#065F46',  bg: '#D1FAE5',   border: '#065F4655' },
  'in-review':  { color: '#5B21B6',  bg: '#EDE9FE',   border: '#5B21B655' },
  completed:    { color: '#155E75',  bg: '#CFFAFE',   border: '#155E7555' },
  archived:     { color: '#4B5563',  bg: '#F3F4F6',   border: '#4B556355' },
};

const PLAN_STATUSES = [
  { id: 'draft',     label: 'Draft' },
  { id: 'active',    label: 'Active' },
  { id: 'in-review', label: 'In Review' },
  { id: 'completed', label: 'Completed' },
  { id: 'archived',  label: 'Archived' },
];

const PLAN_CATEGORY_OPTIONS = CATEGORIES.filter(c => c !== 'All');

const isStateEqual = (a, b) =>
  (a?.search ?? '') === (b?.search ?? '') &&
  (a?.filter ?? 'all') === (b?.filter ?? 'all') &&
  (a?.catFilter ?? 'All') === (b?.catFilter ?? 'All') &&
  (a?.sort ?? 'newest') === (b?.sort ?? 'newest');

function PlanCard({ plan, onNavigate, editing, onStartEdit, onCancelEdit, onSaveEdit }) {
  if (editing) {
    return (
      <div className="card-rich plan-card"
        style={{ background: C.bg1, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.accent}`, borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', padding: 16 }}>
        <QuickEditForm
          initialTitle={plan.title} initialStatus={plan.status} initialCategory={plan.category}
          statuses={PLAN_STATUSES}
          categories={PLAN_CATEGORY_OPTIONS}
          onSave={onSaveEdit}
          onCancel={onCancelEdit} />
      </div>
    );
  }
  return (
    <div className="card-rich plan-card"
      style={{ background: C.bg1, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.accent}`, borderRadius: 10, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column' }}
      onClick={() => onNavigate('project-detail', plan)}>
      <div className="plan-card-head">
        <div className="plan-card-title" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: C.fg1 }}>{plan.title}</div>
        <div className="plan-card-tags">
          {plan.category && (
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.fg2, background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 5, padding: '2px 8px' }}>
              {plan.category}
            </span>
          )}
          <Badge status={plan.status} />
          <button
            type="button"
            aria-label={`Quick edit ${plan.title}`}
            title="Quick edit"
            onClick={e => { e.stopPropagation(); onStartEdit?.(); }}
            style={{
              width: 28, height: 28, borderRadius: 6, border: 'none',
              background: 'transparent', color: C.fg3, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = C.bg2; e.currentTarget.style.color = C.accent; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.fg3; }}>
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        </div>
      </div>
      <div className="plan-card-meta">
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: C.fg3 }}>Updated {plan.updated}</span>
        {plan.attachedFile && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.accent, background: C.accentBg, border: `1px solid ${alpha(C.accent, 33)}`, borderRadius: 5, padding: '1px 8px', fontWeight: 500 }}>
            <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="11" height="11"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
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
  const { plans, updatePlan } = usePlans();
  const { showToast } = useToast();
  const [filter, setFilter]     = useState('all');
  const [catFilter, setCatFilter] = useState('All');
  const [search, setSearch]     = useState('');
  const [sort,   setSort]       = useState('newest');
  const [editingId, setEditingId] = useState(null);
  const [compareOpen, setCompareOpen] = useState(false);

  const sq = search.trim().toLowerCase();
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

  const currentState = { search, filter, catFilter, sort };
  const applyView = (v) => {
    setSearch(v.search ?? '');
    setFilter(v.filter ?? 'all');
    setCatFilter(v.catFilter ?? 'All');
    setSort(v.sort ?? 'newest');
  };

  const handleQuickSave = async (id, patch) => {
    await updatePlan(id, patch);
    setEditingId(null);
    showToast('Plan updated', 'success');
  };

  return (
    <div className="page-pad" style={{ background: C.bg0, minHeight: 'calc(100vh - 64px)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
      <div className="plans-page-header">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', minWidth: 0 }}>
          <div className="grad-text page-title">Projects</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: C.fg3, background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 5, padding: '1px 8px', whiteSpace: 'nowrap' }}>
            {search || filter !== 'all' || catFilter !== 'All' ? `${filtered.length} / ${plans.length}` : plans.length}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
          <button onClick={() => setCompareOpen(true)}
            disabled={plans.length < 2}
            style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500,
              padding: '8px 14px', borderRadius: 8,
              background: 'transparent', color: plans.length < 2 ? C.fg3 : C.fg2,
              border: `1px solid ${C.border}`,
              cursor: plans.length < 2 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
            }}
            title={plans.length < 2 ? 'Need at least 2 projects' : 'Compare projects side by side'}>
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
              <rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="18" rx="1"/>
            </svg>
            Compare
          </button>
          <button className="plans-new-btn"
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, padding: '8px 18px', borderRadius: 8, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}
            onMouseEnter={e => e.currentTarget.style.background = C.accentDim}
            onMouseLeave={e => e.currentTarget.style.background = C.accent}
            onClick={() => onNavigate('new-project')}
            aria-label="New project">
            <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span className="plans-new-btn-label">New Project</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <svg aria-hidden="true" focusable="false" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} viewBox="0 0 24 24" fill="none" stroke={C.fg3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by title or summary…"
          aria-label="Search projects"
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
            {FILTERS.map(f => {
              const sc = STATUS_CHIP_COLORS[f.id] || STATUS_CHIP_COLORS.draft;
              const active = filter === f.id;
              return (
                <button key={f.id} onClick={() => setFilter(f.id)}
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: '5px 14px', borderRadius: 999, border: `1.5px solid ${active ? sc.border : C.border}`, background: active ? sc.bg : 'transparent', color: sc.color, cursor: 'pointer', fontWeight: active ? 600 : 400, flexShrink: 0, transition: 'all 120ms' }}>
                  {f.label}
                </button>
              );
            })}
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
      <div className="chip-scroll-wrap" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', flexWrap: 'nowrap', WebkitOverflowScrolling: 'touch', paddingBottom: 2 }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: '5px 14px', borderRadius: 999, border: `1.5px solid ${catFilter === c ? C.accent : C.border}`, background: 'transparent', color: catFilter === c ? C.accent : C.fg2, cursor: 'pointer', fontWeight: catFilter === c ? 600 : 400, flexShrink: 0, transition: 'all 120ms' }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <SavedViewsBar scope="plans"
        currentState={currentState}
        onApply={applyView}
        isStateEqual={isStateEqual} />

      {/* Empty states */}
      {plans.length === 0 ? (
        <div style={{ background: C.bg1, border: `2px dashed ${C.border}`, borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>📋</div>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, color: C.fg1, marginBottom: 8 }}>No projects yet</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.fg3, marginBottom: 20 }}>Create your first project to get started.</div>
          <button style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, padding: '10px 22px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = C.accentDim}
            onMouseLeave={e => e.currentTarget.style.background = C.accent}
            onClick={() => onNavigate('new-project')}>+ Create Project</button>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: C.fg3, marginTop: 40, textAlign: 'center' }}>
          {search ? `No projects matching "${search}"` : `No projects with status "${filter}".`}
        </div>
      ) : (
        <div className="grid-2">
          {filtered.map(p => (
            <PlanCard key={p.id} plan={p} onNavigate={onNavigate}
              editing={editingId === p.id}
              onStartEdit={() => setEditingId(p.id)}
              onCancelEdit={() => setEditingId(null)}
              onSaveEdit={(patch) => handleQuickSave(p.id, patch)} />
          ))}
        </div>
      )}
      </div>

      <ComparePanel open={compareOpen}
        onClose={() => setCompareOpen(false)}
        items={plans} kind="plan"
        onOpen={(it) => onNavigate('project-detail', it)} />
    </div>
  );
}
