import { useState, useEffect } from 'react';
import { C } from '../tokens';
import { useAppData } from '../context/AppContext';
import { useToast } from '../context/ToastContext';

const CAT_STYLE = {
  Business:     { bg: '#FDF5E4', color: '#B8892A' },
  Agriculture:  { bg: '#EAF5EE', color: '#2E7D52' },
  Technology:   { bg: '#EAF0FA', color: '#2B5FA6' },
  Finance:      { bg: '#FDF0E4', color: '#C4681C' },
  'Real Estate':{ bg: '#F0EAF8', color: '#6B3FA6' },
  Community:    { bg: '#EAF5EE', color: '#2E7D52' },
  Personal:     { bg: '#EDE8DE', color: '#9A8E80' },
  Other:        { bg: '#EDE8DE', color: '#9A8E80' },
};

function SectionBlock({ section }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 16, fontWeight: 700, color: C.fg1, marginBottom: 10, paddingBottom: 6, borderBottom: `1px solid ${C.border}` }}>
        {section.title}
      </div>
      {section.bullets && section.bullets.length > 0 && (
        <ul style={{ margin: 0, paddingLeft: 20, marginBottom: section.content ? 10 : 0 }}>
          {section.bullets.map((b, i) => (
            <li key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2, lineHeight: 1.7, marginBottom: 3 }}>{b}</li>
          ))}
        </ul>
      )}
      {section.content && (
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2, lineHeight: 1.75, margin: 0 }}>{section.content}</p>
      )}
    </div>
  );
}

