/**
 * Financial calculation engine — pure functions, no React.
 *
 * Used by the Calculations page to compute revenue, costs, EBITDA, IRR,
 * NPV, payback, DSCR, working capital, and a year-by-year cash-flow
 * projection from a structured input object. Extracted so the Compare
 * tab can run the same math against a second project's saved inputs
 * without re-mounting the calculator UI.
 *
 * Inputs are kept loosely-typed (numbers default to 0 when missing or
 * non-numeric) so partially-filled forms still render meaningful output.
 */

const PRODUCT_COLORS = ['#b5860d', '#2563a8', '#2d7a3c', '#7c3d9a', '#c0392b', '#0891b2', '#d97706'];

const num = v => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** Newton-Raphson IRR. Returns IRR as a percentage, or null when the
    cash-flow stream has no negative-then-positive flip (degenerate). */
export function calcIRR(cashFlows) {
  if (!cashFlows[0] || cashFlows[0] >= 0) return null;
  let rate = 0.15;
  for (let i = 0; i < 200; i++) {
    let npv = 0, dnpv = 0;
    for (let t = 0; t < cashFlows.length; t++) {
      const pv = Math.pow(1 + rate, t);
      npv  += cashFlows[t] / pv;
      dnpv -= t * cashFlows[t] / (pv * (1 + rate));
    }
    if (Math.abs(dnpv) < 1e-10) break;
    const next = rate - npv / dnpv;
    if (!Number.isFinite(next)) break;
    if (Math.abs(next - rate) < 1e-9) { rate = next; break; }
    rate = Math.max(-0.99, Math.min(next, 5));
  }
  return (rate > -0.99 && rate < 5) ? rate * 100 : null;
}

