import { C, alpha } from '../../tokens';
import ClipTypeBadge from './ClipTypeBadge';
import Tag from '../../components/Tag';

export default function ClipRow({ clip, onOpen }) {
  const tags = Array.isArray(clip.tags) ? clip.tags : [];
  const isQuote = clip.type === 'quote';
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      {/* Timeline marker */}
      <span aria-hidden="true" style={{ width: 11, height: 11, borderRadius: '50%', border: `2px solid ${C.accent}`, background: C.bg0, flexShrink: 0, marginTop: 20 }} />
      <button onClick={() => onOpen(clip)}
        style={{ flex: 1, textAlign: 'left', background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 18px', cursor: 'pointer', fontFamily: 'inherit', minWidth: 0, transition: 'border-color 140ms' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = alpha(C.accent, 44); }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.accent }}>{clip.date}</span>
          <span style={{ color: C.fg3 }}>·</span>
          <ClipTypeBadge type={clip.type} />
          {clip.sourceLabel && (
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontStyle: 'italic', color: C.fg3 }}>· {clip.sourceLabel}</span>
          )}
        </div>
        <div style={{ fontFamily: "'Inter', Georgia, serif", fontSize: isQuote ? 19 : 18, fontStyle: isQuote ? 'italic' : 'normal', fontWeight: 600, color: C.fg1, lineHeight: 1.3, marginBottom: clip.description ? 6 : 0 }}>
          {isQuote ? `"${clip.quoteText || clip.title || ''}"` : (clip.title || 'Untitled')}
        </div>
        {clip.description && (
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2, lineHeight: 1.55 }}>{clip.description}</div>
        )}
        {tags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            {tags.map((t, i) => <Tag key={i} label={t} />)}
          </div>
        )}
      </button>
    </div>
  );
}
