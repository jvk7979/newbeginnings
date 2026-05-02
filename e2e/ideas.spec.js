/**
 * Ideas page tests — search, status filter chips, empty state, new idea form.
 */
import { test, expect } from '@playwright/test';
import { goto } from './helpers.js';

test.beforeEach(async ({ page }) => {
  await goto(page, 'ideas');
});

test('search input is visible', async ({ page }) => {
  await expect(page.locator('input[placeholder*="Search"]').first()).toBeVisible();
});

test('"All" filter chip is always rendered', async ({ page }) => {
  // Ideas chips are data-conditional: only "All" is guaranteed in e2e (empty-data) mode
  await expect(
    page.locator('button').filter({ hasText: /^All/ }).first()
  ).toBeVisible();
});

test('All filter chip is active by default', async ({ page }) => {
  const allChip = page.locator('button').filter({ hasText: /^All/ }).first();
  const bg = await allChip.evaluate(el => window.getComputedStyle(el).backgroundColor);
  // Should not be transparent when active
  expect(bg).not.toBe('rgba(0, 0, 0, 0)');
});

test('"All" chip remains active after click', async ({ page }) => {
  // In e2e mode only "All" chip is present (other chips are data-conditional)
  const allChip = page.locator('button').filter({ hasText: /^All/ }).first();
  await allChip.click();
  await page.waitForTimeout(200);
  const bg = await allChip.evaluate(el => window.getComputedStyle(el).backgroundColor);
  expect(bg).not.toBe('rgba(0, 0, 0, 0)');
});

test('empty state renders when no ideas exist', async ({ page }) => {
  // In e2e mode there is no Firestore data, so empty state shows
  await expect(page.locator('text=No ideas').first()).toBeVisible();
});

test('New Idea page — form renders with required fields', async ({ page }) => {
  await goto(page, 'new-idea');
  await expect(page.locator('text=Capture New Idea')).toBeVisible();
  await expect(page.locator('input[placeholder*="idea"]').first()).toBeVisible();
  // Project Cost and Payback fields
  await expect(page.locator('text=Project Cost Est.')).toBeVisible();
  await expect(page.locator('text=Estimated Payback')).toBeVisible();
});

test('New Idea page — Back to Ideas link works', async ({ page }) => {
  await goto(page, 'new-idea');
  await page.locator('text=Back to Ideas').click();
  await page.waitForTimeout(400);
  await expect(page.locator('input[placeholder*="Search"]').first()).toBeVisible();
});
