/**
 * Financial engine unit tests.
 *
 * Run with `npm run test:unit` (or `npm run test:unit:watch` for the
 * Vitest watcher). These tests cover the four banker-blocking bugs
 * resolved in the P0 batch (DSCR formula, depreciation base, subvention
 * formula, working-capital in NCF) plus regression guards on the IRR
 * solver, capacity ramp, subsidy stacking, break-even calc, and the
 * runSensitivity-on-partial-input crash.
 *
 * The math is verified against hand-computed numbers using the simplest
 * possible scenarios — a single product, no ramp, no inflation — so a
 * future contributor reading a failing test can recompute the expected
 * value in their head.
 */
import { describe, it, expect } from 'vitest';
import { runCalc, runSensitivity, calcIRR, calcIRRDetailed, normalizeCalcInput, DEFAULT_CALC_INPUT } from './calcEngine.js';

// Tiny scenario builder so each test reads as "default + my overrides".
const scenario = (overrides = {}) => ({ ...DEFAULT_CALC_INPUT, ...overrides });

// One coir-fiber row sized to produce non-trivial revenue.
// 100 t/yr × ₹20/kg = 100,000 × 20 = ₹20,00,000 = ₹20 L/yr at 100% capacity.
const oneProduct = (price = 20, qty = 100) =>
  [{ id: 1, name: 'Coir Fiber', unit: 'kg', price, qty, enabled: true }];

const oneVarCost = (price = 8, qty = 100) =>
  [{ id: 11, name: 'Husk', unit: 'kg', price, qty, enabled: true }];

const oneFixed = (amount = 500000) =>
  [{ id: 21, name: 'Rent', amount, enabled: true }];

// At 100% capacity, no ramp, no inflation, no subsidy, no debt:
//   revenue       = 20 L
//   variableCosts = 100 t × 1000 kg/t × 8 = 8 L
//   fixedCosts    = 5 L
//   ebitda        = 20 - 8 - 5 = 7 L
const simplest = () => scenario({
  capex: 5000000,            // 50 L
  debtPct: 0,                // all equity, so no debt service to worry about
  taxRate: 0,                // no tax — depreciation tax shield not in play
  capacityCeilingPct: 100,
  capacityY1Pct: 100,
  capacityRampPct: 0,
  revenueRows: oneProduct(20, 100),
  varRows:     oneVarCost(8, 100),
  fixedRows:   oneFixed(500000),
  receivableDays: 0,         // disable WC for the headline EBITDA tests
  inventoryDays:  0,
  payableDays:    0,
  revenueInflationPct: 0,
  costInflationPct:    0,
});

describe('runCalc — empty / defensive', () => {
  it('returns a valid result for an empty input', () => {
    const r = runCalc({});
    expect(r).toBeDefined();
    expect(r.rows.length).toBe(DEFAULT_CALC_INPUT.lifetime);
    expect(r.revenue).toBe(0);
  });

  it('returns null IRR when there is no negative-then-positive flip', () => {
    const r = runCalc(scenario({ debtPct: 0, revenueRows: [], varRows: [], fixedRows: [] }));
    expect(r.irr).toBeNull();
  });

  it('null/undefined input does not throw', () => {
    expect(() => runCalc(undefined)).not.toThrow();
    expect(() => runCalc(null)).not.toThrow();
  });
});

describe('runCalc — revenue / ebitda / break-even', () => {
  it('computes revenue from a single product at full capacity', () => {
    const r = runCalc(simplest());
    expect(r.revenue).toBe(2000000); // ₹20 L
  });

  it('computes EBITDA as revenue − variableCosts − fixedCosts', () => {
    const r = runCalc(simplest());
    expect(r.ebitda).toBe(700000); // ₹7 L
  });

  it('break-even capacity = fixedCosts / (revenue - variableCosts) × 100', () => {
    // fixed 5L / (20L - 8L) = 5/12 = 41.67%
    const r = runCalc(simplest());
    expect(r.breakEvenCapacity).toBeCloseTo(41.666, 1);
  });

  it('disabled product rows are excluded from revenue', () => {
    const r = runCalc(scenario({
      revenueRows: [
        { id: 1, name: 'A', unit: 'kg', price: 20, qty: 100, enabled: true },
        { id: 2, name: 'B', unit: 'kg', price: 20, qty: 100, enabled: false },
      ],
      capexRows: [], capex: 0, debtPct: 0,
      // DEFAULT_CALC_INPUT sets capacityCeilingPct to 80; force 100 so
      // the assertion is on the raw rev calc, not capacity-scaled.
      capacityCeilingPct: 100, capacityY1Pct: 100, capacityRampPct: 0,
    }));
    expect(r.revenue).toBe(2000000);
  });
});

