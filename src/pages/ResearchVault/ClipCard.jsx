import { useState, useEffect } from 'react';
import { C, alpha } from '../../tokens';
import ClipTypeBadge from './ClipTypeBadge';
import Tag from '../../components/Tag';
import { getFileUrl } from '../../utils/fileStorage';

// Photo clips show a thumbnail. The download URL is resolved on demand and
// never persisted — the same rule the rest of the app follows for Storage
// blobs (see fileStorage.js getFileUrl).
function PhotoThumb({ blobId }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let alive = true;
    if (blobId) getFileUrl(blobId).then(u => { if (alive) setUrl(u); }).catch(() => {});
    return () => { alive = false; };
  }, [blobId]);
  return (
    <div style={{ height: 150, borderRadius: 6, marginBottom: 12, border: `1px solid ${C.border}`, background: url ? `center / cover no-repeat url("${url}")` : C.bg2 }} />
  );
}

export default function ClipCard({ clip, onOpen }) {
  const tags = Array.isArray(clip.tags) ? clip.tags : [];
  const isQuote = clip.type === 'quote';
  return (
    <button onClick={() => onOpen(clip)}
      style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 10, padding: 18, cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color 140ms' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = alpha(C.accent, 44); }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <ClipTypeBadge type={clip.type} />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg3 }}>{clip.date}</span>
      </div>

      {clip.type === 'photo' && clip.photo?.blobId && <PhotoThumb blobId={clip.photo.blobId} />}

      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: isQuote ? 18 : 17, fontStyle: isQuote ? 'italic' : 'normal', fontWeight: 600, color: C.fg1, lineHeight: 1.3, marginBottom: 8 }}>
        {isQuote ? `"${clip.quoteText || clip.title || ''}"` : (clip.title || 'Untitled')}
      </div>

      {clip.description && (
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2, lineHeight: 1.55, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {clip.description}
        </div>
      )}

      <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: `1px dashed ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontStyle: 'italic', color: C.fg3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {clip.sourceLabel || (clip.type === 'web' ? clip.url : '')}
        </span>
        {tags.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            {tags.slice(0, 2).map((t, i) => <Tag key={i} label={t} />)}
          </div>
        )}
      </div>
    </button>
  );
}
