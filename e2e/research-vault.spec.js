/**
 * Research Vault — verifies the vault page UI shell renders. The e2e harness
 * runs with empty Firestore data, so this covers UI presence; clip CRUD
 * (add/edit/delete/undo, click behaviour, week grouping, viewer permissions)
 * is trusted via runtime use — same approach as e2e/linking.spec.js.
 */
import { test, expect } from '@playwright/test';
import { goto } from './helpers.js';

test('vault page renders the Research Log title', async ({ page }) => {
  await goto(page, 'research/1');
  await expect(page.locator('.page-title').filter({ hasText: 'Research Log' }).first()).toBeVisible();
});

test('New Clip button is present', async ({ page }) => {
  await goto(page, 'research/1');
  await expect(page.locator('button').filter({ hasText: /New Clip/ }).first()).toBeVisible();
});

test('breadcrumb shows the Research segment', async ({ page }) => {
  await goto(page, 'research/1');
  await expect(page.locator('text=RESEARCH').first()).toBeVisible();
});

test('type filter chips render with correct labels', async ({ page }) => {
  await goto(page, 'research/1');
  for (const label of ['All', 'Web', 'PDF', 'Quote', 'Photo']) {
    await expect(
      page.locator('button').filter({ hasText: new RegExp(`^${label}$`) }).first()
    ).toBeVisible();
  }
});

test('search input is present', async ({ page }) => {
  await goto(page, 'research/1');
  await expect(page.locator('input[placeholder*="Search"]').first()).toBeVisible();
});

test('empty state renders when no clips exist', async ({ page }) => {
  // In e2e mode there is no Firestore data, so the empty state shows.
  await goto(page, 'research/1');
  await expect(page.locator('text=No clips yet').first()).toBeVisible();
});

test('view toggle switches the active view', async ({ page }) => {
  await goto(page, 'research/1');
  const timelineBtn = page.locator('button[aria-pressed]').filter({ hasText: /^timeline$/i }).first();
  await timelineBtn.click();
  await page.waitForTimeout(150);
  await expect(timelineBtn).toHaveAttribute('aria-pressed', 'true');
});

test('New Clip opens the add-clip modal with the type picker', async ({ page }) => {
  await goto(page, 'research/1');
  await page.locator('button').filter({ hasText: /New Clip/ }).first().click();
  await page.waitForTimeout(200);
  await expect(page.locator('text=Choose a clip type').first()).toBeVisible();
});

test('#/research with no id renders Not Found', async ({ page }) => {
  await goto(page, 'research');
  await expect(page.locator('text=/not found/i').first()).toBeVisible();
});
