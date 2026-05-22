# Data-tier color roles for Calculations + Atlas

**Date:** 2026-05-22
**Status:** Design — pending review
**Pages affected:** Calculations (Feasibility Report, Assumptions panel, Quick Estimate / Deep Dive / What-If / Scenarios tabs), Crop Atlas (Map, Compare, Opportunities)
**Themes affected:** all 8 (heritage / prism / citrus / midnight / coastal / plum / terracotta / mono)

---

## 1. Problem

The Calculations and Atlas pages pack a lot of information into one surface. Today the data tier (KPIs, sparklines, badges, tier strips, axis meters, chart legends, segmented bars) leans on the theme accent for almost everything, with a few hard-coded hex values for status thresholds:

- The 5 KPI cards in the Feasibility Report read as one uniform block — NPV, Net Profit, EBITDA, DSCR and Break-even all share the same cream surface and same sage sparkline tone, even though they measure different concepts (returns vs. coverage vs. headroom).
- The Money Flow segmented bar packs 5 expense categories into a slim strip with no semantic color cue.
- `index.jsx` hard-codes `#2a7d3c`, `#b06000`, `#c0392b` for IRR/NPV/Payback/DSCR/EBITDA/Net Profit thresholds — these don't follow the 8-theme system at all.
- Atlas tier badges (S/A/B/C), 3-axis meters and mode tabs are their own visual island with no shared language with Calculations.

There's no learnable hierarchy: a user can't yet learn that "gold means time" or "blue means coverage."

## 2. Goal

Define a small set of **named data-color roles**, mapped purely to existing `--c-*` theme tokens, and apply them consistently across both pages. The result:

- Every data role has the same hue across all 8 themes (each theme picks its own RGB, but the role mapping is constant).
- The eye learns to group: returns (sage in heritage), coverage (river blue), time (gold), cost (terracotta), categorical (accent‑2/3/4).
- All hard-coded hex values are removed from JSX in favour of `--c-*` tokens.
- Surfaces stay neutral — color appears as **3 px left-stripes, sparkline strokes, chart series, and pill backgrounds**, never as full card fills (so density stays calm).

Out of scope: changing the theme palettes themselves, redesigning page structure, or altering data engines (`calcEngine.js`, `opportunityScore.js`).

## 3. The five roles

| Role | Token | Heritage hue | Semantic |
|---|---|---|---|
| **Return** | `--c-accent` | deep sage | upside, growth, revenue, IRR, NPV, EBITDA, net profit |
| **Coverage** | `--c-info` | river blue | safety / how-much-cushion: DSCR, ramp years, break-even buffer |
| **Time** | `--c-warning` | gold | horizon, payback, tenure, loan years, capacity ramp |
| **Cost** | `--c-danger` | terracotta-red | burn, variable costs, downside, below-hurdle |
| **Category** | `--c-accent-2 / 3 / 4` | varies | products, modes, axes — distinct hues for unordered groups |

Plus two orthogonal **sentiment** tokens — applied on top of a role, never instead of it:

| Sentiment | Token | Used when |
|---|---|---|
| positive | `--c-success` | metric beats threshold (NPV > 0, DSCR ≥ 1.5, etc.) |
| warn | `--c-warning` | borderline (DSCR 1.25–1.5, payback near tenure ceiling) |
| danger | `--c-danger` | below threshold (NPV < 0, DSCR < 1.25, IRR < hurdle) |
| neutral | `--c-fg2` | no signal yet (empty inputs) |

`--c-warning` and `--c-danger` intentionally overlap with the Time and Cost roles. In a heritage palette gold-on-gold means "this time signal is borderline" — same hue, different intensity (sentiment uses a translucent fill via the existing `--c-warning-bg`).

## 4. Ordinal vs categorical handling

For **ordinal data** (S→A→B→C tiers, capacity %, ramp years), use a single role at stepped intensities:
```
S  →  --c-accent          (full)
A  →  --c-accent-light    (one notch lighter)
B  →  --c-accent-22       (translucent fill, 13% alpha)
C  →  --c-fg3             (neutral grey)
```

For **categorical data** (Plant Configuration products, Atlas mode tabs, Compare card stat groups), use the distinct accent-2/3/4 hues that already exist in every theme's secondary palette.

## 5. Page-by-page assignments

### 5.1 Calculations — Feasibility Report masthead
| Element | Role / token | Notes |
|---|---|---|
| IRR big number | Return — `--c-accent` | already correct in tokens, keep |
| Payback big number | Time — `--c-warning` | already correct |
| Sector bar range chip | Coverage — `--c-info-22` | safe-zone band |
| Sector bar marker | Same role as the BigNum it sits under |
| Verdict pill (positive) | Sentiment.positive — `--c-success-bg` + `--c-success` text |
| Verdict pill (warn) | Sentiment.warn — `--c-warning-bg` + `--c-warning` text |

