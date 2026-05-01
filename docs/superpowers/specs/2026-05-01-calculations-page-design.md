# Design: Calculations Page — Konaseema Project Finance Calculator

**Date:** 2026-05-01  
**Status:** Approved

## Summary

A new "Calculations" page in the React SPA that functions as a scratch-pad financial calculator for agri-processing projects in Konaseema, Andhra Pradesh. No data is persisted to Firestore — all state is local to the component. Users can load editable presets seeded from PDF feasibility reports (Coco Peat ₹55L, Coconut Processing ₹2Cr) or build a fully custom scenario with dynamic product/cost rows. All calculations update live on every keystroke.

## Decisions

| Question | Decision |
|---|---|
| Persistence | Scratch-pad only — no Firestore, no localStorage |
| Presets | Editable (seeded from PDF numbers); "Custom" starts blank |
| Row strategy | Dynamic add/remove rows for both Revenue and Costs |
| Layout | Two-panel split (45/55): inputs left, results right |
| Calculation depth | Full project finance + Break-even + Working capital |
| Subsidy stacking | PMEGP + CITUS + AP MSME 4.0 stack multiplicatively on CAPEX |
| Depreciation method | WDV at 15% per IT Act Schedule II (plant & machinery) |
| Tax rate | 30% on EBT, floored at 0 |
| Loan repayment | Equal principal per year; interest on declining balance |
| IRR method | Newton-Raphson iteration on NCF array vs. equity outflow |

## Layout

The page header contains a full-width preset selector bar: three pills — "Coco Peat", "Coconut Processing", "Custom". Selecting a preset populates all inputs; switching resets with a confirmation prompt.

Below the header the page splits 45/55:

- **Left panel** — inputs in five collapsible sections: Project Basics, Financing & Subsidies, Revenue, Costs (Variable + Fixed sub-tabs), Working Capital
- **Right panel** — summary cards (8 metrics) at top; scrollable year-by-year table below

Breakpoint at 900px: panels stack vertically (inputs then results). A sticky anchor button on mobile jumps to results.

## Input Fields

### Project Basics
- Project name (text)
- Total CAPEX (₹)
- Project lifetime (years, default 10)
- Discount rate for NPV (%, default 12)

### Financing & Subsidies
- Debt % / Equity % (linked — sum to 100)
- Interest rate (%)
- Loan tenure (years)
- Subsidy checkboxes: PMEGP (15–35%, editable %), CITUS (25%), AP MSME 4.0 (20%)
- Effective CAPEX shown inline as subsidies are toggled

### Revenue (dynamic rows)
Each row: Product name | Unit | Price per unit (₹) | Quantity per year → row total auto-calculated

### Costs (dynamic rows, two sub-tabs)
- **Variable**: Item name | Cost per unit (₹) | Quantity per year → row total
- **Fixed**: Item name | Annual amount (₹)
- "+ Add row" for both

### Working Capital
- Receivable days, Payable days, Inventory days (number inputs)

## Preset Seed Values

### Coco Peat (CAPEX ₹55,00,000)
- **Revenue**: Cocopeat blocks — ₹8/kg · 5,000 kg/yr; Grow bags — ₹12/unit · 4,000/yr
- **Fixed costs**: Labour ₹2,40,000/yr; Electricity ₹60,000/yr
- **Financing**: 60% debt, 40% equity; 10% interest; 7-year tenure
- **Subsidies**: PMEGP 25%, CITUS 25% pre-checked
- **Working capital**: 30 receivable, 15 payable, 20 inventory days

### Coconut Processing (CAPEX ₹2,00,00,000)
- **Revenue**: Coir fiber — ₹18/kg · 20,000 kg/yr; Shell charcoal — ₹25/kg · 10,000/yr
- **Fixed costs**: Labour ₹6,00,000/yr; Electricity ₹1,80,000/yr
- **Financing**: 70% debt, 30% equity; 10% interest; 7-year tenure
- **Subsidies**: PMEGP 25%, CITUS 25% pre-checked
- **Working capital**: 45 receivable, 20 payable, 30 inventory days

## Calculation Engine

All calculations run inside a single `useMemo` that recomputes on any input change.

### CAPEX & Financing
```
Effective CAPEX = Total CAPEX × (1 − PMEGP%) × (1 − CITUS%) × (1 − APMSME%)
Loan            = Effective CAPEX × Debt%
Equity          = Effective CAPEX × Equity%
Annual principal = Loan / Loan tenure
```

### Year-by-year (year t = 1 … lifetime)
```
Revenue         = Σ (price × qty) for all revenue rows
Variable Costs  = Σ (cost/unit × qty) for all variable rows
Fixed Costs     = Σ annual amounts for all fixed rows
EBITDA          = Revenue − Variable Costs − Fixed Costs
Depreciation    = WDV book value at start of year × 15%  (initial book value = Total CAPEX gross; IT Act allows depreciation on full asset cost regardless of subsidy)
EBIT            = EBITDA − Depreciation
Loan Balance    = Loan − (t−1) × annual principal
Interest        = Loan Balance × Interest rate
EBT             = EBIT − Interest
Tax             = max(0, EBT × 0.30)
PAT             = EBT − Tax
NCF             = PAT + Depreciation − Annual principal
Cumulative NCF  = running sum from year 1
DSCR            = EBITDA / (Annual principal + Interest)
```

### Summary Metrics
```
IRR             = Newton-Raphson on cash flows [−Equity, NCF_1, …, NCF_n]
NPV             = Σ NCF_t/(1+r)^t − Equity   (r = discount rate)
Payback Period  = first year where Cumulative NCF ≥ 0
Variable Cost % = Total Variable Costs / Revenue   (computed from Y1 inputs)
Break-even Rev  = Fixed Costs / (1 − Variable Cost %)
Working Capital = (Receivable days + Inventory days − Payable days) × Revenue / 365
```

## Output Display

### Summary Cards (8 cards, 4×2 grid)
| Card | Value | Sub-label |
|---|---|---|
| Effective CAPEX | ₹XX.XL | after subsidies |
| Y1 Revenue | ₹XX.XL | — |
| EBITDA | ₹XX.XL | XX% margin |
| IRR | XX.X% | — |
| NPV | ₹XX.XL | at X% discount |
| Payback | X.X yrs | — |
| Break-even | ₹XX.XL/yr | revenue needed |
| Working Capital | ₹XX.XL | — |

Cards are color-coded: green (healthy), amber (borderline), red (at risk):
- IRR: green > discount rate + 3%, amber ± 3%, red < discount rate
- DSCR: green > 1.5, amber 1.25–1.5, red < 1.25
- Payback: green < tenure × 0.6, amber < tenure × 0.8, red ≥ tenure × 0.8

### Year-by-Year Table
Columns: Yr · Revenue · Var Costs · Fixed Costs · EBITDA · Depreciation · Interest · EBT · Tax · PAT · Principal · NCF · Cum NCF · DSCR · Loan Balance

- Rows alternate shading
- First profitable year (Cum NCF ≥ 0) highlighted
- DSCR column cells individually color-coded green/red

## Navigation

Add "Calculations" as a nav item in SideNav. Route key: `'calculations'`. Accessible to all authenticated users.

## Out of Scope
- Persisting scenarios (Firestore or localStorage)
- Export to PDF/Excel
- Sensitivity table
- Multi-scenario comparison
- Debt-equity ratio card (can be derived from inputs — no dedicated display needed)
