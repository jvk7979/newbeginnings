// Shared data store — single source of truth for all pages
window.AppData = {
  ideas: [
    { id: 1, title: 'AI-Powered Meal Planner', status: 'draft', date: 'Apr 25, 2026', tags: ['SaaS', 'B2C', 'Early Stage'], desc: 'Personalized weekly meal plans from pantry inventory and dietary goals. Integrates with grocery delivery APIs.' },
    { id: 2, title: 'Freelance Contract Generator', status: 'validating', date: 'Mar 18, 2026', tags: ['B2B', 'Legal-Tech'], desc: 'Auto-generate client contracts from a simple form. Export to PDF. Stripe payment for templates.' },
    { id: 3, title: 'Local Event Newsletter', status: 'archived', date: 'Jan 5, 2026', tags: ['Media', 'Newsletter'], desc: 'Curated weekly digest of local events via email. Abandoned — market too fragmented.' },
    { id: 4, title: 'Remote Team Standup Bot', status: 'validating', date: 'Apr 10, 2026', tags: ['SaaS', 'B2B', 'Productivity'], desc: 'Slack bot that collects daily standups, summarizes blockers, and sends digests to team leads.' },
    { id: 5, title: 'Micro-SaaS Idea Tracker', status: 'draft', date: 'Apr 22, 2026', tags: ['Meta', 'Personal'], desc: 'Track all my SaaS ideas, notes, and validation status. Basically this app.' },
  ],

  projects: [
    { id: 1, title: 'Freelance Invoice Tool', status: 'active', date: 'Updated Mar 12, 2026', desc: 'MVP shipped Feb 2026. Stripe-integrated. 47 paying users.', kpis: [{ value: '$3.2K', label: 'MRR' }, { value: '47', label: 'Users' }, { value: '↑ 18%', label: 'Growth' }] },
    { id: 2, title: 'Portfolio Site Redesign', status: 'progress', date: 'Updated Apr 20, 2026', desc: 'Redesigning personal site with Astro. New case studies section in progress.', kpis: null },
  ],

  plans: [
    {
      id: 1,
      title: 'Freelance Invoice Tool — Business Plan',
      updated: 'Mar 30, 2026',
      sections: [
        { title: 'Executive Summary', content: 'A simple, powerful invoicing tool for freelancers. Generate professional invoices, accept Stripe payments, and track outstanding balances — all in one place. Target MRR: $10K within 12 months of full launch.' },
        { title: 'Problem & Market', content: 'Freelancers spend ~3 hours/month on invoicing using Google Docs or generic tools. 59M Americans freelance; 28% earn over $75K/year. No tool nails the UX for solo operators.' },
        { title: 'Solution', content: 'A focused web app: create invoice in 60 seconds, send via email, accept card payment via Stripe. No bloat. Mobile-friendly. Client portal for payment status.' },
        { title: 'Revenue Model', content: '$9/month subscription. Free tier: 3 invoices/month. Paid: unlimited. Annual plan at $80/year. Target: 1,200 paying users by end of 2026.' },
        { title: 'Go-to-Market', content: 'Cold outreach to freelancer communities on Reddit, Twitter/X, and IndieHackers. Content marketing via invoicing tips. Referral program at month 3.' },
        { title: 'Financials', content: 'Runway: 8 months bootstrapped. Breakeven at 190 paying users (~month 5). Year 1 target: $108K ARR.' },
      ],
      sectionCount: 6,
      status: 'active',
      summary: 'Micro-SaaS targeting freelancers and solopreneurs. Stripe-integrated invoicing with client portal. Revenue model: $9/mo subscription.',
    },
    {
      id: 2,
      title: 'AI Meal Planner — Draft Plan',
      updated: 'Apr 20, 2026',
      sections: [
        { title: 'Executive Summary', content: 'An AI-powered meal planning app that generates personalized weekly menus from pantry inventory and dietary goals.' },
        { title: 'Problem & Market', content: 'People waste food and struggle to eat healthily. Health-conscious adults aged 28–45 are a growing segment willing to pay for convenience.' },
        { title: 'Monetization', content: 'TBD — evaluating subscription vs freemium + grocery affiliate revenue. Initial hypothesis: $7/mo subscription.' },
      ],
      sectionCount: 3,
      status: 'draft',
      summary: 'Early-stage ideation. Target market: health-conscious adults aged 28–45. Monetization TBD — subscription or freemium.',
    },
  ],

  addIdea(idea) {
    this.ideas.unshift({ ...idea, id: Date.now(), date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) });
  },
};
