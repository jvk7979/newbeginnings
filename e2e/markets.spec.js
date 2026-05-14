/**
 * Markets — verifies the Markets page UI shell renders. The e2e harness runs
 * with empty Firestore data, so this covers UI presence; commodity CRUD
 * (add/edit/delete/undo, price entry, sparkline/range math) is trusted via
 * runtime use — same approach as e2e/research-vault.spec.js.
 */
import { test, expect } from '@playwright/test';
import { goto } from './helpers.js';

test("Markets page renders the Today's Mandi title", async ({ page }) => {
  await goto(page, 'markets');
  await expect(page.locator('.page-title').filter({ hasText: "Today's Mandi" }).first()).toBeVisible();
});

test('Markets breadcrumb shows the Markets segment', async ({ page }) => {
  await goto(page, 'markets');
  // Scope to the page body — `text=MARKETS` unscoped also matches the SideNav
  // nav-item <span>s, which are hidden inside the collapsed mobile drawer.
  await expect(page.locator('.page-pad').locator('text=MARKETS').first()).toBeVisible();
});

test('Track button is present', async ({ page }) => {
  await goto(page, 'markets');
  await expect(page.locator('button').filter({ hasText: /Track/ }).first()).toBeVisible();
});

test('empty state renders when no commodities exist', async ({ page }) => {
  // In e2e mode there is no Firestore data, so the empty state shows.
  await goto(page, 'markets');
  await expect(page.locator('text=No commodities tracked yet').first()).toBeVisible();
});

test('Track opens the add-commodity modal', async ({ page }) => {
  await goto(page, 'markets');
  await page.locator('button').filter({ hasText: /Track/ }).first().click();
  await page.waitForTimeout(200);
  await expect(page.locator('text=Track a Commodity').first()).toBeVisible();
});

test('#/commodity-detail with no id renders Not Found', async ({ page }) => {
  await goto(page, 'commodity-detail');
  await expect(page.locator('text=/not found/i').first()).toBeVisible();
});
