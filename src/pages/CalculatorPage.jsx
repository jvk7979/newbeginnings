import { useState } from 'react';
import { C } from '../tokens';

const LARGE = { capex: 200, fullRevPeat: 238, fullRevFiber: 143, fullRevChar: 96, fixedCosts: 60, varCostPct: 0.52, subsidyPct: 0.45 };
const SMALL  = { capex: 55,  fullRevPeat: 60,  fullRevFiber: 20,  fullRevChar: 0,  fixedCosts: 18, varCostPct: 0.58, subsidyPct: 0.40 };

export default function CalculatorPage() {
  const [plant,    setPlant]    = useState('large');
  const [capacity, setCapacity] = useState(60);
  const [mix,      setMix]      = useState({ peat: true, fiber: true, charcoal: true });
  const [subsidy,  setSubsidy]  = useState(true);

  const model = plant === 'large' ? LARGE : SMALL;
  const cap   = capacity / 100;

  const rev = {
    peat:     mix.peat     ? model.fullRevPeat  * cap : 0,
    fiber:    mix.fiber    ? model.fullRevFiber * cap : 0,
    charcoal: mix.charcoal ? model.fullRevChar  * cap : 0,
  };
  const totalRev    = rev.peat + rev.fiber + rev.charcoal;
  const varCosts    = totalRev * model.varCostPct;
  const ebitda      = totalRev - varCosts - model.fixedCosts;
  const effectCapex = subsidy ? model.capex * (1 - model.subsidyPct) : model.capex;
  const irr         = ebitda > 0 ? ((ebitda / effectCapex) * 100).toFixed(1) : '—';
  const payback     = ebitda > 0 ? (effectCapex / ebitda).toFixed(1) : '—';
  const breakEven   = Math.ceil((model.fixedCosts / ((1 - model.varCostPct) * (model.fullRevPeat + model.fullRevFiber + model.fullRevChar))) * 100);

  const fmt    = (v) => v < 0 ? `-₹${Math.abs(v).toFixed(1)} L` : `₹${v.toFixed(1)} L`;
  const fmtCr  = (v) => v >= 100 ? `₹${(v / 100).toFixed(2)} Cr` : fmt(v);
  const card   = (accent) => ({ background: accent ? C.accentBg : C.bg1, border: `1px solid ${accent ? '#B8892A33' : C.border}`, borderRadius: 8, padding: '18px 20px' });
  const statVal = (pos) => ({ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 600, color: pos === 'neg' ? C.danger : pos === 'acc' ? C.accent : C.success });
  const lbl    = { fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.fg3, marginBottom: 5, display: 'block' };

  const ToggleBtn = ({ active, onClick, children }) => (
    <button onClick={onClick} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: active ? 600 : 400, padding: '5px 14px', borderRadius: 999, border: `1px solid ${active ? '#B8892A66' : C.border}`, background: active ? C.accentBg : 'transparent', color: active ? C.accent : C.fg3, cursor: 'pointer', transition: 'all 120ms' }}>{children}</button>
  );

  return (
    <div className="page-pad" style={{ background: C.bg0 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 700, color: C.fg1, letterSpacing: '-0.02em' }}>Financial Calculator</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, marginTop: 4 }}>Model revenue and EBITDA based on feasibility data</div>
      </div>

      <div className="grid-calc">
        {/* Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={card(false)}>
            <span style={lbl}>Plant Model</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <ToggleBtn active={plant === 'large'} onClick={() => setPlant('large')}>₹2 Cr Integrated</ToggleBtn>
              <ToggleBtn active={plant === 'small'} onClick={() => setPlant('small')}>₹50–60 L Unit</ToggleBtn>
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, marginTop: 10 }}>
              {plant === 'large' ? 'Cocopeat + Coir Fiber + Shell Charcoal · Konaseema site' : 'Loose pith + grow bags only · Kadiyam anchor buyer required'}
            </div>
          </div>

          <div style={card(false)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <span style={lbl}>Capacity Utilisation</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 600, color: C.accent }}>{capacity}%</span>
            </div>
            <input type="range" min="10" max="100" step="1" value={capacity} onChange={e => setCapacity(+e.target.value)} style={{ width: '100%', accentColor: C.accent, cursor: 'pointer', height: 4 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: C.fg3 }}>10%</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: capacity <= breakEven ? C.danger : C.success }}>Break-even: {breakEven}%</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: C.fg3 }}>100%</span>
            </div>
          </div>

          <div style={card(false)}>
            <span style={lbl}>Product Mix</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { key: 'peat',     label: 'Cocopeat / Grow Bags', color: '#2E7D52' },
                { key: 'fiber',    label: 'Coir Fiber',           color: '#2B5FA6' },
                { key: 'charcoal', label: 'Shell Charcoal',       color: '#B8892A', disabled: plant === 'small' },
              ].map(p => (
                <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: p.disabled ? 'not-allowed' : 'pointer', opacity: p.disabled ? 0.4 : 1 }}>
                  <input type="checkbox" checked={mix[p.key] && !p.disabled} disabled={p.disabled}
                    onChange={() => setMix(m => ({ ...m, [p.key]: !m[p.key] }))}
                    style={{ accentColor: p.color, width: 14, height: 14 }} />
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg2 }}>{p.label}</span>
                  {p.disabled && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: C.fg3 }}>(large plant only)</span>}
                </label>
              ))}
            </div>
          </div>

          <div style={card(subsidy)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={lbl}>Government Subsidies</span>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3 }}>CITUS 25% + AP MSME 4.0 {plant === 'large' ? '20%' : '15%'}</div>
              </div>
              <button onClick={() => setSubsidy(s => !s)} style={{ width: 40, height: 22, borderRadius: 999, border: 'none', background: subsidy ? C.accent : C.border, cursor: 'pointer', position: 'relative', transition: 'background 200ms', flexShrink: 0 }}>
                <span style={{ position: 'absolute', top: 2, left: subsidy ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 200ms' }} />
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={card(false)}>
            <span style={lbl}>Annual Revenue Breakdown</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              {[
                { name: 'Cocopeat / Grow Bags', val: rev.peat,     color: '#2E7D52' },
                { name: 'Coir Fiber',           val: rev.fiber,    color: '#2B5FA6' },
                { name: 'Shell Charcoal',        val: rev.charcoal, color: '#B8892A' },
              ].map(r => (
                <div key={r.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg2 }}>{r.name}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: r.val > 0 ? C.fg1 : C.fg3 }}>{r.val > 0 ? fmtCr(r.val) : '—'}</span>
                  </div>
                  <div style={{ height: 5, background: C.bg3, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${totalRev > 0 ? (r.val / totalRev * 100).toFixed(0) : 0}%`, height: '100%', background: r.color, borderRadius: 3, transition: 'width 300ms cubic-bezier(0.16,1,0.3,1)' }} />
                  </div>
                </div>
              ))}
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: C.fg1 }}>Total Revenue</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 600, color: C.accent }}>{fmtCr(totalRev)}</span>
              </div>
            </div>
          </div>

          <div style={card(false)}>
            <span style={lbl}>P&amp;L Summary (Annual)</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              {[
                { label: 'Revenue',        val: fmtCr(totalRev),             color: 'acc' },
                { label: 'Variable Costs', val: `−${fmtCr(varCosts)}`,       color: 'neg' },
                { label: 'Fixed Costs',    val: `−${fmt(model.fixedCosts)}`,  color: 'neg' },
                { label: 'EBITDA',         val: fmtCr(ebitda),               color: ebitda >= 0 ? 'pos' : 'neg', big: true },
              ].map(row => (
                <div key={row.label} style={{ padding: '10px 14px', background: row.big ? (ebitda >= 0 ? C.successBg : C.dangerBg) : C.bg2, borderRadius: 6, gridColumn: row.big ? 'span 2' : undefined }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: C.fg3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{row.label}</div>
                  <div style={statVal(row.color)}>{row.val}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {[
              { label: 'Effective Capex',  val: fmtCr(effectCapex), sub: subsidy ? `After ${Math.round(model.subsidyPct * 100)}% subsidy` : 'No subsidy applied' },
              { label: 'Est. IRR',         val: ebitda > 0 ? `${irr}%` : '—', sub: 'Return on investment' },
              { label: 'Payback Period',   val: ebitda > 0 ? `${payback} yrs` : '—', sub: ebitda > 0 && payback < 4 ? 'Strong' : ebitda > 0 ? 'Marginal' : 'Below break-even' },
            ].map(metric => (
              <div key={metric.label} style={card(false)}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: C.fg3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{metric.label}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 600, color: C.accent, marginBottom: 2 }}>{metric.val}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3 }}>{metric.sub}</div>
              </div>
            ))}
          </div>

          {capacity <= breakEven && (
            <div style={{ background: C.dangerBg, border: `1px solid ${C.danger}33`, borderRadius: 8, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={C.danger} strokeWidth="1.5" strokeLinecap="round" width="16" height="16" style={{ flexShrink: 0, marginTop: 2 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.danger, lineHeight: 1.5 }}>
                Below break-even at {capacity}% capacity. Minimum viable utilisation is <strong>{breakEven}%</strong>. Secure Kadiyam buyer contracts before committing capital.
              </div>
            </div>
          )}
          {capacity > breakEven && ebitda > 0 && payback <= 3 && (
            <div style={{ background: C.successBg, border: `1px solid ${C.success}33`, borderRadius: 8, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={C.success} strokeWidth="1.5" strokeLinecap="round" width="16" height="16" style={{ flexShrink: 0, marginTop: 2 }}><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.success, lineHeight: 1.5 }}>
                Strong returns at {capacity}% capacity. Payback in <strong>{payback} years</strong> with subsidies. IRR of <strong>{irr}%</strong> comfortably exceeds cost of capital.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