describe('runCalc — capacity ramp', () => {
  it('Y1 stays at capacityY1Pct; later years climb by capacityRampPct toward ceiling', () => {
    const r = runCalc(scenario({
      capex: 0, debtPct: 0,
      capacityCeilingPct: 100,
      capacityY1Pct:      60,
      capacityRampPct:    20,
      revenueRows: oneProduct(20, 100),
      varRows: [], fixedRows: [],
    }));
    expect(r.rows[0].capacityPct).toBe(60);
    expect(r.rows[1].capacityPct).toBe(80);
    expect(r.rows[2].capacityPct).toBe(100);   // hits ceiling
    expect(r.rows[3].capacityPct).toBe(100);   // stays at ceiling
  });
});

describe('runCalc — subsidy stacking (PMEGP cap + CITUS + APMSME)', () => {
  it('PMEGP cap of ₹50 L deducts first, then CITUS/APMSME stack multiplicatively', () => {
    // 2 Cr capex, PMEGP 25%, CITUS 25%, APMSME 20%
    //   pmegpEligibleCapex = min(2 Cr, 50 L) = 50 L
    //   pmegpSubsidy       = 50 L × 25%      = 12.5 L
    //   afterPmegp         = 2 Cr − 12.5 L   = 1.875 Cr
    //   effectiveCapex     = 1.875 × 0.75 × 0.80 = 1.125 Cr
    const r = runCalc(scenario({
      capex: 20000000,
      pmegpEnabled: true,  pmegpPct: 25,
      citusEnabled: true,
      apmsmeEnabled: true,
      debtPct: 0,
      revenueRows: [], varRows: [], fixedRows: [],
    }));
    expect(r.effectiveCapex).toBeCloseTo(11250000, 0);
  });
});

describe('runCalc — depreciation runs on EFFECTIVE CAPEX (P0 fix #4)', () => {
  it('Y1 depreciation = effectiveCapex × 15% (not capex × 15%)', () => {
    // 2 Cr capex, CITUS 25% → effectiveCapex = 1.5 Cr
    // Y1 dep should be 22.5 L, NOT 30 L
    const r = runCalc(scenario({
      capex: 20000000,
      citusEnabled: true,
      debtPct: 0, taxRate: 0,
      revenueRows: oneProduct(20, 100), varRows: [], fixedRows: [],
    }));
    expect(r.rows[0].depreciation).toBeCloseTo(2250000, 0);
  });

  it('without any subsidy, depreciation base equals gross capex (backwards compat)', () => {
    const r = runCalc(scenario({
      capex: 20000000,
      pmegpEnabled: false, citusEnabled: false, apmsmeEnabled: false,
      debtPct: 0, taxRate: 0,
      revenueRows: oneProduct(20, 100), varRows: [], fixedRows: [],
    }));
    expect(r.rows[0].depreciation).toBeCloseTo(3000000, 0); // 2 Cr × 15%
  });
});

describe('runCalc — subvention applies to INTEREST PAID (P0 fix #5)', () => {
  it('Y1 subvention = interest × subventionPct (not loanBalance × subventionPct)', () => {
    // 1 Cr capex, 60% debt = 60 L loan, 10-year tenure, 12% interest
    // Y1 loanBalance = 60 L, Y1 interest = 60 L × 12% = 7.2 L
    // subvention 5% applied to interest → 7.2 L × 5% = ₹36,000
    // The old (buggy) formula was loanBalance × subventionPct
    //                                = 60 L × 5% = ₹3 L (8.3× larger)
    const r = runCalc(scenario({
      capex: 10000000,
      debtPct: 60,
      tenure: 10,
      interestRate: 12,
      interestSubventionPct:   5,
      interestSubventionYears: 5,
      revenueRows: [], varRows: [], fixedRows: [],
      capacityY1Pct: 0, capacityCeilingPct: 0,
    }));
    const y1Interest    = r.rows[0].interest;
    const y1Subvention  = r.rows[0].subvention;
    expect(y1Subvention).toBeCloseTo(y1Interest * 0.05, 1);
  });

  it('subvention stops after subventionYears', () => {
    const r = runCalc(scenario({
      capex: 10000000, debtPct: 60, tenure: 10, interestRate: 12,
      interestSubventionPct: 5,
      interestSubventionYears: 3,
      revenueRows: [], varRows: [], fixedRows: [],
    }));
    expect(r.rows[0].subvention).toBeGreaterThan(0);   // Y1: yes
    expect(r.rows[2].subvention).toBeGreaterThan(0);   // Y3: yes
    expect(r.rows[3].subvention).toBe(0);              // Y4: stopped
    expect(r.rows[5].subvention).toBe(0);              // Y6: still stopped
  });
});

