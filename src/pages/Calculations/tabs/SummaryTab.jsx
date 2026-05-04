import { C } from '../../../tokens';

// Verdict callout. Revenue Composition lives in the Project Health Dashboard
// up top so users see top-line health (IRR + revenue mix) at a glance without
// opening this tab. Editorial sage-cream treatment with left-stripe accent;
// colour signals positive/negative without going alarm-red.
export default function SummaryTab({ insight }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{
        background: insight.positive ? 'rgba(116,140,98,0.06)' : 'rgba(192,57,43,0.05)',
        borderLeft: `3px solid ${insight.positive ? C.accent : '#c0392b'}`,
        border: `1px solid ${insight.positive ? 'rgba(116,140,98,0.18)' : 'rgba(192,57,43,0.16)'}`,
        borderLeftWidth: 3,
        borderRadius: '0 8px 8px 0',
        padding: '14px 18px',
        display: 'flex', gap: 14, alignItems: 'flex-start',
      }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: insight.positive ? 'rgba(116,140,98,0.18)' : 'rgba(192,57,43,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
          {insight.positive
            ? <svg viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="2" strokeLinecap="round" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
        </div>
        <div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700, color: insight.positive ? C.accent : '#c0392b', marginBottom: 4 }}>{insight.verdict}</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2, lineHeight: 1.6 }}>{insight.text}</div>
        </div>
      </div>
    </div>
  );
}
