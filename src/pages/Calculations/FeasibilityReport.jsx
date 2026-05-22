// src/pages/Calculations/FeasibilityReport.jsx
//
// Editorial feasibility-report header for the Calculations page —
// IRR + Payback bookends with a narrative deck between them, a row of
// KPI cards (NPV / Net Profit / EBITDA / DSCR / Break-even), a
// revenue-mix donut, and a multi-year cash-flow combo chart. All
// values come from runCalc + the project input; no engine changes.

import { useMemo } from 'react';
import { C } from '../../tokens';
import DonutChart from '../../components/calc/DonutChart';
import { Sparkline, NPVBar } from '../../components/calc/charts';
import { fmtINR } from '../../components/calc/primitives';
import { PRODUCT_COLORS_EXPORT } from '../../utils/calcEngine';
import CashFlowChart from './CashFlowChart';
import './feasibility-report.css';

// Sector benchmark reference ranges shown on the masthead bars.
// Indicative only — the app has no live sector dataset; these match the
// SME agro-processing band commonly cited in DPRs and APEDA briefs.
const SECTOR_IRR     = { min: 18, max: 25, label: '18–25%' };
const SECTOR_PAYBACK = { min: 3,  max: 5,  label: '3–5 yrs' };

export default function FeasibilityReport({ selectedProject, input, calc, insight }) {
  const dr     = Number(input.discountRate) || 0;
  const tn     = Number(input.tenure) || 1;
  const cpCeil = Number(input.capacityCeilingPct ?? input.capacityPct) || 0;
  const cpY1   = Number(input.capacityY1Pct) || cpCeil;
  const ramp   = Number(input.capacityRampPct) || 0;
  const rampYrs = ramp > 0 && cpCeil > cpY1 ? Math.ceil((cpCeil - cpY1) / ramp) : 0;

  // IRR
  const irr = calc.irr;
  const irrHeadroom = irr != null ? Math.round(irr - dr) : null;

  // Payback — engine returns integer year; interpolate fractional from cumNCF.
  const payback = useMemo(() => fractionalPayback(calc.rows, calc.equity), [calc.rows, calc.equity]);
  const paybackBuffer = (payback != null && tn > 0) ? Math.round(((tn - payback) / tn) * 100) : null;

  // KPI numbers
  const npv      = calc.npv;
  const netY1    = calc.netProfitY1 ?? 0;
  const ebitdaY1 = calc.rows?.[0]?.ebitda ?? 0;
  const revY1    = calc.rows?.[0]?.revenue ?? 0;
  const ebitdaY1Margin = revY1 > 0 ? Math.round((ebitdaY1 / revY1) * 100) : 0;
  const dscrY1   = calc.dscrY1;
  const be       = calc.breakEvenCapacity;
  const beVsCeiling = (be != null && cpCeil > 0) ? Math.round((be / cpCeil) * 100) : null;
  const beNarrow = beVsCeiling != null
    ? (beVsCeiling < 50 ? 'deep margin' : beVsCeiling < 80 ? 'comfortable margin' : 'tight')
    : '';

  // Revenue mix — scaled to Year 1 so the donut total matches the deck's
  // "Year 1 revenue of …" figure.
  const y1Scale = cpCeil > 0 ? cpY1 / cpCeil : 0;
  const products = useMemo(() => {
    const rows = (input.revenueRows || [])
      .filter(r => r.enabled !== false && Number(r.qty) > 0 && Number(r.price) > 0);
    return rows.map((r, i) => {
      const unitMult = r.unit === 'kg' ? 1000 : 1;
      const valueCeiling = Number(r.price) * Number(r.qty) * unitMult;
      return {
        name:   r.name || `Product ${i + 1}`,
        tonnes: Number(r.qty) * y1Scale,
        price:  Number(r.price),
        unit:   r.unit,
        value:  valueCeiling * y1Scale,
        color:  PRODUCT_COLORS_EXPORT[i % PRODUCT_COLORS_EXPORT.length],
      };
    });
  }, [input.revenueRows, y1Scale]);
  const totalY1 = products.reduce((s, p) => s + p.value, 0);

  // CAPEX
  const rawCapex = useMemo(() => {
    const fromRows = (input.capexRows || [])
      .reduce((s, r) => r.enabled === false ? s : s + Number(r.amount || 0), 0);
    return fromRows > 0 ? fromRows : Number(input.capex || 0);
  }, [input.capexRows, input.capex]);
  const effCapex = calc.effectiveCapex;
  const revCeil  = calc.revenue;

  // Narrative — short product list for the deck (max 4 products).
  const productList = (input.revenueRows || [])
    .filter(r => r.enabled !== false && r.name && Number(r.qty) > 0)
    .map(r => String(r.name).toLowerCase())
    .slice(0, 4)
    .join(', ');

  return (
    <section className="fr-page">

      {/* ── Masthead ────────────────────────────────────────────── */}
      <header className={`fr-masthead ${insight?.positive ? 'fr-mh-positive' : 'fr-mh-warn'}`}>

        {/* IRR */}
        <div className="fr-irr-col">
          <div className="fr-eyebrow">IRR · Internal Rate of Return</div>
          <BigNum value={irr != null ? irr.toFixed(0) : '—'} unit="%" tone="accent"/>
          <div className="fr-sub">
            vs <b>{dr}% hurdle rate</b>
            {irrHeadroom != null && <> · {irrHeadroom >= 0 ? '+' : ''}{irrHeadroom} pp headroom</>}
          </div>
          <SectorBar value={irr} min={SECTOR_IRR.min} max={SECTOR_IRR.max} label={SECTOR_IRR.label}/>
        </div>

        {/* Centre — title, verdict, deck */}
        <div className="fr-center-col">
          <h1 className="fr-title">
            {selectedProject?.title || 'Project'}{' '}
            <span className="fr-title-italic">— Feasibility Report</span>
          </h1>
          {insight?.verdict && (
            <div className={`fr-verdict-pill ${insight.positive ? 'on' : 'warn'}`}>
              <span className="dot"/>
              <span>{insight.verdict}</span>
            </div>
          )}
          <p className="fr-deck">
            {rawCapex > 0 && (
              <>A <b>{fmtINR(rawCapex)}</b>{productList ? ' integrated plant' : ' project'}</>
            )}
            {productList && <> — {productList}.</>}
            {!productList && rawCapex > 0 && '.'}
            {effCapex > 0 && effCapex < rawCapex && (
              <> Subsidies bring effective capex to <b>{fmtINR(effCapex)}</b>;</>
            )}
            {revY1 > 0 && cpY1 > 0 && (
              <> Year 1 revenue of <b>{fmtINR(revY1)}</b> at {cpY1}% capacity</>
            )}
            {revCeil > revY1 && cpCeil > cpY1 && (
              <> ramps to <b>{fmtINR(revCeil)}</b> at the {cpCeil}% ceiling</>
            )}
            {(revY1 > 0 || revCeil > 0) && '.'}
          </p>
        </div>

        {/* Payback */}
        <div className="fr-payback-col">
          <div className="fr-eyebrow">Payback Period</div>
          <BigNum value={payback != null ? payback.toFixed(1) : '—'} unit="yr" tone="gold"/>
          <div className="fr-sub">
            {payback != null
              ? <>within the <b>{tn}-yr loan tenure</b>{paybackBuffer != null && paybackBuffer > 0 && <> · {paybackBuffer}% buffer</>}</>
              : <>set tenure to see buffer</>}
          </div>
          <SectorBar value={payback} min={SECTOR_PAYBACK.min} max={SECTOR_PAYBACK.max} label={SECTOR_PAYBACK.label}/>
        </div>
      </header>

      {/* ── KPI row ─────────────────────────────────────────────────
          Each KPI carries a role (return / coverage) and a sentiment
          (positive / warn / danger). The role drives a 3px left-stripe
          in CSS; the sentiment colours the sparkline so the chart
          tells the same story the value does. */}
      <div className="fr-kpi-row">
        <KpiCard
          label={`NPV @ ${dr}%`}
          value={fmtINR(npv)}
          sub={isFinite(npv)
            ? (npv > 0 ? `+${fmtINR(npv)} over hurdle` : `${fmtINR(Math.abs(npv))} below hurdle`)
            : '—'}
          role="return"
          tone={isFinite(npv) && npv > 0 ? 'positive' : 'danger'}
          chart={<NPVBar value={npv} scale={calc.effectiveCapex || 1} color={isFinite(npv) && npv > 0 ? C.success : C.danger} width={120}/>}
        />
        <KpiCard
          label="Net Profit · Year 1"
          value={fmtINR(netY1)}
          sub="after interest, tax, principal"
          role="return"
          tone={netY1 > 0 ? 'positive' : 'danger'}
          chart={<Sparkline values={calc.rows.map(r => r.netProfit ?? 0)} color={netY1 > 0 ? C.success : C.danger} width={120} height={26}/>}
        />
        <KpiCard
          label="EBITDA · Year 1"
          value={fmtINR(ebitdaY1)}
          sub={`${ebitdaY1Margin}% margin · at ${cpY1}% util.`}
          role="return"
          tone={ebitdaY1 > 0 ? 'positive' : 'danger'}
          chart={<Sparkline values={calc.rows.map(r => r.ebitda)} color={ebitdaY1 > 0 ? C.success : C.danger} width={120} height={26}/>}
        />
        <KpiCard
          label="DSCR · Year 1"
          value={dscrY1 != null ? `${dscrY1.toFixed(2)}×` : '—'}
          sub="covenant: ≥ 1.25×"
          role="coverage"
          tone={dscrY1 == null ? 'neutral' : dscrY1 >= 1.5 ? 'positive' : dscrY1 >= 1.25 ? 'warn' : 'danger'}
          chart={<Sparkline values={calc.rows.map(r => r.dscr ?? 0)} color={dscrY1 == null ? C.fg2 : dscrY1 >= 1.5 ? C.success : dscrY1 >= 1.25 ? C.warning : C.danger} width={120} height={26}/>}
        />
        <KpiCard
          label="Break-even capacity"
          value={be != null ? `${Math.round(be)}%` : '—'}
          sub={beVsCeiling != null ? `of ${cpCeil}% ceiling · ${beNarrow}` : 'enter inputs'}
          role="coverage"
          tone={beVsCeiling == null ? 'neutral' : beVsCeiling < 80 ? 'positive' : beVsCeiling <= 100 ? 'warn' : 'danger'}
          chart={<BreakEvenBar pct={be} ceiling={cpCeil} tone={beVsCeiling == null ? 'neutral' : beVsCeiling < 80 ? 'positive' : beVsCeiling <= 100 ? 'warn' : 'danger'}/>}
        />
      </div>

      {/* ── Charts row ──────────────────────────────────────────── */}
      <div className="fr-charts-row">

        {/* Revenue mix */}
        <div className="fr-mix-card">
          <div className="fr-card-head">
            <h3 className="fr-card-title">Revenue mix</h3>
            <div className="fr-card-meta">{fmtINR(totalY1)} / yr · Y1 at {cpY1}%</div>
          </div>
          {products.length === 0 ? (
            <div className="fr-empty">Add products in the assumptions panel to see the revenue mix.</div>
          ) : (
            <div className="fr-mix-body">
              <div className="fr-mix-chart">
                <DonutChart
                  segments={products.map(p => ({ name: p.name, value: p.value, color: p.color }))}
                  totalLabel={fmtINR(totalY1)}
                />
              </div>
              <div className="fr-mix-list">
                {products.map((p) => {
                  const pct = totalY1 > 0 ? Math.round((p.value / totalY1) * 100) : 0;
                  return (
                    <div key={p.name} className="fr-mix-row">
                      <span className="fr-mix-dot" style={{ background: p.color }}/>
                      <div className="fr-mix-nm">
                        <div className="fr-mix-name">
                          {p.name}{' '}
                          <span className="fr-mix-q">· {p.tonnes.toFixed(p.tonnes < 10 ? 1 : 0)} t</span>
                        </div>
                        <div className="fr-mix-px">₹{p.price.toLocaleString()}/{p.unit}</div>
                      </div>
                      <div className="fr-mix-val">{fmtINR(p.value)}</div>
                      <div className="fr-mix-pct">{pct}%</div>
                    </div>
                  );
                })}
                <div className="fr-mix-total">
                  <div className="fr-mix-tlbl">Y1 revenue at {cpY1}%</div>
                  <div className="fr-mix-val">{fmtINR(totalY1)}</div>
                  <div className="fr-mix-pct">100%</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cash flow */}
        <div className="fr-cashflow-card">
          <div className="fr-card-head">
            <h3 className="fr-card-title">{calc.rows.length}-year cash flow</h3>
            <div className="fr-card-meta">
              {rampYrs > 0
                ? `capacity ramps ${cpY1}% → ${cpCeil}% over ${rampYrs} yrs`
                : `capacity ${cpCeil}% flat`}
            </div>
          </div>
          <CashFlowChart rows={calc.rows} payback={payback}/>
          <div className="fr-cf-legend">
            <Legend color={C.accent}  label="Revenue (inflation-adj)" kind="line"/>
            <Legend color={C.danger}  label="Operating costs"          kind="dashed"/>
            <Legend color={C.info}    label="EBITDA"                   kind="bar"/>
            <Legend color={C.warning} label="Payback"                  kind="dashed"/>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Sub-components ─────────────────────────────────────────────────

function BigNum({ value, unit, tone }) {
  return (
    <div className={`fr-big-num fr-tone-${tone || 'fg1'}`}>
      <span className="value">{value}</span>
      {unit && <span className="unit">{unit}</span>}
    </div>
  );
}

function SectorBar({ value, min, max, label }) {
  const span = Math.max(0.001, max - min);
  const pad  = { lo: min - span * 0.6, hi: max + span * 0.6 };
  const pctOf = (v) => {
    const total = pad.hi - pad.lo;
    return Math.max(0, Math.min(100, ((v - pad.lo) / total) * 100));
  };
  const left  = pctOf(min);
  const right = pctOf(max);
  const mark  = value != null && isFinite(value) ? pctOf(value) : null;
  return (
    <div className="fr-sector">
      <span className="fr-sector-lbl">Sector</span>
      <div className="fr-sector-track">
        <span className="fr-sector-range" style={{ left: `${left}%`, width: `${right - left}%` }}/>
        {mark != null && <span className="fr-sector-mark" style={{ left: `${mark}%` }}/>}
      </div>
      <span className="fr-sector-rlbl">{label}</span>
    </div>
  );
}

function KpiCard({ label, value, sub, role, tone, chart }) {
  return (
    <div className={`fr-kpi fr-kpi-${tone || 'neutral'}`} data-role={role || 'return'}>
      <div className="fr-kpi-label">{label}</div>
      <div className="fr-kpi-value">{value}</div>
      {sub && <div className="fr-kpi-sub">{sub}</div>}
      {chart && <div className="fr-kpi-chart">{chart}</div>}
    </div>
  );
}

function BreakEvenBar({ pct, ceiling, tone }) {
  if (pct == null || !ceiling || ceiling <= 0) return null;
  const w = Math.max(0, Math.min(100, (pct / ceiling) * 100));
  return (
    <div className="fr-be-bar" data-tone={tone || 'positive'}>
      <span className="fr-be-fill" style={{ width: `${w}%` }}/>
    </div>
  );
}

function Legend({ color, label, kind }) {
  return (
    <span className="fr-legend-item" style={{ color }}>
      <span className={`fr-legend-mark fr-legend-${kind}`}/>
      <span className="fr-legend-label">{label}</span>
    </span>
  );
}

// Linear interpolation within the year that crosses zero, so payback is
// a fractional year (e.g. 2.6) instead of the engine's integer year.
function fractionalPayback(rows, equity) {
  if (!rows || rows.length === 0) return null;
  let cum = -Number(equity || 0);
  for (const r of rows) {
    const next = cum + r.ncf;
    if (next >= 0) {
      const frac = r.ncf > 0 ? Math.min(1, Math.max(0, -cum / r.ncf)) : 0;
      return (r.t - 1) + frac;
    }
    cum = next;
  }
  return null;
}
