import { useState } from 'react';
import { C, alpha } from '../tokens';
import { useAppData } from '../context/AppContext';
import Badge from '../components/Badge';

const FILTERS = ['all', 'draft', 'active'];

function PlanCard({ plan, onNavigate }) {
  const [hov, setHov] = useState(false);
  return (
    <div style={{ background: C.bg1, border: `1px solid ${hov ? C.borderLight : C.border}`, borderRadius: 8, padding: '20px 22px', marginBottom: 12, cursor: 'pointer', boxShadow: hov ? '0 4px 16px rgba(60,40,10,0.12)' : '0 1px 3px rgba(60,40,10,0.08)', transition: 'all 150ms' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onClick={() => onNavigate('plan-detail', plan)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, gap: 12 }}>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 17, fontWeight: 500, color: C.fg1 }}>{plan.title}</div>
        <Badge status={plan.status} />
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg3, marginBottom: plan.summary ? 8 : 0 }}>Updated {plan.updated} · {plan.sectionCount} sections</div>
      {plan.summary && (
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg2, lineHeight: 1.55, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
          {plan.summary}
        </div>
      )}
    </div>
  );
}

export default function PlansPage({ onNavigate }) {
  const { plans } = useAppData();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = plans
    .filter(p => filter === 'all' || p.status === filter)
    .filter(p => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return p.title.toLowerCase().includes(q) || (p.summary || '').toLowerCase().includes(q);
    });

  return (
    <div className="page-pad" style={{ background: C.bg0 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 700, color: C.fg1, letterSpacing: '-0.02em' }}>Business Plans</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, marginTop: 4 }}>
            {search || filter !== 'all' ? `${filtered.length} of ${plans.length} plans` : `${plans.length} plans`}
          </div>
        </div>
        <button style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '8px 16px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.background = C.accentDim}
          onMouseLeave={e => e.currentTarget.style.background = C.accent}
          onClick={() => onNavigate('new-plan')}>+ New Plan</button>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} viewBox="0 0 24 24" fill="none" stroke={C.fg3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search plans…"
            style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6, color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: '8px 12px 8px 32px', outline: 'none', width: '100%', transition: 'border 150ms' }}
            onFocus={e => { e.target.style.borderColor = C.accentDim; e.target.style.boxShadow = `0 0 0 2px ${alpha(C.accentDim, 33)}`; }}
            onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }} />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.fg3, fontSize: 16, lineHeight: 1 }}>×</button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, padding: '5px 12px', borderRadius: 999, border: `1px solid ${filter === f ? alpha(C.accent, 33) : C.border}`, background: filter === f ? C.accentBg : 'transparent', color: filter === f ? C.accent : C.fg3, cursor: 'pointer', fontWeight: filter === f ? 500 : 400 }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3, marginTop: 40, textAlign: 'center' }}>
          {search ? `No plans matching "${search}"` : plans.length === 0 ? 'No plans yet. Create your first business plan.' : `No ${filter} plans.`}
        </div>
      ) : (
        filtered.map(p => <PlanCard key={p.id} plan={p} onNavigate={onNavigate} />)
      )}
      </div>
    </div>
  );
}