### 5.2 Calculations — 5 KPI cards
Each card gets a **3 px left-stripe** in its **role** color and a **sparkline** stroked in its **sentiment** color:

| KPI | Role stripe | Sparkline sentiment rule |
|---|---|---|
| NPV @ discount rate | Return — `--c-accent` | positive if `npv > 0`, danger otherwise |
| Net Profit · Y1 | Return — `--c-accent` | positive if `netY1 > 0`, danger otherwise |
| EBITDA · Y1 | Return — `--c-accent` | positive if `ebitda > 0`, danger otherwise |
| DSCR · Y1 | Coverage — `--c-info` | positive ≥ 1.5, warn 1.25–1.5, danger < 1.25 |
| Break-even capacity | Coverage — `--c-info` | positive `< 80% ceiling`, warn 80–100%, danger ≥ 100% |

Surface stays `var(--c-bg1)`; border stays `--c-border`. The stripe is the only colored element on the card by default. This is the single change that does the most to fix the "all 5 KPIs look the same" problem.

### 5.3 Calculations — Cash flow chart legend
Already roughly aligned. After cleanup:
- Revenue line → Return (`--c-accent`)
- Operating costs dashed → Cost (`--c-danger`)
- EBITDA bar → Coverage (`--c-info`) — currently info, keep
- Payback dashed marker → Time (`--c-warning`)

### 5.4 Calculations — Quick Estimate right panel
| Element | Role / token |
|---|---|
| "Strong returns at X% ceiling" callout | Sentiment.positive — `--c-success-bg` + `--c-success` rule on left |
| Plant Configuration card stripe | Category — product dot color (from `PRODUCT_COLORS_EXPORT`) |
| Money Flow segmented bar: Variable Cost | Cost — `--c-danger` |
| Money Flow: Payroll | Time — `--c-warning` |
| Money Flow: Other operating costs | Coverage — `--c-info` |
| Money Flow: Interest + Tax | Neutral — `--c-fg3` (muted because not actionable) |
| Money Flow: Profit | Return — `--c-accent` (the win) |
| Try-a-Preset · Conservative | Coverage — `--c-info` left-stripe |
| Try-a-Preset · Aggressive Growth | Return — `--c-accent` left-stripe |
| Try-a-Preset · No-Subsidy Baseline | Neutral — `--c-fg3` left-stripe |
| CAPEX & SUBSIDY column "Less subsidy" delta | Sentiment.positive — `--c-success` |
| CAPEX & SUBSIDY column "Debt" row | Time — `--c-warning` (debt has a tenure) |
| Variable bottom callout (negative number) | Cost — `--c-danger` |

### 5.5 Calculations — Deep Dive (replaces hard-coded hexes)
Current `index.jsx` has:
```js
const irrColor     = ... '#2a7d3c' ... '#b06000' ... '#c0392b';
const npvColor     = ... '#2a7d3c' ... '#c0392b';
const paybackColor = ... '#2a7d3c' ... '#b06000' ... '#c0392b';
const dscrColor    = ... '#2a7d3c' ... '#b06000' ... '#c0392b';
const ebitdaColor  = ... '#2a7d3c' ... '#c0392b';
const netProfitColor = ... '#2a7d3c' ... '#c0392b';
```
Each `#2a7d3c` → `C.success`, each `#b06000` → `C.warning`, each `#c0392b` → `C.danger`. Empty-state fallback `C.fg2` stays. This single change makes status thresholds theme-aware across all 8 themes.

### 5.6 Calculations — Pill tabs (Quick / Deep Dive / What-If / Scenarios)
Currently 4 identical pills. Apply category accents so the active tab also hints at its content:
- Quick Estimate active → `--c-accent` (return — verdict at a glance)
- Deep Dive active → `--c-info` (coverage — full P&L and DSCR coverage)
- What-If Lab active → `--c-warning` (time/sensitivity — what changes when?)
- Scenarios active → `--c-accent-2` (category — compare alternatives)

Inactive pills: `--c-bg1` background, `--c-fg3` text, `--c-border` border. Hover: 1-tier brighter.

### 5.7 Atlas — Mode tabs
- Atlas (Map) → `--c-accent`
- Compare → `--c-info`
- Opportunities → `--c-accent-2` (the "new" pill stays `--c-danger-bg` as a `new` chip)

Active tab gets a 2 px bottom border in its mode color, plus the eyebrow index (`01`, `02`, `03`) and label switch to that hue.

