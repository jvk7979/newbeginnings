// Calculation defaults chosen on the Settings page — pure apart from the
// (injectable) storage, unit tested in calcDefaults.test.js.
//
// Settings saved these under `nb_calc_defaults`, but nothing outside Settings
// ever read the key, so new calculations always started from the hardcoded
// values in calcEngine.DEFAULT_CALC_INPUT. applyCalcDefaults() is what the
// Calculations page now layers over those hardcoded values for a NEW
// calculation (a project with no saved calc, or a reset). Existing saved
// calculations are never touched.

export const CALC_DEFAULTS_KEY = 'nb_calc_defaults';

// Factory values — must match DEFAULT_CALC_INPUT so an untouched Settings page
// changes nothing.
export const FACTORY_CALC_DEFAULTS = {
  taxRate: 25,
  discountRate: 12,
  interestRate: 12,
  revenueInflationPct: 0,
  costInflationPct: 0,
};

function defaultStorage() {
  try { return globalThis.localStorage || null; } catch { return null; }
}

/** Saved defaults merged over the factory ones; anything invalid falls back. */
export function loadCalcDefaults(storage = defaultStorage()) {
  const out = { ...FACTORY_CALC_DEFAULTS };
  try {
    const raw = storage?.getItem(CALC_DEFAULTS_KEY);
    if (!raw) return out;
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== 'object') return out;
    for (const key of Object.keys(FACTORY_CALC_DEFAULTS)) {
      const n = typeof saved[key] === 'number' ? saved[key] : Number(saved[key]);
      if (saved[key] !== null && saved[key] !== '' && Number.isFinite(n)) out[key] = n;
    }
  } catch { /* corrupt JSON or blocked storage — use factory values */ }
  return out;
}

export function saveCalcDefaults(next, storage = defaultStorage()) {
  try { storage?.setItem(CALC_DEFAULTS_KEY, JSON.stringify(next)); } catch { /* private mode */ }
}

/** Layer the user's defaults over a calc-input base (e.g. DEFAULT_CALC_INPUT). */
export function applyCalcDefaults(base, defaults = loadCalcDefaults()) {
  return { ...base, ...defaults };
}
