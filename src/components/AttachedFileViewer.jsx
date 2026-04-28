import { useState, useEffect } from 'react';
import { C, alpha } from '../tokens';
import { loadFileFromDB, makeBlobUrl, mimeForType, fmtSize } from '../utils/fileStorage';

export default function AttachedFileViewer({ file, onReplace, onRemove, editing }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState('');
  const [viewing, setViewing] = useState(false);

  useEffect(() => {
    if (!file?.blobId) return;
    let revoked = false;
    setLoading(true);
    setErr('');
    loadFileFromDB(file.blobId).then(data => {
      if (!data) { setErr('File not found.'); setLoading(false); return; }
      const url = makeBlobUrl(data.data, data.mimeType);
      if (!revoked) { setBlobUrl(url); setLoading(false); }
    }).catch(() => { setErr('Failed to load file.'); setLoading(false); });
    return () => {
      revoked = true;
      setBlobUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
    };
  }, [file?.blobId]);

  if (!file) return null;

  const isPdf = file.type === 'PDF';

  const handleView = () => {
    if (isPdf && blobUrl) { setViewing(true); return; }
    if (file.url) window.open(file.url, '_blank');
  };

  const handleDownload = () => {
    const url = blobUrl || file.url;
    if (!url) return;
    const a    = document.createElement('a');
    a.href     = url;
    a.download = file.name || `file.${(file.type || 'pdf').toLowerCase()}`;
    a.click();
  };

  const ready = blobUrl || file.url;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderRadius: 8, background: C.accentBg, border: `1px solid ${alpha(C.accent, 44)}` }}>
        <svg viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" width="20" height="20" style={{ flexShrink: 0 }}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
        </svg>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: C.fg1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {file.name || file.fileName || 'Attached file'}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg3, marginTop: 2 }}>
            {[file.type, file.size && fmtSize(file.size), file.uploadedAt].filter(Boolean).join(' · ')}
          </div>
          {err && <div style={{ fontSize: 11, color: C.danger, marginTop: 2 }}>{err}</div>}
        </div>

        <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
          {!err && (
            <>
              <button onClick={handleView} disabled={loading || !ready}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.accent, background: 'none', border: `1px solid ${alpha(C.accent, 44)}`, borderRadius: 5, padding: '4px 10px', cursor: loading || !ready ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', opacity: loading || !ready ? 0.5 : 1 }}>
                {loading ? 'Loading…' : isPdf ? 'View' : 'Open'}
              </button>
              {ready && (
                <button onClick={handleDownload}
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg2, background: 'none', border: `1px solid ${C.border}`, borderRadius: 5, padding: '4px 10px', cursor: 'pointer' }}>
                  ↓
                </button>
              )}
            </>
          )}
          {editing && (
            <>
              <button onClick={onReplace}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg2, background: 'none', border: `1px solid ${C.border}`, borderRadius: 5, padding: '4px 10px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Replace
              </button>
              <button onClick={onRemove}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.danger, background: 'none', border: `1px solid ${alpha(C.danger, 33)}`, borderRadius: 5, padding: '4px 10px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Remove
              </button>
            </>
          )}
        </div>
      </div>

      {/* Full-screen PDF overlay */}
      {viewing && blobUrl && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', flexDirection: 'column', background: '#1a1510' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', background: '#221c12', borderBottom: '1px solid rgba(255,255,255,0.10)', flexShrink: 0 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" width="18" height="18">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
            </svg>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: '#f5e6c8', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {file.name || file.fileName}
            </span>
            <button onClick={handleDownload}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.accent, background: 'none', border: `1px solid ${alpha(C.accent, 44)}`, borderRadius: 5, padding: '5px 12px', cursor: 'pointer' }}>
              ↓ Download
            </button>
            <button onClick={() => setViewing(false)}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#aaa', background: 'none', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 5, padding: '5px 12px', cursor: 'pointer' }}>
              ✕ Close
            </button>
          </div>
          <iframe src={blobUrl} title={file.name || 'PDF'} style={{ flex: 1, border: 'none', width: '100%' }} />
        </div>
      )}
    </>
  );
}