### 5.8 Atlas — Opportunity tier cards (S / A / B / C)
Ordinal — single role (Return) at stepped intensity:
| Tier | Stripe + score chip | Card hover stripe glow |
|---|---|---|
| S | `--c-accent` | `--c-accent-33` |
| A | `--c-accent-light` | `--c-accent-22` |
| B | `--c-warning` | `--c-warning-bg` |
| C | `--c-fg3` | `--c-bg3` |

Rationale for B = warning: Tier B is the "fine but with caveats" band — matches the warn sentiment.

### 5.9 Atlas — 3-axis meters (Volume / Concentration / Access)
Categorical — three distinct theme tokens so a glance across rows shows which axis dominates:
- Volume → Return — `--c-accent`
- Concentration → Coverage — `--c-info`
- Access → Time — `--c-warning`

(Why this mapping: bigger volume = bigger upside (return); higher concentration = better sourcing safety (coverage); better access = faster path to launch (time). The mapping is mnemonic, not arbitrary.)

### 5.10 Atlas — Tier filter chips, Sort chips
- Active "All" / sort chip → `--c-accent` background, `--c-bg1` text
- Active tier chip (S / A / B / C) → that tier's stripe color (see 5.8)
- Inactive chip → `--c-bg1` background, `--c-fg2` text, `--c-border` border

### 5.11 Atlas — Compare card stats
Each of the 4 stat tiles in a Compare card gets a top-stripe in its role:
- Production tonnes → Return — `--c-accent`
- Irrigation % → Coverage — `--c-info`
- Farmer density → Time — `--c-warning` (proxy for access/horizon)
- National share % → Neutral — `--c-fg3`

## 6. Implementation surface

CSS files (all changes go here, no JSX restructure except DeepDive hex swaps):
- `src/styles.css` — KPI card stripes, money-flow segments, preset stripes (or feasibility-report.css below if scoped)
- `src/pages/Calculations/feasibility-report.css` — KPI stripes, sparkline color rule
- `src/pages/Calculations/tabs/QuickEstimate.jsx` (or its CSS) — money flow + preset stripes
- `src/atlas-v2.css` — mode-tab borders, tier-card stripes, axis meter colors, chip active states

JSX files (small token-only edits):
- `src/pages/Calculations/index.jsx` — replace 6 hard-coded hexes with `C.success / C.warning / C.danger`
- `src/pages/Calculations/FeasibilityReport.jsx` — pass `role` prop into `KpiCard` so the stripe + sparkline pick up the right token
- `src/utils/calcEngine.js` — `PRODUCT_COLORS_EXPORT` currently hard-coded; remap to a CSS-var lookup that resolves at runtime so products track each theme (out-of-scope if it widens blast radius — flag for a follow-up if so)

## 7. Verification

**Visual** — for each of the 3 most representative themes (heritage, midnight, prism):
1. Open Calculations with Coconut by-products selected; confirm KPI stripes are visually distinct from each other and each stripe matches its role color.
2. Switch sparkline scenarios (force NPV negative by zeroing revenue rows); confirm the NPV sparkline flips from `--c-success` to `--c-danger`.
3. Open Atlas Opportunities; confirm S/A/B/C tier cards form a descending intensity ladder.
4. Switch Atlas to Compare; confirm the 4 stat tiles in each card use 3 distinct hues + 1 neutral.

**Code** — grep for hard-coded hex usage in JSX:
```
rg "#[0-9a-fA-F]{6}" src/pages/Calculations src/pages/Atlas
```
should return zero matches in `index.jsx` after the change. Other JSX may legitimately keep hexes for product-color palettes.

**Theme parity** — toggle every theme via the sidebar (Light/Dark/System and Theme dropdown). Every role color must resolve via a `--c-*` token; no theme should break.

## 8. Non-goals

- No new design tokens added to `styles.css` — every role maps to a token that already exists.
- No restructuring of which sections live in Quick / Deep / What-If / Scenarios — colors only.
- No changes to chart libraries or SVG primitives — only the color values passed in.
- No accessibility-contrast audit beyond what the existing palette already provides (the theme palettes already pass WCAG AA per their design intent).

## 9. Risks

- **Risk:** product colors in `calcEngine.js` are theme-blind hex values. **Mitigation:** keep them theme-blind for now; they're categorical and the existing palette is already coherent enough. Flag as a follow-up if the user wants per-theme product palettes.
- **Risk:** the 3-axis meter mapping (Volume/Conc/Access → Return/Coverage/Time) is mnemonic but not universally obvious. **Mitigation:** axis labels stay text-first; color is a learning aid, not the only cue.
- **Risk:** tier B = warning (gold) might read as "alert" when it's really just "second-best." **Mitigation:** chip text remains literal ("Tier B · 7"); the gold is only the left-stripe accent, not a full background.
