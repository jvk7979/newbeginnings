import { useState } from 'react';

// "Export DPR" button. The @react-pdf/renderer dependency (~300KB
// gzipped) only loads when the user clicks — same lazy-loading pattern
// as the lazy tabs. While the bundle fetches and the document
// generates, the button renders a busy state with a spinner.
export default function DPRExportButton({ input, calc, project }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      // Lazy-import the heavy bits only when needed
      const [{ pdf }, { default: DPRDocument }, { buildDPRData }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('../../utils/dpr/DPRDocument'),
        import('../../utils/dpr/dprData'),
      ]);

      const data = buildDPRData({ input, calc, project });
      const blob = await pdf(<DPRDocument data={data} />).toBlob();

      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const slug = (project?.title || 'project')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .toLowerCase();
      const dateStr = new Date().toISOString().slice(0, 10);
      a.download = `${slug}-dpr-${dateStr}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Revoke after a tick so the download has a chance to attach
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      console.error('DPR export failed:', e);
      setError(e?.message || 'Failed to generate PDF');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className="calc-hero-btn calc-hero-btn-secondary"
      title={busy ? 'Generating PDF…' : 'Download a banker-ready DPR with every input + projection'}>
      {busy ? (
        <>
          <svg className="calc-dpr-spinner" viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="14 28" />
          </svg>
          Building…
        </>
      ) : (
        <>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <polyline points="9 15 12 18 15 15" />
          </svg>
          Export DPR
        </>
      )}
      {error && <span className="calc-dpr-error">{error}</span>}
    </button>
  );
}
