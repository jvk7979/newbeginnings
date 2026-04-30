import { useState, useEffect, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { C, alpha } from '../tokens';
import { fmtSize, getFileUrl, fetchFileBlob } from '../utils/fileStorage';

// PDF renderer is lazy-loaded so the pdfjs worker chunk is only fetched
// when a user actually opens a PDF — keeps the main bundle small.
const PdfPageRenderer = lazy(() => import('./PdfPageRenderer'));

export default function AttachedFileViewer({ file, onReplace, onRemove, editing }) {
  const [viewing, setViewing]     = useState(false);
  const [docxHtml, setDocxHtml]   = useState('');
  const [docxLoading, setDocxLoading] = useState(false);
  const [docxError, setDocxError] = useState('');
  const [resolvedUrl, setResolvedUrl] = useState(null);

  useEffect(() => {
    if (!viewing) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prevOverflow; };
  }, [viewing]);

  if (!file) return null;

  const isPdf  = file.type === 'PDF';
  const isDocx = file.type === 'DOCX';
  const isDoc  = file.type === 'DOC';
  const isInlineViewable = isPdf || isDocx;

  // URL resolution. New records have only blobId — fetch a fresh, ephemeral
  // download URL on demand. Legacy records persist `url` (kept as fallback so
  // pre-migration data still works). The url is *not* re-persisted anywhere.
  const ensureUrl = async () => {
    if (resolvedUrl) return resolvedUrl;
    if (file.url) { setResolvedUrl(file.url); return file.url; }
    if (file.blobId) {
      const u = await getFileUrl(file.blobId);
      setResolvedUrl(u);
      return u;
    }
    return null;
  };

  const loadDocxHtml = async () => {
    setDocxLoading(true);
    setDocxError('');
    setDocxHtml('');
    try {
      const mammothMod = await import('mammoth/mammoth.browser.min.js');
      const mammoth = mammothMod.default ?? mammothMod;
      // Prefer the SDK-authenticated path so we don't need a download URL at all
      let buf;
      if (file.blobId) {
        const blob = await fetchFileBlob(file);
        buf = await blob.arrayBuffer();
      } else {
        const u = await ensureUrl();
        if (!u) throw new Error('No file URL available.');
        const res = await fetch(u);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        buf = await res.arrayBuffer();
      }
      const result = await mammoth.convertToHtml({ arrayBuffer: buf });
      const DOMPurify = (await import('dompurify')).default;
      const safeHtml = DOMPurify.sanitize(result.value || '', {
        ALLOWED_URI_REGEXP: /^(?:https?|mailto|tel|#|\/):/i,
      });
      setDocxHtml(safeHtml || '<p><em>Empty document.</em></p>');
    } catch (err) {
      console.error('[DOCX render]', err);
      setDocxError('Could not render this document. You can still download it.');
    } finally {
      setDocxLoading(false);
    }
  };

  const handleView = async () => {
    if (isDoc) {
      // Legacy binary .doc — cannot be rendered in-browser; fall back to download
      handleDownload();
      return;
    }
    if (isPdf) {
      // The new canvas-based renderer fetches the blob itself via the
      // SDK's authenticated path, so we don't need to resolve a URL here.
      // Keep ensureUrl warm for the Download button's sake only.
      ensureUrl().catch(() => {});
      setViewing(true);
      return;
    }
    if (isDocx) {
      setViewing(true);
      loadDocxHtml();
      return;
    }
    const u = await ensureUrl();
    if (u) window.open(u, '_blank', 'noopener,noreferrer');
  };

  const handleDownload = async () => {
    const u = await ensureUrl();
    if (!u) return;
    const a    = document.createElement('a');
    a.href     = u;
    a.download = file.name || `file.${(file.type || 'pdf').toLowerCase()}`;
    a.target   = '_blank';
    a.rel      = 'noopener noreferrer';
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
          {(file.blobId || file.url) && (
            <>
              <button onClick={handleView}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.accent, background: 'none', border: `1px solid ${alpha(C.accent, 44)}`, borderRadius: 5, padding: '6px 10px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {isInlineViewable ? 'View' : 'Open'}
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

      {/* Full-screen viewer overlay — portal to body so it escapes any
          transformed ancestor (.page-pad uses transform in its pageIn
          animation, which would otherwise constrain position:fixed).
          For PDFs we render via canvas (PdfPageRenderer) which handles
          its own loading; for DOCX we still need a resolvedUrl path
          when the file has only a legacy `url` field, so the gating
          condition stays. */}
      {viewing && (isPdf || resolvedUrl || file.url) && createPortal(
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

          {isPdf && (
            <Suspense fallback={
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f5e6c8', fontFamily: "'DM Sans', sans-serif", fontSize: 15, background: '#3a3530' }}>
                Loading PDF…
              </div>
            }>
              <PdfPageRenderer file={file} />
            </Suspense>
          )}

          {isDocx && (
            <div style={{ flex: 1, overflow: 'auto', minHeight: 0, background: '#FAFAF7', display: 'flex', justifyContent: 'center', padding: '24px 16px' }}>
              {docxLoading && (
                <div style={{ alignSelf: 'center', display: 'flex', alignItems: 'center', gap: 10, color: C.fg2, fontFamily: "'DM Sans', sans-serif", fontSize: 15 }}>
                  <span style={{ display: 'inline-block', width: 14, height: 14, border: `2px solid ${C.border}`, borderTopColor: C.accent, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  Loading document…
                </div>
              )}
              {docxError && !docxLoading && (
                <div style={{ alignSelf: 'center', textAlign: 'center', color: C.danger, fontFamily: "'DM Sans', sans-serif", fontSize: 15, lineHeight: 1.6 }}>
                  {docxError}
                </div>
              )}
              {!docxLoading && !docxError && docxHtml && (
                <article
                  className="docx-content"
                  style={{ maxWidth: 820, width: '100%', background: '#FFFFFF', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', borderRadius: 6, padding: 'clamp(24px, 4vw, 56px)', fontFamily: "'DM Sans', Georgia, serif", fontSize: 16, lineHeight: 1.7, color: '#1A1714' }}
                  dangerouslySetInnerHTML={{ __html: docxHtml }} />
              )}
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
}
