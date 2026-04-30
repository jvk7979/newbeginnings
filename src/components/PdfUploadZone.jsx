import { useState, useRef } from 'react';
import { C, alpha } from '../tokens';
// Only the Paste tab parses now; the PDF tab no longer extracts text.
import { parseTextForIdea, parseTextForPlan } from '../utils/pdfParser';

/* ── Icons ── */
function UploadIcon() {
  return <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
}
function CheckIcon() {
  return <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><polyline points="20 6 9 17 4 12"/></svg>;
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

/* ── Main component ──
 *
 *   onExtracted(parsed)  — fires after a successful PASTE-tab parse with
 *                          { title, summary?, desc?, sections? }. The PDF
 *                          tab no longer extracts: it just confirms the
 *                          attachment via Save/Cancel.
 *   onFileAttached(file) — fires when the user clicks Save on a dropped
 *                          PDF (passing the File), or with null on Cancel /
 *                          Replace. The Paste tab does not call this.
 */
export default function PdfUploadZone({ mode = 'plan', onExtracted, onFileAttached }) {
  const [tab, setTab]           = useState('pdf');   // 'pdf' | 'paste'
  // pdfState transitions:
  //   idle      → drop zone shown
  //   dragging  → drop zone highlighted
  //   pending   → file dropped, Save/Cancel buttons visible
  //   saved     → file confirmed as attachment, Replace button visible
  //   error     → file rejected, Try-another-file button visible
  const [pdfState, setPdfState] = useState('idle');
  const [pendingFile, setPendingFile] = useState(null);
  const [pdfErr, setPdfErr]     = useState('');

  const [pasteText, setPasteText]     = useState('');
  const [pastePreview, setPastePreview] = useState(null);
  const [pasteParsed, setPasteParsed] = useState(false);
  const [showPrompt, setShowPrompt]   = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);

  const inputRef = useRef(null);

  /* ── PDF intake ── */
  // Drop = attach immediately. The Save/Cancel UI is a confirmation
  // affordance, not a gate — the parent's attachment slot needs to react
  // the moment the file is dropped so the bottom "Attach Document" zone
  // mirrors the upload AND the "Generate AI Summary" button (which keys
  // off the parent's selectedFile via isSummarySupported) becomes
  // available without waiting for a Save click. Save still exists as a
  // visual "I'm done" affirmation; Cancel detaches.
  const acceptPdf = (file) => {
    if (!file || file.type !== 'application/pdf') {
      setPdfErr('Please upload a PDF file.');
      setPdfState('error');
      return;
    }
    setPendingFile(file);
    setPdfState('pending');
    setPdfErr('');
    onFileAttached?.(file);
  };

  const onDrop      = (e) => { e.preventDefault(); setPdfState('idle'); acceptPdf(e.dataTransfer.files[0]); };
  const onDragOver  = (e) => { e.preventDefault(); setPdfState('dragging'); };
  const onDragLeave = () => setPdfState('idle');
  const onFileChange = (e) => { acceptPdf(e.target.files[0]); e.target.value = ''; };

  // Save: just transition to the "saved" visual state — the file was
  // already attached on drop, so this is purely UX confirmation.
  const savePdf = () => {
    if (!pendingFile) return;
    setPdfState('saved');
  };

  // Cancel / reset: drop the pending file and any prior attachment so
  // the bottom slot + AI button rewind too.
  const resetPdf = () => {
    setPdfState('idle');
    setPendingFile(null);
    setPdfErr('');
    onFileAttached?.(null);
  };

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
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: C.success }}>
              {fileLabel ? 'PDF extracted successfully' : 'Report parsed successfully'}
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, marginTop: 1 }}>
              {fileLabel || `${pasteText.length} characters`}
              {mode === 'plan' && preview.sections?.length > 0 && ` · ${preview.sections.length} sections detected`}
            </div>
          </div>
        </div>
        <button onClick={onReplace}
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, background: 'none', border: `1px solid ${C.border}`, borderRadius: 5, cursor: 'pointer', padding: '4px 10px', whiteSpace: 'nowrap' }}>
          {fileLabel ? 'Replace file' : 'Clear'}
        </button>
      </div>
      <div style={{ padding: '14px 16px', background: C.bg1 }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: C.fg3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          Applied to form below ↓
        </div>
        {preview.title && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, marginBottom: 3 }}>TITLE</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500, color: C.fg1, background: C.bg0, border: `1px solid ${C.border}`, borderRadius: 6, padding: '7px 10px' }}>{preview.title}</div>
          </div>
        )}
        {(preview.summary || preview.desc) && (
          <div style={{ marginBottom: mode === 'plan' && preview.sections?.length > 0 ? 10 : 0 }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, marginBottom: 3 }}>{mode === 'plan' ? 'SUMMARY' : 'DESCRIPTION'}</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2, background: C.bg0, border: `1px solid ${C.border}`, borderRadius: 6, padding: '7px 10px', lineHeight: 1.6,
              overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
              {preview.summary || preview.desc}
            </div>
          </div>
        )}
        {mode === 'plan' && preview.sections?.length > 0 && (
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, marginBottom: 6 }}>SECTIONS DETECTED</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {preview.sections.map((s, i) => (
                <div key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg2, background: C.bg0, border: `1px solid ${C.border}`, borderRadius: 5, padding: '3px 10px' }}>
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
    fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: active ? 500 : 400,
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
          {(pdfState === 'idle' || pdfState === 'dragging' || pdfState === 'error') && (
            <div onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
              onClick={() => inputRef.current?.click()}
              style={{
                border: `2px dashed ${pdfState === 'dragging' ? C.accent : pdfState === 'error' ? C.danger : C.border}`,
                borderRadius: 12, padding: '36px 24px', textAlign: 'center',
                cursor: 'pointer',
                background: pdfState === 'dragging' ? C.accentBg : pdfState === 'error' ? C.dangerBg : C.bg1,
                transition: 'all 200ms ease', userSelect: 'none',
              }}>
              <input ref={inputRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={onFileChange} />

              {pdfState === 'idle' && <>
                <div style={{ color: C.fg3, marginBottom: 12 }}><UploadIcon /></div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, fontWeight: 500, color: C.fg1, marginBottom: 6 }}>Drop your PDF here</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.fg3, marginBottom: 16 }}>or click to browse files</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.accent, background: C.accentBg, border: `1px solid ${alpha(C.accent, 33)}`, borderRadius: 6, padding: '6px 14px' }}>
                  PDF only · Attach to this entry on Save
                </div>
              </>}

              {pdfState === 'dragging' && <>
                <div style={{ color: C.accent, marginBottom: 12 }}><UploadIcon /></div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, fontWeight: 600, color: C.accent }}>Release to upload</div>
              </>}

              {pdfState === 'error' && <>
                <div style={{ color: C.danger, marginBottom: 10 }}>
                  <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 500, color: C.danger, marginBottom: 6 }}>Not a valid PDF</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3, marginBottom: 14 }}>{pdfErr}</div>
                <button onClick={(e) => { e.stopPropagation(); resetPdf(); }}
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2, background: C.bg0, border: `1px solid ${C.border}`, borderRadius: 5, cursor: 'pointer', padding: '6px 14px' }}>
                  Try another file
                </button>
              </>}
            </div>
          )}

          {/* Pending — file picked, awaiting Save/Cancel decision. */}
          {pdfState === 'pending' && pendingFile && (
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', animation: 'fadeIn 200ms ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: C.bg1, borderBottom: `1px solid ${C.border}` }}>
                <div style={{ color: C.accent, flexShrink: 0 }}>
                  <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="24" height="24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: C.fg1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pendingFile.name}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: C.fg3, marginTop: 2 }}>
                    PDF · {formatSize(pendingFile.size)}
                  </div>
                </div>
              </div>
              <div style={{ padding: '12px 16px', background: C.bg0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3 }}>
                  Attached. Save to confirm, or cancel to discard.
                </span>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button onClick={resetPdf}
                    style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2, background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 6, cursor: 'pointer', padding: '7px 14px' }}>
                    Cancel
                  </button>
                  <button onClick={savePdf}
                    style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: '#fff', background: C.accent, border: 'none', borderRadius: 6, cursor: 'pointer', padding: '7px 16px' }}
                    onMouseEnter={e => e.currentTarget.style.background = C.accentDim}
                    onMouseLeave={e => e.currentTarget.style.background = C.accent}>
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Saved — file confirmed; offer Replace to start over. */}
          {pdfState === 'saved' && pendingFile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderRadius: 12, background: C.successBg, border: `1px solid ${C.border}`, animation: 'fadeIn 200ms ease' }}>
              <div style={{ color: C.success, flexShrink: 0 }}><CheckIcon /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: C.success }}>
                  PDF attached
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: C.fg3, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {pendingFile.name} · {formatSize(pendingFile.size)}
                </div>
              </div>
              <button onClick={resetPdf}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg2, background: 'none', border: `1px solid ${C.border}`, borderRadius: 5, cursor: 'pointer', padding: '5px 12px', flexShrink: 0, whiteSpace: 'nowrap' }}>
                Replace
              </button>
            </div>
          )}
        </>
      )}

      {/* ── PASTE TAB ── */}
      {tab === 'paste' && (
        <>
          {/* Prompt tip */}
          <div style={{ background: C.accentBg, border: `1px solid ${alpha(C.accent, 22)}`, borderRadius: 8, padding: '12px 14px', marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: C.accent, marginBottom: 4 }}>
                  Tip: Use this prompt in Claude or ChatGPT for best results
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2, lineHeight: 1.5 }}>
                  Ask your AI to format the report with clear section headings — the app will auto-detect and split them.
                </div>
              </div>
              <button onClick={() => setShowPrompt(p => !p)}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.accent, background: 'none', border: `1px solid ${alpha(C.accent, 44)}`, borderRadius: 5, cursor: 'pointer', padding: '4px 10px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {showPrompt ? 'Hide' : 'Show prompt'}
              </button>
            </div>
            {showPrompt && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: C.fg2, background: C.bg0, border: `1px solid ${C.border}`, borderRadius: 6, padding: '10px 12px', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {PROMPT_TEMPLATE}
                </div>
                <button onClick={copyPrompt}
                  style={{ marginTop: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: promptCopied ? C.success : C.accent, background: 'none', border: `1px solid ${promptCopied ? C.success : C.accent}44`, borderRadius: 5, cursor: 'pointer', padding: '5px 12px' }}>
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
                  color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 15,
                  lineHeight: 1.7, padding: '14px 16px', outline: 'none',
                  transition: 'border 150ms', boxSizing: 'border-box',
                }}
                onFocus={e => { e.target.style.borderColor = C.accentDim; e.target.style.boxShadow = `0 0 0 2px ${alpha(C.accentDim, 22)}`; }}
                onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3 }}>
                  {pasteText.length > 0 ? `${pasteText.length} characters pasted` : 'Paste any length — entire report works best'}
                </div>
                <button onClick={handleParse} disabled={!pasteText.trim()}
                  style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500,
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
