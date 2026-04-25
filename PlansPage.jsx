// PlansPage.jsx — Business Plans listing + detail
const PlansPage = ({ onNavigate }) => {
  const plans = [
    { id: 1, title: 'Freelance Invoice Tool — Business Plan', updated: 'Mar 30, 2026', sections: 6, status: 'active', summary: 'Micro-SaaS targeting freelancers and solopreneurs. Stripe-integrated invoicing with client portal. Revenue model: $9/mo subscription.' },
    { id: 2, title: 'AI Meal Planner — Draft Plan', updated: 'Apr 20, 2026', sections: 3, status: 'draft', summary: 'Early-stage ideation. Target market: health-conscious adults aged 28–45. Monetization TBD — subscription or freemium.' },
  ];

  const s = {
    wrap: { flex: 1, overflowY: 'auto', padding: '32px 36px', background: '#0D0C0A' },
    title: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 600, color: '#F2EDE0', letterSpacing: '-0.02em', marginBottom: 6 },
    card: {
      background: '#18160F', border: '1px solid #2E2B23', borderRadius: 8,
      padding: '20px 22px', marginBottom: 12, cursor: 'pointer',
      transition: 'border-color 150ms, box-shadow 150ms',
    },
    planTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, fontWeight: 500, color: '#F2EDE0', marginBottom: 6 },
    meta: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#6A6055', marginBottom: 10 },
    summary: { fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#A39888', lineHeight: 1.55 },
  };

  const PlanCard = ({ plan }) => {
    const [hov, setHov] = React.useState(false);
    return (
      <div style={{ ...s.card, borderColor: hov ? '#3E3A30' : '#2E2B23', boxShadow: hov ? '0 4px 16px rgba(0,0,0,0.45)' : '0 1px 3px rgba(0,0,0,0.5)' }}
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        onClick={() => onNavigate('plan-detail', plan)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={s.planTitle}>{plan.title}</div>
          <Badge status={plan.status} />
        </div>
        <div style={s.meta}>Updated {plan.updated} · {plan.sections} sections</div>
        <div style={s.summary}>{plan.summary}</div>
      </div>
    );
  };

  return (
    <div style={s.wrap}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <div style={s.title}>Business Plans</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#6A6055' }}>{plans.length} plans · long-form documents</div>
        </div>
        <button style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '8px 16px', borderRadius: 6, background: '#D4A853', color: '#0D0C0A', border: 'none', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.background = '#E8C47A'}
          onMouseLeave={e => e.currentTarget.style.background = '#D4A853'}>
          + New Plan
        </button>
      </div>
      {plans.map(p => <PlanCard key={p.id} plan={p} />)}
    </div>
  );
};

// Plan detail — reading view
const PlanDetailPage = ({ plan, onNavigate }) => {
  const sections = [
    { title: 'Executive Summary', content: 'A simple, powerful invoicing tool for freelancers. Generate professional invoices, accept Stripe payments, and track outstanding balances — all in one place. Target MRR: $10K within 12 months of full launch.' },
    { title: 'Problem & Market', content: 'Freelancers spend ~3 hours/month on invoicing using Google Docs or generic tools. 59M Americans freelance; 28% earn over $75K/year. No tool nails the UX for solo operators.' },
    { title: 'Solution', content: 'A focused web app: create invoice in 60 seconds, send via email, accept card payment via Stripe. No bloat. Mobile-friendly. Client portal for payment status.' },
    { title: 'Revenue Model', content: '$9/month subscription. Free tier: 3 invoices/month. Paid: unlimited. Annual plan at $80/year. Target: 1,200 paying users by end of 2026.' },
  ];

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 48px', background: '#0D0C0A', maxWidth: 760 }}>
      <button onClick={() => onNavigate('plans')} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#6A6055', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Business Plans
      </button>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#6A6055', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Business Plan</div>
      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 32, fontWeight: 600, color: '#F2EDE0', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 8 }}>
        {plan ? plan.title : 'Freelance Invoice Tool — Business Plan'}
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#6A6055', marginBottom: 32 }}>
        Updated Mar 30, 2026 · 6 sections · <span style={{ color: '#6BAF8A' }}>Active</span>
      </div>
      {sections.map((sec, i) => (
        <div key={i} style={{ marginBottom: 32, paddingBottom: 32, borderBottom: i < sections.length - 1 ? '1px solid #2E2B23' : 'none' }}>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 500, color: '#F2EDE0', marginBottom: 12 }}>{sec.title}</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#A39888', lineHeight: 1.7 }}>{sec.content}</div>
        </div>
      ))}
    </div>
  );
};

Object.assign(window, { PlansPage, PlanDetailPage });
