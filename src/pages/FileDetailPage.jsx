import { useState } from 'react';
import { C, alpha } from '../tokens';
import { useAppData } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { getCategoryStyle } from '../utils/categoryStyles';
import ConfirmModal from '../components/ConfirmModal';

export default function FileDetailPage({ file, onNavigate }) {
  const { deleteFile } = useAppData();
  const { showToast }  = useToast();
  const [showInfo, setShowInfo]   = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  if (!file) {
    return (
      <div className="page-pad" style={{ background: C.bg0, flex: 1, overflowY: 'auto' }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: C.fg3, marginTop: 60, textAlign: 'center' }}>
          File not found.
          <button onClick={() => onNavigate('documents')} style={{ display: 'block', margin: '12px auto 0', fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.accent, background: 'none', border: 'none', cursor: 'pointer' }}>← Back to Documents</button>
        </div>
      </div>
    );
  }

  const isPdf = file.fileName?.toLowerCase().endsWith('.pdf');
  const fileUrl = `${import.meta.env.BASE_URL}files/${encodeURIComponent(file.fileName)}`;
  const catStyle = getCategoryStyle(file.category);

  const handleDelete = () => setConfirmDel(true);
  const confirmDelete = async () => {
    await deleteFile(file.id);
    showToast('Document removed', 'info');
    onNavigate('documents');
  };

  return (
    <>
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', background: C.bg0 }}>

      {/* Compact top bar */}
      <div style={{ flexShrink: 0, height: 48, background: C.bg2, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', paddingInline: 20, gap: 12 }}>
        <button onClick={() => onNavigate('documents')}
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
          ← Documents
        </button>

        <div style={{ width: 1, height: 18, background: C.border, flexShrink: 0 }} />

        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500, color: C.fg1, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {file.title}
        </span>

        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, padding: '2px 9px', borderRadius: 99, background: catStyle.bg, color: catStyle.color, flexShrink: 0 }}>
          {file.category || 'Other'}
        </span>

        {file.summary && (
          <button onClick={() => setShowInfo(s => !s)}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: showInfo ? C.accent : C.fg3, background: showInfo ? C.accentBg : 'transparent', border: `1px solid ${showInfo ? alpha(C.accent, 44) : C.border}`, borderRadius: 5, padding: '4px 10px', cursor: 'pointer', flexShrink: 0 }}>
            Info
          </button>
        )}

        <a href={fileUrl} target="_blank" rel="noopener noreferrer"
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, padding: '5px 12px', borderRadius: 5, background: C.accent, color: '#fff', textDecoration: 'none', flexShrink: 0 }}>
          Open ↗
        </a>

        <button onClick={handleDelete}
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: '5px 10px', borderRadius: 5, background: 'transparent', color: C.danger, border: `1px solid ${alpha(C.danger, 33)}`, cursor: 'pointer', flexShrink: 0 }}>
          Delete
        </button>
      </div>

      {/* Info panel (collapsible) */}
      {showInfo && (
        <div style={{ flexShrink: 0, background: C.accentBg, borderBottom: `1px solid ${C.border}`, padding: '12px 20px', display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {file.summary && (
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Summary</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.fg2, lineHeight: 1.6 }}>{file.summary}</div>
            </div>
          )}
          {file.tags && file.tags.length > 0 && (
            <div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Tags</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {file.tags.map(t => (
                  <span key={t} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, background: C.bg0, color: C.fg3, padding: '2px 8px', borderRadius: 99, border: `1px solid ${C.border}` }}>{t}</span>
                ))}
              </div>
            </div>
          )}
          {file.relatedProject && (
            <div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Project</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.fg2 }}>{file.relatedProject}</div>
            </div>
          )}
        </div>
      )}

      {/* PDF viewer — fills all remaining height */}
      {isPdf && (
        <iframe
          src={fileUrl}
          title={file.title}
          style={{ flex: 1, border: 'none', width: '100%', display: 'block' }}
        />
      )}

      {!isPdf && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: C.fg2 }}>This file type cannot be previewed.</div>
          <a href={fileUrl} download
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500, padding: '8px 20px', borderRadius: 6, background: C.accent, color: '#fff', textDecoration: 'none' }}>
            Download File ↓
          </a>
        </div>
      )}
    </div>
    {confirmDel && (
      <ConfirmModal
        title="Delete document?"
        message={`Are you sure you want to delete "${file.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDel(false)} />
    )}
    </>
  );
}
