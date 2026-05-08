# Venture Log — Theme System Redesign

**Date:** 2026-05-08
**Status:** Spec — pending implementation plan

## 1. Goal

Replace the current 3-theme set (`heritage`, `forest`, `amber`) with a curated 6-theme set, each with a distinct editorial mood, and redesign the Settings theme picker so picking between six is as easy as picking between three.

The editorial direction the app has been moving toward — Cormorant italic hero, Playfair Display headings, DM Sans body, Heritage's leather-notebook palette — is the anchor. Every new theme has to belong on the same shelf as Heritage.

## 2. Scope

**In scope:**
- 6 light theme palettes defined as `:root[data-theme="..."]` blocks in [src/styles.css](src/styles.css).
- Per-theme status colors (success / warning / danger / info), not shared.
- Theme picker UI redesigned in [src/pages/SettingsPage.jsx](src/pages/SettingsPage.jsx) — preview cards, not pills.
- Theme metadata in [src/context/ThemeContext.jsx](src/context/ThemeContext.jsx) updated to the new set.
- One-time `localStorage` migration: `forest` → `field`, `amber` → `heritage`.

**Explicitly out of scope:**
- Dark mode CSS. Already implemented via `:root[data-mode="dark"]` overriding surfaces while keeping each theme's accent — it works correctly with new themes by default. No changes.
- Adding a new dedicated dark theme. User explicitly declined.
- Theme switching from anywhere outside Settings (Command Palette, etc.) — current paths stay as-is.
- Rebranding. The product remains *Venture Log*.

## 3. The six themes

Default stays **Heritage**. The other five sit alongside as alternates.

| ID | Name | Mood | bg0 | bg1 | accent | accent-light | accent-dim | fg1 |
|---|---|---|---|---|---|---|---|---|
| `heritage` *(default)* | Heritage | Leather notebook, library | `#F6F1E7` | `#FDFAF2` | `#2F6B4F` | `#4A8F70` | `#205139` | `#2D2A26` |
| `vellum` | Vellum | 1920s ledger, walnut ink | `#F2EBDA` | `#FAF4E5` | `#6B3F2A` | `#8A5538` | `#4F2D1C` | `#2A1F14` |
| `field` | Field | Clean, work-mode | `#FAFAF7` | `#FFFFFF` | `#15803D` | `#22C55E` | `#166534` | `#0A1F0E` |
| `linen` | Linen | Monochrome editorial | `#FBFAF6` | `#FFFFFF` | `#1F1F1F` | `#3A3A3A` | `#0E0E0E` | `#0E0E0E` |
| `oxford` | Oxford | Academic, dust jacket | `#F4F2EA` | `#FBF9F1` | `#1A2238` | `#2D3A5C` | `#0F162A` | `#1A2238` |
| `burgundy` | Burgundy | Penguin Classics shelf | `#F5EFE6` | `#FCF7EE` | `#7A2C25` | `#9C3D34` | `#561C18` | `#2A1414` |

### 3.1 Per-theme status colors

Each theme picks success/warning/danger/info hexes that sit naturally on its background. Heritage already does this (terracotta-as-danger). The same logic applies to the new themes.

| Theme | success | success-bg | warning | warning-bg | danger | danger-bg | info | info-bg |
|---|---|---|---|---|---|---|---|---|
| `heritage` *(unchanged)* | `#2F6B4F` | `#E6EEE6` | `#B88A3B` | `#F8F0DD` | `#B33A2F` | `#FBEAE6` | `#7FA9B8` | `#E5EEF1` |
| `vellum` | `#5C7B3C` | `#EAEEDC` | `#B07820` | `#F5E8C5` | `#A4422A` | `#F5E0D5` | `#5A7A8E` | `#E0E8EE` |
| `field` *(near-current)* | `#16A34A` | `#F0FDF4` | `#B45309` | `#FFFBEB` | `#B91C1C` | `#FEF2F2` | `#1E40AF` | `#EFF6FF` |
| `linen` | `#2D6E3D` | `#EBF1ED` | `#8B6914` | `#F4EEDC` | `#8B2424` | `#F2E5E5` | `#1F4D7A` | `#E5ECF3` |
| `oxford` | `#2B6E4F` | `#E5EFE9` | `#A8782A` | `#F2E9CD` | `#8E342B` | `#F2DFD9` | `#1A4571` | `#DCE6F1` |
| `burgundy` | `#4A6B30` | `#E8EEDC` | `#A8782A` | `#F2E9CD` | `#B23522` | `#F5DDD6` | `#3A6280` | `#DCE6EE` |

