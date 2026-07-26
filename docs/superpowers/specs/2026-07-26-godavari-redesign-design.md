# Godavari Redesign — Design Spec

**Date:** 2026-07-26
**Status:** Approved (visual direction signed off via interactive sample)
**Scope:** Bold visual reinvention of *The New Beginnings* venture-log app, responsive for web + iPad + iPhone, with motion and richer data viz. Whole-app sweep, delivered in phases.

---

## 1. Concept — "Godavari": one identity, two climates

A single brand expressed through the app's existing light/dark toggle:

- **Light mode = "Monsoon"** — warm paper, expressive serif hero, tropical colour-block stats, rounded cards, floating "+ new idea". Approachable and joyful.
- **Dark mode = "Delta"** — fertile near-black ground, paddy greens, gauge-style data tiles with sparklines, crop-atlas terrain bars. Rooted and immersive.

The two climates are unified — read as one app, not two — by three shared devices:

1. **Contour signature** — drifting topographic contour lines behind every page hero, tinted to the active climate. The Godavari delta, literally under the ventures.
2. **Type system** — one expressive serif display + one mono for data, identical across both climates.
3. **Motion language** — the same set of animations everywhere (count-ups, growing bars, drawing sparklines, hover-lift, hero rise).

This chosen direction deliberately departs from the current warm-cream editorial look (which is the most common "AI default" aesthetic). Boldness is spent in one place: the contour terrain + the two-climate colour system. Everything else stays disciplined.

---

## 2. Architecture — how it plugs into the existing theme system

The app already exposes two independent axes:

- `document.documentElement.dataset.theme` — the **palette** (`heritage`, `citrus`, `midnight`, `terracotta`, `aurora`).
- `document.documentElement.dataset.mode` — **light / dark** (`data-mode`), driven by the Light/Dark/System switch.

**Implementation:** add a new palette `godavari` whose tokens are climate-aware:

```
:root[data-theme="godavari"]                    → Monsoon (light) tokens
:root[data-theme="godavari"][data-mode="dark"]  → Delta (dark) tokens
```

- Register `godavari` in `THEMES` (`src/context/ThemeContext.jsx`) and make it the **default** (replacing `heritage` as `DEFAULT_THEME`). Existing users on retired/other palettes are unaffected by their own choice; the legacy map already normalises unknowns.
- **Light is the default mode** (Monsoon-forward), per sign-off. `System` still honours OS preference and lands users in Delta at night.
- Heritage and the other palettes remain available in Settings — Godavari is added, nothing is deleted, so we can roll out screen-by-screen without a hard cutover.

All component CSS reads `var(--c-*)` tokens, so repainting is a token swap; component-shape changes (hero contours, KPI tiles, bottom nav) are additive CSS keyed on `[data-theme="godavari"]`.

---

## 3. Design tokens

### 3.1 Monsoon (light)

| Role | Hex | Notes |
|---|---|---|
| `--c-bg0` page | `#FBF7EF` | warm paper |
| `--c-bg1` card | `#FFFFFF` | card surface |
| `--c-bg2` | `#F3ECDD` | secondary surface |
| `--c-bg3` border-deep | `#E7DCC5` | |
| `--c-fg1` ink | `#20261F` | |
| `--c-fg2` body | `#55594B` | |
| `--c-fg3` label | `#6E6A57` | ≥ AA on bg0 |
| `--c-accent` paddy | `#2E7D53` | primary |
| `--c-accent-light` leaf | `#46A06B` | |
| `--c-warning` mango | `#F2A93B` | KPI 1, progress |
| `--c-info` river | `#2F80A8` | KPI 3, "in motion" |
| `--c-danger` coral | `#E4633C` | FAB gradient stop |
| `--c-border` | `#EFE7D4` | |
| `--c-contour` | `#2E7D53` | low-opacity hero lines |

### 3.2 Delta (dark)

| Role | Hex | Notes |
|---|---|---|
| `--c-bg0` page | `#0E1512` | fertile near-black |
| `--c-bg1` card | `#16201B` | tile surface |
| `--c-bg2` | `#1B2A22` | |
| `--c-bg3` border-deep | `#24332B` | |
| `--c-fg1` | `#EAF0EA` | |
| `--c-fg2` | `#B4C2B7` | |
| `--c-fg3` | `#93A596` | |
| `--c-accent` paddy | `#7FB069` | primary (brightened for dark) |
| `--c-accent-light` | `#98C784` | |
| `--c-warning` silt gold | `#E0A458` | |
| `--c-info` river teal | `#4EA8A0` | |
| `--c-danger` | `#D9764A` | |
| `--c-border` | `#24332B` | |
| `--c-contour` | `#7FB069` | hero lines |

Both climates keep the existing `--c-accent-2/3/4` categorical roles, remapped to the palette above so charts/maps stay legible.