export default function FileDetailPage({ file, onNavigate }) {
  const { deleteFile } = useAppData();
  const { showToast }  = useToast();
  const [pdfState, setPdfState] = useState('idle'); // idle | loading | done | error
  const [sections, setSections] = useState([]);
  const [rawText, setRawText]   = useState('');
  const [showRaw, setShowRaw]   = useState(false);

  if (!file) {
    return (
      <div className="page-pad" style={{ background: C.bg0, flex: 1, overflowY: 'auto' }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3, marginTop: 60, textAlign: 'center' }}>
          File not found.
          <button onClick={() => onNavigate('files')} style={{ display: 'block', margin: '12px auto 0', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.accent, background: 'none', border: 'none', cursor: 'pointer' }}>← Back to Files</button>
        </div>
      </div>
    );
  }

  const isPdf = file.fileName?.toLowerCase().endsWith('.pdf');
  const fileUrl = `${import.meta.env.BASE_URL}files/${file.fileName}`;
  const catStyle = CAT_STYLE[file.category] || CAT_STYLE.Other;

  const loadPdf = async () => {
    if (!isPdf) return;
    setPdfState('loading');
    try {
      const { extractSections } = await import('../utils/pdfParser.js');
      const result = await extractSections(fileUrl);
      if (result && result.sections && result.sections.length > 0) {
        setSections(result.sections);
        setRawText(result.rawText || '');
        setPdfState('done');
      } else {
        setRawText(result?.rawText || '');
        setPdfState('done');
      }
    } catch (err) {
      console.error('PDF load error:', err);
      setPdfState('error');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${file.title}"?`)) return;
    await deleteFile(file.id);
    showToast('File removed', 'info');
    onNavigate('files');
  };

  return (
    <div className="page-pad" style={{ background: C.bg0, flex: 1, overflowY: 'auto' }}>
      {/* Back + actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <button onClick={() => onNavigate('files')}
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
          ← Back to Files
        </button>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {isPdf && (
            <a href={fileUrl} target="_blank" rel="noopener noreferrer"
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '7px 14px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer', textDecoration: 'none' }}>
              Open PDF ↗
            </a>
          )}
          {!isPdf && (
            <a href={fileUrl} download
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '7px 14px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer', textDecoration: 'none' }}>
              Download ↓
            </a>
          )}
          <button onClick={handleDelete}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '7px 14px', borderRadius: 6, background: 'transparent', color: C.danger, border: `1px solid ${C.danger}44`, cursor: 'pointer' }}>
            Delete
          </button>
        </div>
      </div>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: catStyle.bg, color: catStyle.color }}>
            {file.category || 'Other'}
          </span>
          {isPdf && (
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg3, background: C.bg2, padding: '2px 8px', borderRadius: 4 }}>PDF</span>
          )}
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 700, color: C.fg1, margin: '0 0 8px 0', lineHeight: 1.25 }}>
          {file.title}
        </h1>
        {file.date && (
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg3, marginBottom: 8 }}>
            Added {file.date}
            {file.relatedProject && <span> · {file.relatedProject}</span>}
          </div>
        )}
        {file.summary && (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2, lineHeight: 1.7, margin: 0, maxWidth: 680 }}>{file.summary}</p>
        )}
        {file.tags && file.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
            {file.tags.map(t => (
              <span key={t} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, background: C.bg2, color: C.fg3, padding: '3px 8px', borderRadius: 99, border: `1px solid ${C.border}` }}>{t}</span>
            ))}
          </div>
        )}
      </div>

      <div style={{ height: 1, background: C.border, margin: '20px 0' }} />

      {/* PDF content area */}
      {isPdf && (
        <>
          {pdfState === 'idle' && (
            <div style={{ background: C.bg1, border: `1px dashed ${C.border}`, borderRadius: 8, padding: '32px 24px', textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2, marginBottom: 14 }}>
                Load and extract the PDF content to read it here.
              </div>
              <button onClick={loadPdf}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '8px 20px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}>
                Load PDF Content
              </button>
            </div>
          )}

          {pdfState === 'loading' && (
            <div style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 8, padding: '32px 24px', textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3 }}>Extracting PDF content…</div>
            </div>
          )}

          {pdfState === 'error' && (
            <div style={{ background: C.dangerBg, border: `1px solid ${C.danger}33`, borderRadius: 8, padding: '20px 24px', marginBottom: 24 }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.danger, marginBottom: 8 }}>Could not load PDF content.</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg2, marginBottom: 12 }}>
                Make sure the file <code style={{ fontFamily: "'JetBrains Mono', monospace" }}>{file.fileName}</code> is uploaded to <code style={{ fontFamily: "'JetBrains Mono', monospace" }}>public/files/</code> in the GitHub repo.
              </div>
              <a href={fileUrl} target="_blank" rel="noopener noreferrer"
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.accent }}>
                Try opening PDF directly ↗
              </a>
            </div>
          )}

          {pdfState === 'done' && sections.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.fg3, marginBottom: 16 }}>
                Content — {sections.length} sections
              </div>
              {sections.map((s, i) => <SectionBlock key={i} section={s} />)}
              {rawText && (
                <div style={{ marginTop: 8 }}>
                  <button onClick={() => setShowRaw(r => !r)}
                    style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    {showRaw ? '▲ Hide raw text' : '▼ Show raw text'}
                  </button>
                  {showRaw && (
                    <pre style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.fg2, background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6, padding: '16px', marginTop: 8, whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6, maxHeight: 400, overflowY: 'auto' }}>
                      {rawText}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}

          {pdfState === 'done' && sections.length === 0 && rawText && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.fg3, marginBottom: 12 }}>
                Extracted Text
              </div>
              <pre style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.fg2, background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6, padding: '16px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6, maxHeight: 500, overflowY: 'auto' }}>
                {rawText}
              </pre>
            </div>
          )}

          {pdfState === 'done' && sections.length === 0 && !rawText && (
            <div style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 8, padding: '24px', textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3 }}>No text could be extracted from this PDF.</div>
              <a href={fileUrl} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-block', marginTop: 10, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.accent }}>
                Open PDF directly ↗
              </a>
            </div>
          )}
        </>
      )}

      {!isPdf && (
        <div style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 8, padding: '24px', textAlign: 'center' }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2, marginBottom: 12 }}>
            This file can be downloaded from GitHub.
          </div>
          <a href={fileUrl} download
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '8px 20px', borderRadius: 6, background: C.accent, color: '#fff', textDecoration: 'none', display: 'inline-block' }}>
            Download File ↓
          </a>
        </div>
      )}
    </div>
  );
}
