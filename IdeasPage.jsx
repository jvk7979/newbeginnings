// IdeasPage.jsx — Ideas listing + detail view
const IdeasPage = ({ onNavigate }) => {
  const [filter, setFilter] = React.useState('all');
  const ideas = [
    { id: 1, title: 'AI-Powered Meal Planner', status: 'draft', date: 'Apr 25, 2026', tags: ['SaaS', 'B2C', 'Early Stage'], desc: 'Personalized weekly meal plans from pantry inventory and dietary goals. Integrates with grocery delivery APIs.' },
    { id: 2, title: 'Freelance Contract Generator', status: 'validating', date: 'Mar 18, 2026', tags: ['B2B', 'Legal-Tech'], desc: 'Auto-generate client contracts from a simple form. Export to PDF. Stripe payment for templates.' },
    { id: 3, title: 'Local Event Newsletter', status: 'archived', date: 'Jan 5, 2026', tags: ['Media', 'Newsletter'], desc: 'Curated weekly digest of local events via email. Abandoned — market too fragmented.' },
    { id: 4, title: 'Remote Team Standup Bot', status: 'validating', date: 'Apr 10, 2026', tags: ['SaaS', 'B2B', 'Productivity'], desc: 'Slack bot that collects daily standups, summarizes blockers, and sends digests to team leads.' },
    { id: 5, title: 'Micro-SaaS Idea Tracker', status: 'draft', date: 'Apr 22, 2026', tags: ['Meta', 'Personal'], desc: 'Track all my SaaS ideas, notes, and validation status. Basically this app.' },
  ];

  const filters = ['all', 'draft', 'validating', 'active', 'archived'];
  const filtered = filter === 'all' ? ideas : ideas.filter(i => i.status === filter);

  const s = {
    wrap: { flex: 1, overflowY: 'auto', padding: '32px 36px', background: '#0D0C0A' },
    topbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 },
    title: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 600, color: '#F2EDE0', letterSpacing: '-0.02em' },
    filterRow: { display: 'flex', gap: 6, marginBottom: 20 },
    filterBtn: (active) => ({
      fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: active ? 500 : 400,
      padding: '5px 12px', borderRadius: 999, border: `1px solid ${active ? '#D4A85333' : '#2E2B23'}`,
      background: active ? '#1E1A0F' : 'transparent', color: active ? '#D4A853' : '#6A6055',
      cursor: 'pointer', transition: 'all 120ms',
    }),
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
    btn: {
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
      padding: '8px 16px', borderRadius: 6, border: 'none',
      background: '#D4A853', color: '#0D0C0A', cursor: 'pointer',
    },
  };

  return (
    <div style={s.wrap}>
      <div style={s.topbar}>
        <div>
          <div style={s.title}>Ideas</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#6A6055', marginTop: 4 }}>{ideas.length} ideas tracked</div>
        </div>
        <button style={s.btn}
          onMouseEnter={e => e.currentTarget.style.background = '#E8C47A'}
          onMouseLeave={e => e.currentTarget.style.background = '#D4A853'}
          onClick={() => onNavigate('new-idea')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Idea
        </button>
      </div>
      <div style={s.filterRow}>
        {filters.map(f => (
          <button key={f} style={s.filterBtn(filter === f)} onClick={() => setFilter(f)}
            onMouseEnter={e => { if (filter !== f) e.currentTarget.style.color = '#A39888'; }}
            onMouseLeave={e => { if (filter !== f) e.currentTarget.style.color = '#6A6055'; }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      <div style={s.grid}>
        {filtered.map(i => <IdeaCard key={i.id} {...i} onClick={() => onNavigate('idea-detail', i)} />)}
      </div>
    </div>
  );
};

// New Idea form
const NewIdeaPage = ({ onNavigate }) => {
  const [form, setForm] = React.useState({ title: '', status: 'draft', tags: '', desc: '' });
  const inputStyle = {
    background: '#18160F', border: '1px solid #2E2B23', borderRadius: 6,
    color: '#F2EDE0', fontFamily: "'DM Sans', sans-serif", fontSize: 14,
    padding: '9px 12px', outline: 'none', width: '100%', transition: 'border 150ms, box-shadow 150ms',
  };
  const labelStyle = { fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, color: '#A39888', marginBottom: 5, display: 'block' };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 36px', background: '#0D0C0A' }}>
      <button onClick={() => onNavigate('ideas')} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#6A6055', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Back to Ideas
      </button>
      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 600, color: '#F2EDE0', letterSpacing: '-0.02em', marginBottom: 28 }}>Capture New Idea</div>
      <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <label style={labelStyle}>Idea Title *</label>
          <input style={inputStyle} value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="What's the idea?"
            onFocus={e => { e.target.style.borderColor = '#9A7530'; e.target.style.boxShadow = '0 0 0 1px #9A7530, 0 4px 16px rgba(212,168,83,0.12)'; }}
            onBlur={e => { e.target.style.borderColor = '#2E2B23'; e.target.style.boxShadow = 'none'; }} />
        </div>
        <div>
          <label style={labelStyle}>Stage</label>
          <select style={{...inputStyle, appearance: 'none'}} value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
            <option value="draft">Draft</option>
            <option value="validating">Validating</option>
            <option value="active">Active</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Tags (comma separated)</label>
          <input style={inputStyle} value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} placeholder="SaaS, B2B, Fintech…"
            onFocus={e => { e.target.style.borderColor = '#9A7530'; e.target.style.boxShadow = '0 0 0 1px #9A7530, 0 4px 16px rgba(212,168,83,0.12)'; }}
            onBlur={e => { e.target.style.borderColor = '#2E2B23'; e.target.style.boxShadow = 'none'; }} />
        </div>
        <div>
          <label style={labelStyle}>Description</label>
          <textarea style={{...inputStyle, resize: 'vertical', minHeight: 100, lineHeight: 1.55}}
            value={form.desc} onChange={e => setForm({...form, desc: e.target.value})}
            placeholder="Describe the problem you're solving, target customer, rough mechanics…"
            onFocus={e => { e.target.style.borderColor = '#9A7530'; e.target.style.boxShadow = '0 0 0 1px #9A7530, 0 4px 16px rgba(212,168,83,0.12)'; }}
            onBlur={e => { e.target.style.borderColor = '#2E2B23'; e.target.style.boxShadow = 'none'; }} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '9px 20px', borderRadius: 6, background: '#D4A853', color: '#0D0C0A', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = '#E8C47A'}
            onMouseLeave={e => e.currentTarget.style.background = '#D4A853'}
            onClick={() => onNavigate('ideas')}>
            Save Idea
          </button>
          <button style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: '9px 20px', borderRadius: 6, background: 'transparent', color: '#6A6055', border: '1px solid #2E2B23', cursor: 'pointer' }}
            onClick={() => onNavigate('ideas')}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { IdeasPage, NewIdeaPage });
