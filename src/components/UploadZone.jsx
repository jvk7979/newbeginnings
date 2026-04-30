import { useState, useRef } from 'react';
import { C, alpha } from '../tokens';
import { FILE_MAX_BYTES, FILE_MAX_LABEL, detectType, fmtSize } from '../utils/fileStorage';

const ACCEPTED = ['PDF', 'DOC', 'DOCX'];

// Drag-and-drop / click-to-browse file picker.
// Props:
//   file      — currently selected File object (null = show drop zone)
//   onFile    — called with a validated File when user selects one
//   onRemove  — called when user clicks Remove on the selected file preview
export default function UploadZone({ file, onFile, onRemove }) {
  const [drag, setDrag] = useState(false);
  const [err,  setErr]  = useState('');
  const inputRef = useRef(null);

  const validate = (f) => {
    const type = detectType(f);
    if (!ACCEPTED.includes(type)) {
      setErr('Unsupported file type. Please upload a PDF, DOC, or DOCX.');
      return false;
    }
    if (f.size > FILE_MAX_BYTES) {
      setErr(`File too large (${fmtSize(f.size)}). Maximum is ${FILE_MAX_LABEL}.`);
      return false;
    }
    setErr('');
    return true;
  };

  const pick = (f) => { if (validate(f)) onFile(f); };

  // ── File selected — show preview ──────────────────────────────────────────
  if (file) {
    const type = detectType(file);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderRadius: 8, background: C.accentBg, border: `1px solid ${alpha(C.accent, 44)}` }}>
        <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" width="20" height="20" style={{ flexShrink: 0 }}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
        </svg>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: C.fg1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: C.fg3, marginTop: 2 }}>
            {type} · {fmtSize(file.size)} · ready to save
          </div>
        </div>
        <button onClick={onRemove}
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.danger, background: 'none', border: `1px solid ${alpha(C.danger, 33)}`, borderRadius: 5, padding: '4px 10px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
          Remove
        </button>
      </div>
    );
  }

  // ── No file — show drop zone ──────────────────────────────────────────────
  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload file"
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) pick(f); }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
        style={{
          border: `2px dashed ${drag ? C.accent : C.border}`,
          borderRadius: 8,
          padding: '28px 20px',
          textAlign: 'center',
          cursor: 'pointer',
          background: drag ? C.accentBg : C.bg1,
          transition: 'border-color 150ms, background 150ms',
          outline: 'none',
        }}>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files[0]; if (f) pick(f); e.target.value = ''; }}
        />
        <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke={drag ? C.accent : C.fg3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="30" height="30" style={{ margin: '0 auto 10px', display: 'block', transition: 'stroke 150ms' }}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17,8 12,3 7,8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500, color: C.fg2, marginBottom: 5 }}>
          Drop a file here, or{' '}
          <span style={{ color: C.accent, fontWeight: 600 }}>click to browse</span>
        </div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3 }}>
          PDF · DOC · DOCX &nbsp;·&nbsp; Max {FILE_MAX_LABEL}
        </div>
      </div>

      {err && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.danger, marginTop: 7 }}>
          <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="13" height="13">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {err}
        </div>
      )}
    </div>
  );
}
