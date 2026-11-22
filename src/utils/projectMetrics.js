// Headline financials for one project — shared by Portfolio and the
// Dashboard so the two pages can never disagree about a project's IRR,
// NPV or verdict. Mirrors the load path in CalculationsPage: normalise the
// saved input (kg/ton migration) before merging defaults.
import { runCalc, DEFAULT_CALC_INPUT, normalizeCalcInput } from './calcEngine';

export function projectRow(plan) {
  const normalized = normalizeCalcInput(plan.calc);
  const input = normalized && typeof normalized === 'object'
    ? { ...DEFAULT_CALC_INPUT, ...normalized }
    : DEFAULT_CALC_INPUT;
  const calc = runCalc(input);
  const hurdle = Number(input.discountRate) || 0;
  const hasData = calc.revenue > 0 || calc.effectiveCapex > 0;

  let verdict; // 'Viable' | 'Below hurdle' | 'No data'
  if (!hasData || calc.irr == null) verdict = !hasData ? 'No data' : 'Below hurdle';
  else verdict = calc.irr > hurdle ? 'Viable' : 'Below hurdle';

  return {
    id: plan.id,
    title: plan.title || 'Untitled project',
    irr: calc.irr,
    npv: isFinite(calc.npv) ? calc.npv : null,
    payback: calc.payback,
    operatingProfit: calc.ebitda,
    netProfit: calc.netProfitY1 ?? 0,
    breakEven: calc.breakEvenCapacity,
    capex: calc.effectiveCapex,
    hurdle,
    verdict,
  };
}
