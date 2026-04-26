import { useState, useRef } from 'react';
import { C } from '../tokens';
import { extractAllText, parseTextForIdea, parseTextForPlan } from '../utils/pdfParser';

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="32" height="32">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function Spinner() {
  return (
    <div style={{ width: 28, height: 28, border: `2.5px solid ${C.border}`, borderTopColor: C.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
  );
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// mode: 'idea' | 'plan'
export default function PdfUploadZone({ mode = 'plan', onExtracted }) {
  const [state, setState]       = useState('idle'); // idle | dragging | processing | done | error
  const [fileInfo, setFileInfo] = useState(null);
  const [preview, setPreview]   = useState(null);
  const [errMsg, setErrMsg]     = useState('');
  const inputRef                = useRef(null);

  const process = async (file) => {
    if (!file || file.type !== 'application/pdf') {
      setErrMsg('Please upload a PDF file.');
      setState('error');
      return;
    }
    setFileInfo({ name: file.name, size: file.size });
    setState('processing');
    setErrMsg('');
    try {
      const text   = await extractAllText(file);
      const parsed = mode === 'idea' ? parseTextForIdea(text) : parseTextForPlan(text);
      setPreview(parsed);
      setState('done');
      onExtracted(parsed);
    } catch {
      setErrMsg('Could not read this PDF. Make sure it is a text-based PDF, not a scanned image.');
      setState('error');
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setState('idle');
    const file = e.dataTransfer.files[0];
    process(file);
  };

  const onDragOver = (e) => { e.preventDefault(); setState('dragging'); };
  const onDragLeave = () => setState('idle');
  const onFileChange = (e) => { process(e.target.files[0]); e.target.value = ''; };
  const reset = () => { setState('idle'); setFileInfo(null); setPreview(null); setErrMsg(''); };

  const isDragging   = state === 'dragging';
  const isProcessing = state === 'processing';
  const isDone       = state === 'done';
  const isError      = state === 'error';

  return (
    <div style={{ marginBottom: 28 }}>

      {/* Drop zone */}
      {!isDone && (
        <div
          onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
          onClick={() => !isProcessing && inputRef.current?.click()}
          style={{
            border: `2px dashed ${isDragging ? C.accent : isError ? C.danger : C.border}`,
            borderRadius: 12,
            padding: '36px 24px',
            textAlign: 'center',
            cursor: isProcessing ? 'default' : 'pointer',
            background: isDragging ? C.accentBg : isError ? C.dangerBg : C.bg1,
            transition: 'all 200ms ease',
            userSelect: 'none',
          }}>
          <input ref={inputRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={onFileChange} />

          {/* Idle state */}
          {state === 'idle' && (
            <>
              <div style={{ color: C.fg3, marginBottom: 12 }}><UploadIcon /></div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500, color: C.fg1, marginBottom: 6 }}>
                Drop your PDF here
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, marginBottom: 16 }}>
                or click to browse files
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.accent, background: C.accentBg, border: `1px solid ${C.accent}33`, borderRadius: 6, padding: '6px 14px' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                PDF files only · All pages extracted
              </div>
            </>
          )}

          {/* Dragging state */}
          {state === 'dragging' && (
            <>
              <div style={{ color: C.accent, marginBottom: 12 }}><UploadIcon /></div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 600, color: C.accent }}>
                Release to upload
              </div>
            </>
          )}

          {/* Processing state */}
          {isProcessing && (
            <>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                <Spinner />
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: C.fg1, marginBottom: 4 }}>
                Reading PDF…
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, marginBottom: 8 }}>
                {fileInfo?.name}
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.accent }}>
                Extracting text from all pages
                <span style={{ animation: 'blink 1.2s step-start infinite' }}>…</span>
              </div>
            </>
          )}

          {/* Error state */}
          {isError && (
            <>
              <div style={{ color: C.danger, marginBottom: 10 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: C.danger, marginBottom: 6 }}>
                Could not read PDF
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, marginBottom: 14 }}>
                {errMsg}
              </div>
              <button onClick={(e) => { e.stopPropagation(); reset(); }}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg2, background: C.bg0, border: `1px solid ${C.border}`, borderRadius: 5, cursor: 'pointer', padding: '6px 14px' }}>
                Try another file
              </button>
            </>
          )}
        </div>
      )}

      {/* Success state — extracted content card */}
      {isDone && preview && (
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', animation: 'fadeIn 250ms ease' }}>

          {/* File info header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: C.successBg, borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ color: C.success }}><CheckIcon /></div>
              <div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: C.success }}>PDF extracted successfully</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3, marginTop: 1 }}>
                  {fileInfo?.name} · {formatSize(fileInfo?.size || 0)}
                  {mode === 'plan' && preview.sections?.length > 0 && ` · ${preview.sections.length} sections found`}
                </div>
              </div>
            </div>
            <button onClick={reset}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3, background: 'none', border: `1px solid ${C.border}`, borderRadius: 5, cursor: 'pointer', padding: '4px 10px', whiteSpace: 'nowrap' }}>
              Replace file
            </button>
          </div>

          {/* Extracted preview */}
          <div style={{ padding: '14px 16px', background: C.bg1 }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, color: C.fg3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Extracted content — applied to form below
            </div>

            {/* Title */}
            {preview.title && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: C.fg3, marginBottom: 3 }}>TITLE</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: C.fg1, background: C.bg0, border: `1px solid ${C.border}`, borderRadius: 6, padding: '7px 10px' }}>
                  {preview.title}
                </div>
              </div>
            )}

            {/* Summary (plan) or desc (idea) */}
            {(preview.summary || preview.desc) && (
              <div style={{ marginBottom: mode === 'plan' && preview.sections?.length > 0 ? 10 : 0 }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: C.fg3, marginBottom: 3 }}>
                  {mode === 'plan' ? 'SUMMARY' : 'DESCRIPTION'}
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg2, background: C.bg0, border: `1px solid ${C.border}`, borderRadius: 6, padding: '7px 10px', lineHeight: 1.6,
                  overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                  {preview.summary || preview.desc}
                </div>
              </div>
            )}

            {/* Sections list (plan only) */}
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
      )}
    </div>
  );
}
