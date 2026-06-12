import { useState } from 'react';
import { C, alpha } from '../../tokens';
import { CLIP_TYPES } from './ClipTypeBadge';
import { useToast } from '../../context/ToastContext';
import UploadZone from '../../components/UploadZone';
import {
  uploadFileToDB, uploadImageToDB, deleteFileFromDB,
  FILE_MAX_BYTES, FILE_MAX_LABEL, fmtSize,
} from '../../utils/fileStorage';
import { useDialogA11y } from '../../utils/useDialogA11y';

const inputStyle = { width: '100%', background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6, color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 15, padding: '9px 12px', outline: 'none', boxSizing: 'border-box' };
const labelStyle = { fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: C.fg2, marginBottom: 5, display: 'block' };

const parseTags = (s) => s.split(',').map(t => t.trim()).filter(Boolean);
const toTitleCase = (s) => s[0] + s.slice(1).toLowerCase();

// Human-readable type labels for the picker step.
const TYPE_PICKER = [
  { type: 'web',   blurb: 'A link to an article, policy page, or report' },
  { type: 'pdf',   blurb: 'Upload a PDF, DOC, or DOCX document' },
  { type: 'quote', blurb: 'A noteworthy line from a source or field note' },
  { type: 'photo', blurb: 'A site photo or image from the field' },
];