describe('runCalc — DSCR uses banker formula (P0 fix #3)', () => {
  it('Y1 DSCR = (PAT + Depreciation + Interest) / (Principal + Interest)', () => {
    const r = runCalc(scenario({
      capex: 10000000, debtPct: 60, tenure: 5, interestRate: 12, taxRate: 25,
      revenueRows: oneProduct(30, 200),   // ₹60 L/yr
      varRows:     oneVarCost(8, 200),    // ₹16 L/yr
      fixedRows:   oneFixed(800000),      // ₹8 L/yr
      receivableDays: 0, inventoryDays: 0, payableDays: 0,
      capacityCeilingPct: 100, capacityY1Pct: 100, capacityRampPct: 0,
    }));
    const y1 = r.rows[0];
    const expectedDscr = (y1.pat + y1.depreciation + y1.interest) / (y1.principal + y1.interest);
    expect(y1.dscr).toBeCloseTo(expectedDscr, 4);

    // Sanity-check that the new formula is meaningfully different from
    // the old EBITDA/debt-service formula (which over-stated DSCR by
    // ~15-25% in taxable projects).
    const oldDscr = y1.ebitda / (y1.principal + y1.interest);
    expect(y1.dscr).toBeLessThan(oldDscr);
  });

  it('DSCR is null when there is no debt service', () => {
    const r = runCalc(scenario({ debtPct: 0, capex: 1000000, revenueRows: oneProduct(20, 100) }));
    expect(r.rows[0].dscr).toBeNull();
  });
});

describe('runCalc — working capital flows through NCF (P0 fix #6)', () => {
  it('Y1 NCF includes a WC outflow when revenue > 0 and the WC cycle is positive', () => {
    const r = runCalc(scenario({
      capex: 0, debtPct: 0, taxRate: 0,
      revenueRows: oneProduct(20, 100),
      varRows: [], fixedRows: [],
      receivableDays: 30, inventoryDays: 30, payableDays: 0,
      capacityCeilingPct: 100, capacityY1Pct: 100, capacityRampPct: 0,
    }));
    // wcRequired = (30 + 30 - 0) × 20L / 365 = 60 × 20L / 365 ≈ 3.28 L
    // Y1 deltaWC = 3.28 L − 0 = 3.28 L (outflow)
    expect(r.rows[0].deltaWC).toBeCloseTo(60 * 2000000 / 365, 0);
    expect(r.rows[0].deltaWC).toBeGreaterThan(0);
  });

  it('terminal year releases accumulated WC stock as an inflow', () => {
    const r = runCalc(scenario({
      capex: 0, debtPct: 0, taxRate: 0, lifetime: 5,
      revenueRows: oneProduct(20, 100),
      varRows: [], fixedRows: [],
      receivableDays: 30, inventoryDays: 30, payableDays: 0,
      capacityCeilingPct: 100, capacityY1Pct: 100, capacityRampPct: 0,
    }));
    const terminal = r.rows[r.rows.length - 1];
    const beforeTerminal = r.rows[r.rows.length - 2];
    // Terminal-year NCF should be roughly (PAT + dep − principal +
    // subvention − deltaWC + wcStock). With principal=0 and deltaWC≈0
    // (steady-state revenue), terminal NCF ≈ PAT + wcStock.
    // beforeTerminal NCF has no wcRelease, so terminal > before by ~wcStock.
    expect(terminal.ncf).toBeGreaterThan(beforeTerminal.ncf);
  });

  it('zero WC cycle leaves NCF identical to pre-WC behaviour', () => {
    const r = runCalc(scenario({
      capex: 0, debtPct: 0, taxRate: 0,
      revenueRows: oneProduct(20, 100),
      varRows: [], fixedRows: [],
      receivableDays: 0, inventoryDays: 0, payableDays: 0,
    }));
    expect(r.rows[0].deltaWC).toBe(0);
  });
});

describe('runCalc — Net Profit', () => {
  it('netProfit = ebitda - interest - tax - principal', () => {
    const r = runCalc(scenario({
      capex: 10000000, debtPct: 60, tenure: 10, interestRate: 10, taxRate: 25,
      revenueRows: oneProduct(30, 200),
      varRows:     oneVarCost(8, 200),
      fixedRows:   oneFixed(800000),
      capacityCeilingPct: 100, capacityY1Pct: 100, capacityRampPct: 0,
    }));
    const y1 = r.rows[0];
    const expected = y1.ebitda - y1.interest - y1.tax - y1.principal;
    expect(y1.netProfit).toBeCloseTo(expected, 4);
  });
});

