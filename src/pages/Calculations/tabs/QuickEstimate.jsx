import { C } from '../../../tokens';
import { fmtINR } from '../../../components/calc/primitives';
import { PRODUCT_COLORS_EXPORT as PRODUCT_COLORS, unitMult } from '../../../utils/calcEngine';

// Cost-segment palette for the Money Flow stacked bar — sourced from
// theme tokens so each segment carries a data-role colour:
//   1st segment (always Variable Cost) → danger (the burn)
//   2nd                                → warning (Time/payroll cadence)
//   3rd                                → info    (Coverage/overhead)
//   4th                                → accent-2 (categorical — varies per theme)
//   5th                                → accent-3 (categorical)
//   6th                                → accent-4 (categorical)
//   7th                                → fg2     (neutral / catch-all)
// Bracket-key access is required for accent-2/3/4: the C Proxy's
// camelCase→kebab transform only inserts a hyphen before UPPERCASE
// letters, so C.accent2 would resolve to var(--c-accent2) — which is
// undefined. C['accent-2'] passes the literal key through unchanged
// and produces var(--c-accent-2) (the actually-defined token).
const COST_COLORS = [
  C.danger,
  C.warning,
  C.info,
  C['accent-2'],
  C['accent-3'],
  C['accent-4'],
  C.fg2,
];

// Three preset patches users can apply with one click. Each `apply()`
// returns a partial input object that gets merged via setI(). Conservative
// stress-tests the project; Aggressive Growth flatters it; No-Subsidy
// Baseline strips every grant so users see what the project earns on
// its own merits. `role` drives a 3px left-stripe per the data-color
// system: coverage (info) for the cautious preset, return (accent) for
// the upside preset, neutral (fg3) for the unflattered baseline.
const PRESETS = [
  {
    id: 'conservative',
    label: 'Conservative',
    sub: '40% ceiling · 30% Y1 · no subsidy · no subvention',
    role: 'coverage',
    apply: () => ({
      capacityCeilingPct: 40,
      capacityPct: 40,
      capacityY1Pct: 30,
      capacityRampPct: 5,
      pmegpEnabled: false,
      citusEnabled: false,
      apmsmeEnabled: false,
      interestSubventionPct: 0,
    }),
  },
  {
    id: 'aggressive',
    label: 'Aggressive Growth',
    sub: '95% ceiling · 60% Y1 · all subsidies · 3% subvention',
    role: 'return',
    apply: () => ({
      capacityCeilingPct: 95,
      capacityPct: 95,
      capacityY1Pct: 60,
      capacityRampPct: 12,
      pmegpEnabled: true,
      citusEnabled: true,
      apmsmeEnabled: true,
      interestSubventionPct: 3,
      interestSubventionYears: 5,
    }),
  },
  {
    id: 'baseline',
    label: 'No-Subsidy Baseline',
    sub: 'all subsidies off · current ramp & costs',
    role: 'neutral',
    apply: () => ({
      pmegpEnabled: false,
      citusEnabled: false,
      apmsmeEnabled: false,
      interestSubventionPct: 0,
    }),
  },
];

