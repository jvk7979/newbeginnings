import { useState, useRef } from 'react';
import { C } from '../tokens';
import { extractAllText, parseTextForIdea, parseTextForPlan } from '../utils/pdfParser';

/* ── Icons ── */
function UploadIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
}
function PasteIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>;
}
function CheckIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><polyline points="20 6 9 17 4 12"/></svg>;
}
function Spinner() {
  return <div style={{ width: 28, height: 28, border: `2.5px solid ${C.border}`, borderTopColor: C.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />;
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

const PROMPT_TEMPLATE = `Please write a structured business report with the following sections clearly labeled as headings:

1. Executive Summary
2. Market Analysis
3. Financial Projections
4. Operations Plan
5. Risk Assessment
6. Next Steps

Format each section heading on its own line in UPPERCASE or Title Case, followed by the content. This helps my business tracking app auto-detect and organize sections automatically.`;

/* ── Main component ── */
export default function PdfUploadZone({ mode = 'plan', onExtracted }) {
  const [tab, setTab]           = useState('pdf');   // 'pdf' | 'paste'
  const [pdfState, setPdfState] = useState('idle');  // idle | dragging | processing | done | error
  const [fileInfo, setFileInfo] = useState(null);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [pdfErr, setPdfErr]     = useState('');

  const [pasteText, setPasteText]     = useState('');
  const [pastePreview, setPastePreview] = useState(null);
  const [pasteParsed, setPasteParsed] = useState(false);
  const [showPrompt, setShowPrompt]   = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);

  const inputRef = useRef(null);

  /* ── PDF processing ── */
  const processPdf = async (file) => {
    if (!file || file.type !== 'application/pdf') {
      setPdfErr('Please upload a PDF file.');
      setPdfState('error');
      return;
    }
    setFileInfo({ name: file.name, size: file.size });
    setPdfState('processing');
    setPdfErr('');
    try {
      const text   = await extractAllText(file);
      const parsed = mode === 'idea' ? parseTextForIdea(text) : parseTextForPlan(text);
      setPdfPreview(parsed);
      setPdfState('done');
      onExtracted(parsed);
    } catch {
      setPdfErr('Could not read this PDF. Make sure it is a text-based PDF, not a scanned image.');
      setPdfState('error');
    }
  };

  const onDrop      = (e) => { e.preventDefault(); setPdfState('idle'); processPdf(e.dataTransfer.files[0]); };
  const onDragOver  = (e) => { e.preventDefault(); setPdfState('dragging'); };
  const onDragLeave = () => setPdfState('idle');
  const onFileChange = (e) => { processPdf(e.target.files[0]); e.target.value = ''; };
  const resetPdf    = () => { setPdfState('idle'); setFileInfo(null); setPdfPreview(null); setPdfErr(''); };

  /* ── Paste processing ── */
  const handleParse = () => {
    if (!pasteText.trim()) return;
    const parsed = mode === 'idea' ? parseTextForIdea(pasteText) : parseTextForPlan(pasteText);
    setPastePreview(parsed);
    setPasteParsed(true);
    onExtracted(parsed);
  };

  const handlePasteChange = (e) => {
    setPasteText(e.target.value);
    setPasteParsed(false);
    setPastePreview(null);
  };

  const resetPaste = () => { setPasteText(''); setPastePreview(null); setPasteParsed(false); };

  const copyPrompt = () => {
    navigator.clipboard.writeText(PROMPT_TEMPLATE);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2000);
  };

  /* ── Shared preview card ── */
  const PreviewCard = ({ preview, fileLabel, onReplace }) => (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', animation: 'fadeIn 250ms ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: C.successBg, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ color: C.success }}><CheckIcon /></div>
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: C.success }}>
              {fileLabel ? 'PDF extracted successfully' : 'Report parsed successfully'}
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3, marginTop: 1 }}>
              {fileLabel || `${pasteText.length} characters`}
              {mode === 'plan' && preview.sections?.length > 0 && ` · ${preview.sections.length} sections detected`}
            </div>
          </div>
        </div>
        <button onClick={onReplace}
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3, background: 'none', border: `1px solid ${C.border}`, borderRadius: 5, cursor: 'pointer', padding: '4px 10px', whiteSpace: 'nowrap' }}>
          {fileLabel ? 'Replace file' : 'Clear'}
        </button>
      </div>
      <div style={{ padding: '14px 16px', background: C.bg1 }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, color: C.fg3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          Applied to form below ↓
        </div>
        {preview.title && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: C.fg3, marginBottom: 3 }}>TITLE</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: C.fg1, background: C.bg0, border: `1px solid ${C.border}`, borderRadius: 6, padding: '7px 10px' }}>{preview.title}</div>
          </div>
        )}
        {(preview.summary || preview.desc) && (
          <div style={{ marginBottom: mode === 'plan' && preview.sections?.length > 0 ? 10 : 0 }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: C.fg3, marginBottom: 3 }}>{mode === 'plan' ? 'SUMMARY' : 'DESCRIPTION'}</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg2, background: C.bg0, border: `1px solid ${C.border}`, borderRadius: 6, padding: '7px 10px', lineHeight: 1.6,
              overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
              {preview.summary || preview.desc}
            </div>
          </div>
        )}
        {mode === 'plan' && preview.sections?.length > 0 && (
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: C.fg3, marginBottom: 6 }}>SECTIONS DETECTED</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {preview.sections.map((s, i) => (
                <div key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg2, background: C.bg0, border: `1px solid ${C.border}`, borderRadius: 5, padding: '3px 10px' }}>
                  {s.title || `Section ${i + 1}`}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  /* ── Tab bar ── */
  const tabStyle = (active) => ({
    fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: active ? 500 : 400,
    color: active ? C.accent : C.fg3,
    background: 'none', border: 'none', borderBottom: `2px solid ${active ? C.accent : 'transparent'}`,
    cursor: 'pointer', padding: '8px 16px', transition: 'all 150ms',
  });

  return (
    <div style={{ marginBottom: 28 }}>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, marginBottom: 16 }}>
        <button style={tabStyle(tab === 'pdf')} onClick={() => setTab('pdf')}>
          ↑ Upload PDF
        </button>
        <button style={tabStyle(tab === 'paste')} onClick={() => setTab('paste')}>
          ⌘ Paste from Claude / ChatGPT
        </button>
      </div>

      {/* ── PDF TAB ── */}
      {tab === 'pdf' && (
        <>
          {pdfState !== 'done' && (
            <div onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
              onClick={() => pdfState !== 'processing' && inputRef.current?.click()}
              style={{
                border: `2px dashed ${pdfState === 'dragging' ? C.accent : pdfState === 'error' ? C.danger : C.border}`,
                borderRadius: 12, padding: '36px 24px', textAlign: 'center',
                cursor: pdfState === 'processing' ? 'default' : 'pointer',
                background: pdfState === 'dragging' ? C.accentBg : pdfState === 'error' ? C.dangerBg : C.bg1,
                transition: 'all 200ms ease', userSelect: 'none',
              }}>
              <input ref={inputRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={onFileChange} />

              {pdfState === 'idle' && <>
                <div style={{ color: C.fg3, marginBottom: 12 }}><UploadIcon /></div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500, color: C.fg1, marginBottom: 6 }}>Drop your PDF here</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, marginBottom: 16 }}>or click to browse files</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.accent, background: C.accentBg, border: `1px solid ${C.accent}33`, borderRadius: 6, padding: '6px 14px' }}>
                  PDF only · All pages extracted · Auto-detects sections
                </div>
              </>}

              {pdfState === 'dragging' && <>
                <div style={{ color: C.accent, marginBottom: 12 }}><UploadIcon /></div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 600, color: C.accent }}>Release to upload</div>
              </>}

              {pdfState === 'processing' && <>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><Spinner /></div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: C.fg1, marginBottom: 4 }}>Reading PDF…</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, marginBottom: 8 }}>{fileInfo?.name}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.accent }}>Extracting text from all pages<span style={{ animation: 'blink 1.2s step-start infinite' }}>…</span></div>
              </>}

              {pdfState === 'error' && <>
                <div style={{ color: C.danger, marginBottom: 10 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: C.danger, marginBottom: 6 }}>Could not read PDF</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, marginBottom: 14 }}>{pdfErr}</div>
                <button onClick={(e) => { e.stopPropagation(); resetPdf(); }}
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg2, background: C.bg0, border: `1px solid ${C.border}`, borderRadius: 5, cursor: 'pointer', padding: '6px 14px' }}>
                  Try another file
                </button>
              </>}
            </div>
          )}
          {pdfState === 'done' && pdfPreview && (
            <PreviewCard preview={pdfPreview} fileLabel={`${fileInfo?.name} · ${formatSize(fileInfo?.size || 0)}`} onReplace={resetPdf} />
          )}
        </>
      )}

      {/* ── PASTE TAB ── */}
      {tab === 'paste' && (
        <>
          {/* Prompt tip */}
          <div style={{ background: C.accentBg, border: `1px solid ${C.accent}22`, borderRadius: 8, padding: '12px 14px', marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: C.accent, marginBottom: 4 }}>
                  Tip: Use this prompt in Claude or ChatGPT for best results
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg2, lineHeight: 1.5 }}>
                  Ask your AI to format the report with clear section headings — the app will auto-detect and split them.
                </div>
              </div>
              <button onClick={() => setShowPrompt(p => !p)}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.accent, background: 'none', border: `1px solid ${C.accent}44`, borderRadius: 5, cursor: 'pointer', padding: '4px 10px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {showPrompt ? 'Hide' : 'Show prompt'}
              </button>
            </div>
            {showPrompt && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg2, background: C.bg0, border: `1px solid ${C.border}`, borderRadius: 6, padding: '10px 12px', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {PROMPT_TEMPLATE}
                </div>
                <button onClick={copyPrompt}
                  style={{ marginTop: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: promptCopied ? C.success : C.accent, background: 'none', border: `1px solid ${promptCopied ? C.success : C.accent}44`, borderRadius: 5, cursor: 'pointer', padding: '5px 12px' }}>
                  {promptCopied ? '✓ Copied!' : 'Copy prompt'}
                </button>
              </div>
            )}
          </div>

          {/* Paste area */}
          {!pasteParsed ? (
            <div>
              <textarea
                value={pasteText}
                onChange={handlePasteChange}
                placeholder={`Paste your Claude or ChatGPT report here…\n\nThe app will automatically detect section headings like:\n• Executive Summary\n• Market Analysis\n• Financial Projections\n• Risk Assessment\n• Next Steps`}
                style={{
                  width: '100%', minHeight: 240, resize: 'vertical',
                  background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 8,
                  color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                  lineHeight: 1.7, padding: '14px 16px', outline: 'none',
                  transition: 'border 150ms', boxSizing: 'border-box',
                }}
                onFocus={e => { e.target.style.borderColor = C.accentDim; e.target.style.boxShadow = `0 0 0 2px ${C.accentDim}22`; }}
                onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3 }}>
                  {pasteText.length > 0 ? `${pasteText.length} characters pasted` : 'Paste any length — entire report works best'}
                </div>
                <button onClick={handleParse} disabled={!pasteText.trim()}
                  style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
                    color: '#fff', background: pasteText.trim() ? C.accent : C.border,
                    border: 'none', borderRadius: 6, cursor: pasteText.trim() ? 'pointer' : 'not-allowed',
                    padding: '8px 20px', transition: 'all 150ms',
                  }}
                  onMouseEnter={e => { if (pasteText.trim()) e.currentTarget.style.background = C.accentDim; }}
                  onMouseLeave={e => { if (pasteText.trim()) e.currentTarget.style.background = C.accent; }}>
                  Parse into sections →
                </button>
              </div>
            </div>
          ) : (
            pastePreview && <PreviewCard preview={pastePreview} fileLabel={null} onReplace={resetPaste} />
          )}
        </>
      )}
    </div>
  );
}
