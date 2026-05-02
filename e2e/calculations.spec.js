/**
 * Calculations page tests — panel layout, widths, hints, and responsiveness.
 */
import { test, expect } from '@playwright/test';
import { goto } from './helpers.js';

test.beforeEach(async ({ page }) => {
  await goto(page, 'calculations');
});

test('both panels are visible', async ({ page }) => {
  await expect(page.locator('.calc-left').first()).toBeVisible();
  await expect(page.locator('.calc-right').first()).toBeVisible();
});

test('topbar KPIs are visible', async ({ page }) => {
  // Topbar shows metric labels — check for at least two KPI labels
  const topbar = page.locator('.calc-topbar').first();
  await expect(topbar).toBeVisible();
  const text = await topbar.innerText();
  // Should contain at least two of these metric names
  const metrics = ['REVENUE', 'EBITDA', 'IRR', 'PAYBACK'];
  const found = metrics.filter(m => text.toUpperCase().includes(m));
  expect(found.length).toBeGreaterThanOrEqual(2);
});

test('left panel width is correct per viewport', async ({ page, viewport }) => {
  const dims = await page.evaluate(() => {
    const left  = document.querySelector('.calc-left');
    const right = document.querySelector('.calc-right');
    if (!left || !right) return null;
    return {
      leftW:  left.offsetWidth,
      rightW: right.offsetWidth,
      total:  left.offsetWidth + right.offsetWidth,
    };
  });

  expect(dims).not.toBeNull();
  const pct = dims.leftW / dims.total;

  if (viewport.width >= 1400) {
    // Web: ~65%
    expect(pct).toBeGreaterThanOrEqual(0.60);
    expect(pct).toBeLessThanOrEqual(0.75);
  } else if (viewport.width >= 769) {
    // iPad: ~60%
    expect(pct).toBeGreaterThanOrEqual(0.55);
    expect(pct).toBeLessThanOrEqual(0.70);
  } else {
    // Mobile: stacked, left panel is full viewport width
    expect(dims.leftW).toBe(viewport.width);
  }
});

test('panels stack vertically on mobile', async ({ page, viewport }) => {
  if (viewport.width >= 769) test.skip();
  const panelsDir = await page.locator('.calc-panels').evaluate(
    el => window.getComputedStyle(el).flexDirection
  );
  expect(panelsDir).toBe('column');
});

test('hint text is present under capacity utilisation', async ({ page }) => {
  await expect(page.locator('text=CAPACITY UTILISATION')).toBeVisible();
  const hint = page.locator('text=/Most projects run at/i').first();
  await expect(hint).toBeVisible();
});

test('Product Mix section renders', async ({ page }) => {
  await expect(page.locator('text=PRODUCT MIX')).toBeVisible();
});

test('Costs section renders with Variable and Fixed tabs', async ({ page }) => {
  // Scroll the left panel to bring COSTS into view
  await page.locator('.calc-left').evaluate(el => el.scrollTop += 600);
  await page.waitForTimeout(200);
  const text = await page.locator('.calc-left').innerText();
  expect(text.toUpperCase()).toContain('COST');
  expect(text).toMatch(/Variable|Fixed/i);
});

test('Summary tab is visible on right panel', async ({ page, viewport }) => {
  if (viewport.width < 769) test.skip();
  await expect(page.locator('text=Summary')).toBeVisible();
  await expect(page.locator('text=P&L Breakdown')).toBeVisible();
});

test('no horizontal overflow on calculations page', async ({ page }) => {
  const overflow = await page.evaluate(
    () => document.body.scrollWidth > window.innerWidth + 4
  );
  expect(overflow).toBe(false);
});
