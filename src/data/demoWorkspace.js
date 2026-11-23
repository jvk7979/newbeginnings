// DEVELOPMENT ONLY — a sample workspace for reviewing layouts locally.
//
// Loaded by AppContext only when running the dev server with
// `?e2e=1&demo=1` in the URL (import.meta.env.DEV is false in production
// builds, so this never reaches the live site). Titles mirror the real
// workspace; the calculation inputs are simplified examples chosen to give
// one viable project, two below the hurdle and three with no numbers.

const calc = ({ capex, price, qty, fixed }) => ({
  unitsMigrated: true,
  capex,
  discountRate: 12,
  // price is per kg; qty is tonnes a year (the engine multiplies kg rows by 1,000)
  revenueRows: [{ id: 1, name: 'Main product', unit: 'kg', price, qty, enabled: true }],
  varRows: [],
  fixedRows: [{ id: 1, name: 'Wages, power, rent', amount: fixed, enabled: true }],
});

export const DEMO_IDEAS = [
  { id: 101, title: 'Sugarcane', status: 'draft', category: 'Agriculture', date: 'Jun 19, 2026' },
  { id: 102, title: 'Palm oil', status: 'draft', category: 'Food processing', estimatedCapex: 30000000, date: 'May 2, 2026' },
  { id: 103, title: 'Solar power', status: 'active', category: 'Industrial production', estimatedCapex: 10000000, date: 'Apr 25, 2026' },
  { id: 104, title: 'Coconut by-products', status: 'active', category: 'Food processing', estimatedCapex: 20000000, date: 'May 3, 2026' },
];

export const DEMO_PLANS = [
  { id: 201, title: 'Coir fiber', status: 'draft', category: 'Business', sections: [], updated: 'May 3, 2026' },
  { id: 202, title: 'Coconut by-products', status: 'in-review', category: 'Business', eligibleForCalc: true, linkedIdeaId: 104,
    sections: [{ title: 'Summary', content: '' }], updated: 'Jul 26, 2026',
    calc: calc({ capex: 8500000, price: 30, qty: 600, fixed: 2400000 }) },
  { id: 203, title: 'Activated carbon', status: 'draft', category: 'Manufacturing', eligibleForCalc: true,
    sections: [{ title: 'Summary', content: '' }], updated: 'Jul 26, 2026',
    calc: calc({ capex: 10000000, price: 40, qty: 60, fixed: 2200000 }) },
  { id: 204, title: 'Cocopeat plant', status: 'draft', category: 'Manufacturing', eligibleForCalc: true, sections: [{ title: 'Summary', content: '' }], updated: 'May 3, 2026' },
  { id: 205, title: 'Coir pith briquettes', status: 'draft', category: 'Manufacturing', eligibleForCalc: true, sections: [{ title: 'Summary', content: '' }], updated: 'May 3, 2026' },
  { id: 206, title: 'Palm oil refinery', status: 'draft', category: 'Food processing', eligibleForCalc: true, sections: [{ title: 'Summary', content: '' }], updated: 'May 2, 2026' },
  { id: 207, title: 'Coconut shell charcoal plant', status: 'active', category: 'Manufacturing', eligibleForCalc: true,
    sections: [{ title: 'Summary', content: '' }], updated: 'May 15, 2026',
    calc: calc({ capex: 12000000, price: 35, qty: 80, fixed: 3000000 }) },
];

// Sample tracked commodities: two linked to Agmarknet (live refresh), one
// typed by hand. Prices in ₹ per quintal unless the unit says otherwise.
const day = (iso, price, extra = {}) => ({ ts: Date.parse(`${iso}T12:00:00Z`), date: iso, price, ...extra });
export const DEMO_COMMODITIES = [
  { id: 'seed-copra-milling', name: 'Copra (Milling)', unit: '₹/quintal', mandi: 'Rajahmundry mandi', color: 'clay',
    agmarknet: { name: 'Copra' },
    history: [day('2026-08-30', 11200), day('2026-09-27', 11450), day('2026-10-25', 11800),
      day('2026-11-21', 11850, { source: 'agmarknet', state: 'Andhra Pradesh', arrivalISO: '2026-11-21' })] },
  { id: 'seed-coconut-husk', name: 'Coconut Husk', unit: '₹/piece', mandi: 'Rajahmundry mandi', color: 'amber',
    history: [day('2026-09-15', 0.85), day('2026-10-15', 0.92), day('2026-11-15', 0.95, { source: 'manual' })] },
  { id: 'seed-coconut', name: 'Coconut', unit: '₹/quintal', mandi: 'Amalapuram', color: 'sage',
    agmarknet: { name: 'Coconut' },
    history: [day('2026-10-01', 2400), day('2026-11-02', 2550, { source: 'agmarknet', state: 'Tamil Nadu', arrivalISO: '2026-11-02' })] },
];
