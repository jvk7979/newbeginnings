import { useState, useEffect } from 'react';
import { C, alpha } from '../../tokens';
import ClipTypeBadge from './ClipTypeBadge';
import Tag from '../../components/Tag';
import ConfirmModal from '../../components/ConfirmModal';
import { useToast } from '../../context/ToastContext';
import { getFileUrl } from '../../utils/fileStorage';

const inputStyle = { width: '100%', background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6, color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 15, padding: '9px 12px', outline: 'none', boxSizing: 'border-box' };
const labelStyle = { fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: C.fg2, marginBottom: 5, display: 'block' };

const parseTags = (s) => s.split(',').map(t => t.trim()).filter(Boolean);

// Resolves a Storage download URL on demand. Used for both the photo <img>
// and the PDF "open" action.
function useBlobUrl(blobId) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let alive = true;
    if (blobId) getFileUrl(blobId).then(u => { if (alive) setUrl(u); }).catch(() => {});
    return () => { alive = false; };
  }, [blobId]);
  return url;
}

export default function ClipModal({ clip, onClose, onUpdate, onDelete, canEdit }) {
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title,       setTitle]       = useState(clip.title || '');
  const [description, setDescription] = useState(clip.description || '');
  const [tagsInput,   setTagsInput]   = useState((Array.isArray(clip.tags) ? clip.tags : []).join(', '));
  const [sourceLabel, setSourceLabel] = useState(clip.sourceLabel || '');
  const [quoteText,   setQuoteText]   = useState(clip.quoteText || '');

  const blobId  = clip.attachedFile?.blobId || clip.photo?.blobId || null;
  const blobUrl = useBlobUrl(clip.type === 'photo' ? blobId : null);

  const handleOpenDoc = async () => {
    try {
      const u = await getFileUrl(clip.attachedFile.blobId);
      window.open(u, '_blank', 'noopener,noreferrer');
    } catch {
      showToast('Could not open the document.', 'error');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(clip.id, {
        title: title.trim(),
        description: description.trim(),
        tags: parseTags(tagsInput),
        sourceLabel: sourceLabel.trim(),
        ...(clip.type === 'quote' ? { quoteText: quoteText.trim() } : {}),
      });
      setEditing(false);
      showToast('Clip updated', 'success');
    } catch (err) {
      console.error('[ClipModal/save]', err);
      showToast('Could not save changes.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const tags = Array.isArray(clip.tags) ? clip.tags : [];

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(28,25,20,0.55)', zIndex: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        onClick={e => e.target === e.currentTarget && onClose()}>
        <div style={{ position: 'relative', background: C.bg0, borderRadius: 12, padding: '26px 24px', width: '100%', maxWidth: 560, maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.22)', animation: 'fadeIn 160ms ease' }}>
          <button onClick={onClose} aria-label="Close"
            style={{ position: 'absolute', top: 6, right: 6, width: 44, height: 44, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: C.fg3, fontSize: 26, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ×
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingRight: 36 }}>
            <ClipTypeBadge type={clip.type} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg3 }}>{clip.date}</span>
          </div>

          {/* ── VIEW MODE ── */}
          {!editing && (
            <>
              {clip.type === 'photo' && (
                <div style={{ width: '100%', borderRadius: 8, border: `1px solid ${C.border}`, marginBottom: 16, overflow: 'hidden', background: C.bg2 }}>
                  {blobUrl
                    ? <img src={blobUrl} alt={clip.title || 'Clip photo'} style={{ width: '100%', display: 'block' }} />
                    : <div style={{ height: 220 }} />}
                </div>
              )}

              <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: clip.type === 'quote' ? 22 : 20, fontStyle: clip.type === 'quote' ? 'italic' : 'normal', fontWeight: 600, color: C.fg1, lineHeight: 1.35, marginBottom: 12 }}>
                {clip.type === 'quote' ? `"${clip.quoteText || ''}"` : (clip.title || 'Untitled')}
              </div>

              {clip.description && (
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.fg2, lineHeight: 1.65, marginBottom: 14, whiteSpace: 'pre-wrap' }}>{clip.description}</div>
              )}

              {clip.type === 'pdf' && clip.attachedFile?.blobId && (
                <button onClick={handleOpenDoc}
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, padding: '8px 16px', borderRadius: 6, background: C.accentBg, color: C.accent, border: `1px solid ${alpha(C.accent, 44)}`, cursor: 'pointer', marginBottom: 14 }}>
                  Open document — {clip.attachedFile.name}
                </button>
              )}

              {clip.sourceLabel && (
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontStyle: 'italic', color: C.fg3, marginBottom: 12 }}>{clip.sourceLabel}</div>
              )}

              {tags.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                  {tags.map((t, i) => <Tag key={i} label={t} />)}
                </div>
              )}

              {canEdit && (
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
                  <button onClick={() => setConfirmDel(true)}
                    style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: '8px 16px', borderRadius: 6, background: 'transparent', color: C.danger, border: `1px solid ${alpha(C.danger, 33)}`, cursor: 'pointer', marginRight: 'auto' }}>
                    Delete
                  </button>
                  <button onClick={() => setEditing(true)}
                    style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, padding: '8px 16px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}>
                    Edit
                  </button>
                </div>
              )}
            </>
          )}

          {/* ── EDIT MODE (metadata only) ── */}
          {editing && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {clip.type === 'quote' && (
                <div>
                  <label style={labelStyle}>Quote</label>
                  <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 90, lineHeight: 1.6 }} value={quoteText} onChange={e => setQuoteText(e.target.value)} />
                </div>
              )}
              {clip.type !== 'quote' && (
                <div>
                  <label style={labelStyle}>Title</label>
                  <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} maxLength={160} />
                </div>
              )}
              <div>
                <label style={labelStyle}>Description</label>
                <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 60, lineHeight: 1.6 }} value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Tags</label>
                <input style={inputStyle} value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="Comma-separated" />
              </div>
              <div>
                <label style={labelStyle}>Source label</label>
                <input style={inputStyle} value={sourceLabel} onChange={e => setSourceLabel(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button onClick={() => setEditing(false)}
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: '8px 16px', borderRadius: 6, background: 'transparent', color: C.fg2, border: `1px solid ${C.border}`, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, padding: '8px 18px', borderRadius: 6, background: saving ? C.bg2 : C.accent, color: saving ? C.fg3 : '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {confirmDel && (
        <ConfirmModal
          title="Delete clip?"
          message="Are you sure you want to delete this clip? You can undo for a few seconds."
          confirmLabel="Delete"
          onConfirm={() => { setConfirmDel(false); onClose(); onDelete(clip); }}
          onCancel={() => setConfirmDel(false)} />
      )}
    </>
  );
}
