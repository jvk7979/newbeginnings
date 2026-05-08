# Venture Log — Vintage Empty States + Editorial Chart Polish

**Date:** 2026-05-08
**Status:** Spec — pending implementation plan

## 1. Goal

Push the heritage editorial identity deeper into the two surfaces where it currently breaks character:

1. **Empty states** still use emoji (💡 / 📋 / 📄) — out of place next to Playfair titles, palm-leaf flourishes, and the Pinyon Script tagline. Replace with a coherent set of **vintage engraving silhouettes** (Style B), bookplate / colophon feel.

2. **Calculations & dashboard charts** read as generic SaaS — flat blues, system-font tick labels, no editorial framing. Push to **full editorial** (Ambition B): scroll-reveal stagger on dashboard sections, KPI count-up, palette retune to heritage gold/sage/terracotta, JetBrains Mono tick labels, hand-warmed axes (1.2 px), inscribed zone labels on Capacity Ring + IRR Gauge, soft cream area-fill on sparklines, chapter-style eyebrow above every chart in Calculations.

Both items deepen what's already there — the existing [.empty-state](src/styles.css#L5744) class, the existing chart eyebrows ([.calc-gauge-eyebrow](src/pages/Calculations/MetricDashboard.jsx#L18), [.calc-composition-eyebrow](src/pages/Calculations/MetricDashboard.jsx#L30)), and the existing [.page-enter](src/styles.css#L5441) keyframes. No surfaces are rebuilt from scratch.

## 2. Scope