/** Run the engine. Returns derived metrics + per-year projection rows. */
export function runCalc(input) {
  const {
    capex = 0,
    lifetime = 10,
    discountRate = 12,
    debtPct = 60,
    interestRate = 12,
    tenure = 7,
    taxRate = 25,
    interestSubventionPct = 0,
    interestSubventionYears = 5,
    pmegpEnabled = false,
    pmegpPct = 25,
    citusEnabled = false,
    apmsmeEnabled = false,
    revenueRows = [],
    varRows = [],
    fixedRows = [],
    receivableDays = 30,
    payableDays = 15,
    inventoryDays = 20,
    capacityPct = 100,
    // Per-year capacity ramp. Y1 starts at `capacityY1Pct`, climbs by
    // `capacityRampPct` points each year, capped at `capacityCeilingPct`.
    // Auto-shim: projects saved before the ramp existed only stored
    // `capacityPct` — treat that as the ceiling AND the Y1 value (ramp 0)
    // so behaviour is identical until the user edits the new fields.
    capacityCeilingPct = capacityPct,
    capacityY1Pct      = capacityPct,
    capacityRampPct    = 0,
    // Optional category-by-category breakdown of CAPEX. When any enabled
    // row has a non-zero amount, the SUM is authoritative and the legacy
    // `capex` scalar is ignored. When empty / all zero, we fall back to
    // `capex` so projects saved before this field existed work unchanged.
    capexRows = [],
    // Annual escalation applied inside the year loop. Y1 stays at the
    // base; Y2 = base × (1+pct), Y3 = base × (1+pct)^2, etc. Defaults
    // are zero so projects saved before this field existed run unchanged
    // (flat-real-terms behaviour).
    revenueInflationPct = 0,
    costInflationPct    = 0,
  } = input || {};

  const citus  = citusEnabled ? 0.25 : 0;
  const apmsme = apmsmeEnabled ? 0.20 : 0;
  const capexFromRows = capexRows.reduce((s, r) => r.enabled === false ? s : s + num(r.amount), 0);
  const capexN = capexFromRows > 0 ? capexFromRows : num(capex);

  // PMEGP urban manufacturing only subsidises the first ₹50 L of project
  // cost. Anything above the cap is the promoter's full responsibility, so
  // a ₹2 Cr project with PMEGP at 25% gets ₹12.5 L off (not ₹50 L). Apply
  // PMEGP first as a flat ₹ deduction; CITUS and APMSME then stack
  // multiplicatively on what's left.
  const PMEGP_CAP = 5000000; // ₹50 L
  const pmegpPctFrac = pmegpEnabled ? num(pmegpPct) / 100 : 0;
  const pmegpEligibleCapex = Math.min(capexN, PMEGP_CAP);
  const pmegpSubsidy = pmegpEligibleCapex * pmegpPctFrac;
  const afterPmegp  = capexN - pmegpSubsidy;
  const effectiveCapex  = afterPmegp * (1 - citus) * (1 - apmsme);
  const debt   = num(debtPct);
  const loan            = effectiveCapex * (debt / 100);
  const equity          = effectiveCapex * ((100 - debt) / 100);
  const tenureN  = Math.max(1, num(tenure));
  const annualPrincipal = loan / tenureN;

  const capCeilFrac = Math.max(0, Math.min(100, num(capacityCeilingPct))) / 100;
  const capY1Frac   = Math.max(0, Math.min(100, num(capacityY1Pct)))      / 100;
  const capRampFrac = num(capacityRampPct) / 100;

  // Steady-state capacity for the top-level KPIs (Annual Revenue card,
  // Revenue Composition donut, Working Capital). Per-year ramp is applied
  // only inside the projection loop.
  // `enabled` is opt-out — rows without the field are treated as enabled
  // (backward-compat with projects saved before the toggle existed).
  const isOn              = (r) => r.enabled !== false;
  // Per-product cost allocation: a var row can be tagged with a
  // `productId` pointing at a revenueRow.id. When that product is
  // disabled (toggled OFF in Quick Estimate), its linked variable costs
  // drop out too. Var rows without a `productId` are "global" and stay
  // counted as long as they're enabled.
  const disabledProductIds = new Set(
    revenueRows.filter(r => r.enabled === false).map(r => r.id)
  );
  const isVarLinkedToDisabled = (r) =>
    r.productId != null && disabledProductIds.has(r.productId);
  const fullRevenue       = revenueRows.reduce((s, r) => isOn(r) ? s + num(r.price) * num(r.qty) : s, 0);
  const fullVariableCosts = varRows.reduce((s, r) =>
    (isOn(r) && !isVarLinkedToDisabled(r)) ? s + num(r.price) * num(r.qty) : s, 0);
  const fixedCosts        = fixedRows.reduce((s, r) => isOn(r) ? s + num(r.amount) : s, 0);

  const revenue       = fullRevenue * capCeilFrac;
  const variableCosts = fullVariableCosts * capCeilFrac;
  const ebitda        = revenue - variableCosts - fixedCosts;
  const ebitdaMargin  = revenue > 0 ? (ebitda / revenue) * 100 : 0;

  const breakEvenCapacity = (fullRevenue - fullVariableCosts) > 0
    ? (fixedCosts / (fullRevenue - fullVariableCosts)) * 100
    : null;

  const lifetimeN = Math.max(1, num(lifetime));
  const interestN = num(interestRate);

  const subventionPct  = num(interestSubventionPct) / 100;
  const subventionYrs  = Math.max(0, num(interestSubventionYears));

  const revInflFrac  = num(revenueInflationPct) / 100;
  const costInflFrac = num(costInflationPct)    / 100;

  const rows = [];
  let wdvBook = capexN;
  let cumNCF  = -equity;
  for (let t = 1; t <= lifetimeN; t++) {
    // Per-year capacity climbs linearly from Y1 toward the ceiling.
    const capYr     = Math.min(capCeilFrac, capY1Frac + (t - 1) * capRampFrac);
    // Inflation factors — Y1 stays at the base (exponent 0), Y2+ scale
    // by (1+rate)^(t-1). Revenue and costs use independent rates so a
    // project that raises prices 5%/yr while costs climb 7%/yr correctly
    // sees its margin compress over time.
    const revInflFactor  = Math.pow(1 + revInflFrac,  t - 1);
    const costInflFactor = Math.pow(1 + costInflFrac, t - 1);
    const revYr     = fullRevenue       * capYr * revInflFactor;
    const varYr     = fullVariableCosts * capYr * costInflFactor;
    const fixedYr   = fixedCosts                * costInflFactor;
    const ebitdaYr  = revYr - varYr - fixedYr;

    const depreciation = wdvBook * 0.15;
    wdvBook = Math.max(0, wdvBook - depreciation);
    const loanBalance = Math.max(0, loan - (t - 1) * annualPrincipal);
    const principal   = t <= tenureN ? annualPrincipal : 0;
    const interest    = loanBalance * (interestN / 100);
    // Government subvention is cash received separately, not an interest
    // reduction — the bank still charges full interest. So it leaves DSCR
    // (numerator EBITDA, denominator gross debt service) untouched and
    // shows up as an additive line in the cash-flow stream.
    const subvention  = (t <= subventionYrs && loanBalance > 0)
      ? loanBalance * subventionPct
      : 0;
    const ebit        = ebitdaYr - depreciation;
    const ebt         = ebit - interest;
    const tax         = Math.max(0, ebt * (num(taxRate) / 100));
    const pat         = ebt - tax;
    const ncf         = pat + depreciation - principal + subvention;
    cumNCF += ncf;
    const dscr = (principal + interest) > 0 ? ebitdaYr / (principal + interest) : null;
    rows.push({ t, capacityPct: capYr * 100, revenue: revYr, variableCosts: varYr, fixedCosts: fixedYr, ebitda: ebitdaYr, depreciation, interest, subvention, ebt, tax, pat, principal, ncf, cumNCF, dscr, loanBalance });
  }

  const totalSubvention = rows.reduce((s, r) => s + r.subvention, 0);

  const cashFlows = [-equity, ...rows.map(r => r.ncf)];
  const irr = equity > 0 ? calcIRR(cashFlows) : null;

  const r   = num(discountRate) / 100;
  const npv = cashFlows.reduce((s, cf, t) => s + cf / Math.pow(1 + r, t), 0);

  const paybackRow = rows.find(row => row.cumNCF >= 0);
  const payback    = paybackRow ? paybackRow.t : null;

  const varPct       = revenue > 0 ? variableCosts / revenue : 0;
  const breakEvenRev = revenue > 0 && (1 - varPct) > 0 ? fixedCosts / (1 - varPct) : null;

  const workingCapital = revenue > 0
    ? (num(receivableDays) + num(inventoryDays) - num(payableDays)) * revenue / 365
    : 0;

  const revenueByProduct = revenueRows.map((row, i) => ({
    name: row.name || `Product ${i + 1}`,
    value: isOn(row) ? num(row.price) * num(row.qty) * capCeilFrac : 0,
    color: PRODUCT_COLORS[i % PRODUCT_COLORS.length],
  })).filter(s => s.value > 0);

  const dscrY1 = rows[0]?.dscr ?? null;

  return {
    effectiveCapex, equity, loan, revenue, variableCosts, fixedCosts, ebitda, ebitdaMargin,
    rows, irr, npv, payback, breakEvenRev, breakEvenCapacity, workingCapital,
    revenueByProduct, dscrY1, totalSubvention,
  };
}

