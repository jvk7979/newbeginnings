// Pure data-shaper for the DPR PDF. Takes the same (input, calc,
// project) the page already has and returns a structured object the
// PDF document can render section-by-section. No React, no PDF lib —
// just data transformation. Keeps the PDF document component focused
// on layout.

import { runSensitivity, unitMult } from '../calcEngine';

// Indian-format numeric formatter — distinct from fmtINR/fmtShort so we
// can present "₹1,40,00,000" style numbers in tables. The web app uses
// Cr/L/K shorthand for compactness; bankers want the full number.
export function fmtFull(n) {
  if (n === null || n === undefined || !isFinite(n)) return '—';
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  // Indian comma grouping: last 3 digits, then 2-digit groups.
  const intPart = Math.round(abs).toString();
  const lastThree = intPart.slice(-3);
  const rest = intPart.slice(0, -3);
  const grouped = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree : lastThree;
  return `${sign}₹${grouped}`;
}

export function fmtCompact(n) {
  if (n === null || n === undefined || !isFinite(n)) return '—';
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(2)} Cr`;
  if (abs >= 100000)   return `${sign}₹${(abs / 100000).toFixed(1)} L`;
  if (abs >= 1000)     return `${sign}₹${(abs / 1000).toFixed(1)} K`;
  return `${sign}₹${Math.round(abs)}`;
}

export function fmtPct(n, decimals = 1) {
  if (n === null || n === undefined || !isFinite(n)) return '—';
  return `${n.toFixed(decimals)}%`;
}

// Build the top-level verdict copy so the cover page + executive
// summary share the same headline.
function buildVerdict(input, calc) {
  const dr = Number(input.discountRate) || 12;
  const tn = Number(input.tenure) || 7;
  const cp = Number(input.capacityCeilingPct ?? input.capacityPct) || 0;
  const { irr, payback } = calc;
  if (irr === null && payback === null) {
    return { headline: 'Pending data', detail: 'Enter products, costs, and CAPEX to render projections.', positive: false };
  }
  if (irr !== null && irr > dr * 1.5 && payback !== null && payback < tn * 0.6) {
    return {
      headline: `Strong returns at ${cp}% ceiling`,
      detail: `Payback in ${payback} year${payback !== 1 ? 's' : ''} with IRR of ${irr.toFixed(1)}% — comfortably exceeds the ${dr}% hurdle.`,
      positive: true,
    };
  }
  if (irr !== null && irr > dr && payback !== null && payback <= tn) {
    return {
      headline: `Viable at ${cp}% ceiling`,
      detail: `Payback in ${payback} year${payback !== 1 ? 's' : ''} with IRR of ${irr.toFixed(1)}% — clears the ${dr}% hurdle.`,
      positive: true,
    };
  }
  return {
    headline: `Below break-even at ${cp}% ceiling`,
    detail: `IRR of ${irr !== null ? irr.toFixed(1) + '%' : '—'} does not meet the ${dr}% hurdle. Review pricing or cost structure.`,
    positive: false,
  };
}

export function buildDPRData({ input, calc, project }) {
  const verdict = buildVerdict(input, calc);
  const generatedAt = new Date();

  // Cover info
  const cover = {
    projectName: project?.title || 'Untitled Project',
    projectCategory: project?.category || '',
    promoterName: project?.promoter || '',
    location: project?.location || '',
    generatedAt,
    verdict: verdict.headline,
  };

  // Executive summary KPIs
  const dr = Number(input.discountRate) || 12;
  const tn = Number(input.tenure) || 7;
  const ceiling = Number(input.capacityCeilingPct ?? input.capacityPct) || 0;
  const summary = {
    verdict,
    headline: [
      { label: 'IRR (project)',    value: calc.irr !== null ? fmtPct(calc.irr) : '—', sub: `vs ${dr}% hurdle` },
      { label: 'NPV',              value: fmtCompact(calc.npv),                       sub: `at ${dr}% discount` },
      { label: 'Payback',          value: calc.payback !== null ? `${calc.payback} year${calc.payback !== 1 ? 's' : ''}` : '> lifetime', sub: `${tn}-yr loan tenure` },
      { label: 'Y1 DSCR',          value: calc.dscrY1 !== null ? calc.dscrY1.toFixed(2) : '—', sub: '≥ 1.25 comfortable' },
      { label: 'Operating Profit', value: fmtCompact(calc.ebitda),                    sub: `${calc.ebitdaMargin.toFixed(1)}% margin` },
      { label: 'Net Profit (Y1)',  value: fmtCompact(calc.netProfitY1 ?? 0),          sub: `after interest, tax, principal` },
      { label: 'Annual Revenue',   value: fmtCompact(calc.revenue),                   sub: `at ${ceiling}% ceiling` },
    ],
  };

  // Project configuration
  // `unit` is the *price* unit ('kg' = ₹/kg, 'ton' = ₹/tonne); `qty` is
  // always annual tonnes. annualValue applies the kg→tonne 1000× factor
  // when needed so the DPR's table totals match the dashboard.
  const products = (input.revenueRows || [])
    .filter(r => r.enabled !== false && Number(r.qty) > 0 && Number(r.price) > 0)
    .map((r, i) => ({
      name: r.name || `Product ${i + 1}`,
      unit: r.unit === 'ton' ? 'ton' : 'kg',
      price: Number(r.price),
      qty: Number(r.qty),
      annualValue: Number(r.price) * Number(r.qty) * unitMult(r) * (ceiling / 100),
    }));

  const variableCosts = (input.varRows || [])
    .filter(r => r.enabled !== false && Number(r.qty) > 0 && Number(r.price) > 0)
    .map((r, i) => ({
      name: r.name || `Variable ${i + 1}`,
      unit: r.unit === 'ton' ? 'ton' : 'kg',
      price: Number(r.price),
      qty: Number(r.qty),
      annualValue: Number(r.price) * Number(r.qty) * unitMult(r) * (ceiling / 100),
      productId: r.productId ?? null,
    }));

  const fixedCosts = (input.fixedRows || [])
    .filter(r => r.enabled !== false && Number(r.amount) > 0)
    .map((r, i) => ({
      name: r.name || `Fixed ${i + 1}`,
      annualValue: Number(r.amount),
    }));

  // Capex breakdown
  const capexRows = (input.capexRows || [])
    .filter(r => r.enabled !== false && Number(r.amount) > 0)
    .map((r, i) => ({
      name: r.name || `Capex ${i + 1}`,
      amount: Number(r.amount),
    }));
  const totalCapex = capexRows.reduce((s, r) => s + r.amount, 0) || Number(input.capex) || 0;
  const subsidySaved = Math.max(0, totalCapex - calc.effectiveCapex);

  const subsidies = [];
  if (input.pmegpEnabled) subsidies.push({ scheme: `PMEGP (${input.pmegpPct || 25}% on first ₹50 L)`, applied: true });
  if (input.citusEnabled) subsidies.push({ scheme: 'CITUS (25%)', applied: true });
  if (input.apmsmeEnabled) subsidies.push({ scheme: 'AP MSME 4.0 (20%)', applied: true });

  // Means of finance
  const finance = {
    grossCapex: totalCapex,
    subsidySaved,
    effectiveCapex: calc.effectiveCapex,
    equity: calc.equity,
    equityPct: 100 - Number(input.debtPct || 60),
    loan: calc.loan,
    debtPct: Number(input.debtPct || 60),
    interestRate: Number(input.interestRate || 12),
    tenure: Number(input.tenure || 7),
    workingCapital: calc.workingCapital,
    receivableDays: Number(input.receivableDays || 30),
    payableDays: Number(input.payableDays || 15),
    inventoryDays: Number(input.inventoryDays || 20),
  };

  // Year 1 P&L statement
  const y1 = calc.rows[0] || {};
  const grossProfit = (y1.revenue || 0) - (y1.variableCosts || 0);
  const taxRate = Number(input.taxRate || 25);
  const plStatement = [
    { label: 'Revenue',           amount: y1.revenue || 0,              detail: `Σ price × qty × ${(y1.capacityPct ?? 0).toFixed(0)}% capacity` },
    { label: 'Less: Variable Costs', amount: -(y1.variableCosts || 0),  detail: `Σ raw material × qty × ${(y1.capacityPct ?? 0).toFixed(0)}% capacity`, indent: true },
    { label: 'Gross Profit',      amount: grossProfit,                  detail: `${y1.revenue ? ((grossProfit / y1.revenue) * 100).toFixed(1) : 0}% gross margin`, subtotal: true },
    ...fixedCosts.map(f => ({ label: `Less: ${f.name}`, amount: -f.annualValue, detail: 'Annual fixed cost', indent: true })),
    { label: 'Operating Profit',  amount: y1.ebitda || 0,               detail: `${y1.revenue ? ((y1.ebitda / y1.revenue) * 100).toFixed(1) : 0}% operating margin`, subtotal: true },
    { label: 'Less: Depreciation', amount: -(y1.depreciation || 0),     detail: '15% WDV on remaining book value', indent: true },
    { label: 'Less: Interest',    amount: -(y1.interest || 0),          detail: `${finance.interestRate}% on Y1 loan balance`, indent: true },
    ...(y1.subvention > 0
      ? [{ label: 'Plus: Interest Subvention', amount: y1.subvention, detail: 'Government rebate (cash inflow)', indent: true, positive: true }]
      : []),
    { label: 'PBT',               amount: y1.ebt || 0,                  detail: 'Profit before tax', subtotal: true },
    { label: 'Less: Tax',         amount: -(y1.tax || 0),               detail: `${taxRate}% effective rate`, indent: true },
    { label: 'PAT',               amount: y1.pat || 0,                  detail: 'Profit after tax (accounting view)', subtotal: true },
    { label: 'Less: Loan Principal', amount: -(y1.principal || 0),      detail: 'Year 1 principal repayment', indent: true },
    { label: 'Net Profit',        amount: (y1.netProfit ?? ((y1.ebitda || 0) - (y1.interest || 0) - (y1.tax || 0) - (y1.principal || 0))), detail: `${y1.revenue ? (((y1.netProfit ?? 0) / y1.revenue) * 100).toFixed(1) : 0}% net margin · cash after interest, tax, principal`, subtotal: true },
  ];

  // 5-year projection table — slice all rows; bankers want the full
  // tenure-life view if available, but cap at 10 to keep the table
  // legible
  const projection = (calc.rows || []).slice(0, Math.min(10, calc.rows.length));

  // Loan schedule (repeats projection columns but isolates principal /
  // interest / balance for the bank-officer view)
  const loanSchedule = (calc.rows || [])
    .slice(0, Math.min(input.tenure || 7, calc.rows.length))
    .map(r => ({
      year: r.t,
      principal: r.principal,
      interest: r.interest,
      subvention: r.subvention || 0,
      loanBalance: r.loanBalance,
    }));
  const loanTotals = {
    totalInterest: loanSchedule.reduce((s, r) => s + r.interest, 0),
    totalPrincipal: loanSchedule.reduce((s, r) => s + r.principal, 0),
    totalSubvention: calc.totalSubvention || 0,
  };

  // Returns analysis (richer than the headline KPIs)
  const returns = [
    { label: 'IRR (project)',     value: calc.irr !== null ? fmtPct(calc.irr) : '—',                                                  threshold: `vs ${dr}% hurdle` },
    { label: 'NPV',               value: fmtCompact(calc.npv),                                                                        threshold: `discount @ ${dr}%` },
    { label: 'Payback',           value: calc.payback !== null ? `${calc.payback} year${calc.payback !== 1 ? 's' : ''}` : '> lifetime', threshold: `< ${tn}-yr tenure` },
    { label: 'Y1 DSCR',           value: calc.dscrY1 !== null ? calc.dscrY1.toFixed(2) : '—',                                          threshold: '≥ 1.25 comfortable' },
    { label: 'Break-even Capacity', value: calc.breakEvenCapacity !== null ? fmtPct(calc.breakEvenCapacity, 0) : '—',                  threshold: `< ${ceiling}% ceiling` },
    { label: 'Break-even Revenue', value: calc.breakEvenRev !== null ? fmtCompact(calc.breakEvenRev) + '/yr' : '—',                    threshold: 'cover fixed costs' },
    { label: 'Working Capital',   value: fmtCompact(calc.workingCapital),                                                              threshold: `${finance.receivableDays}R + ${finance.inventoryDays}I − ${finance.payableDays}P d` },
  ];

  // Sensitivity — top 3 drivers ranked by Operating Profit impact
  const sensitivity = (() => {
    try {
      const { rows } = runSensitivity(input, 20);
      if (!rows || rows.length === 0) return [];
      const sorted = [...rows].sort((a, b) =>
        Math.max(Math.abs(b.deltaEbitdaLow), Math.abs(b.deltaEbitdaHigh)) -
        Math.max(Math.abs(a.deltaEbitdaLow), Math.abs(a.deltaEbitdaHigh))
      );
      return sorted.slice(0, 6).map((r, i) => ({
        rank: i + 1,
        driver: r.label,
        deltaLow: r.deltaEbitdaLow,
        deltaHigh: r.deltaEbitdaHigh,
        // Swing = max abs delta as a % of base Operating Profit
        swingPct: Math.abs(r.base.ebitda) > 0
          ? (Math.max(Math.abs(r.deltaEbitdaLow), Math.abs(r.deltaEbitdaHigh)) / Math.abs(r.base.ebitda)) * 100
          : 0,
      }));
    } catch (_e) {
      return [];
    }
  })();

  return {
    cover,
    summary,
    products,
    variableCosts,
    fixedCosts,
    capexRows,
    totalCapex,
    subsidies,
    finance,
    plStatement,
    projection,
    loanSchedule,
    loanTotals,
    returns,
    sensitivity,
    inputSnapshot: {
      capacityCeilingPct: ceiling,
      capacityY1Pct: Number(input.capacityY1Pct ?? ceiling),
      capacityRampPct: Number(input.capacityRampPct ?? 0),
      lifetime: Number(input.lifetime || 10),
      taxRate,
      revenueInflationPct: Number(input.revenueInflationPct ?? 0),
      costInflationPct: Number(input.costInflationPct ?? 0),
      interestSubventionPct: Number(input.interestSubventionPct ?? 0),
      interestSubventionYears: Number(input.interestSubventionYears ?? 0),
    },
  };
}
