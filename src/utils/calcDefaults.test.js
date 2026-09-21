import { describe, it, expect } from 'vitest';
import {
  CALC_DEFAULTS_KEY, FACTORY_CALC_DEFAULTS,
  loadCalcDefaults, saveCalcDefaults, applyCalcDefaults,
} from './calcDefaults.js';
import { DEFAULT_CALC_INPUT } from './calcEngine.js';

// Minimal in-memory Storage stand-in.
const fakeStorage = (initial = {}) => {
  const data = { ...initial };
  return {
    getItem: k => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    _data: data,
  };
};

describe('factory defaults', () => {
  it('match calcEngine.DEFAULT_CALC_INPUT, so an untouched Settings page changes nothing', () => {
    for (const [k, v] of Object.entries(FACTORY_CALC_DEFAULTS)) {
      expect(DEFAULT_CALC_INPUT[k]).toBe(v);
    }
  });
});

describe('loadCalcDefaults', () => {
  it('returns the factory values when nothing is saved', () => {
    expect(loadCalcDefaults(fakeStorage())).toEqual(FACTORY_CALC_DEFAULTS);
  });

  it('reads what Settings saved', () => {
    const s = fakeStorage({ [CALC_DEFAULTS_KEY]: JSON.stringify({ taxRate: 30, discountRate: 15 }) });
    expect(loadCalcDefaults(s)).toEqual({ ...FACTORY_CALC_DEFAULTS, taxRate: 30, discountRate: 15 });
  });

  it('falls back per field for invalid values and ignores unknown keys', () => {
    const s = fakeStorage({ [CALC_DEFAULTS_KEY]: JSON.stringify({ taxRate: 'abc', interestRate: null, discountRate: '', bogus: 5, costInflationPct: '4' }) });
    const d = loadCalcDefaults(s);
    expect(d.taxRate).toBe(FACTORY_CALC_DEFAULTS.taxRate);
    expect(d.interestRate).toBe(FACTORY_CALC_DEFAULTS.interestRate);
    expect(d.discountRate).toBe(FACTORY_CALC_DEFAULTS.discountRate);
    expect(d.costInflationPct).toBe(4);   // numeric string is accepted
    expect(d).not.toHaveProperty('bogus');
  });

  it('survives corrupt JSON and missing storage', () => {
    expect(loadCalcDefaults(fakeStorage({ [CALC_DEFAULTS_KEY]: '{not json' }))).toEqual(FACTORY_CALC_DEFAULTS);
    expect(loadCalcDefaults(null)).toEqual(FACTORY_CALC_DEFAULTS);
  });

  it('round-trips through saveCalcDefaults', () => {
    const s = fakeStorage();
    saveCalcDefaults({ ...FACTORY_CALC_DEFAULTS, taxRate: 22, revenueInflationPct: 3 }, s);
    expect(loadCalcDefaults(s)).toMatchObject({ taxRate: 22, revenueInflationPct: 3 });
  });
});

describe('applyCalcDefaults', () => {
  it('overrides a new calculation with the saved preferences', () => {
    const out = applyCalcDefaults(DEFAULT_CALC_INPUT, { ...FACTORY_CALC_DEFAULTS, taxRate: 30, discountRate: 15 });
    expect(out.taxRate).toBe(30);
    expect(out.discountRate).toBe(15);
  });

  it('leaves every other calc field untouched and does not mutate the base', () => {
    const before = JSON.stringify(DEFAULT_CALC_INPUT);
    const out = applyCalcDefaults(DEFAULT_CALC_INPUT, { ...FACTORY_CALC_DEFAULTS, taxRate: 30 });
    expect(out.lifetime).toBe(DEFAULT_CALC_INPUT.lifetime);
    expect(out.revenueRows).toBe(DEFAULT_CALC_INPUT.revenueRows);
    expect(JSON.stringify(DEFAULT_CALC_INPUT)).toBe(before);
  });
});
