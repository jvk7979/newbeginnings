import { C } from '../tokens';

export default function ConfirmModal({ title, message, confirmLabel = 'Delete', variant = 'danger', onConfirm, onCancel }) {
  const btnColor = variant === 'danger' ? C.danger : C.accent;

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(28,25,20,0.55)', zIndex: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onCancel()}>
      <div style={{ position: 'relative', background: C.bg0, borderRadius: 12, padding: '28px 24px', width: '100%', maxWidth: 420, boxShadow: '0 8px 40px rgba(0,0,0,0.22)', animation: 'fadeIn 160ms ease' }}>
        {/* Top-right × close. Mobile users muscle-memory expect this; on
            small screens the bottom Cancel button isn't always reachable
            with one thumb. 44×44 meets HIG/WCAG touch-target minimums. */}
        <button
          onClick={onCancel}
          aria-label="Close"
          style={{ position: 'absolute', top: 6, right: 6, width: 44, height: 44, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: C.fg3, fontSize: 26, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onMouseEnter={e => { e.currentTarget.style.color = C.fg1; e.currentTarget.style.background = C.bg2; }}
          onMouseLeave={e => { e.currentTarget.style.color = C.fg3; e.currentTarget.style.background = 'none'; }}>
          ×
        </button>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 19, fontWeight: 700, color: C.fg1, marginBottom: 10, paddingRight: 36 }}>{title}</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: C.fg2, lineHeight: 1.65, marginBottom: 24 }}>{message}</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, padding: '9px 20px', borderRadius: 6, background: 'transparent', color: C.fg2, border: `1px solid ${C.border}`, cursor: 'pointer' }}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, padding: '9px 20px', borderRadius: 6, background: btnColor, color: '#fff', border: 'none', cursor: 'pointer' }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
