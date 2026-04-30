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
    <UploadZone
      file={pendingFile}
      onFile={onPendingFile}
      onRemove={() => onPendingFile(null)}
    />
  );
}