/** Sensitivity: how much does each metric move when each driver flexes
    ±pct? Returns one row per driver with base/low/high snapshots and
    deltas for IRR (percentage points), Y1 EBITDA (₹) and Y1 PAT (₹).
    No sorting — the caller picks a metric and sorts by impact in that
    metric. */
export function runSensitivity(input, pct = 20) {
  const baseRun = runCalc(input);
  const baseY1  = baseRun.rows[0] || { ebitda: 0, pat: 0 };
  const base    = { irr: baseRun.irr, ebitda: baseY1.ebitda, pat: baseY1.pat };

  // Bail when there's no signal at all — nothing to flex.
  if (base.irr === null && base.ebitda === 0 && base.pat === 0 && baseRun.revenue === 0) {
    return { base, rows: [] };
  }

  const baseCeiling = num(input.capacityCeilingPct ?? input.capacityPct);
  const drivers = [
    { key: 'capex',        label: 'CAPEX',            patch: (m) => ({ capex: num(input.capex) * m }) },
    { key: 'capacityPct',  label: 'Capacity Ceiling', patch: (m) => ({
        capacityCeilingPct: Math.min(100, baseCeiling * m),
        capacityPct:        Math.min(100, baseCeiling * m),
      }) },
    { key: 'interestRate', label: 'Interest Rate',    patch: (m) => ({ interestRate: num(input.interestRate) * m }) },
    { key: 'revenueRows',  label: 'Sale Price',       patch: (m) => ({ revenueRows: input.revenueRows.map(r => ({ ...r, price: num(r.price) * m })) }) },
    { key: 'varRows',      label: 'Variable Cost',    patch: (m) => ({ varRows:     input.varRows.map(r => ({ ...r, price: num(r.price) * m })) }) },
    { key: 'fixedRows',    label: 'Fixed Cost',       patch: (m) => ({ fixedRows:   input.fixedRows.map(r => ({ ...r, amount: num(r.amount) * m })) }) },
  ];

  const lowMult  = 1 - pct / 100;
  const highMult = 1 + pct / 100;

  const snapshot = (run) => {
    const y1 = run.rows[0] || { ebitda: 0, pat: 0 };
    return { irr: run.irr, ebitda: y1.ebitda, pat: y1.pat };
  };

  const rows = drivers.map(d => {
    const lowRun  = runCalc({ ...input, ...d.patch(lowMult)  });
    const highRun = runCalc({ ...input, ...d.patch(highMult) });
    const low  = snapshot(lowRun);
    const high = snapshot(highRun);
    return {
      key: d.key,
      label: d.label,
      base,
      low,
      high,
      deltaIrrLow:     low.irr  !== null ? low.irr  - base.irr  : 0,
      deltaIrrHigh:    high.irr !== null ? high.irr - base.irr  : 0,
      deltaEbitdaLow:  low.ebitda  - base.ebitda,
      deltaEbitdaHigh: high.ebitda - base.ebitda,
      deltaPatLow:     low.pat    - base.pat,
      deltaPatHigh:    high.pat   - base.pat,
    };
  });

  return { base, rows };
}

