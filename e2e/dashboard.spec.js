/**
 * Dashboard tests — hero image, stat cards, quick actions, pipeline section.
 */
import { test, expect } from '@playwright/test';
import { goto } from './helpers.js';

test.beforeEach(async ({ page }) => {
  await goto(page, 'dashboard');
});

test('hero section renders', async ({ page }) => {
  await expect(page.locator('.hero-bleed').first()).toBeVisible();
});

test('stat cards are present', async ({ page }) => {
  await expect(page.locator('.stat-grid').first()).toBeVisible();
  const cards = page.locator('button.stat-card');
  await expect(cards).toHaveCount(3);
});

test('stat card click is interactive', async ({ page }) => {
  // In e2e mode data is empty (count=0), so clicking a stat card navigates to its dest page
  // Verify the card is clickable and triggers navigation
  const card = page.locator('button.stat-card').first();
  await card.click();
  await page.waitForTimeout(400);
  // Hash changes away from #/dashboard (navigated to ideas/plans/documents)
  const hash = await page.evaluate(() => window.location.hash);
  expect(hash).not.toBe('#/dashboard');
});

test('quick action buttons are present', async ({ page }) => {
  await expect(page.locator('button').filter({ hasText: '+ New Idea' }).first()).toBeVisible();
  await expect(page.locator('button').filter({ hasText: '+ New Plan' }).first()).toBeVisible();
  await expect(page.locator('button').filter({ hasText: 'Upload Document' }).first()).toBeVisible();
});

test('Ideas Pipeline section renders', async ({ page }) => {
  await expect(page.locator('text=IDEAS PIPELINE')).toBeVisible();
});

test('+ New Idea hero button navigates to new-idea', async ({ page }) => {
  await page.locator('.hero-bleed button').filter({ hasText: '+ New Idea' }).click();
  await page.waitForTimeout(400);
  await expect(page.locator('text=Capture New Idea')).toBeVisible();
});
