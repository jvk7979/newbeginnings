import { C } from '../../../tokens';
import { fmtINR } from '../../../components/calc/primitives';
import { PRODUCT_COLORS_EXPORT as PRODUCT_COLORS } from '../../../utils/calcEngine';

// Cost-segment palette for the Money Flow stacked bar. Adjacent slots
// are 100°+ apart on the hue wheel — primary triad (red/green/blue)
// interleaved with secondary triad (orange/violet/yellow) — so two
// neighbouring segments always have a strong colour-wheel separation
// even at small widths. Independent from PRODUCT_COLORS so revenue and
// cost segments don't collide.
const COST_COLORS = [
  '#dc2626', // red-600
  '#16a34a', // green-600
  '#0ea5e9', // sky-500
  '#ea580c', // orange-600
  '#7c3aed', // violet-600
  '#eab308', // yellow-500
  '#0f172a', // slate-900
];

// Three preset patches users can apply with one click. Each `apply()`
// returns a partial input object that gets merged via setI(). Conservative
// stress-tests the project; Aggressive Growth flatters it; No-Subsidy
// Baseline strips every grant so users see what the project earns on
// its own merits.
const PRESETS = [
  {
    id: 'conservative',
    label: 'Conservative',
    sub: '40% ceiling · 30% Y1 · no subsidy · no subvention',
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
  const productCards = input.revenueRows.map((r, i) => {
    const enabled = r.enabled !== false;
    const value = enabled ? Number(r.price || 0) * Number(r.qty || 0) * (ceiling / 100) : 0;
    const pct = calc.revenue > 0 ? (value / calc.revenue) * 100 : 0;
    return { ...r, enabled, value, pct, color: PRODUCT_COLORS[i % PRODUCT_COLORS.length], rowIndex: i };
  });

  // Money Flow segments — Variable as one bucket, then each named fixedRow
  // (skip empty / disabled rows). Disabled vars are excluded too.
  const totalCosts = calc.variableCosts + calc.fixedCosts;
  const moneyFlowSegments = totalCosts > 0
    ? [
        ...(calc.variableCosts > 0
          ? [{ key: 'variable', name: 'Variable Costs', value: calc.variableCosts, color: COST_COLORS[0] }]
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
                      ₹{Number(p.price || 0)}{p.unit ? `/${p.unit}` : ''} · {Number(p.qty || 0)}{p.unit ? ` ${p.unit}` : ''}/yr
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

          {/* Money Flow */}
          {moneyFlowSegments.length > 0 && (
            <div className="calc-quick-card">
              <div className="calc-quick-card-head">
                <span className="calc-quick-eyebrow">Money Flow</span>
                <span className="calc-quick-hint">Where every rupee of operating cost goes</span>
              </div>
              <div className="calc-quick-moneyflow-bar" role="img" aria-label="Cost composition">
                {moneyFlowSegments.map(seg => (
                  <div
                    key={seg.key}
                    style={{ width: `${(seg.value / totalCosts) * 100}%`, background: seg.color }}
                    title={`${seg.name}: ${fmtINR(seg.value)}`} />
                ))}
              </div>
              <div className="calc-quick-moneyflow-legend">
                {moneyFlowSegments.map(seg => (
                  <span key={seg.key}>
                    <span className="dot" style={{ background: seg.color }} />
                    {seg.name} <strong>{fmtINR(seg.value)}</strong> · {((seg.value / totalCosts) * 100).toFixed(0)}%
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* KPI tiles */}
          <div className="calc-quick-kpis">
            {[
              { label: 'Revenue',         value: fmtINR(calc.revenue),                                          color: C.fg1 },
              { label: 'Variable',        value: '−' + fmtINR(calc.variableCosts),                              color: '#c0392b' },
              { label: 'Operating Costs', value: '−' + fmtINR(calc.variableCosts + calc.fixedCosts),            color: '#c0392b' },
              { label: 'EBITDA',          value: fmtINR(calc.ebitda),                                           color: calc.ebitda >= 0 ? '#2a7d3c' : '#c0392b' },
            ].map(t => (
              <div key={t.label} className="calc-quick-kpi-tile">
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
