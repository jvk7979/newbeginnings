import { C, alpha } from '../../tokens';
import { IS } from '../../components/calc/primitives';
import { IllCalc, IllScenario } from '../../components/illustrations';

export function EmptyNoEligible({ onNavigate }) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div style={{ maxWidth: 480, textAlign: 'center', background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 12, padding: '40px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <span style={{ width: 56, height: 56, borderRadius: 14, background: `linear-gradient(135deg, ${C.accentBg} 0%, ${C.bg2} 100%)`, border: `1px solid ${alpha(C.accent, 44)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent }}>
            <IllCalc size={36} />
          </span>
        </div>
        <div style={{ fontFamily: "'Inter', Georgia, serif", fontSize: 20, color: C.fg1, marginBottom: 10 }}>No projects ready to calculate</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.fg2, lineHeight: 1.6, marginBottom: 22 }}>
          Open a project, click <strong>Edit</strong>, and tick <strong>"Eligible for Calculations"</strong>. It'll show up here.
        </div>
        <button onClick={() => onNavigate('projects')}
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, padding: '9px 20px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}>
          Go to Projects
        </button>
      </div>
    </div>
  );
}

export function EmptyNoSelection({ eligible, onPick }) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div style={{ maxWidth: 480, textAlign: 'center', background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 12, padding: '40px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <span style={{ width: 56, height: 56, borderRadius: 14, background: `linear-gradient(135deg, ${C.accentBg} 0%, ${C.bg2} 100%)`, border: `1px solid ${alpha(C.accent, 44)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent }}>
            <IllScenario size={36} />
          </span>
        </div>
        <div style={{ fontFamily: "'Inter', Georgia, serif", fontSize: 20, color: C.fg1, marginBottom: 10 }}>Pick a project to begin</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.fg2, lineHeight: 1.6, marginBottom: 22 }}>
          Choose one of the projects you've marked eligible. Their saved calculation loads automatically.
        </div>
        <select onChange={e => e.target.value && onPick(e.target.value)} defaultValue=""
          style={{ ...IS, fontSize: 14, padding: '8px 12px', cursor: 'pointer', maxWidth: 320 }}>
          <option value="" disabled>Select a project…</option>
          {eligible.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
      </div>
    </div>
  );
}
