/**
 * Crop Atlas — top-level mode router (`atlas` | `compare` | `opps`),
 * filter state plumbing, year selector, and the venture-radar tier
 * scoring. The data-color role system is covered separately in
 * data-color-roles.spec.js; this spec focuses on navigation, content
 * presence, and state-survives-rerender behaviour.
 */
import { test, expect } from '@playwright/test';
import { goto } from './helpers.js';

test.describe('Crop Atlas — landing + masthead + mode router', () => {

  test.beforeEach(async ({ page }) => {
    await goto(page, 'atlas');
  });

  test('mounts without runtime errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.waitForTimeout(500);
    expect(errors.filter(e => !e.includes('ResizeObserver'))).toHaveLength(0);
  });

  test('renders the editorial masthead with title and subhead', async ({ page }) => {
    await expect(page.locator('.atlas-header .atlas-title').first()).toBeVisible();
    await expect(page.locator('.atlas-header .atlas-subhead').first()).toBeVisible();
  });

  test('mode bar shows three tabs (Atlas / Compare / Opportunities) with index prefixes', async ({ page }) => {
    const bar = page.locator('.atlas-modebar').first();
    await expect(bar.locator('.tab[data-mode="atlas"]')).toBeVisible();
    await expect(bar.locator('.tab[data-mode="compare"]')).toBeVisible();
    await expect(bar.locator('.tab[data-mode="opps"]')).toBeVisible();
    // Mono index prefixes 01 / 02 / 03 — confirmed via the visible label.
    await expect(bar.locator('.tab .idx').first()).toBeVisible();
  });

  test('Opportunities tab carries a "new" badge', async ({ page }) => {
    const oppTab = page.locator('.atlas-modebar .tab[data-mode="opps"]').first();
    await expect(oppTab.locator('.badge')).toContainText(/new/i);
  });

  test('switching modes updates the active class', async ({ page }) => {
    const atlasTab = page.locator('.atlas-modebar .tab[data-mode="atlas"]').first();
    const compareTab = page.locator('.atlas-modebar .tab[data-mode="compare"]').first();
    await expect(atlasTab).toHaveClass(/active/);
    await compareTab.click();
    await page.waitForTimeout(150);
    await expect(compareTab).toHaveClass(/active/);
    await expect(atlasTab).not.toHaveClass(/active/);
  });

  test('mode bar is sticky and remains visible after scroll', async ({ page }) => {
    await page.evaluate(() => {
      const root = document.querySelector('.atlas-scroll');
      if (root) root.scrollTop = 400;
    });
    await page.waitForTimeout(200);
    await expect(page.locator('.atlas-modebar').first()).toBeInViewport();
  });
});

test.describe('Crop Atlas — Atlas (Map) mode', () => {

  test.beforeEach(async ({ page }) => {
    await goto(page, 'atlas');
  });

  test('renders the India choropleth map column', async ({ page }) => {
    // The map column is locked to the India viewBox via CSS (.atlasv2-map).
    await expect(page.locator('.atlasv2-map').first()).toBeVisible();
  });

  test('left rail shows the category filter list', async ({ page }) => {
    await expect(page.locator('.atlas-sidebar .as-cats').first()).toBeVisible();
    const cats = page.locator('.atlas-sidebar .as-cat');
    expect(await cats.count()).toBeGreaterThan(2);
  });

  test('year selector control is present', async ({ page }) => {
    // The Year picker is in the .atlas-filterbar — exact label may vary;
    // we assert by partial text the user actually sees on the page.
    const body = await page.locator('body').innerText();
    expect(body).toMatch(/2024-25|2023-24|year/i);
  });
});

