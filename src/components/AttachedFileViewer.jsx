import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { C, alpha } from '../tokens';
import { fmtSize } from '../utils/fileStorage';

export default function AttachedFileViewer({ file, onReplace, onRemove, editing }) {
  const [viewing, setViewing] = useState(false);

  useEffect(() => {
    if (!viewing) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prevOverflow; };
  }, [viewing]);

  if (!file) return null;

  const isPdf = file.type === 'PDF';
  const url   = file.url;

  const handleView = () => {
    if (isPdf && url) { setViewing(true); return; }
    if (url) window.open(url, '_blank');
  };

  const handleDownload = () => {
    if (!url) return;
    const a    = document.createElement('a');
    a.href     = url;
    a.download = file.name || `file.${(file.type || 'pdf').toLowerCase()}`;
    a.target   = '_blank';
    a.click();
  };

  return (
    <>
      <div className="attached-file-card" style={{ padding: '13px 16px', borderRadius: 8, background: C.accentBg, border: `1px solid ${alpha(C.accent, 44)}` }}>
        <div className="attached-file-top">
          <svg viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" width="20" height="20" style={{ flexShrink: 0 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
          </svg>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: C.fg1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {file.name || file.fileName || 'Attached file'}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: C.fg3, marginTop: 2 }}>
              {[file.type, file.size && fmtSize(file.size), file.uploadedAt].filter(Boolean).join(' · ')}
            </div>
          </div>
        </div>

        <div className="attached-file-btns">
          {url && (
            <>
              <button onClick={handleView}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.accent, background: 'none', border: `1px solid ${alpha(C.accent, 44)}`, borderRadius: 5, padding: '6px 10px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {isPdf ? 'View' : 'Open'}
              </button>
              <button onClick={handleDownload}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2, background: 'none', border: `1px solid ${C.border}`, borderRadius: 5, padding: '6px 10px', cursor: 'pointer' }}>
                ↓ Download
              </button>
            </>
          )}
          {editing && (
            <>
              <button onClick={onReplace}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2, background: 'none', border: `1px solid ${C.border}`, borderRadius: 5, padding: '6px 10px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Replace
              </button>
              <button onClick={onRemove}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.danger, background: 'none', border: `1px solid ${alpha(C.danger, 33)}`, borderRadius: 5, padding: '6px 10px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Remove
              </button>
            </>
          )}
        </div>
      </div>

      {/* Full-screen PDF overlay — portal to body so it escapes any
          transformed ancestor (.page-pad uses transform in its pageIn
          animation, which would otherwise constrain position:fixed) */}
      {viewing && url && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', flexDirection: 'column', background: '#1a1510' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', background: '#221c12', borderBottom: '1px solid rgba(255,255,255,0.10)', flexShrink: 0 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" width="18" height="18">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
            </svg>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: '#f5e6c8', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {file.name || file.fileName}
            </span>
            <button onClick={handleDownload}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.accent, background: 'none', border: `1px solid ${alpha(C.accent, 44)}`, borderRadius: 5, padding: '5px 12px', cursor: 'pointer' }}>
              ↓ Download
            </button>
            <button onClick={() => setViewing(false)}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#aaa', background: 'none', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 5, padding: '5px 12px', cursor: 'pointer' }}>
              ✕ Close
            </button>
          </div>
          <iframe src={url} title={file.name || 'PDF'} style={{ flex: 1, border: 'none', width: '100%', minHeight: 0 }} />
        </div>,
        document.body
      )}
    </>
  );
}
