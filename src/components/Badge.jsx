export default function Badge({ status }) {
  const configs = {
    active:        { label: 'Active',       bg: '#EAF5EE', color: '#2E7D52', border: '#2E7D5255' },
    completed:     { label: 'Completed',    bg: '#E8F4FF', color: '#1D5FA6', border: '#1D5FA655' },
    'in-review':   { label: 'In Review',    bg: '#F0EAF8', color: '#6B3FA6', border: '#6B3FA655' },
    progress:      { label: 'In Progress',  bg: '#FDF0E4', color: '#C4681C', border: '#C4681C55' },
    'in-progress': { label: 'In Progress',  bg: '#FDF0E4', color: '#C4681C', border: '#C4681C55' },
    stalled:       { label: 'Stalled',      bg: '#FAEAEA', color: '#B03030', border: '#B0303055' },
    paused:        { label: 'Paused',       bg: '#FAEAEA', color: '#B03030', border: '#B0303055' },
    draft:         { label: 'Draft',        bg: '#EAF0FA', color: '#2B5FA6', border: '#2B5FA655' },
    new:           { label: 'New',          bg: '#EAF0FA', color: '#2B5FA6', border: '#2B5FA655' },
    validating:    { label: 'Validating',   bg: '#FDF5E4', color: '#B8892A', border: '#B8892A55' },
    researching:   { label: 'Researching',  bg: '#FDF5E4', color: '#B8892A', border: '#B8892A55' },
    planning:      { label: 'Planning',     bg: '#F0EAF8', color: '#6B3FA6', border: '#6B3FA655' },
    archived:      { label: 'Archived',     bg: '#EDE8DE', color: '#9A8E80', border: '#9A8E8055' },
  };
  const c = configs[status] || configs.draft;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: 4, background: c.bg, color: c.color, border: `1px solid ${c.border}`, flexShrink: 0 }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.color, display: 'inline-block' }} />
      {c.label}
    </span>
  );
}
