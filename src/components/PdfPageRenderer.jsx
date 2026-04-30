import { useEffect, useRef, useState } from 'react';
import { fetchFileBlob } from '../utils/fileStorage';
import { loadPdfJs } from '../utils/pdfParser';

// Why we don't just use <iframe src={pdfUrl}>: on iOS Safari (and several
// Android WebView builds) the iframe PDF viewer renders the document at
// the PDF's intrinsic page width, which is invariably wider than a phone
// viewport, and disables pinch-zoom for the iframe content. The user is
// stuck with horizontal scrolling at 100% zoom, can't read anything, can't
// scale.
//
// Rendering each page to a <canvas> sized to fit the container width
// solves both: the canvases are real DOM elements so they obey the page's
// viewport meta (pinch-zoom works), and we explicitly scale them to the
// container width on first paint so the user sees a properly fitted
// document immediately on every device.

export default function PdfPageRenderer({ file }) {
  const containerRef = useRef(null);
  const [status, setStatus] = useState({ loading: true, error: '', pageCount: 0, rendered: 0 });

  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    const container = containerRef.current;
    // Clear any previous render (e.g. when switching between two PDFs in
    // the same session).
    if (container) container.innerHTML = '';

    (async () => {
      try {
        const [pdfjsLib, blob] = await Promise.all([loadPdfJs(), fetchFileBlob(file)]);
        const buf = await blob.arrayBuffer();
        if (cancelled) return;
        const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
        if (cancelled) return;

        // Render at the container's current CSS width, clamped sensibly.
        // We multiply by devicePixelRatio so retina screens get a sharp
        // image, but cap DPR at 2 so we don't blow memory on a 4x device
        // rendering 50-page PDFs.
        const cssWidth   = Math.max(280, (container.clientWidth || 360) - 16);
        const dpr        = Math.min(window.devicePixelRatio || 1, 2);
        setStatus(s => ({ ...s, pageCount: pdf.numPages }));

        // Pages render serially so the user sees pages appearing as they
        // finish, rather than waiting for a 30-page PDF to render entirely
        // before any content shows up.
        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) return;
          const page = await pdf.getPage(i);
          const intrinsic = page.getViewport({ scale: 1 });
          const fitScale  = cssWidth / intrinsic.width;
          const viewport  = page.getViewport({ scale: fitScale * dpr });

          const canvas = document.createElement('canvas');
          canvas.width  = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          // CSS dimensions match the fit-to-width target; the canvas
          // backing store is dpr× higher-res so it's crisp on retina.
          canvas.style.width    = `${Math.round(cssWidth)}px`;
          canvas.style.height   = `${Math.round(viewport.height / dpr)}px`;
          canvas.style.maxWidth = '100%';
          canvas.style.display  = 'block';
          canvas.style.margin   = '8px auto';
          canvas.style.background = '#fff';
          canvas.style.boxShadow  = '0 1px 6px rgba(0,0,0,0.18)';
          canvas.style.borderRadius = '4px';

          await page.render({
            canvasContext: canvas.getContext('2d', { alpha: false }),
            viewport,
          }).promise;
          if (cancelled) return;
          container.appendChild(canvas);
          setStatus(s => ({ ...s, rendered: i }));
        }
        setStatus(s => ({ ...s, loading: false }));
      } catch (err) {
        console.error('[PDF render]', err);
        if (!cancelled) setStatus({ loading: false, error: err?.message || 'Could not render this PDF.', pageCount: 0, rendered: 0 });
      }
    })();

    return () => { cancelled = true; };
  // file.blobId is the only stable identity — re-render when a different
  // file is selected, but not on every parent re-render.
  }, [file?.blobId, file?.url]);

  return (
    <div style={{ flex: 1, overflow: 'auto', minHeight: 0, background: '#3a3530', WebkitOverflowScrolling: 'touch' }}>
      <div ref={containerRef} style={{ padding: 8, maxWidth: 980, margin: '0 auto' }} />
      {status.loading && (
        <div style={{ position: 'sticky', bottom: 0, textAlign: 'center', padding: '10px 12px', background: 'rgba(34,28,18,0.92)', color: '#f5e6c8', fontFamily: "'DM Sans', sans-serif", fontSize: 14, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {status.pageCount
            ? <>Rendering page {status.rendered + 1} of {status.pageCount}…</>
            : <>Loading PDF…</>}
        </div>
      )}
      {status.error && !status.loading && (
        <div style={{ textAlign: 'center', padding: '24px 16px', color: '#f5cdcd', fontFamily: "'DM Sans', sans-serif", fontSize: 15 }}>
          {status.error}
        </div>
      )}
    </div>
  );
}
