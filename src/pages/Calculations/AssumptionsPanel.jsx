import { useState } from 'react';
import { C, alpha } from '../../tokens';
import { PRODUCT_COLORS_EXPORT as PRODUCT_COLORS } from '../../utils/calcEngine';
import { Section, Stepper, ChipRow, Hint, IS, fmtINR } from '../../components/calc/primitives';

// LEFT PANEL — Assumptions. Five collapsible groups: Capacity, Products,
// Costs (variable/fixed sub-tabs), Financing, Subsidies, Working Capital.
export default function AssumptionsPanel({
  input, calc, setI, setRow, addRow, delRow,
  openSections, toggleSection,
  bePct, beLeft, sliderMin, sliderMax,
  style,
}) {
  const [costTab, setCostTab] = useState('fixed');

  return (
    <div className="calc-left calc-assumptions" style={style}>
      <div className="calc-assumptions-title">
        <span className="calc-assumptions-eyebrow">Assumptions</span>
        <span className="calc-assumptions-hint">Click any group to expand or collapse</span>
      </div>

      {/* Capacity Utilisation — Y1 + ramp + ceiling, instead of a flat scalar.
          Realistic projections start low (setup year), climb each year, and
          plateau at the long-run ceiling. The hero CapacityRing shows the
          ceiling; the projection table reveals the per-year ramp. */}
      <Section id="capacity" label="Capacity Utilisation"
        summary={`Y1 ${input.capacityY1Pct ?? 50}% → ${input.capacityCeilingPct ?? input.capacityPct}%`}
        open={openSections.includes('capacity')} onToggle={toggleSection}>
        <Hint>Year 1 is typically 40–60% (setup, market development). Most projects climb 5–15 points per year until they hit the long-run ceiling.</Hint>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: C.fg2 }}>Ceiling</span>
          <div>
            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 32, fontWeight: 700, color: C.accent, lineHeight: 1 }}>{input.capacityCeilingPct ?? input.capacityPct}</span>
            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 700, color: C.accent }}>%</span>
          </div>
        </div>
        <div style={{ position: 'relative', marginBottom: 12, paddingTop: 18 }}>
          {beLeft && (
            <div style={{ position: 'absolute', top: 0, left: beLeft, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, pointerEvents: 'none' }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: C.fg3, whiteSpace: 'nowrap' }}>break-even {Math.round(bePct)}%</span>
              <div style={{ width: 1, height: 8, background: C.fg3 }} />
            </div>
          )}
          <input type="range" min={sliderMin} max={sliderMax} step={5} value={input.capacityCeilingPct ?? input.capacityPct}
            onChange={e => setI({ capacityCeilingPct: Number(e.target.value), capacityPct: Number(e.target.value) })}
            style={{ width: '100%', accentColor: C.accent, cursor: 'pointer' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3 }}>10%</span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3 }}>100%</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, justifyContent: 'space-between', marginBottom: 14 }}>
          {[40, 60, 80, 100].map(v => (
            <button key={v} onClick={() => setI({ capacityCeilingPct: v, capacityPct: v })}
              aria-pressed={(input.capacityCeilingPct ?? input.capacityPct) === v}
              style={{ flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: (input.capacityCeilingPct ?? input.capacityPct) === v ? 700 : 500, padding: '4px 0', borderRadius: 4, background: (input.capacityCeilingPct ?? input.capacityPct) === v ? C.accentBg : 'transparent', border: `1px solid ${(input.capacityCeilingPct ?? input.capacityPct) === v ? alpha(C.accent, 55) : C.border}`, color: (input.capacityCeilingPct ?? input.capacityPct) === v ? C.accent : C.fg2, cursor: 'pointer' }}>
              {v}%
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div className="calc-field-label">Year 1 %</div>
            <Stepper value={input.capacityY1Pct ?? 50} onChange={v => setI({ capacityY1Pct: Math.max(0, Math.min(100, v)) })} min={0} max={100} step={5} ariaLabel="year 1 capacity" />
            <ChipRow values={[40, 50, 60, 70]} current={input.capacityY1Pct ?? 50} onPick={v => setI({ capacityY1Pct: v })} suffix="%" />
          </div>
          <div>
            <div className="calc-field-label">Ramp / yr</div>
            <Stepper value={input.capacityRampPct ?? 10} onChange={v => setI({ capacityRampPct: Math.max(0, Math.min(50, v)) })} min={0} max={50} step={1} ariaLabel="capacity ramp" />
            <ChipRow values={[0, 5, 10, 15]} current={input.capacityRampPct ?? 10} onPick={v => setI({ capacityRampPct: v })} suffix="pp" />
          </div>
        </div>
      </Section>

      {/* Product Mix */}
      <Section id="products" label="Products & Pricing"
        summary={`${fmtINR(calc.revenue)}/yr`}
        open={openSections.includes('products')} onToggle={toggleSection}>
        <Hint>List everything you sell. Price × Qty at 100% capacity; the slider scales them.</Hint>
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 0.7fr 0.7fr 0.7fr auto', gap: 4, marginBottom: 4, alignItems: 'center' }}>
          {['Product', 'Unit', 'Price ₹', 'Qty/yr', ''].map((h, i) => (
            <div key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: C.fg3, paddingLeft: i === 0 ? 14 : 0 }}>{h}</div>
          ))}
        </div>
        {input.revenueRows.map((row, i) => (
          <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '1.8fr 0.7fr 0.7fr 0.7fr auto', gap: 4, marginBottom: 5, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: PRODUCT_COLORS[i % PRODUCT_COLORS.length], flexShrink: 0 }} />
              <input value={row.name} placeholder="Product" onChange={e => setRow('revenueRows', row.id, 'name', e.target.value)} style={{ ...IS, flex: 1 }} />
            </div>
            <input value={row.unit} placeholder="kg" onChange={e => setRow('revenueRows', row.id, 'unit', e.target.value)} style={IS} />
            <input type="number" value={row.price} min={0} onChange={e => setRow('revenueRows', row.id, 'price', e.target.value)} style={IS} />
            <input type="number" value={row.qty} min={0} onChange={e => setRow('revenueRows', row.id, 'qty', e.target.value)} style={IS} />
            <button onClick={() => delRow('revenueRows', row.id)} disabled={input.revenueRows.length === 1}
              style={{ background: 'none', border: 'none', cursor: input.revenueRows.length === 1 ? 'default' : 'pointer', color: input.revenueRows.length === 1 ? C.fg3 : '#c0392b', fontSize: 16, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}>×</button>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
          <button onClick={() => addRow('revenueRows', { name: '', unit: '', price: 0, qty: 0, enabled: true })}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.accent, background: 'none', border: `1px dashed ${alpha(C.accent, 66)}`, borderRadius: 5, padding: '3px 10px', cursor: 'pointer' }}>+ Add product</button>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg2 }}>{fmtINR(calc.revenue)}/yr at {input.capacityPct}%</span>
        </div>
      </Section>

      {/* Costs */}
      <Section id="costs" label="Operating Costs"
        summary={`${fmtINR(calc.variableCosts + calc.fixedCosts)}/yr`}
        open={openSections.includes('costs')} onToggle={toggleSection}>
        {(calc.variableCosts + calc.fixedCosts) > 0 && (() => {
          const total = calc.variableCosts + calc.fixedCosts;
          const varPct = (calc.variableCosts / total) * 100;
          const fixedPct = 100 - varPct;
          return (
            <div className="calc-cost-split">
              <div className="calc-cost-split-bar">
                <div className="calc-cost-split-seg calc-cost-split-var" style={{ width: `${varPct}%` }} />
                <div className="calc-cost-split-seg calc-cost-split-fixed" style={{ width: `${fixedPct}%` }} />
              </div>
              <div className="calc-cost-split-legend">
                <span><span className="dot calc-cost-split-var" /> Variable {fmtINR(calc.variableCosts)} <em>· {varPct.toFixed(0)}%</em></span>
                <span><span className="dot calc-cost-split-fixed" /> Fixed {fmtINR(calc.fixedCosts)} <em>· {fixedPct.toFixed(0)}%</em></span>
              </div>
            </div>
          );
        })()}
        <div style={{ display: 'flex', gap: 0, marginBottom: 10, borderBottom: `1px solid ${C.border}` }}>
          {[['variable', 'Variable'], ['fixed', 'Fixed']].map(([id, lbl]) => (
            <button key={id} onClick={() => setCostTab(id)}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: costTab === id ? 700 : 400, color: costTab === id ? C.accent : C.fg3, background: 'none', border: 'none', borderBottom: `2px solid ${costTab === id ? C.accent : 'transparent'}`, padding: '3px 12px 7px', cursor: 'pointer' }}>
              {lbl}
            </button>
          ))}
        </div>
        {costTab === 'variable' ? (
          <>
            <Hint>Variable costs scale with output — raw materials, packaging, fuel, contract labour.</Hint>
            {input.varRows.length === 0 && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, marginBottom: 8 }}>No variable costs yet.</div>}
            {input.varRows.map((row, i) => (
              <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '1.8fr 0.7fr 0.7fr 0.7fr auto', gap: 4, marginBottom: 5, alignItems: 'center' }}>
                {i === 0 && ['Item', 'Unit', 'Cost ₹', 'Qty/yr', ''].map((h, j) => <div key={j} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: C.fg3 }}>{h}</div>)}
                <input value={row.name} placeholder="Material" onChange={e => setRow('varRows', row.id, 'name', e.target.value)} style={IS} />
                <input value={row.unit} placeholder="kg" onChange={e => setRow('varRows', row.id, 'unit', e.target.value)} style={IS} />
                <input type="number" value={row.price} min={0} onChange={e => setRow('varRows', row.id, 'price', e.target.value)} style={IS} />
                <input type="number" value={row.qty} min={0} onChange={e => setRow('varRows', row.id, 'qty', e.target.value)} style={IS} />
                <button onClick={() => delRow('varRows', row.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c0392b', fontSize: 16, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}>×</button>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <button onClick={() => addRow('varRows', { name: '', unit: '', price: 0, qty: 0, enabled: true })}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.accent, background: 'none', border: `1px dashed ${alpha(C.accent, 66)}`, borderRadius: 5, padding: '3px 10px', cursor: 'pointer' }}>+ Add</button>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg2 }}>{fmtINR(calc.variableCosts)}/yr</span>
            </div>
          </>
        ) : (
          <>
            <Hint>Fixed costs don't change with output — salaries, rent, insurance, electricity base. Annual amount per item.</Hint>
            {input.fixedRows.map((row, i) => (
              <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr auto', gap: 4, marginBottom: 5, alignItems: 'center' }}>
                {i === 0 && ['Item', 'Annual (₹)', ''].map((h, j) => <div key={j} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: C.fg3 }}>{h}</div>)}
                <input value={row.name} placeholder="Expense" onChange={e => setRow('fixedRows', row.id, 'name', e.target.value)} style={IS} />
                <input type="number" value={row.amount} min={0} onChange={e => setRow('fixedRows', row.id, 'amount', e.target.value)} style={IS} />
                <button onClick={() => delRow('fixedRows', row.id)} disabled={input.fixedRows.length === 1}
                  style={{ background: 'none', border: 'none', cursor: input.fixedRows.length === 1 ? 'default' : 'pointer', color: input.fixedRows.length === 1 ? C.fg3 : '#c0392b', fontSize: 16, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}>×</button>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <button onClick={() => addRow('fixedRows', { name: '', amount: 0, enabled: true })}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.accent, background: 'none', border: `1px dashed ${alpha(C.accent, 66)}`, borderRadius: 5, padding: '3px 10px', cursor: 'pointer' }}>+ Add</button>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg2 }}>{fmtINR(calc.fixedCosts)}/yr</span>
            </div>
          </>
        )}
      </Section>

      {/* Financing */}
      <Section id="financing" label="Financing"
        summary={`${input.debtPct}% debt · ${fmtINR(input.capex)}`}
        open={openSections.includes('financing')} onToggle={toggleSection}>
        <div className="calc-field-label">Total CAPEX (₹)</div>
        <Hint>Total capital before subsidies — land, civil work, machinery, electrification.</Hint>
        <input type="number" value={input.capex} min={0} step={100000} onChange={e => setI({ capex: Number(e.target.value) || 0 })} style={{ ...IS, marginBottom: 12 }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <div className="calc-field-label">Lifetime (yrs)</div>
            <Stepper value={input.lifetime} onChange={v => setI({ lifetime: Math.max(1, v) })} min={1} max={30} ariaLabel="lifetime" />
          </div>
          <div>
            <div className="calc-field-label">Discount %</div>
            <Stepper value={input.discountRate} onChange={v => setI({ discountRate: Math.max(1, v) })} min={1} max={50} step={0.5} ariaLabel="discount rate" />
            <ChipRow values={[8, 10, 12, 15]} current={input.discountRate} onPick={v => setI({ discountRate: v })} suffix="%" />
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div className="calc-field-label">Tax %</div>
          <Stepper value={input.taxRate ?? 25} onChange={v => setI({ taxRate: Math.max(0, Math.min(50, v)) })} min={0} max={50} step={0.5} ariaLabel="tax rate" />
          <ChipRow values={[17, 25, 30]} current={input.taxRate ?? 25} onPick={v => setI({ taxRate: v })} suffix="%" />
          <Hint>17% = new mfg co (Sec 115BAB) · 25% = existing co (Sec 115BAA) · 30% = old regime / partnership slab.</Hint>
        </div>

        <div className="calc-field-label">Debt <strong style={{ color: C.fg1 }}>{input.debtPct}%</strong> · Equity {100 - input.debtPct}%</div>
        <input type="range" min={0} max={100} step={5} value={input.debtPct} onChange={e => setI({ debtPct: Number(e.target.value) })} style={{ width: '100%', accentColor: C.accent, marginBottom: 12 }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div className="calc-field-label">Interest %</div>
            <Stepper value={input.interestRate} onChange={v => setI({ interestRate: Math.max(0, v) })} min={0} max={30} step={0.5} ariaLabel="interest rate" />
            <Hint>MSME term-loan rate. AP state subvention can effectively bring this to ~9%.</Hint>
          </div>
          <div>
            <div className="calc-field-label">Tenure (yrs)</div>
            <Stepper value={input.tenure} onChange={v => setI({ tenure: Math.max(1, v) })} min={1} max={20} ariaLabel="tenure" />
            <ChipRow values={[5, 7, 10, 15]} current={input.tenure} onPick={v => setI({ tenure: v })} suffix="y" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          <div>
            <div className="calc-field-label">Interest Subvention %</div>
            <Stepper value={input.interestSubventionPct ?? 0} onChange={v => setI({ interestSubventionPct: Math.max(0, Math.min(15, v)) })} min={0} max={15} step={0.5} ariaLabel="interest subvention" />
            <ChipRow values={[0, 2, 3, 5]} current={input.interestSubventionPct ?? 0} onPick={v => setI({ interestSubventionPct: v })} suffix="%" />
          </div>
          <div>
            <div className="calc-field-label">Subvention Years</div>
            <Stepper value={input.interestSubventionYears ?? 5} onChange={v => setI({ interestSubventionYears: Math.max(0, Math.min(20, v)) })} min={0} max={20} ariaLabel="subvention years" />
            <ChipRow values={[3, 5, 7]} current={input.interestSubventionYears ?? 5} onPick={v => setI({ interestSubventionYears: v })} suffix="y" />
          </div>
        </div>
        <Hint>Government rebate on interest (AP MSME Policy: up to 3% for 5y). Adds to NCF; does not reduce DSCR's debt-service denominator.</Hint>
      </Section>

      {/* Subsidy Stack — accent-highlighted card. Individual checkboxes
          preserved for flexibility, savings line surfaced as a footer. */}
      <Section id="subsidies" label="Subsidy Stack"
        summary={
          (input.pmegpEnabled || input.citusEnabled || input.apmsmeEnabled)
            ? `Saves ${fmtINR(Number(input.capex) - calc.effectiveCapex)}`
            : 'none active'
        }
        open={openSections.includes('subsidies')} onToggle={toggleSection} accent>
        {(input.pmegpEnabled || input.citusEnabled || input.apmsmeEnabled) && Number(input.capex) > 0 && (() => {
          const saved = Number(input.capex) - calc.effectiveCapex;
          const savedPct = (saved / Number(input.capex)) * 100;
          return (
            <div className="calc-subsidy-savings">
              <div className="calc-subsidy-savings-bar">
                <div className="calc-subsidy-savings-fill" style={{ width: `${Math.min(100, savedPct)}%` }} />
              </div>
              <div className="calc-subsidy-savings-legend">
                <span><strong>{savedPct.toFixed(0)}%</strong> capex saved</span>
                <span>·</span>
                <span>{fmtINR(saved)} off</span>
              </div>
            </div>
          );
        })()}
        <Hint>PMEGP applies first to the first ₹50 L only; CITUS and AP MSME then stack on what's left.</Hint>
        {[
          { id: 'pmegp', label: 'PMEGP (max ₹50 L cost)', enabled: input.pmegpEnabled, setEnabled: (v) => setI({ pmegpEnabled: v }), pct: input.pmegpPct, setPct: (v) => setI({ pmegpPct: v }), editable: true },
          { id: 'citus', label: 'CITUS (25%)', enabled: input.citusEnabled, setEnabled: (v) => setI({ citusEnabled: v }), editable: false },
          { id: 'apmsme', label: 'AP MSME 4.0 (20%)', enabled: input.apmsmeEnabled, setEnabled: (v) => setI({ apmsmeEnabled: v }), editable: false },
        ].map(sub => (
          <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <input type="checkbox" id={`sub-${sub.id}`} checked={sub.enabled} onChange={e => sub.setEnabled(e.target.checked)} style={{ accentColor: C.accent, width: 15, height: 15, cursor: 'pointer', flexShrink: 0 }} />
            <label htmlFor={`sub-${sub.id}`} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg1, cursor: 'pointer', flex: 1 }}>{sub.label}</label>
            {sub.editable && sub.enabled && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <input type="number" value={sub.pct} min={0} max={100} step={5} onChange={e => sub.setPct(Number(e.target.value) || 0)}
                  style={{ width: 48, fontFamily: "'DM Sans', sans-serif", fontSize: 12, padding: '3px 5px', border: `1px solid ${C.border}`, borderRadius: 4, background: C.bg2, color: C.fg1, outline: 'none' }} />
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3 }}>%</span>
              </div>
            )}
          </div>
        ))}
        {(input.pmegpEnabled || input.citusEnabled || input.apmsmeEnabled) && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${alpha(C.accent, 22)}`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 6 }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: C.fg2 }}>Effective CAPEX</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: C.fg1 }}>{fmtINR(calc.effectiveCapex)}</span>
            <span style={{ flexBasis: '100%', fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: C.accent }}>
              Saves {fmtINR(Number(input.capex) - calc.effectiveCapex)}
            </span>
          </div>
        )}
      </Section>

      {/* Working Capital */}
      <Section id="wc" label="Working Capital"
        summary={calc.workingCapital > 0 ? fmtINR(calc.workingCapital) : `${input.receivableDays + input.inventoryDays - input.payableDays}d cycle`}
        open={openSections.includes('wc')} onToggle={toggleSection}>
        <Hint>Cash you need day-to-day. Common values: 30 / 45 / 60 / 90 days.</Hint>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {[
            ['Receivable d', 'receivableDays'],
            ['Payable d',    'payableDays'],
            ['Inventory d',  'inventoryDays'],
          ].map(([lbl, key]) => (
            <div key={key}>
              <div className="calc-field-label">{lbl}</div>
              <Stepper value={input[key]} onChange={v => setI({ [key]: Math.max(0, Math.min(180, v)) })} min={0} max={180} step={5} ariaLabel={lbl} />
              <ChipRow values={[15, 30, 45, 60]} current={input[key]} onPick={v => setI({ [key]: v })} suffix="d" />
            </div>
          ))}
        </div>
        {calc.workingCapital > 0 && (
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, marginTop: 12, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
            Required: <strong style={{ color: C.fg1, fontFamily: "'JetBrains Mono', monospace" }}>{fmtINR(calc.workingCapital)}</strong>
            <span style={{ marginLeft: 8 }}>· {input.receivableDays + input.inventoryDays - input.payableDays}d cash cycle</span>
          </div>
        )}
      </Section>

    </div>
  );
}
