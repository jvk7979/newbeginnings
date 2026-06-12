import { C, alpha } from '../../tokens';
import { IllLibrary } from '../../components/illustrations';

// Shown when the project has zero clips. `canAdd` gates the CTA button so
// viewers (read-only role) see the explanation but no action.
export default function EmptyState({ onAddClip, canAdd }) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div style={{ maxWidth: 460, textAlign: 'center', background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 12, padding: '40px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <span style={{ width: 56, height: 56, borderRadius: 14, background: `linear-gradient(135deg, ${C.accentBg} 0%, ${C.bg2} 100%)`, border: `1px solid ${alpha(C.accent, 44)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent }}>
            <IllLibrary size={36} />
          </span>
        </div>
        <div style={{ fontFamily: "'Inter', Georgia, serif", fontSize: 20, color: C.fg1, marginBottom: 10 }}>No clips yet</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.fg2, lineHeight: 1.6, marginBottom: canAdd ? 22 : 0 }}>
          Collect the web links, PDFs, quotes, and photos you gather while researching this project.
        </div>
        {canAdd && (
          <button onClick={onAddClip}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, padding: '9px 20px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}>
            + Add your first clip
          </button>
        )}
      </div>
    </div>
  );
}