export default function AddClipModal({ onClose, onAdd }) {
  const { showToast } = useToast();
  const { dialogProps, titleId } = useDialogA11y(onClose);
  const [step, setStep] = useState('type');   // 'type' | 'fields'
  const [type, setType] = useState(null);

  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput,   setTagsInput]   = useState('');
  const [sourceLabel, setSourceLabel] = useState('');
  const [url,         setUrl]         = useState('');
  const [quoteText,   setQuoteText]   = useState('');
  const [file,        setFile]        = useState(null);   // pdf — File object
  const [imageFile,   setImageFile]   = useState(null);   // photo — File object
  const [imageErr,    setImageErr]    = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [uploadPct,   setUploadPct]   = useState(null);

  const pickImage = (f) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) { setImageErr('Please choose an image file.'); return; }
    if (f.size > FILE_MAX_BYTES) { setImageErr(`Image too large (${fmtSize(f.size)}). Maximum is ${FILE_MAX_LABEL}.`); return; }
    setImageErr('');
    setImageFile(f);
  };

  const canSubmit = (() => {
    if (type === 'web')   return url.trim() && title.trim();
    if (type === 'pdf')   return !!file && title.trim();
    if (type === 'quote') return !!quoteText.trim();
    if (type === 'photo') return !!imageFile && title.trim();
    return false;
  })();

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    let uploadedBlobId = null;
    try {
      const base = {
        type,
        title: title.trim(),
        description: description.trim(),
        tags: parseTags(tagsInput),
        sourceLabel: sourceLabel.trim(),
      };
      let clip;
      if (type === 'web') {
        clip = { ...base, url: url.trim() };
      } else if (type === 'quote') {
        clip = { ...base, quoteText: quoteText.trim(), title: base.title || quoteText.trim().slice(0, 80) };
      } else if (type === 'pdf') {
        const attachedFile = await uploadFileToDB(file, setUploadPct);
        uploadedBlobId = attachedFile.blobId;
        clip = { ...base, attachedFile };
      } else {
        const photo = await uploadImageToDB(imageFile, setUploadPct);
        uploadedBlobId = photo.blobId;
        clip = { ...base, photo };
      }
      await onAdd(clip);
      onClose();
    } catch (err) {
      console.error('[AddClipModal]', err);
      // Upload succeeded but the Firestore write failed — clean up the orphan.
      if (uploadedBlobId) { try { await deleteFileFromDB(uploadedBlobId); } catch { /* orphan scan cleans up */ } }
      showToast(err?.message || 'Could not save clip. Please try again.', 'error');
      setSubmitting(false);   // stay open so input isn't lost
    } finally {
      setUploadPct(null);
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(28,25,20,0.55)', zIndex: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div {...dialogProps}
           style={{ position: 'relative', background: C.bg0, borderRadius: 12, padding: '26px 24px', width: '100%', maxWidth: 520, maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.22)', animation: 'fadeIn 160ms ease' }}>
        <button onClick={onClose} aria-label="Close"
          onMouseEnter={e => { e.currentTarget.style.color = C.fg1; e.currentTarget.style.background = C.bg2; }}
          onMouseLeave={e => { e.currentTarget.style.color = C.fg3; e.currentTarget.style.background = 'none'; }}
          style={{ position: 'absolute', top: 6, right: 6, width: 44, height: 44, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: C.fg3, fontSize: 26, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          ×
        </button>

        <div id={titleId} style={{ fontFamily: "'Inter', Georgia, serif", fontSize: 22, fontWeight: 600, color: C.fg1, marginBottom: 4, paddingRight: 36 }}>
          New Clip
        </div>

        {step === 'type' && (
          <>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3, marginBottom: 18 }}>Choose a clip type</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {TYPE_PICKER.map(({ type: t, blurb }) => (
                <button key={t} onClick={() => { setType(t); setStep('fields'); }}
                  style={{ textAlign: 'left', background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 16px', cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color 140ms' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = alpha(C.accent, 55); }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: C.fg1, marginBottom: 4 }}>
                    <span aria-hidden="true" style={{ marginRight: 6 }}>{CLIP_TYPES[t].glyph}</span>
                    {toTitleCase(CLIP_TYPES[t].label)}
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, lineHeight: 1.45 }}>{blurb}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 'fields' && (
          <>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3, marginBottom: 18 }}>
              <button onClick={() => setStep('type')}
                style={{ background: 'none', border: 'none', color: C.accent, cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: 'inherit' }}>
                ← Type
              </button>
              {'  ·  '}{toTitleCase(CLIP_TYPES[type].label)}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {type === 'web' && (
                <div>
                  <label style={labelStyle}>URL</label>
                  <input style={inputStyle} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" />
                </div>
              )}

              {type === 'pdf' && (
                <div>
                  <label style={labelStyle}>Document</label>
                  <UploadZone file={file} onFile={setFile} onRemove={() => setFile(null)} progress={uploadPct} />
                </div>
              )}

              {type === 'photo' && (
                <div>
                  <label style={labelStyle}>Image</label>
                  {imageFile ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 8, background: C.accentBg, border: `1px solid ${alpha(C.accent, 44)}` }}>
                      <span style={{ flex: 1, minWidth: 0, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{imageFile.name}</span>
                      <button onClick={() => { setImageFile(null); setImageErr(''); }}
                        style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.danger, background: 'none', border: `1px solid ${alpha(C.danger, 33)}`, borderRadius: 5, padding: '4px 10px', cursor: 'pointer', flexShrink: 0 }}>
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label tabIndex={0}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.querySelector('input').click(); } }}
                      style={{ display: 'block', border: `2px dashed ${C.border}`, borderRadius: 8, padding: '20px', textAlign: 'center', cursor: 'pointer', background: C.bg1, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2, outline: 'none' }}>
                      Click to choose an image
                      <input type="file" accept="image/*" style={{ display: 'none' }}
                        onChange={e => { pickImage(e.target.files[0]); e.target.value = ''; }} />
                    </label>
                  )}
                  {imageErr && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.danger, marginTop: 6 }}>{imageErr}</div>}
                </div>
              )}

              {type === 'quote' && (
                <div>
                  <label style={labelStyle}>Quote</label>
                  <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 90, lineHeight: 1.6 }} value={quoteText}
                    onChange={e => setQuoteText(e.target.value)} placeholder="The noteworthy line…" />
                </div>
              )}

              {type !== 'quote' && (
                <div>
                  <label style={labelStyle}>Title</label>
                  <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} maxLength={160} placeholder="Clip title" />
                </div>
              )}

              <div>
                <label style={labelStyle}>{type === 'quote' ? 'Context (optional)' : 'Description (optional)'}</label>
                <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 60, lineHeight: 1.6 }} value={description}
                  onChange={e => setDescription(e.target.value)} placeholder="A short note or excerpt…" />
              </div>

              <div>
                <label style={labelStyle}>Tags (optional)</label>
                <input style={inputStyle} value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="Comma-separated, e.g. Subsidy, Policy" />
              </div>

              <div>
                <label style={labelStyle}>Source label (optional)</label>
                <input style={inputStyle} value={sourceLabel} onChange={e => setSourceLabel(e.target.value)}
                  placeholder={(type === 'pdf' || type === 'photo') ? 'e.g. Personal, Field — Apr 18' : 'e.g. coirboard.gov.in, CIRCOT field note'} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
              <button onClick={onClose}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, padding: '9px 18px', borderRadius: 6, background: 'transparent', color: C.fg2, border: `1px solid ${C.border}`, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={!canSubmit || submitting}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, padding: '9px 20px', borderRadius: 6, background: (!canSubmit || submitting) ? C.bg2 : C.accent, color: (!canSubmit || submitting) ? C.fg3 : '#fff', border: 'none', cursor: (!canSubmit || submitting) ? 'not-allowed' : 'pointer' }}>
                {submitting ? 'Saving…' : 'Add Clip'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