`*-rgb` channels (used for translucent variants) follow each accent and danger color's RGB, same as the existing pattern.

### 3.2 Full token values per theme

Heritage and Field (formerly forest) keep their existing token blocks verbatim. The four new themes use the values below — same variable list, same order as Heritage at [src/styles.css:26-65](src/styles.css#L26-L65).

**Vellum** — `:root[data-theme="vellum"]`
```
--c-bg0: #F2EBDA;      --c-bg1: #FAF4E5;      --c-bg2: #E5DBC2;      --c-bg3: #D4C49E;
--c-fg1: #2A1F14;      --c-fg2: #5A4A30;      --c-fg3: #8B7A52;
--c-accent: #6B3F2A;   --c-accent-light: #8A5538;  --c-accent-dim: #4F2D1C;
--c-accent-bg: #EFE2CC;  --c-accent-rgb: 107 63 42;  --c-accent-dim-rgb: 79 45 28;
--c-border: #E0D6BC;     --c-border-light: #C9BB94;
--c-success: #5C7B3C;    --c-success-bg: #EAEEDC;
--c-warning: #B07820;    --c-warning-bg: #F5E8C5;
--c-danger:  #A4422A;    --c-danger-bg:  #F5E0D5;   --c-danger-rgb: 164 66 42;
--c-info:    #5A7A8E;    --c-info-bg:    #E0E8EE;
```

**Linen** — `:root[data-theme="linen"]`
```
--c-bg0: #FBFAF6;      --c-bg1: #FFFFFF;      --c-bg2: #F2F1ED;      --c-bg3: #E2E0DA;
--c-fg1: #0E0E0E;      --c-fg2: #4A4A4A;      --c-fg3: #8A8A8A;
--c-accent: #1F1F1F;   --c-accent-light: #3A3A3A;  --c-accent-dim: #0E0E0E;
--c-accent-bg: #F0EFEB;  --c-accent-rgb: 31 31 31;   --c-accent-dim-rgb: 14 14 14;
--c-border: #E0DED7;     --c-border-light: #C9C7BE;
--c-success: #2D6E3D;    --c-success-bg: #EBF1ED;
--c-warning: #8B6914;    --c-warning-bg: #F4EEDC;
--c-danger:  #8B2424;    --c-danger-bg:  #F2E5E5;   --c-danger-rgb: 139 36 36;
--c-info:    #1F4D7A;    --c-info-bg:    #E5ECF3;
```

**Oxford** — `:root[data-theme="oxford"]`
```
--c-bg0: #F4F2EA;      --c-bg1: #FBF9F1;      --c-bg2: #E8E5D5;      --c-bg3: #D5D2BE;
--c-fg1: #1A2238;      --c-fg2: #3F4960;      --c-fg3: #6F7A92;
--c-accent: #1A2238;   --c-accent-light: #2D3A5C;  --c-accent-dim: #0F162A;
--c-accent-bg: #E8EBF3;  --c-accent-rgb: 26 34 56;   --c-accent-dim-rgb: 15 22 42;
--c-border: #E0DCCB;     --c-border-light: #C8C3A8;
--c-success: #2B6E4F;    --c-success-bg: #E5EFE9;
--c-warning: #A8782A;    --c-warning-bg: #F2E9CD;
--c-danger:  #8E342B;    --c-danger-bg:  #F2DFD9;   --c-danger-rgb: 142 52 43;
--c-info:    #1A4571;    --c-info-bg:    #DCE6F1;
```

**Burgundy** — `:root[data-theme="burgundy"]`
```
--c-bg0: #F5EFE6;      --c-bg1: #FCF7EE;      --c-bg2: #E9DFCE;      --c-bg3: #D6C8AC;
--c-fg1: #2A1414;      --c-fg2: #5A2E2E;      --c-fg3: #8B5A5A;
--c-accent: #7A2C25;   --c-accent-light: #9C3D34;  --c-accent-dim: #561C18;
--c-accent-bg: #F2E3DD;  --c-accent-rgb: 122 44 37;  --c-accent-dim-rgb: 86 28 24;
--c-border: #DECDB6;     --c-border-light: #C7B292;
--c-success: #4A6B30;    --c-success-bg: #E8EEDC;
--c-warning: #A8782A;    --c-warning-bg: #F2E9CD;
--c-danger:  #B23522;    --c-danger-bg:  #F5DDD6;   --c-danger-rgb: 178 53 34;
--c-info:    #3A6280;    --c-info-bg:    #DCE6EE;
```

### 3.3 Why these six and not others

- **Heritage** — current best work. Default stays.
- **Vellum** replaces *amber*. Amber was warmer-Heritage; Vellum is a distinct ink-on-paper identity.
- **Field** is *forest* renamed. Same palette, sharper name; pairs naturally with Heritage as the "work mode" sibling.
- **Linen** owns the monochrome editorial mood (Are.na, *The Browser*) — strips color, lets typography carry.
- **Oxford** fills the missing **blue** axis. Bookish navy, not corporate-app blue.
- **Burgundy** fills the missing **red** axis. Penguin Classics oxblood, not alert-red.

The two color axes the original three didn't cover (blue, red) are now both bookish. Nothing in the set picks a fight with the Cormorant-Playfair-DM Sans typography.

## 4. Theme picker UI redesign

### 4.1 Why redesign

The current picker (3 small swatch dots + label, in a single row) works for three themes. For six it gets cramped, and the dots are too small to communicate mood — Heritage and Vellum both look "warm cream + dark accent" at that size.

### 4.2 New design

Two-column grid (single column on narrow). Each theme is a card showing a real micro-preview.

```
┌────────────────────────────────────┬────────────────────────────────────┐
│ [bg fill: theme bg0]               │ [bg fill: theme bg0]               │
│                                    │                                    │
│   VENTURE LOG       (italic, caps) │   VENTURE LOG                      │
│   Heritage          (display name) │   Vellum                           │
│                                    │                                    │
│   ◉◉◉  (3 surface chips)           │   ◉◉◉                              │
│   ▢ + New idea  (accent pill)      │   ▢ + New idea                     │
│                                    │                                    │
│   ✓ selected  (only on active)     │                                    │
└────────────────────────────────────┴────────────────────────────────────┘
```

Each card:
- Outer container `bg0`, fixed height ~140 px
- Mini hero in Cormorant italic 18 px, caps — actual brand identity rendered in the theme's `fg1`
- Theme name in Playfair Display 14 px below
- Three surface chips: `bg1`, `bg2`, `bg3` as 14-px circles
- Accent button: real "+ New idea" pill in `accent` / `accent` text-on-bg
- Selected state: 2 px outline in `accent` + small ✓ badge top-right
- Hover: subtle lift (`translateY(-2px)`) and border darkens

Cards live inside a `SectionCard title="Theme"`. Replaces the existing `themes.map(...)` button row in [src/pages/SettingsPage.jsx:99-140](src/pages/SettingsPage.jsx#L99-L140).

### 4.3 Why preview cards over swatch dots

For six themes, the question shifts from "which name do I want" to "which mood do I want." A real micro-preview answers that question in one glance. The 3-dot pill answered "which palette" — that's a different question and a worse one for the user.

## 5. Token & file changes

### 5.1 [src/styles.css](src/styles.css)

- Heritage block at line 26-65 — **unchanged**.
- Forest block (line 67-92) — **rename** the selector to `:root[data-theme="field"]`, palette unchanged.
- Amber block (line 95-120) — **delete**.
- Add four new blocks: `vellum`, `linen`, `oxford`, `burgundy`, structured identically to Heritage (same variable list, same order, same comment style).
- Translucent-variant block (line 122-134) — **unchanged** (already derives from each theme's `--c-accent-rgb` and `--c-danger-rgb`).
- Dark-mode override (line 2503) — **unchanged**.

### 5.2 [src/context/ThemeContext.jsx](src/context/ThemeContext.jsx)

`THEMES` array goes from 3 entries to 6:

```js
export const THEMES = [
  { id: 'heritage', label: 'Heritage', mode: 'light', swatch: ['#F6F1E7', '#FDFAF2', '#2F6B4F'] },
  { id: 'vellum',   label: 'Vellum',   mode: 'light', swatch: ['#F2EBDA', '#FAF4E5', '#6B3F2A'] },
  { id: 'field',    label: 'Field',    mode: 'light', swatch: ['#FAFAF7', '#FFFFFF', '#15803D'] },
  { id: 'linen',    label: 'Linen',    mode: 'light', swatch: ['#FBFAF6', '#FFFFFF', '#1F1F1F'] },
  { id: 'oxford',   label: 'Oxford',   mode: 'light', swatch: ['#F4F2EA', '#FBF9F1', '#1A2238'] },
  { id: 'burgundy', label: 'Burgundy', mode: 'light', swatch: ['#F5EFE6', '#FCF7EE', '#7A2C25'] },
];
```

The preview-card UI doesn't actually use `swatch` for rendering (it computes from CSS vars), but the array stays for back-compat with anywhere else that consumes it.

### 5.3 localStorage migration

In `ThemeProvider`, before the existing `THEMES.some(...)` validation, normalize legacy values:

```js
const LEGACY_MAP = { forest: 'field', amber: 'heritage', sprout: 'heritage' };
const normalized = LEGACY_MAP[stored] ?? stored;
if (THEMES.some(t => t.id === normalized)) {
  if (normalized !== stored) {
    try { localStorage.setItem(STORAGE_KEY, normalized); } catch {}
  }
  return normalized;
}
```

This preserves the existing graceful fallback for unrecognized values *and* upgrades known legacy values silently. `sprout` is already in the comment at line 11 as a prior rename — same treatment.

## 6. Acceptance criteria

- [ ] Six theme cards render in Settings, two columns on desktop, one column under ~640 px wide.
- [ ] Clicking any card sets `data-theme` on `<html>` immediately and persists to `localStorage`.
- [ ] Each card's micro-preview uses live theme tokens — switching the active theme does not affect the preview tiles of other themes.
- [ ] An existing user with `localStorage.nb_theme === "forest"` lands on `field` after upgrade and sees `field` selected. Same for `amber → heritage`, `sprout → heritage`.
- [ ] Dark mode (`data-mode="dark"`) toggled on each of the six themes shows that theme's accent intact and surfaces inverted to dark — no visual regressions from current behavior.
- [ ] Status colors (success/warning/danger/info) render distinctly per theme — verifiable on a page that uses several status badges (Calculations or a status palette demo page if one exists).
- [ ] No `forest`, `amber`, or `sprout` references remain in the codebase except the legacy-map and a one-line comment explaining why.

## 7. Open questions

None. Decisions:
- Default: **Heritage** (unchanged).
- Status colors: **per-theme** (Q answered 2026-05-08).
- Picker scope: **redesigned UI** (Q answered 2026-05-08).
- Existing dark-mode behavior: keep as a scheme that overlays any theme.

## 8. Out-of-scope follow-ups (not this spec)

- A "reading mode" page-level theme override (e.g. force Linen on Plan Detail regardless of global theme).
- Dedicated dark themes (warm-dark "Midnight Library" etc.) — declined for now.
- Theme picker accessible from Command Palette.