### 3.3 Type

Keep the app's loaded families but re-cast their roles for a bolder voice:

- **Display:** Playfair Display (already loaded) — hero headline, section titles. Heavy weights, tight tracking, italic accent for one word ("*Endless*").
- **Body/UI:** DM Sans (already loaded).
- **Data/mono:** JetBrains Mono (already loaded) — KPI numerals, sparkline labels, tabular figures (`font-variant-numeric: tabular-nums`).

Type scale (rem, 1rem = 16px): hero `clamp(2.1, 5vw, 3.25)`, h2 `clamp(1.3, 3vw, 1.9)`, h3 `1.15`, body `0.95`, label/mono `0.72` uppercase `.14em`.

---

## 4. Motion language

All motion respects `prefers-reduced-motion` (jump to final state). Shared primitives:

- **Hero rise** — headline fades up on route enter (reuses existing `.page-enter`).
- **Contour drift** — hero contour SVG translates ±16px over ~15s, `ease-in-out alternate`.
- **Count-up** — KPI numerals animate 0→value (~850ms, cubic ease-out) on first scroll into view (IntersectionObserver).
- **Bar grow** — atlas terrain bars + card progress grow from width 0.
- **Sparkline draw** — `stroke-dashoffset` draw-in.
- **Hover-lift** — cards translateY(-4px) + soft shadow.
- **Live dot pulse** — for any "live data" indicator.

Motion is orchestrated per screen (a short load sequence), not scattered — one confident moment beats many twitches.

---

## 5. Component patterns

- **Page hero** — contour SVG layer + eyebrow (mono) + serif headline + sub + CTAs. Condenses to greeting-only on phone.
- **KPI row** — Monsoon: three colour-block gradient tiles (mango / paddy / river), white numerals + sparkline. Delta: dark surface tiles, one "hot" tile with paddy glow, mono numerals + sparkline. Same data, climate-appropriate skin.
- **Venture cards** — rounded, tag chip (Pipeline / In motion), serif title, progress bar; hover-lift.
- **Crop-atlas terrain bars** — labelled horizontal bars, river→paddy gradient fill; present in both climates.
- **Responsive navigation:**
  - **Desktop (≥1024px):** existing left sidebar, restyled to Godavari.
  - **iPad (768–1023px):** sidebar (as today) or condensed rail — restyled.
  - **iPhone (<768px):** **bottom tab bar** (Home / Ideas / Projects / Markets / Atlas) + floating "+ new idea" FAB, replacing the hamburger-only pattern. Thumb-first, `env(safe-area-inset-bottom)` aware.

---

## 6. Responsive rules

- Layout via flex/grid + `gap`; no per-element margins that collapse.
- Breakpoints: `<768` phone, `768–1023` tablet, `≥1024` desktop.
- All touch targets ≥ 44px on phone/tablet.
- Wide content (tables, maps, charts) scrolls in its own `overflow-x:auto` container; body never scrolls sideways.
- Verify every phase with screenshots at 390px (iPhone), 820px (iPad), 1280px (web).

---

## 7. Quality floor

Responsive to mobile; visible keyboard focus retained; `prefers-reduced-motion` honoured; contrast ≥ WCAG AA for text; the skip-link and `<main>` landmark preserved; theme switch remains atomic.

---

## 8. Phased rollout

Each phase is committed and screenshot-verified on all three widths before the next.

- **Phase 1 — Foundation + Dashboard (flagship).** Add Godavari palette (both climates) + register/default it; build the shared hero-contour, KPI, card, terrain-bar, motion primitives; restyle the Dashboard end-to-end. *This proves the language.*
- **Phase 2 — Global chrome.** Restyle SideNav for Godavari; add the iPhone bottom tab bar + FAB; page-enter/transition polish.
- **Phase 3 — List & detail screens.** Ideas, Projects, Plans, Idea/Plan detail — cards, headers, forms.
- **Phase 4 — Data screens.** Calculations, Scenarios, Portfolio, Markets, World Market, Crop Atlas — richer charts, terrain/gauge treatments, live-feeling stats.
- **Phase 5 — Supporting screens.** Suppliers, Research Vault, Settings, About, Access, Sign-in, empty/error states.

Out of scope for now: new features or data-model changes. This is visual/interaction reinvention only, reusing existing content and routes.

---

## 9. Success criteria

- Toggling Light/Dark visibly switches Monsoon↔Delta with one coherent identity.
- Dashboard (Phase 1) reads as a bold, distinctive, non-templated design on web, iPad, and iPhone.
- Motion is present but calm; reduced-motion users get a static, correct layout.
- No regression in navigation, auth, routing, or the existing theme picker.
- Build passes; existing unit/e2e suites stay green (or are updated intentionally).