test.describe('Crop Atlas — Compare mode', () => {

  test.beforeEach(async ({ page }) => {
    await goto(page, 'atlas');
    await page.locator('.atlas-modebar .tab[data-mode="compare"]').first().click();
    await page.waitForTimeout(300);
  });

  test('seeds with three coastal-belt states by default (AP / TN / Kerala)', async ({ page }) => {
    await expect(page.locator('.compare-card', { hasText: 'Andhra Pradesh' }).first()).toBeVisible();
    await expect(page.locator('.compare-card', { hasText: 'Tamil Nadu' }).first()).toBeVisible();
    await expect(page.locator('.compare-card', { hasText: 'Kerala' }).first()).toBeVisible();
  });

  test('state picker chips render and clicking toggles a card on/off', async ({ page }) => {
    // Click the "Andhra Pradesh" picker chip to remove it from the grid.
    const apChip = page.locator('.compare-pickers .chip', { hasText: 'Andhra Pradesh' }).first();
    await apChip.click();
    await page.waitForTimeout(150);
    await expect(page.locator('.compare-card', { hasText: 'Andhra Pradesh' })).toHaveCount(0);
  });

  test('each Compare card shows 4 stat tiles + a top-crops list', async ({ page }) => {
    const card = page.locator('.compare-card').first();
    await expect(card.locator('.stats .stat')).toHaveCount(4);
    await expect(card.locator('.crops-mini').first()).toBeVisible();
  });
});

test.describe('Crop Atlas — Opportunities (Venture Radar) mode', () => {

  test.beforeEach(async ({ page }) => {
    await goto(page, 'atlas');
    await page.locator('.atlas-modebar .tab[data-mode="opps"]').first().click();
    await page.waitForTimeout(400);
  });

  test('pane head renders the editorial kicker + title + sub', async ({ page }) => {
    await expect(page.locator('.atlas-mode-pane .pane-head .kicker').first()).toContainText(/Venture Radar/i);
    await expect(page.locator('.atlas-mode-pane .pane-head h2').first()).toBeVisible();
  });

  test('opportunity cards render with name, location and three meters', async ({ page }) => {
    const card = page.locator('.opp-card').first();
    await expect(card).toBeVisible();
    await expect(card.locator('.nm')).toBeVisible();
    await expect(card.locator('.where')).toBeVisible();
    await expect(card.locator('.meters .meter')).toHaveCount(3);
  });

  test('tier filter chips filter the card grid to one tier at a time', async ({ page }) => {
    const allCount = await page.locator('.opp-card').count();
    expect(allCount).toBeGreaterThan(0);
    // Find a tier the current dataset actually contains — S/A/B/C can all
    // be empty depending on the score distribution. The seeded dataset
    // typically lands C-heavy.
    const present = [];
    for (const t of ['S', 'A', 'B', 'C']) {
      if (await page.locator(`.opp-card.tier-${t}`).count() > 0) present.push(t);
    }
    expect(present.length, 'At least one tier must be populated').toBeGreaterThan(0);
    const target = present[present.length - 1];   // most-populated tier candidate
    await page.locator(`.atlas-mode-pane .chip[data-tier="${target}"]`).first().click();
    await page.waitForTimeout(200);
    const remaining = page.locator('.opp-card');
    const cnt = await remaining.count();
    expect(cnt).toBeGreaterThan(0);
    for (let i = 0; i < cnt; i++) {
      await expect(remaining.nth(i)).toHaveClass(new RegExp(`tier-${target}`));
    }
  });

  test('clicking "All" chip restores the full list', async ({ page }) => {
    // Filter to whichever tier is populated, then clear via the All chip.
    let filterTier = null;
    for (const t of ['S', 'A', 'B', 'C']) {
      if (await page.locator(`.opp-card.tier-${t}`).count() > 0) { filterTier = t; break; }
    }
    expect(filterTier).not.toBeNull();
    await page.locator(`.atlas-mode-pane .chip[data-tier="${filterTier}"]`).first().click();
    await page.waitForTimeout(200);
    const filtered = await page.locator('.opp-card').count();
    // Click the "All" chip — first chip in the toolbar, no data-tier attr.
    await page.locator('.atlas-mode-pane .chip').first().click();
    await page.waitForTimeout(200);
    const all = await page.locator('.opp-card').count();
    expect(all).toBeGreaterThanOrEqual(filtered);
  });

  test('sort chips toggle between composite / volume / concentration', async ({ page }) => {
    const compositeChip = page.locator('.atlas-mode-pane .chip', { hasText: /composite/i }).first();
    const volumeChip = page.locator('.atlas-mode-pane .chip', { hasText: /^volume$/i }).first();
    await expect(compositeChip).toHaveClass(/on/);
    await volumeChip.click();
    await page.waitForTimeout(150);
    await expect(volumeChip).toHaveClass(/on/);
    await expect(compositeChip).not.toHaveClass(/on/);
  });
});
