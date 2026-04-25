// Shared UI primitives
const Badge = ({ status }) => {
  const configs = {
    active:     { label: 'Active',      bg: '#0F1A14', color: '#6BAF8A', border: '#6BAF8A33' },
    progress:   { label: 'In Progress', bg: '#1A1208', color: '#E8924A', border: '#E8924A33' },
    stalled:    { label: 'Stalled',     bg: '#1A0C0C', color: '#C45E5E', border: '#C45E5E33' },
    draft:      { label: 'Draft',       bg: '#0C1220', color: '#5B8FCC', border: '#5B8FCC33' },
    validating: { label: 'Validating',  bg: '#1E1A0F', color: '#D4A853', border: '#D4A85333' },
    archived:   { label: 'Archived',    bg: '#22201A', color: '#6A6055', border: '#2E2B23' },
  };
  const c = configs[status] || configs.draft;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      fontFamily: "'DM Sans', sans-serif", fontSize: '10px', fontWeight: 600,
      letterSpacing: '0.08em', textTransform: 'uppercase',
      padding: '2px 7px', borderRadius: '4px',
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.color, display: 'inline-block' }} />
      {c.label}
    </span>
  );
};

const Tag = ({ label, accent }) => (
  <span style={{
    fontFamily: "'DM Sans', sans-serif", fontSize: '11px',
    padding: '3px 9px', borderRadius: '999px',
    background: accent ? '#1E1A0F' : '#22201A',
    color: accent ? '#D4A853' : '#6A6055',
    border: `1px solid ${accent ? '#D4A85333' : '#2E2B23'}`,
  }}>{label}</span>
);

const IdeaCard = ({ title, date, tags, status, desc, onClick }) => {
  const [hov, setHov] = React.useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: '#18160F',
        border: `1px solid ${hov ? '#3E3A30' : '#2E2B23'}`,
        borderRadius: '8px', padding: '18px 20px',
        cursor: 'pointer',
        boxShadow: hov ? '0 4px 16px rgba(0,0,0,0.45)' : '0 1px 3px rgba(0,0,0,0.5)',
        transition: 'all 180ms cubic-bezier(0.16,1,0.3,1)',
      }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 16, fontWeight: 500, color: '#F2EDE0', lineHeight: 1.3, paddingRight: 8 }}>{title}</div>
        <Badge status={status} />
      </div>
      {desc && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#A39888', lineHeight: 1.5, marginBottom: 10 }}>{desc}</div>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {(tags || []).map(t => <Tag key={t} label={t} />)}
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#6A6055' }}>{date}</div>
    </div>
  );
};

const ProjectCard = ({ title, date, status, desc, kpis, onClick }) => {
  const [hov, setHov] = React.useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: '#18160F',
        border: `1px solid ${hov ? '#3E3A30' : '#2E2B23'}`,
        borderRadius: '8px', padding: '18px 20px',
        cursor: 'pointer',
        boxShadow: hov ? '0 4px 16px rgba(0,0,0,0.45)' : '0 1px 3px rgba(0,0,0,0.5)',
        transition: 'all 180ms cubic-bezier(0.16,1,0.3,1)',
      }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 16, fontWeight: 500, color: '#F2EDE0', lineHeight: 1.3 }}>{title}</div>
        <Badge status={status} />
      </div>
      {desc && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#A39888', lineHeight: 1.5, marginBottom: 12 }}>{desc}</div>}
      {kpis && (
        <div style={{ display: 'flex', gap: 16, borderTop: '1px solid #2E2B23', paddingTop: 12 }}>
          {kpis.map(k => (
            <div key={k.label}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 500, color: '#D4A853' }}>{k.value}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: '#6A6055', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>
      )}
      {date && !kpis && <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#6A6055', marginTop: 8 }}>{date}</div>}
    </div>
  );
};

Object.assign(window, { Badge, Tag, IdeaCard, ProjectCard });
