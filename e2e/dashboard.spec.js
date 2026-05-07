/**
 * Dashboard tests — heritage redesign: hero, KPI strip, three-column body.
 */
import { test, expect } from '@playwright/test';
import { goto } from './helpers.js';

test.beforeEach(async ({ page }) => {
  await goto(page, 'dashboard');
});

test('hero section renders', async ({ page }) => {
  await expect(page.locator('.dh-hero').first()).toBeVisible();
  await expect(page.locator('.dh-hero-title').filter({ hasText: 'Welcome back.' })).toBeVisible();
});

test('KPI strip renders all seven tiles', async ({ page }) => {
  await expect(page.locator('.dh-kpi-strip').first()).toBeVisible();
  const tiles = page.locator('.dh-kpi-tile');
  await expect(tiles).toHaveCount(7);
});

test('KPI tiles show portfolio metrics labels', async ({ page }) => {
  await expect(page.locator('.dh-kpi-label').filter({ hasText: /Total Ideas/i })).toBeVisible();
  await expect(page.locator('.dh-kpi-label').filter({ hasText: /Active Projects/i })).toBeVisible();
  await expect(page.locator('.dh-kpi-label').filter({ hasText: /NPV/i })).toBeVisible();
  await expect(page.locator('.dh-kpi-label').filter({ hasText: /Payback/i })).toBeVisible();
});

test('hero CTA buttons are present', async ({ page }) => {
  await expect(page.locator('.dh-hero button').filter({ hasText: 'New Idea' }).first()).toBeVisible();
  await expect(page.locator('.dh-hero button').filter({ hasText: 'New Project' }).first()).toBeVisible();
});

test('three-column body sections render', async ({ page }) => {
  await expect(page.locator('.dh-section-title').filter({ hasText: 'Featured Ideas' })).toBeVisible();
  await expect(page.locator('.dh-section-title').filter({ hasText: 'Active Projects' })).toBeVisible();
  await expect(page.locator('.dh-section-title').filter({ hasText: 'Recent Documents' })).toBeVisible();
});

test('closing tagline banner renders', async ({ page }) => {
  await expect(page.locator('.dh-closing').first()).toBeVisible();
  await expect(page.locator('.dh-closing-script').first()).toBeVisible();
});

test('hero New Idea button navigates to new-idea', async ({ page }) => {
  await page.locator('.dh-hero button').filter({ hasText: 'New Idea' }).first().click();
  await page.waitForTimeout(400);
  await expect(page.locator('text=Capture New Idea')).toBeVisible();
});