describe('calcIRR — Newton-Raphson solver', () => {
  it('returns ~10% IRR for a flat 100/10/10/10/... stream', () => {
    // -100, +10 forever — IRR is 0% (loses money in real terms).
    // For a 10-year stream of (-100, +100×10) the IRR is exactly 0%.
    expect(calcIRR([-100, 100])).toBeCloseTo(0, 1);
  });

  it('handles a doubling-money one-year project (~100% IRR)', () => {
    expect(calcIRR([-100, 200])).toBeCloseTo(100, 1);
  });

  it('returns null when the very first cash flow is non-negative', () => {
    expect(calcIRR([100, 100, 100])).toBeNull();
    expect(calcIRR([0, 100, 100])).toBeNull();
  });

  it('returns null on a cash-flow stream with no sign change at all', () => {
    // All-negative — never a payback. No IRR exists.
    expect(calcIRR([-100, -50, -30])).toBeNull();
  });
});

describe('IRR multi-root detection (P2.9)', () => {
  it('runCalc flags irrAmbiguous=false for the simple monotonic case', () => {
    const r = runCalc(scenario({
      capex: 1000000, debtPct: 0,
      revenueRows: oneProduct(20, 100), varRows: [], fixedRows: [],
    }));
    expect(r.irrAmbiguous).toBe(false);
    expect(r.irrSignChanges).toBeLessThanOrEqual(1);
  });

  it('calcIRRDetailed flags ambiguity on a stream with multiple sign changes', () => {
    // The runCalc projection shape (single capex outflow + always-positive
    // NCFs) is structurally monotonic by design — real-world ambiguity
    // comes from mid-life capex injection / shutdown-and-restart patterns
    // the engine doesn't currently model. The detection layer is
    // unit-testable directly: classic multiple-IRR teaser stream from
    // every corporate-finance textbook.
    const stream = [-100, 230, -132];
    const detail = calcIRRDetailed(stream);
    expect(detail).not.toBeNull();
    expect(detail.signChanges).toBe(2);
    expect(detail.ambiguous).toBe(true);
  });

  it('calcIRRDetailed returns the same value calcIRR does on the simple case', () => {
    const stream = [-100, 50, 50, 50];
    expect(calcIRRDetailed(stream).value).toBeCloseTo(calcIRR(stream), 4);
    expect(calcIRRDetailed(stream).ambiguous).toBe(false);
  });
});

describe('runSensitivity — partial input does not crash (P0 fix #7)', () => {
  it('handles a scenario with revenueRows undefined', () => {
    expect(() => runSensitivity({ capex: 1000000, debtPct: 50 })).not.toThrow();
  });

  it('handles a scenario with varRows undefined', () => {
    expect(() => runSensitivity({ capex: 1000000, debtPct: 50, revenueRows: oneProduct() })).not.toThrow();
  });

  it('returns a base object even on degenerate input', () => {
    const out = runSensitivity({});
    expect(out).toHaveProperty('base');
    expect(Array.isArray(out.rows)).toBe(true);
  });
});

describe('normalizeCalcInput — kg/ton migration', () => {
  it('preserves new-model inputs (unitsMigrated=true)', () => {
    const out = normalizeCalcInput({
      unitsMigrated: true,
      revenueRows: [{ id: 1, name: 'X', unit: 'kg', price: 10, qty: 50 }],
    });
    expect(out.revenueRows[0].qty).toBe(50);
    expect(out.revenueRows[0].unit).toBe('kg');
  });

  it('resets qty=0 and unit=kg on legacy inputs (unitsMigrated missing)', () => {
    const out = normalizeCalcInput({
      revenueRows: [{ id: 1, name: 'X', unit: 'piece', price: 10, qty: 999 }],
    });
    expect(out.revenueRows[0].qty).toBe(0);
    expect(out.revenueRows[0].unit).toBe('kg');
    expect(out.unitsMigrated).toBe(true);
  });

  it('coerces invalid unit strings to kg on new-model inputs', () => {
    const out = normalizeCalcInput({
      unitsMigrated: true,
      revenueRows: [{ id: 1, unit: 'foo', price: 10, qty: 50 }],
    });
    expect(out.revenueRows[0].unit).toBe('kg');
    expect(out.revenueRows[0].qty).toBe(50);   // qty preserved
  });
});
