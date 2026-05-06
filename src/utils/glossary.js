// Plain-English explanations for the financial terms used across the
// Calculations page. Looked up by the GlossaryTerm component which
// renders the term with a small info icon and shows the definition on
// hover/focus. Centralised here so the same wording is used everywhere
// the term appears (KPI tiles, P&L rows, Capex/Returns tiles, etc).
export const GLOSSARY = {
  IRR:
    'Internal Rate of Return. The annualised return at which the project\'s NPV equals zero. ' +
    'When IRR exceeds your hurdle (discount) rate, the project clears its cost of capital. ' +
    'Computed via Newton-Raphson iteration on the year-by-year cash flow stream.',

  NPV:
    'Net Present Value. The sum of all future cash flows discounted back to today\'s value at the hurdle rate. ' +
    'Positive NPV means the project earns more than the cost of capital; negative means it doesn\'t.',

  DSCR:
    'Debt Service Coverage Ratio. EBITDA ÷ (Principal + Interest) for the year. ' +
    'Banks expect ≥ 1.25 for comfort; ≥ 1.5 is strong. Below 1.0 means EBITDA can\'t cover debt service. ' +
    'Y1 DSCR is shown on the dashboard because it\'s usually the binding year.',

  Payback:
    'Years until cumulative net cash flow turns positive — i.e., the year you recover your initial equity. ' +
    'Shorter is better. The model uses integer-year resolution.',

  EBITDA:
    'Earnings Before Interest, Tax, Depreciation, Amortisation. The "pure operating profit" before financing ' +
    'decisions and accounting allocations. Calculated as Revenue − Variable Costs − Fixed Costs.',

  CAPEX:
    'Capital Expenditure. The one-time investment in plant, machinery, land, civil work etc. — before subsidies. ' +
    'Can be entered as a single number or broken into named categories.',

  'Effective CAPEX':
    'CAPEX after subsidies. PMEGP applies first to the first ₹50L only; CITUS and AP MSME stack ' +
    'multiplicatively on what\'s left. This is the actual amount you and your bank need to fund.',

  Equity:
    'The promoter\'s own contribution. Effective CAPEX × (1 − Debt%). Banks generally want at least 25–30% equity.',

  Debt:
    'The portion of effective CAPEX financed via term loan. Effective CAPEX × Debt%. Repaid as straight-line ' +
    'principal over the tenure plus declining-balance interest.',

  'Hurdle Rate':
    'Minimum acceptable return on capital — your cost of capital. Used as the NPV discount rate. ' +
    'For Indian MSMEs typically 10–15%.',

  'Discount Rate':
    'The rate at which future cash flows are discounted to present value when computing NPV. ' +
    'Same concept as the hurdle rate.',

  'Working Capital':
    'Cash needed day-to-day to bridge the gap between paying suppliers and collecting from customers. ' +
    'Approximated as (Receivable + Inventory − Payable days) × daily revenue.',

  'Capacity Ceiling':
    'The long-run target plant utilisation — the maximum % of theoretical max output the plant will run at ' +
    'after ramp-up. Real plants rarely operate at 100% due to maintenance, rejects, demand variability.',

  'Capacity Y1':
    'Year-1 plant utilisation. Real projects typically start at 40–60% (setup, market development, raw material ' +
    'stabilisation) and ramp toward the ceiling over 3–5 years.',

  'Capacity Ramp':
    'Annual capacity gain in percentage points. Y1 starts at the Y1 value, climbs by this many points each year, ' +
    'and plateaus at the ceiling.',

  Tenure:
    'Loan repayment period in years. Shorter tenure → higher annual debt service → tighter DSCR. ' +
    'MSME term loans typically run 5–10 years.',

  PAT:
    'Profit After Tax. PBT − Tax. The "take-home" earnings after every deduction. Negative PAT means a loss year.',

  PBT:
    'Profit Before Tax. EBITDA − Depreciation − Interest. Drives the year\'s tax bill (no tax when PBT is negative).',

  EBT:
    'Earnings Before Tax (same as PBT). EBITDA − Depreciation − Interest.',

  'PMEGP':
    'Prime Minister\'s Employment Generation Programme. Manufacturing subsidy capped at ₹50L of project cost; ' +
    'pays 15–35% of that capped amount depending on the applicant category and location.',

  'CITUS':
    'Coir Industry Technology Upgradation Scheme. 25% capital subsidy from the Coir Board for coir-related ' +
    'machinery purchases.',

  'AP MSME':
    'Andhra Pradesh MSME 4.0 Policy. 20% capital subsidy on fixed-capital investment for eligible MSME ' +
    'manufacturing units.',

  'Interest Subvention':
    'Government cash rebate on interest paid — typical ranges 1–3% for 3–5 years. ' +
    'Paid as a separate inflow, so the bank still demands full debt service (DSCR is unaffected); ' +
    'cash flow gets the boost.',

  'Break-even Capacity':
    'The plant utilisation at which contribution margin exactly covers fixed costs. Below this, ' +
    'the project loses money even with full subsidies.',

  'Break-even Revenue':
    'Annual revenue level at which contribution margin exactly covers fixed costs. Fixed Costs ÷ ' +
    '(1 − Variable / Revenue ratio).',

  Depreciation:
    'Non-cash accounting deduction for the wear-and-tear of plant and machinery. Indian tax rule applies ' +
    '15% WDV (Written-Down Value) — 15% of the remaining book value each year.',

  Subvention:
    'Government cash rebate on interest paid — added back to your net cash flow each year for the ' +
    'configured number of years. Doesn\'t reduce the bank\'s interest charge.',

  'Total Subvention':
    'Sum of all government interest-rebate cash inflows over the lifetime of the loan, given the configured ' +
    'subvention rate × subvention years.',

  'Gross Profit':
    'Revenue − Variable Costs. The "contribution" left over from sales after the costs that scale with output. ' +
    'Gross margin = Gross Profit ÷ Revenue.',

  'Variable Costs':
    'Costs that scale with output — raw material, packaging, fuel, contract labour. Drop when capacity drops.',

  'Fixed Costs':
    'Costs that don\'t scale with output — salaries, rent, insurance, electricity base. Paid in full whether ' +
    'you operate at 40% or 100%.',

  Inflation:
    'Annual escalation applied inside the year-by-year projection. Y1 stays at the base; Y2+ scale by ' +
    '(1 + rate)^(t−1). Revenue and costs use independent rates so margins compress (or expand) realistically.',
};

export function lookupTerm(term) {
  return GLOSSARY[term] || null;
}
