export default function Badge({ status }) {
  // Each status family carries a distinct GLYPH as well as a colour, so
  // state is never conveyed by colour alone (WCAG 1.4.1 — colourblind
  // users see ● ✓ ◆ ▸ ‖ ○ ▲ ■ shapes even when the hues read alike).
  const configs = {
    active:        { label: 'Active',       glyph: '●', bg: '#D1FAE5', color: '#065F46', border: '#065F4655' },
    completed:     { label: 'Completed',    glyph: '✓', bg: '#CFFAFE', color: '#155E75', border: '#155E7555' },
    'in-review':   { label: 'In Review',    glyph: '◆', bg: '#EDE9FE', color: '#5B21B6', border: '#5B21B655' },
    progress:      { label: 'In Progress',  glyph: '▸', bg: '#FFEDD5', color: '#9A3412', border: '#9A341255' },
    'in-progress': { label: 'In Progress',  glyph: '▸', bg: '#FFEDD5', color: '#9A3412', border: '#9A341255' },
    stalled:       { label: 'Stalled',      glyph: '‖', bg: '#FEE2E2', color: '#991B1B', border: '#991B1B55' },
    paused:        { label: 'Paused',       glyph: '‖', bg: '#FEE2E2', color: '#991B1B', border: '#991B1B55' },
    draft:         { label: 'Draft',        glyph: '○', bg: '#DBEAFE', color: '#1E40AF', border: '#1E40AF55' },
    new:           { label: 'New',          glyph: '○', bg: '#DBEAFE', color: '#1E40AF', border: '#1E40AF55' },
    validating:    { label: 'Validating',   glyph: '▲', bg: '#FEF9C3', color: '#854D0E', border: '#854D0E55' },
    researching:   { label: 'Researching',  glyph: '▲', bg: '#FEF9C3', color: '#854D0E', border: '#854D0E55' },
    planning:      { label: 'Planning',     glyph: '◆', bg: '#EDE9FE', color: '#5B21B6', border: '#5B21B655' },
    archived:      { label: 'Archived',     glyph: '■', bg: '#F3F4F6', color: '#4B5563', border: '#4B556355' },
  };
  const c = configs[status] || configs.draft;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: 4, background: c.bg, color: c.color, border: `1px solid ${c.border}`, flexShrink: 0 }}>
      <span aria-hidden="true" style={{ fontSize: 9, lineHeight: 1, display: 'inline-block' }}>{c.glyph}</span>
      {c.label}
    </span>
  );
}
