import { C, alpha } from '../../tokens';
import { IllScenario } from '../../components/illustrations';

// Shown when there are no commodities tracked yet. `canAdd` gates the CTA so
// viewers see the explanation but no action.
export default function EmptyState({ onAdd, canAdd }) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div style={{ maxWidth: 460, textAlign: 'center', background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 12, padding: '40px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <span style={{ width: 56, height: 56, borderRadius: 14, background: `linear-gradient(135deg, ${C.accentBg} 0%, ${C.bg2} 100%)`, border: `1px solid ${alpha(C.accent, 44)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent }}>
            <IllScenario size={36} />
          </span>
        </div>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, color: C.fg1, marginBottom: 10 }}>No commodities tracked yet</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.fg2, lineHeight: 1.6, marginBottom: canAdd ? 22 : 0 }}>
          Track the price of raw materials and commodities — coconut husk, coir fiber, copra, and more — week by week.
        </div>
        {canAdd && (
          <button onClick={onAdd}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, padding: '9px 20px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}>
            + Track your first commodity
          </button>
        )}
      </div>
    </div>
  );
}