export default function QuickEstimate({ input, calc, insight, setI, setRow, sliderMin = 10, sliderMax = 100 }) {
  const ceiling = input.capacityCeilingPct ?? input.capacityPct ?? 80;

  // Per-product card data — values reflect steady-state ceiling capacity
  // (matches the donut on the dashboard above). Disabled rows zero out.
  // `linkedVarCount` reflects how many variable-cost rows are tagged
  // with this product's id — toggling the product OFF drops those costs
  // from the calc too, so users get a heads-up before they click.
  const productCards = input.revenueRows.map((r, i) => {
    const enabled = r.enabled !== false;
    const value = enabled ? Number(r.price || 0) * Number(r.qty || 0) * unitMult(r) * (ceiling / 100) : 0;
    const pct = calc.revenue > 0 ? (value / calc.revenue) * 100 : 0;
    const linkedVarCount = (input.varRows || []).filter(v => v.productId === r.id).length;
    return { ...r, enabled, value, pct, linkedVarCount, color: PRODUCT_COLORS[i % PRODUCT_COLORS.length], rowIndex: i };
  });

  // Money Flow segments — Variable as one bucket, then each named fixedRow
  // (skip empty / disabled rows). Disabled vars are excluded too.
  // Each segment carries its bar width % (proportional to value vs the
  // chosen denominator) AND its revenue % (the share of revenue the
  // category consumes — the label users actually want to read).
  const totalCosts = calc.variableCosts + calc.fixedCosts;
  const isLoss     = calc.ebitda < 0;
  // Bar denominator: when EBITDA is positive the bar represents revenue
  // (cost segments leave room for a green PROFIT slice on the right);
  // when negative the bar represents total outlay (revenue + |loss|) so
  // the LOSS sliver fits at the end without distorting widths.
  const denominator = isLoss ? totalCosts : Math.max(calc.revenue, totalCosts);

  const baseSegments = totalCosts > 0
    ? [
        ...(calc.variableCosts > 0
          ? [{ key: 'variable', name: 'Variable', value: calc.variableCosts, color: COST_COLORS[0] }]
          : []),
        ...input.fixedRows
          .filter(r => r.enabled !== false && Number(r.amount) > 0)
          .map((r, i) => ({
            key: `fixed-${r.id}`,
            name: r.name || `Fixed ${i + 1}`,
            value: Number(r.amount),
            color: COST_COLORS[(i + 1) % COST_COLORS.length],
          })),
      ]
    : [];

  const moneyFlowSegments = baseSegments.map(seg => ({
    ...seg,
    barPct: denominator > 0 ? (seg.value / denominator) * 100 : 0,
    revPct: calc.revenue > 0 ? (seg.value / calc.revenue) * 100 : 0,
  }));

  // Trailing slice — PROFIT if EBITDA positive, LOSS if negative. Hidden
  // when there's no revenue yet (everything else is empty too).
  const trailing = (calc.revenue > 0 && totalCosts > 0)
    ? (isLoss
        ? {
            key: 'loss',
            name: 'LOSS',
            barPct: denominator > 0 ? (Math.abs(calc.ebitda) / denominator) * 100 : 0,
            revPct: (Math.abs(calc.ebitda) / calc.revenue) * 100,
            background: C.dangerBg,
            textColor: C.danger,
          }
        : {
            key: 'profit',
            name: 'PROFIT',
            barPct: denominator > 0 ? (calc.ebitda / denominator) * 100 : 0,
            revPct: (calc.ebitda / calc.revenue) * 100,
            background: C.success,
            // textColor uses bg0 (not literal #fff) so the slice flips
            // polarity per theme: cream on dark sage in Heritage, dark
            // slate on light sage in Midnight — both clear WCAG AA.
            textColor: C.bg0,
          })
    : null;

  const grossCapex   = Number(input.capex) || 0;
  const subsidySaved = Math.max(0, grossCapex - calc.effectiveCapex);

  return (
    <div className="calc-quick">

      {/* ── Verdict strip ──────────────────────────────────────────────
          Compact one-line rebuild of the old Summary callout. Sits at the
          top of the workspace so the bottom-line read is the first thing
          a user sees on this tab. */}
      <div className="calc-quick-verdict" data-positive={insight.positive ? 'true' : 'false'}>
        {insight.positive
          ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="16" height="16"><polyline points="20 6 9 17 4 12"/></svg>
          : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
        <strong>{insight.verdict}</strong>
        <span>{insight.text}</span>
      </div>

      <div className="calc-quick-grid">

        {/* ── LEFT column ─────────────────────────────────────────────── */}
        <div className="calc-quick-left">

          {/* Plant Configuration */}
          <div className="calc-quick-card">
            <div className="calc-quick-card-head">
              <span className="calc-quick-eyebrow">Plant Configuration</span>
              <span className="calc-quick-hint">Click ON/OFF to include or exclude a product</span>
            </div>
            {productCards.length === 0 ? (
              <div className="calc-quick-empty">Add a product in the Assumptions rail.</div>
            ) : (
              <div className="calc-quick-products">
                {productCards.map(p => (
                  <div key={p.id} className="calc-quick-product" data-on={p.enabled ? 'true' : 'false'}>
                    <div className="calc-quick-product-head">
                      <span className="calc-quick-product-dot" style={{ background: p.color }} />
                      <span className="calc-quick-product-name">{p.name || `Product ${p.rowIndex + 1}`}</span>
                      <button
                        type="button"
                        className="calc-quick-product-toggle"
                        aria-pressed={p.enabled}
                        onClick={() => setRow('revenueRows', p.id, 'enabled', !p.enabled)}>
                        {p.enabled ? 'ON' : 'OFF'}
                      </button>
                    </div>
                    <div className="calc-quick-product-meta">
                      ₹{Number(p.price || 0)}/{p.unit === 'ton' ? 'ton' : 'kg'} · {Number(p.qty || 0)} t/yr
                      {p.linkedVarCount > 0 && <> · <em style={{ fontStyle: 'normal', color: C.accent }}>{p.linkedVarCount} linked cost{p.linkedVarCount > 1 ? 's' : ''}</em></>}
                    </div>
                    <div className="calc-quick-product-revenue">
                      <strong>{fmtINR(p.value)}</strong>
                      <span>{p.pct.toFixed(0)}% of revenue</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Capacity slider — duplicate of the rail control so changes
              visible on this tab without scrolling left. Writes both
              capacityCeilingPct and capacityPct in lockstep. */}
          <div className="calc-quick-card">
            <div className="calc-quick-card-head">
              <span className="calc-quick-eyebrow">Capacity Ceiling</span>
              <span className="calc-quick-hint">Long-run target — Y1 ramps from your assumption</span>
            </div>
            <div className="calc-quick-capacity-row">
              <span className="calc-quick-capacity-value">{ceiling}<small>%</small></span>
              <input
                type="range"
                min={sliderMin}
                max={sliderMax}
                step={5}
                value={ceiling}
                onChange={e => {
                  const v = Number(e.target.value);
                  setI({ capacityCeilingPct: v, capacityPct: v });
                }}
                style={{ flex: 1, accentColor: C.accent, cursor: 'pointer' }} />
            </div>
          </div>

          {/* Money Flow — tall stacked bar with category labels overlaid
              inside each segment, plus a trailing PROFIT (sage) or LOSS
              (pink) slice. No external legend; the bar IS the legend. */}
          {moneyFlowSegments.length > 0 && (
            <div className="calc-quick-card">
              <div className="calc-quick-card-head">
                <span className="calc-quick-eyebrow">Money Flow</span>
                <span className="calc-quick-hint">Each segment is its share of revenue</span>
              </div>
              <div className="calc-quick-moneyflow-bar" role="img" aria-label="Cost composition">
                {moneyFlowSegments.map(seg => (
                  <div
                    key={seg.key}
                    className="calc-quick-moneyflow-seg"
                    style={{ width: `${seg.barPct}%`, background: seg.color, color: '#fff' }}
                    title={`${seg.name}: ${fmtINR(seg.value)} · ${seg.revPct.toFixed(0)}% of revenue`}>
                    {seg.barPct >= 9 && (
                      <>
                        <span className="calc-quick-moneyflow-name">{seg.name.toUpperCase()}</span>
                        <span className="calc-quick-moneyflow-pct">{seg.revPct.toFixed(0)}%</span>
                      </>
                    )}
                  </div>
                ))}
                {trailing && trailing.barPct > 0 && (
                  <div
                    key={trailing.key}
                    className="calc-quick-moneyflow-seg"
                    data-trailing={trailing.key}
                    style={{ width: `${trailing.barPct}%`, background: trailing.background, color: trailing.textColor }}
                    title={`${trailing.name}: ${fmtINR(Math.abs(calc.ebitda))} · ${trailing.revPct.toFixed(0)}% of revenue`}>
                    <span className="calc-quick-moneyflow-name">{trailing.name}</span>
                    {trailing.barPct >= 9 && (
                      <span className="calc-quick-moneyflow-pct">{trailing.revPct.toFixed(0)}%</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* KPI tiles — values colour-coded by sentiment via theme tokens.
              Revenue stays in fg1 (factual baseline); cost rows take the
              danger hue (--c-danger); profits flip success ↔ danger by
              sign. Role-stripe data-role drives a 3px left border in CSS. */}
          <div className="calc-quick-kpis">
            {[
              { label: 'Revenue',          value: fmtINR(calc.revenue),                                          color: C.fg1,    role: 'return' },
              { label: 'Variable',         value: '−' + fmtINR(calc.variableCosts),                              color: C.danger, role: 'cost'   },
              { label: 'Operating Costs',  value: '−' + fmtINR(calc.variableCosts + calc.fixedCosts),            color: C.danger, role: 'cost'   },
              { label: 'Operating Profit', value: fmtINR(calc.ebitda),                                           color: calc.ebitda >= 0 ? C.success : C.danger,            role: 'return' },
              { label: 'Net Profit (Y1)',  value: fmtINR(calc.netProfitY1 ?? 0),                                 color: (calc.netProfitY1 ?? 0) >= 0 ? C.success : C.danger, role: 'return' },
            ].map(t => (
              <div key={t.label} className="calc-quick-kpi-tile" data-role={t.role}>
                <div className="calc-quick-kpi-label">{t.label}</div>
                <div className="calc-quick-kpi-value" style={{ color: t.color }}>{t.value}</div>
              </div>
            ))}
          </div>

        </div>

        {/* ── RIGHT column ────────────────────────────────────────────── */}
        <div className="calc-quick-right">

          {/* Capex & Subsidy summary — compact mirror of Deep Dive's
              Capex Breakdown card. Lives here so the cost side of the
              project is one glance away from the revenue side. */}
          <div className="calc-quick-card">
            <div className="calc-quick-eyebrow">Capex &amp; Subsidy</div>
            <div className="calc-quick-capex">
              <div className="calc-quick-capex-row">
                <span>Total CAPEX</span>
                <strong>{fmtINR(grossCapex)}</strong>
              </div>
              {subsidySaved > 0 && (
                <div className="calc-quick-capex-row" style={{ color: C.accent }}>
                  <span>Less subsidy</span>
                  <strong>−{fmtINR(subsidySaved)}</strong>
                </div>
              )}
              <div className="calc-quick-capex-row total">
                <span>Effective CAPEX</span>
                <strong>{fmtINR(calc.effectiveCapex)}</strong>
              </div>
              <div className="calc-quick-capex-row sub">
                <span>Equity ({100 - input.debtPct}%)</span>
                <strong>{fmtINR(calc.equity)}</strong>
              </div>
              <div className="calc-quick-capex-row sub">
                <span>Debt ({input.debtPct}%)</span>
                <strong>{fmtINR(calc.loan)}</strong>
              </div>
            </div>
          </div>

          {/* Try a Preset */}
          <div className="calc-quick-card">
            <div className="calc-quick-eyebrow">Try a Preset</div>
            <div className="calc-quick-presets">
              {PRESETS.map(p => (
                <button
                  key={p.id}
                  type="button"
                  className="calc-quick-preset"
                  data-role={p.role}
                  onClick={() => setI(p.apply())}>
                  <strong>{p.label}</strong>
                  <span>{p.sub}</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
