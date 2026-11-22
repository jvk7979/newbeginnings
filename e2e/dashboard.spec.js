/**
 * Dashboard — the "stream" layout: photo band with greeting, the venture
 * stream (five stages from Ideas to Underway), "Needs your attention",
 * "Recent changes", and the strongest case. In e2e mode there is no
 * Firestore data, so these tests cover the structure and the empty states;
 * the stage / attention / strongest-case logic is unit tested in
 * src/utils/dashboardModel.test.js.
 */
import { test, expect } from '@playwright/test';
import { goto, expectNoOverflow } from './helpers.js';

test.beforeEach(async ({ page }) => {
  await goto(page, 'dashboard');
});

test('photo band shows a time-of-day greeting and the status line', async ({ page }) => {
  await expect(page.locator('.db-band').first()).toBeVisible();
  await expect(page.locator('.db-greet h1')).toHaveText(/^Good (morning|afternoon|evening)/);
  await expect(page.locator('.db-greet p')).toContainText(/Capture your first idea|ventures? on the go/);
});

test('band actions are present', async ({ page }) => {
  await expect(page.locator('.db-actions button').filter({ hasText: 'New idea' })).toBeVisible();
  await expect(page.locator('.db-actions button').filter({ hasText: 'Browse ideas' })).toBeVisible();
});

test('the stream shows all five stages in order', async ({ page }) => {
  const names = page.locator('.db-stage-name');
  await expect(names).toHaveCount(5);
  await expect(names).toHaveText(['Ideas', 'Shortlisted', 'Planning', 'Running numbers', 'Underway']);
  await expect(page.locator('.db-count').first()).toHaveText('0');
});

test('attention and recent-changes columns render their empty states', async ({ page }) => {
  await expect(page.locator('#db-att-title')).toHaveText('Needs your attention');
  await expect(page.locator('#db-recent-title')).toHaveText('Recent changes');
  await expect(page.locator('.db-calm').first()).toBeVisible();
});

test('no strongest-case panel without modelled projects', async ({ page }) => {
  await expect(page.locator('.db-best')).toHaveCount(0);
});

test('page does not overflow horizontally', async ({ page }) => {
  await expectNoOverflow(page, 'dashboard');
});

test('New idea button navigates to the new-idea form', async ({ page }) => {
  await page.locator('.db-actions button').filter({ hasText: 'New idea' }).click();
  await page.waitForTimeout(400);
  await expect(page.locator('text=Capture New Idea')).toBeVisible();
});