/** Goal Seek — bisection solver. Given an `input`, a `lever` (a function
 *  that patches the input with a candidate value), a `metric` extractor
 *  that pulls the target metric out of a runCalc result, and a `target`
 *  value, search the lever's [min, max] range for the value that makes
 *  metric(runCalc(...)) equal to target (within tol). Returns
 *  { found, value, achieved, iterations, monotonic } — `found` is false
 *  when the target lies outside what the lever can reach in [min, max].
 *
 *  Bisection is robust + bounded — converges in ~30 steps for any
 *  monotonic metric. We don't assume the metric is monotonic globally,
 *  but the supported lever × metric pairs (capex / capacity / interest
 *  / sale price / variable cost vs IRR / NPV / EBITDA / Payback) all are
 *  monotonic in practice.
 */
export function solveFor({ input, lever, metric, target, min, max, tol = 1e-3, maxIter = 40 }) {
  const evalAt = (v) => {
    const result = runCalc({ ...input, ...lever(v) });
    return metric(result);
  };

  let lo = min;
  let hi = max;
  const f = (v) => {
    const m = evalAt(v);
    return (m === null || !isFinite(m)) ? null : m - target;
  };

  let fLo = f(lo);
  let fHi = f(hi);
  if (fLo === null || fHi === null) {
    return { found: false, reason: 'metric undefined at search boundary' };
  }
  // Same-sign at both endpoints means target is outside reachable range
  if (fLo * fHi > 0) {
    const closest = Math.abs(fLo) < Math.abs(fHi) ? lo : hi;
    return {
      found: false,
      reason: 'target unreachable in lever range',
      closestValue: closest,
      closestMetric: evalAt(closest),
      boundaryLow:  evalAt(lo),
      boundaryHigh: evalAt(hi),
    };
  }

  let iter = 0;
  while (iter < maxIter && (hi - lo) > tol) {
    const mid = (lo + hi) / 2;
    const fMid = f(mid);
    if (fMid === null) break;
    if (Math.abs(fMid) < tol) {
      return { found: true, value: mid, achieved: evalAt(mid), iterations: iter };
    }
    if (fLo * fMid <= 0) {
      hi = mid; fHi = fMid;
    } else {
      lo = mid; fLo = fMid;
    }
    iter++;
  }
  const value = (lo + hi) / 2;
  return { found: true, value, achieved: evalAt(value), iterations: iter };
}

/** Default empty input — used when a project has no saved calc yet. */
export const DEFAULT_CALC_INPUT = {
  capex: 0,
  lifetime: 10,
  discountRate: 12,
  debtPct: 60,
  interestRate: 12,
  tenure: 7,
  taxRate: 25,
  interestSubventionPct: 0,
  interestSubventionYears: 5,
  pmegpEnabled: false,
  pmegpPct: 25,
  citusEnabled: false,
  apmsmeEnabled: false,
  revenueRows: [{ id: 1, name: '', unit: '', price: 0, qty: 0, enabled: true }],
  varRows: [],
  fixedRows: [{ id: 1, name: '', amount: 0, enabled: true }],
  capexRows: [],
  revenueInflationPct: 0,
  costInflationPct: 0,
  receivableDays: 30,
  payableDays: 15,
  inventoryDays: 20,
  capacityPct: 80,           // legacy steady-state; kept in sync with ceiling
  capacityCeilingPct: 80,    // long-run target capacity
  capacityY1Pct: 50,         // realistic Year-1 utilisation (setup year)
  capacityRampPct: 10,       // points added per year until the ceiling
};

export const PRODUCT_COLORS_EXPORT = PRODUCT_COLORS;
