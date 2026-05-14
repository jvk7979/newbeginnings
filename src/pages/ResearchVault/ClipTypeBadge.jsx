import { C, alpha } from '../../tokens';

// The four research-clip kinds. `glyph` is a short inline mark shown in the
// badge — kept as a text glyph so no icon-system dependency is introduced.
export const CLIP_TYPES = {
  web:   { label: 'WEB',   glyph: '🔗' },
  pdf:   { label: 'PDF',   glyph: '📄' },
  quote: { label: 'QUOTE', glyph: '"' },
  photo: { label: 'PHOTO', glyph: '🖼' },
};

export const CLIP_TYPE_ORDER = ['web', 'pdf', 'quote', 'photo'];

export default function ClipTypeBadge({ type }) {
  const t = CLIP_TYPES[type] || CLIP_TYPES.web;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600,
      letterSpacing: '0.08em', color: C.accent,
      background: alpha(C.accent, 11), border: `1px solid ${alpha(C.accent, 33)}`,
      borderRadius: 4, padding: '2px 7px', flexShrink: 0,
    }}>
      <span aria-hidden="true">{t.glyph}</span>{t.label}
    </span>
  );
}
