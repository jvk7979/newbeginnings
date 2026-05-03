/**
 * About page — verifies the rewritten first-person layout: hero, "Why I
 * built this", Mission, "How I use this site" walkthrough, page-by-page
 * cards, region cards, and activity heatmap.
 */
import { test, expect } from '@playwright/test';
import { goto } from './helpers.js';

test.beforeEach(async ({ page }) => {
  await goto(page, 'about');
});

test('page mounts without runtime errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.waitForTimeout(400);
  const real = errors.filter(e => !e.includes('ResizeObserver'));
  expect(real).toHaveLength(0);
});

test('hero tagline is present', async ({ page }) => {
  await expect(page.locator('text=A fresh start. Endless possibilities.').first()).toBeVisible();
});

test('"Why I built this" section is present', async ({ page }) => {
  await expect(page.locator('text=Why I built this').first()).toBeVisible();
});

test('Mission card is present', async ({ page }) => {
  // Mission heading is uppercase via CSS, source casing is "Mission".
  await expect(page.locator('text=Mission').first()).toBeVisible();
});

test('"How I use this site" walkthrough renders', async ({ page }) => {
  await expect(page.locator('text=How I use this site').first()).toBeVisible();
  // Workflow step keywords from the numbered list.
  const body = await page.locator('body').innerText();
  expect(body).toContain('Capture an idea');
  expect(body).toContain('Promote it to a project');
});

test('page-by-page guide lists all 5 pages', async ({ page }) => {
  await expect(page.locator('text=Page by page').first()).toBeVisible();
  const body = await page.locator('body').innerText();
  for (const title of ['Home', 'Ideas', 'Projects', 'Calculations', 'Documents']) {
    expect(body).toContain(title);
  }
});

test('Region focus section is present', async ({ page }) => {
  await expect(page.locator('text=Region focus').first()).toBeVisible();
  const body = await page.locator('body').innerText();
  expect(body).toContain('Rajahmundry');
  expect(body).toContain('Konaseema');
});

test('clicking a page-by-page card navigates to that page', async ({ page }) => {
  // Click the Calculations card — the button has aria-label "Open Calculations".
  await page.locator('button[aria-label="Open Calculations"]').first().click();
  await page.waitForTimeout(400);
  const hash = await page.evaluate(() => window.location.hash);
  expect(hash).toContain('calculations');
});
