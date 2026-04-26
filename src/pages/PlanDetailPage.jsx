import { C } from '../tokens';
import { useAppData } from '../context/AppContext';

export default function PlanDetailPage({ plan, onNavigate }) {
  const { plans } = useAppData();

  const resolved = plan ?? (plans.length > 0 ? plans[0] : null);

  if (!resolved) {
    return (
      <div className="page-pad" style={{ background: C.bg0 }}>
        <button onClick={() => onNavigate('plans')} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Business Plans
        </button>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3, marginTop: 40, textAlign: 'center' }}>No business plans yet. Create your first plan.</div>
      </div>
    );
  }

  const sections = resolved.sections || [];

  return (
    <div className="page-pad" style={{ background: C.bg0, paddingLeft: 48, paddingRight: 48 }}>
      <button onClick={() => onNavigate('plans')} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Business Plans
      </button>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Business Plan</div>
      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 32, fontWeight: 700, color: C.fg1, letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 8 }}>
        {resolved.title}
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.fg3, marginBottom: 32 }}>
        Updated {resolved.updated} · {resolved.sectionCount} sections · <span style={{ color: C.success }}>{resolved.status.charAt(0).toUpperCase() + resolved.status.slice(1)}</span>
      </div>
      {sections.length === 0 && (
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3 }}>No sections yet.</div>
      )}
      {sections.map((sec, i) => (
        <div key={i} style={{ marginBottom: 28, paddingBottom: 28, borderBottom: i < sections.length - 1 ? `1px solid ${C.border}` : 'none' }}>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 600, color: C.fg1, marginBottom: 10 }}>{sec.title}</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.fg2, lineHeight: 1.7 }}>{sec.content}</div>
        </div>
      ))}
    </div>
  );
}
