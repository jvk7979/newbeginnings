/**
 * Plans page tests — search, status/category filter chips, empty state, new plan form.
 */
import { test, expect } from '@playwright/test';
import { goto } from './helpers.js';

test.beforeEach(async ({ page }) => {
  await goto(page, 'plans');
});

test('page title is Business Plans', async ({ page }) => {
  await expect(page.locator('text=Business Plans').first()).toBeVisible();
});

test('search input is visible', async ({ page }) => {
  await expect(page.locator('input[placeholder*="Search"]').first()).toBeVisible();
});

test('status filter chips render with correct labels', async ({ page }) => {
  for (const label of ['All', 'Draft', 'Active', 'In Review', 'Completed', 'Archived']) {
    await expect(
      page.locator('button').filter({ hasText: new RegExp(`^${label}`) }).first()
    ).toBeVisible();
  }
});

test('category chips render', async ({ page }) => {
  await expect(
    page.locator('button').filter({ hasText: /^Business$/ }).first()
  ).toBeVisible();
});

test('Compare button is present', async ({ page }) => {
  await expect(page.locator('button').filter({ hasText: 'Compare' }).first()).toBeVisible();
});

test('New Plan button is present', async ({ page }) => {
  await expect(page.locator('button').filter({ hasText: /New Plan/ }).first()).toBeVisible();
});

test('empty state renders when no plans exist', async ({ page }) => {
  await expect(page.locator('text=No business plans').first()).toBeVisible();
});

test('New Plan page — form renders', async ({ page }) => {
  await goto(page, 'new-plan');
  // Title input (not the hidden file input)
  await expect(page.locator('input:not([type="file"])').first()).toBeVisible();
});

test('status chip click updates active state', async ({ page }) => {
  const draftChip = page.locator('button').filter({ hasText: /^Draft/ }).first();
  await draftChip.click();
  await page.waitForTimeout(200);
  const bg = await draftChip.evaluate(el => window.getComputedStyle(el).backgroundColor);
  expect(bg).not.toBe('rgba(0, 0, 0, 0)');
});