**In scope:**
- New illustration component set: `src/components/illustrations/` — six vintage-engraving SVG silhouettes (idea, plan, document, library, calculation, scenario).
- Replace emoji art in the four `empty-state` call sites — [IdeasPage:173](src/pages/IdeasPage.jsx#L173), [PlansPage:253](src/pages/PlansPage.jsx#L253), [FilesPage:236](src/pages/FilesPage.jsx#L236), and the three [Dashboard EmptyTile](src/pages/Dashboard.jsx#L321) instances.
- Replace the two custom inline SVGs in [Calculations/EmptyStates.jsx:10-21](src/pages/Calculations/EmptyStates.jsx#L10-L21) and [Calculations/EmptyStates.jsx:42-48](src/pages/Calculations/EmptyStates.jsx#L42-L48) with the new silhouette set so Calculations matches the rest.
- Update `.empty-state-art` styling to host SVGs cleanly (it's currently sized for a 32 px emoji).
- Two small reusable hooks: `useReveal` (IntersectionObserver) and `useCountUp` (rAF tween). Live in `src/utils/`.
- Apply scroll-reveal stagger + KPI count-up on the Dashboard ([dh-kpi-strip](src/pages/Dashboard.jsx#L155), [dh-three-col](src/pages/Dashboard.jsx#L162), [dh-closing](src/pages/Dashboard.jsx#L285)).
- Editorial pass on every Calculations chart component:
  [charts.jsx](src/components/calc/charts.jsx) (Sparkline, NPVBar, PaybackTrack), [CapacityRing.jsx](src/components/calc/CapacityRing.jsx), [IRRGauge.jsx](src/components/calc/IRRGauge.jsx), [DonutChart.jsx](src/components/calc/DonutChart.jsx), [RevenueEbitdaBarChart.jsx](src/components/calc/RevenueEbitdaBarChart.jsx), [RevenueToProfitWaterfall.jsx](src/components/calc/RevenueToProfitWaterfall.jsx), [LoanAmortisationChart.jsx](src/components/calc/LoanAmortisationChart.jsx).
- One Playwright e2e per visible change (illustration loads on empty Ideas page; KPI count-up runs once; reduced-motion path skips animation).

**Explicitly out of scope:**
- Any change to Plan Detail (item 1 from the brainstorm — dropped by user).
- Adding new pages, new product capabilities, AI features, voice capture, RAG.
- Changing the `.empty-state` layout / copy structure / button styles.
- Swapping chart libraries or rebuilding chart math. Only the visual treatment changes; underlying data props, sizes, and accessibility labels stay identical.
- Theme work — the new illustrations + chart palette inherit per-theme tokens; nothing in [ThemeContext.jsx](src/context/ThemeContext.jsx) changes.

## 3. Item 3 · Vintage engraving silhouettes

### 3.1 The set

Six illustrations, each rendered as a single React component returning an inline `<svg>` so it inherits `currentColor` for theming and lazy-imports cleanly.

| Component | Empty-state surface | Motif |
|---|---|---|
| `IllIdea` | IdeasPage, Dashboard "Featured Ideas" | Coconut palm tree silhouette with three drupes at the base — invokes the Godavari hero photo. |
| `IllPlan` | PlansPage, Dashboard "Active Projects" | Open ledger / bound book spread, ribbon bookmark trailing. |
| `IllDoc` | FilesPage, Dashboard "Recent Documents" | Single closed book with foil-stamp ornament on the spine. |
| `IllLibrary` | (reserved) shelf empty state — used if FilesPage gets split into a library view later. Ship the asset now. | Three stacked books on a shelf with a small triangle pediment. |
| `IllCalc` | Calculations [EmptyNoEligible](src/pages/Calculations/EmptyStates.jsx#L4) | Old-school balance scale, perfectly level. |
| `IllScenario` | Calculations [EmptyNoSelection](src/pages/Calculations/EmptyStates.jsx#L36) | Branching tree / dendrogram silhouette, three forks. |

All six share:
- ViewBox `0 0 80 80` so they drop into the existing 72 px `.empty-state-art` badge with room to breathe.
- `fill="currentColor"`, `stroke="none"` — pure silhouette. No outlines, no two-tone.
- Tiny notch / ornament detail on each (a small dot, a triangle, a flourish curve) so they read as engravings rather than icons. Detail must remain legible at 32 px (the `.empty-state-compact` size).
- Identical optical weight: each silhouette occupies ≈ 50–55% of its viewBox area. Tested by previewing all six side-by-side in Storybook-style sandbox before locking.
- No themed colour fills — single fill via `currentColor`, parent badge sets the colour.

### 3.2 Badge restyle

Today [.empty-state-art](src/styles.css#L5765) is a 72 px circle with a faint accent-tinted radial halo behind it. To carry the bookplate feel, the badge needs a subtle "wax-stamp" treatment without slowing the page or fighting the accent.

Changes:
- Background fill: change from `rgba(var(--c-accent-rgb) / 0.14)` to `var(--c-bg2)` so the silhouette reads as ink-on-paper, not as the accent.
- Border: keep `1px solid rgba(var(--c-accent-rgb) / 0.26)`; this is already the right weight.
- New: `box-shadow: inset 0 0 0 1px rgba(var(--c-accent-rgb) / 0.10), 0 6px 18px rgba(var(--c-accent-rgb) / 0.10);` — inset hairline + soft outer shadow gives the embossed-stamp feel.
- The silhouette itself uses `color: var(--c-fg1)` so it reads as heritage ink, with `opacity: 0.84` to soften slightly. (Tested: full opacity reads too aggressive, especially in dark themes.)
- The decorative `::before` radial halo stays as-is.
- `.empty-state-compact` overrides scale linearly — silhouette renders at 32 px instead of 40 px, badge stays 48 px.

### 3.3 Existing call sites

| File | Change |
|---|---|
| [IdeasPage.jsx:172-177](src/pages/IdeasPage.jsx#L172-L177) | Replace the emoji `<div>` with `<IllIdea />`. Title + copy + button unchanged. |
| [PlansPage.jsx:252-256](src/pages/PlansPage.jsx#L252-L256) | Replace with `<IllPlan />`. |
| [FilesPage.jsx:235-238](src/pages/FilesPage.jsx#L235-L238) | Replace with `<IllDoc />`. |
| [Dashboard.jsx EmptyTile](src/pages/Dashboard.jsx#L321) | Three call sites pass icon-less `+ New Idea` / `+ New Project` / `Upload Document` buttons today. Add an optional `art` prop and pass `<IllIdea />` / `<IllPlan />` / `<IllDoc />` from each call site. Compact variant. |
| [Calculations/EmptyStates.jsx:4-34](src/pages/Calculations/EmptyStates.jsx#L4-L34) | Replace inline calendar SVG with `<IllCalc />`. Keep custom card layout, just swap the art. |
| [Calculations/EmptyStates.jsx:36-62](src/pages/Calculations/EmptyStates.jsx#L36-L62) | Replace inline bar-chart SVG with `<IllScenario />`. |

No props or callbacks change. CSS class names unchanged.

## 4. Item 4 · Editorial scroll + chart polish

### 4.1 Scroll reveal — `useReveal`

```
src/utils/useReveal.js
```

A 30-line custom hook that returns `{ ref, visible }`. Behaviour:
- Creates one `IntersectionObserver` per element with `threshold: 0.12` and `rootMargin: '0px 0px -40px 0px'` (so the reveal fires just as the element peeks into the viewport, not at first pixel).
- On first intersect, sets `visible = true` and disconnects (one-shot, no replay on scroll-out).
- Respects `window.matchMedia('(prefers-reduced-motion: reduce)')`: hook returns `{ ref, visible: true }` immediately, animation skipped.

Two CSS classes in [styles.css](src/styles.css):
- `.reveal-fade` — base state `opacity: 0; transform: translateY(8px); transition: opacity 420ms ease-out, transform 420ms ease-out;`
- `.reveal-fade.is-visible` — `opacity: 1; transform: none;`

Stagger via inline `transition-delay` (40 ms × child index) when applied to a list of siblings. Cap the stagger at 6 children so a long list doesn't accumulate a 600 ms delay on the last item.

Apply to:
- [Dashboard.jsx](src/pages/Dashboard.jsx) — KPI strip (3 children, staggered), three-column section (3 children, staggered), closing tagline section (1 reveal, no stagger).
- Hero is *not* revealed — it's above the fold and would feel laggy.

Already-shipping [.page-enter](src/styles.css#L5441) keyframe stays — fires once on route mount, then `useReveal` takes over for in-page scrolling.

### 4.2 KPI count-up — `useCountUp`

```
src/utils/useCountUp.js
```

A 25-line hook: `useCountUp(target, { duration = 700, enabled = true })` returns the animated current value. Implementation:
- `requestAnimationFrame` tween, easing `easeOutCubic`.
- Starts at 0 when `enabled` first becomes true, animates to `target`. If `target` changes mid-animation, restart from current value.
- Reduced-motion: returns `target` immediately.
- Wired together with `useReveal` so the count-up only starts once the tile scrolls into view, not on mount (otherwise the user never sees it on long pages).

Apply to the three [Dashboard KPI tiles](src/pages/Dashboard.jsx#L155-L159). Round target values to integers (they already are).

The hook is reused — also wire it to the four [Calculations KPI cards](src/pages/Calculations/MetricDashboard.jsx#L97-L109) where revenue / EBITDA / NPV / payback ramp up into view. INR formatting (Lakh / Crore via [fmtINR](src/components/calc/primitives.jsx)) wraps the animated number, *not* the input — so "₹1.4 Cr" types up naturally without breaking the formatter.

### 4.3 Chart palette retune

Define five chart colour roles as new CSS custom properties in `:root` per theme — they all already exist in spirit, just not consolidated:

| Role | Use | Heritage | Vellum | Field | Linen | Oxford | Burgundy |
|---|---|---|---|---|---|---|---|
| `--c-chart-positive` | upward trends (revenue, EBITDA when positive) | `#5C8A52` | `#5C7B3C` | `#16A34A` | `#2D6E3D` | `#2B6E4F` | `#4A6B30` |
| `--c-chart-negative` | downward trends, NPV negative | `#B33A2F` | `#A4422A` | `#B91C1C` | `#8B2424` | `#8E342B` | `#B23522` |
| `--c-chart-neutral` | EBITDA when negative, payback track | `#B88A3B` | `#B07820` | `#B45309` | `#8B6914` | `#A8782A` | `#A8782A` |
| `--c-chart-accent` | revenue, primary metric | `#2F6B4F` | `#6B3F2A` | `#15803D` | `#1F1F1F` | `#1A2238` | `#7A2C25` |
| `--c-chart-axis` | axis lines, tick marks | `#8a7256` | `#6f5638` | `#475569` | `#3a3a3a` | `#5b6374` | `#6c4f4f` |

Charts that today reference [C.accent](src/tokens.js) / [C.fg2](src/tokens.js) for visualisation switch to these roles. Functional `Badge` accent and form-input accent are unchanged.

### 4.4 Per-chart edits

For every chart, two universal changes:
- **Tick labels** switch from `'DM Sans', sans-serif` to `'JetBrains Mono', monospace`. Numbers in monospace align in columns and read as data, not body copy. Currently inconsistent — IRRGauge uses DM Sans 10 px; CapacityRing uses Playfair for the centre value (kept) and DM Sans for the tiny CAPACITY label (kept, monospace would feel wrong at 5 px).
- **Axis stroke** widens from `1` to `1.2` and uses `var(--c-chart-axis)` instead of [C.fg3](src/tokens.js). Reads warmer.

Per-chart specifics:

#### Sparkline ([charts.jsx:9-29](src/components/calc/charts.jsx#L9))
- Area fill opacity stays at 0.14, but the colour switches from the prop `color` to a soft cream overlay: `<path d={areaPath} fill="var(--c-bg2)" fillOpacity="0.5"/>`. Then the line itself stays in the prop colour. Reads as "ink on parchment" instead of "blue-on-blue".
- Endpoint dot grows from r=2 to r=2.4 and gets a 1 px white stroke for the wax-seal hit.

#### NPVBar ([charts.jsx:33-53](src/components/calc/charts.jsx#L33))
- Centre dashed midline switches to `var(--c-chart-axis)`.
- The bar itself uses `var(--c-chart-positive)` when positive, `var(--c-chart-negative)` when negative — drop the prop-passed colour. Caller no longer threads the colour through.

#### PaybackTrack ([charts.jsx:57-78](src/components/calc/charts.jsx#L57))
- Tick marks switch to `var(--c-chart-axis)`. Endpoint dot stays in prop colour.

#### CapacityRing ([CapacityRing.jsx](src/components/calc/CapacityRing.jsx))
- New: inscribed zone labels around the ring. Three short labels — "Comfortable" (0–60%), "Stretched" (60–85%), "Overworked" (85–100%) — rendered as faint arc-following text in JetBrains Mono 4.5 px, opacity 0.4, hidden when the ring is < 60 px (compact embeds). Use SVG `<textPath>` with a hidden `<defs><path>` per zone arc.
- The 18 px Playfair percentage in the centre stays as-is.

#### IRRGauge ([IRRGauge.jsx](src/components/calc/IRRGauge.jsx))
- Zone labels: "below hurdle" / "fair" / "strong" rendered in JetBrains Mono 8 px above each coloured arc segment. Today the gauge has only "0" / "max%" / "hurdle" labels; these new labels make the zones legible without a legend.
- Existing palette (`#d96b5b` / `#e6b34a` / `#5c8a52`) replaced by the new chart roles — `--c-chart-negative` / `--c-chart-neutral` / `--c-chart-positive`. Visually almost identical in Heritage, but now adapts per theme.
- "0" / "{max}%+" tick numbers switch to JetBrains Mono.

#### DonutChart, RevenueEbitdaBarChart, RevenueToProfitWaterfall, LoanAmortisationChart
- Same two universal changes (mono ticks, warmer axes).
- Colour props that today expect callers to pass theme tokens are switched to `var(--c-chart-*)` directly inside the components. Removes the colour-threading dance from MetricDashboard.

#### Chapter eyebrow consistency
Today the dashboard already has `calc-gauge-eyebrow` and `calc-composition-eyebrow` in [MetricDashboard.jsx](src/pages/Calculations/MetricDashboard.jsx). Promote that pattern: every chart component renders inside a wrapper that ships its own `.calc-chart-eyebrow` slot — small uppercase JetBrains Mono label, 11 px, 0.18 em letter-spacing, [--c-fg3](src/styles.css). Examples: "Capacity Utilisation" above the ring, "Internal Rate of Return" above the gauge, "Revenue Trajectory" above each sparkline.

The eyebrow component:
```jsx
// src/components/calc/ChartEyebrow.jsx
export default function ChartEyebrow({ children }) {
  return <div className="calc-chart-eyebrow">{children}</div>;
}
```

CSS:
```css
.calc-chart-eyebrow {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--c-fg3);
  margin-bottom: 6px;
}
```

Wire-up: every chart in [Calculations/tabs/](src/pages/Calculations/tabs) gets its eyebrow string passed in. The two existing eyebrow classes (`calc-gauge-eyebrow`, `calc-composition-eyebrow`) collapse into the new shared `.calc-chart-eyebrow`, removing duplication.

## 5. Reduced-motion behaviour

Every animation in the spec respects `prefers-reduced-motion: reduce`:
- `.reveal-fade` — under reduced motion, base state is `opacity: 1; transform: none;` — the `.is-visible` class is a no-op.
- `useCountUp` — returns `target` immediately when reduced motion is set.
- IRRGauge needle `transition: transform 480ms cubic-bezier(...)` (already in [IRRGauge.jsx:49](src/components/calc/IRRGauge.jsx#L49)) — wrap in `@media (prefers-reduced-motion: reduce) { transition: none; }` via a small CSS adjustment to the gauge wrapper.
- All hand-drawn flourishes are static SVG; no animation.

## 6. Files touched

**New:**
- `src/components/illustrations/IllIdea.jsx`, `IllPlan.jsx`, `IllDoc.jsx`, `IllLibrary.jsx`, `IllCalc.jsx`, `IllScenario.jsx`
- `src/components/illustrations/index.js` — barrel file
- `src/components/calc/ChartEyebrow.jsx`
- `src/utils/useReveal.js`
- `src/utils/useCountUp.js`

**Modified:**
- [src/styles.css](src/styles.css) — `.empty-state-art` restyle (§3.2), `.reveal-fade` + `.is-visible` (§4.1), `.calc-chart-eyebrow` (§4.4), per-theme `--c-chart-*` tokens (§4.3, six theme blocks).
- [src/pages/IdeasPage.jsx](src/pages/IdeasPage.jsx), [PlansPage.jsx](src/pages/PlansPage.jsx), [FilesPage.jsx](src/pages/FilesPage.jsx) — emoji → silhouette.
- [src/pages/Dashboard.jsx](src/pages/Dashboard.jsx) — `EmptyTile` `art` prop, `useReveal` + `useCountUp` wiring on KPI strip and three-col section.
- [src/pages/Calculations/EmptyStates.jsx](src/pages/Calculations/EmptyStates.jsx) — inline SVGs → `<IllCalc />` / `<IllScenario />`.
- [src/pages/Calculations/MetricDashboard.jsx](src/pages/Calculations/MetricDashboard.jsx) — `useCountUp` on KPI cards, eyebrows refactored to `<ChartEyebrow>`.
- [src/components/calc/charts.jsx](src/components/calc/charts.jsx), [CapacityRing.jsx](src/components/calc/CapacityRing.jsx), [IRRGauge.jsx](src/components/calc/IRRGauge.jsx), [DonutChart.jsx](src/components/calc/DonutChart.jsx), [RevenueEbitdaBarChart.jsx](src/components/calc/RevenueEbitdaBarChart.jsx), [RevenueToProfitWaterfall.jsx](src/components/calc/RevenueToProfitWaterfall.jsx), [LoanAmortisationChart.jsx](src/components/calc/LoanAmortisationChart.jsx) — palette swap, mono ticks, warmer axes, inscribed zone labels (CapacityRing + IRRGauge only).

**No changes:**
- [PlanDetailPage.jsx](src/pages/PlanDetailPage.jsx) — explicitly out of scope.
- [ThemeContext.jsx](src/context/ThemeContext.jsx) — token additions are pure CSS.
- Firestore schema, security rules, Cloud Functions.

## 7. Testing

**Visual:**
- Manual sweep across all six themes (heritage, vellum, field, linen, oxford, burgundy) on each empty state and each chart. Look for: badge contrast, silhouette legibility at 32 px and 40 px, chart axis hue.
- Manual reduced-motion check (`prefers-reduced-motion: reduce` via DevTools rendering pane) — KPI numbers appear instantly, no fade-in stagger, gauge needle snaps.

**Playwright:**
- New `e2e/empty-states-illustrations.spec.js`:
  - Sign in as a new account with no ideas → IdeasPage renders, the silhouette `<svg>` appears inside `.empty-state-art`, no emoji character is rendered.
  - Same on PlansPage, FilesPage.
- New `e2e/dashboard-reveal.spec.js`:
  - Standard motion: KPI tile starts at `opacity:0`, becomes `opacity:1` after scroll into view.
  - Reduced motion: KPI tile is `opacity:1` from the start.
- New `e2e/calc-chart-eyebrows.spec.js`:
  - Calculations page renders one `.calc-chart-eyebrow` per chart, text matches expected labels.

Existing e2e (theme system, page transitions, Plan Detail) must continue to pass.

## 8. Risks &amp; tradeoffs

- **Style B is heavier than Style A.** The user explicitly chose it, knowing the bookplate vibe. Mitigation: silhouettes ship at 84% opacity, and the badge background is `--c-bg2` not the accent, so they read as ink-on-paper rather than as competing buttons.
- **Six themes × six illustrations × multiple sizes.** A single bad SVG curve will look broken in every theme. Lock the silhouettes in a side-by-side preview before wiring to the empty-state surfaces.
- **`useReveal` runs one observer per element.** With ≤ 10 reveal targets per page this is a non-issue; if a future long list adopts it, switch to a single shared observer.
- **Chart-palette refactor changes prop signatures.** [MetricDashboard](src/pages/Calculations/MetricDashboard.jsx) currently threads `irrColor`, `npvColor`, `paybackColor`, `ebitdaColor` through. After this change, charts read CSS vars directly and those props are dropped. Confirm no other caller is passing them.
- **Inscribed zone labels on CapacityRing rely on SVG `textPath`** — works in all evergreen browsers. Hide on viewBox widths < 60 px (compact embeds where the labels would be unreadable anyway).
- **JetBrains Mono is already loaded** ([App.jsx](src/App.jsx) → fonts) — no font weight change to bundle size.

## 9. Definition of done

- All four `empty-state` surfaces and the two Calculations empty surfaces render the new silhouettes; no emoji characters appear in any empty-state DOM.
- Dashboard KPI numbers count up once on first scroll into view; subsequent scrolls do not replay.
- Every chart in Calculations has a `.calc-chart-eyebrow` heading.
- Capacity Ring shows three zone labels; IRR Gauge shows three zone labels.
- All charts use `--c-chart-*` tokens; no chart hard-codes `#d96b5b` etc.
- Reduced-motion: zero animation runs.
- All six themes pass visual sweep.
- New + existing Playwright suites pass.
