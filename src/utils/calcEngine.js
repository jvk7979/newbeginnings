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
  } = input || {};

  const citus  = citusEnabled ? 0.25 : 0;
  const apmsme = apmsmeEnabled ? 0.20 : 0;
  const capexN = num(capex);

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
  const cap             = num(capacityPct) / 100;

  const fullRevenue       = revenueRows.reduce((s, r) => s + num(r.price) * num(r.qty), 0);
  const fullVariableCosts = varRows.reduce((s, r) => s + num(r.price) * num(r.qty), 0);
  const fixedCosts        = fixedRows.reduce((s, r) => s + num(r.amount), 0);

  const revenue       = fullRevenue * cap;
  const variableCosts = fullVariableCosts * cap;
  const ebitda        = revenue - variableCosts - fixedCosts;
  const ebitdaMargin  = revenue > 0 ? (ebitda / revenue) * 100 : 0;

  const breakEvenCapacity = (fullRevenue - fullVariableCosts) > 0
    ? (fixedCosts / (fullRevenue - fullVariableCosts)) * 100
    : null;

  const lifetimeN = Math.max(1, num(lifetime));
  const interestN = num(interestRate);

  const rows = [];
  let wdvBook = capexN;
  let cumNCF  = -equity;
  for (let t = 1; t <= lifetimeN; t++) {
    const depreciation = wdvBook * 0.15;
    wdvBook = Math.max(0, wdvBook - depreciation);
    const loanBalance = Math.max(0, loan - (t - 1) * annualPrincipal);
    const principal   = t <= tenureN ? annualPrincipal : 0;
    const interest    = loanBalance * (interestN / 100);
    const ebit        = ebitda - depreciation;
    const ebt         = ebit - interest;
    const tax         = Math.max(0, ebt * (num(taxRate) / 100));
    const pat         = ebt - tax;
    const ncf         = pat + depreciation - principal;
    cumNCF += ncf;
    const dscr = (principal + interest) > 0 ? ebitda / (principal + interest) : null;
    rows.push({ t, revenue, variableCosts, fixedCosts, ebitda, depreciation, interest, ebt, tax, pat, principal, ncf, cumNCF, dscr, loanBalance });
  }

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
    value: num(row.price) * num(row.qty) * cap,
    color: PRODUCT_COLORS[i % PRODUCT_COLORS.length],
  })).filter(s => s.value > 0);

  const dscrY1 = rows[0]?.dscr ?? null;

  return {
    effectiveCapex, equity, loan, revenue, variableCosts, fixedCosts, ebitda, ebitdaMargin,
    rows, irr, npv, payback, breakEvenRev, breakEvenCapacity, workingCapital,
    revenueByProduct, dscrY1,
  };
}

/** Sensitivity table: how much does IRR change when each input flexes
    +/- pct? Used by the Sensitivity tab. Returns [{ key, label, low, base, high, deltaLow, deltaHigh }] sorted by absolute impact. */
export function runSensitivity(input, pct = 20) {
  const base = runCalc(input).irr;
  if (base === null) return [];

  const flex = (mult) => ({
    capex:        runCalc({ ...input, capex:        num(input.capex)        * mult }).irr,
    capacityPct:  runCalc({ ...input, capacityPct:  Math.min(100, num(input.capacityPct) * mult) }).irr,
    interestRate: runCalc({ ...input, interestRate: num(input.interestRate) * mult }).irr,
    revenueRows:  runCalc({ ...input, revenueRows: input.revenueRows.map(r => ({ ...r, price: num(r.price) * mult })) }).irr,
    varRows:      runCalc({ ...input, varRows:     input.varRows.map(r => ({ ...r, price: num(r.price) * mult })) }).irr,
    fixedRows:    runCalc({ ...input, fixedRows:   input.fixedRows.map(r => ({ ...r, amount: num(r.amount) * mult })) }).irr,
  });

  const low  = flex(1 - pct / 100);
  const high = flex(1 + pct / 100);

  const labels = {
    capex:        'CAPEX',
    capacityPct:  'Capacity Utilisation',
    interestRate: 'Interest Rate',
    revenueRows:  'Sale Price',
    varRows:      'Variable Cost',
    fixedRows:    'Fixed Cost',
  };

  return Object.keys(labels).map(key => ({
    key,
    label: labels[key],
    base,
    low:  low[key],
    high: high[key],
    deltaLow:  low[key]  !== null ? low[key]  - base : 0,
    deltaHigh: high[key] !== null ? high[key] - base : 0,
  })).sort((a, b) => Math.max(Math.abs(b.deltaLow), Math.abs(b.deltaHigh)) - Math.max(Math.abs(a.deltaLow), Math.abs(a.deltaHigh)));
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
  pmegpEnabled: false,
  pmegpPct: 25,
  citusEnabled: false,
  apmsmeEnabled: false,
  revenueRows: [{ id: 1, name: '', unit: '', price: 0, qty: 0 }],
  varRows: [],
  fixedRows: [{ id: 1, name: '', amount: 0 }],
  receivableDays: 30,
  payableDays: 15,
  inventoryDays: 20,
  capacityPct: 100,
};

export const PRODUCT_COLORS_EXPORT = PRODUCT_COLORS;
