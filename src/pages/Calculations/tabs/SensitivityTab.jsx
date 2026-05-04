import { C } from '../../../tokens';
import { runSensitivity } from '../../../utils/calcEngine';

// Tornado chart of IRR sensitivity to ±20% on each key input. Bars
// right-of-centre (green) mean a positive flex helps IRR; bars left
// (red) hurt. Sorted by total impact.
export default function SensitivityTab({ input, calc }) {
  const rows = runSensitivity(input, 20);
  const maxAbs = Math.max(0.01, ...rows.map(r => Math.max(Math.abs(r.deltaLow), Math.abs(r.deltaHigh))));

  return (
    <div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg2, marginBottom: 14, lineHeight: 1.55 }}>
        How much each input moves IRR when flexed <strong>±20%</strong>. Bars to the right (green) mean a positive flex helps IRR; bars to the left (red) mean it hurts. Inputs are sorted by total impact.
      </div>
      {rows.length === 0 || calc.irr === null ? (
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, fontStyle: 'italic', padding: '20px 0' }}>
          Sensitivity needs a non-degenerate IRR. Add CAPEX, products, and costs first.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', alignItems: 'center', gap: 6, fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: C.fg3, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
            <span></span>
            <span style={{ textAlign: 'right' }}>−20%</span>
            <span>+20%</span>
          </div>
          {rows.map(r => {
            const lowPct  = Math.abs(r.deltaLow)  / maxAbs * 100;
            const highPct = Math.abs(r.deltaHigh) / maxAbs * 100;
            const lowColor  = r.deltaLow  < 0 ? '#c0392b' : '#2a7d3c';
            const highColor = r.deltaHigh > 0 ? '#2a7d3c' : '#c0392b';
            return (
              <div key={r.key} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', alignItems: 'center', gap: 6, padding: '6px 0' }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: C.fg1 }}>{r.label}</span>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg3, minWidth: 40, textAlign: 'right' }}>
                    {r.deltaLow > 0 ? '+' : ''}{r.deltaLow.toFixed(1)}%
                  </span>
                  <div style={{ flex: 1, height: 14, background: C.bg2, borderRadius: 3, overflow: 'hidden', display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ width: `${lowPct}%`, height: '100%', background: lowColor, opacity: 0.85 }} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ flex: 1, height: 14, background: C.bg2, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${highPct}%`, height: '100%', background: highColor, opacity: 0.85 }} />
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg3, minWidth: 40 }}>
                    {r.deltaHigh > 0 ? '+' : ''}{r.deltaHigh.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, marginTop: 8, paddingTop: 10, borderTop: `1px solid ${C.border}`, lineHeight: 1.55 }}>
            Base IRR: <strong style={{ color: C.fg1 }}>{calc.irr.toFixed(1)}%</strong>. Top entries dominate your project's risk profile — focus diligence there.
          </div>
        </div>
      )}
    </div>
  );
}
