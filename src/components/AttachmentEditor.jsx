import { C, alpha } from '../tokens';
import AttachedFileViewer from './AttachedFileViewer';
import UploadZone from './UploadZone';

// Presentational wrapper used in the edit UI of IdeaDetailPage and
// PlanDetailPage. Renders either the existing-file viewer (when there's
// a saved attachment that the user hasn't opted to replace) or the
// upload dropzone (when the slot is empty or the user clicked Replace).
//
// State stays in the parent so save semantics are unchanged — this
// component only consolidates the conditional rendering decision and the
// onReplace/onRemove wiring that was previously copied byte-for-byte
// across two pages.
export default function AttachmentEditor({
  attachedFile,
  pendingFile,
  replacingFile,
  onPendingFile,
  onReplaceClick,
  onRemove,
  onCancelReplace,   // optional — when present, shows a Cancel-replace
                     // affordance during the replacing state so the user
                     // can back out without accidentally deleting their
                     // existing attachment on save.
}) {
  if (attachedFile && !replacingFile) {
    return (
      <AttachedFileViewer
        file={attachedFile}
        editing
        onReplace={onReplaceClick}
        onRemove={onRemove}
      />
    );
  }
  return (
    <div>
      {attachedFile && replacingFile && onCancelReplace && (
        // Visible reminder + escape hatch. Without this, the user who
        // clicked Replace and then changed their mind has no way to
        // revert — and saving with no pendingFile previously deleted
        // the attachment silently.
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2, background: C.accentBg, border: `1px solid ${alpha(C.accent, 33)}`, borderRadius: 6, padding: '8px 12px', marginBottom: 8 }}>
          <span>
            Replacing <strong style={{ color: C.fg1 }}>{attachedFile.name || 'attached file'}</strong>
            {!pendingFile && ' — pick a new file or cancel to keep the existing one.'}
          </span>
          <button type="button" onClick={onCancelReplace}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg2, background: 'none', border: `1px solid ${C.border}`, borderRadius: 5, cursor: 'pointer', padding: '4px 10px', whiteSpace: 'nowrap', flexShrink: 0 }}>
            Cancel replace
          </button>
        </div>
      )}
      <UploadZone
        file={pendingFile}
        onFile={onPendingFile}
        onRemove={() => onPendingFile(null)}
      />
    </div>
  );
}
