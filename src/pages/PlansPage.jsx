import { useState } from 'react';
import { C } from '../tokens';
import { useAppData } from '../context/AppContext';
import Badge from '../components/Badge';

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
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg3, marginBottom: 8 }}>Updated {plan.updated} · {plan.sectionCount} sections</div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg2, lineHeight: 1.55 }}>{plan.summary}</div>
    </div>
  );
}

export default function PlansPage({ onNavigate }) {
  const { plans } = useAppData();
  return (
    <div className="page-pad" style={{ background: C.bg0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 700, color: C.fg1, letterSpacing: '-0.02em' }}>Business Plans</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, marginTop: 4 }}>{plans.length} plans · long-form documents</div>
        </div>
        <button style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '8px 16px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.background = C.accentDim}
          onMouseLeave={e => e.currentTarget.style.background = C.accent}
          onClick={() => onNavigate('new-plan')}>+ New Plan</button>
      </div>
      {plans.length === 0 ? (
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3, marginTop: 40, textAlign: 'center' }}>No plans yet. Create your first business plan.</div>
      ) : (
        plans.map(p => <PlanCard key={p.id} plan={p} onNavigate={onNavigate} />)
      )}
    </div>
  );
}
