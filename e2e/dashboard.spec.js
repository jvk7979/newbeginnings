/**
 * Dashboard tests — heritage redesign: hero, three-column body, closing banner.
 */
import { test, expect } from '@playwright/test';
import { goto } from './helpers.js';

test.beforeEach(async ({ page }) => {
  await goto(page, 'dashboard');
});

test('hero section renders', async ({ page }) => {
  await expect(page.locator('.dh-hero').first()).toBeVisible();
  await expect(page.locator('.dh-hero-title').filter({ hasText: 'A fresh start.' })).toBeVisible();
});

test('hero CTA buttons are present', async ({ page }) => {
  await expect(page.locator('.dh-hero button').filter({ hasText: 'New Idea' }).first()).toBeVisible();
  await expect(page.locator('.dh-hero button').filter({ hasText: 'Explore Ideas' }).first()).toBeVisible();
});

test('KPI strip renders below the hero with three count tiles', async ({ page }) => {
  await expect(page.locator('.dh-kpi-strip').first()).toBeVisible();
  const tiles = page.locator('.dh-kpi-tile');
  await expect(tiles).toHaveCount(3);
  await expect(page.locator('.dh-kpi-label').filter({ hasText: /Total Ideas/i })).toBeVisible();
  await expect(page.locator('.dh-kpi-label').filter({ hasText: /Active Projects/i })).toBeVisible();
  await expect(page.locator('.dh-kpi-label').filter({ hasText: /In Calculation/i })).toBeVisible();
  // Strip must NOT overlap the hero — its top must sit at or below the hero's bottom.
  const heroBox = await page.locator('.dh-hero').first().boundingBox();
  const stripBox = await page.locator('.dh-kpi-strip').first().boundingBox();
  expect(stripBox.y).toBeGreaterThanOrEqual(heroBox.y + heroBox.height - 1);
});

test('page does not overflow horizontally', async ({ page }) => {
  const overflows = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(overflows).toBe(false);
});

test('two-column body sections render', async ({ page }) => {
  await expect(page.locator('.dh-section-title').filter({ hasText: 'Featured Ideas' })).toBeVisible();
  await expect(page.locator('.dh-section-title').filter({ hasText: 'Active Projects' })).toBeVisible();
});

test('features card renders with the three CTA cards', async ({ page }) => {
  await expect(page.locator('.dh-features').first()).toBeVisible();
  await expect(page.locator('.dh-features-title').filter({ hasText: 'Build your next venture' })).toBeVisible();
  await expect(page.locator('.dh-feature-title').filter({ hasText: 'Explore Ideas' })).toBeVisible();
  await expect(page.locator('.dh-feature-title').filter({ hasText: 'Manage Projects' })).toBeVisible();
  await expect(page.locator('.dh-feature-title').filter({ hasText: 'Run Calculations' })).toBeVisible();
});

test('hero New Idea button navigates to new-idea', async ({ page }) => {
  await page.locator('.dh-hero button').filter({ hasText: /^\+?\s*New Idea$/ }).first().click();
  await page.waitForTimeout(400);
  await expect(page.locator('text=Capture New Idea')).toBeVisible();
});
