/**
 * Calculations UI polish (Step 5b) — verifies the empty-state copy
 * mentions the eligibility flow that drives the Step 4/5 architecture.
 * Header card / live output / sticky-note section cards / Save+Reset
 * buttons / autosave pill all live behind the eligibility gate so they
 * aren't reachable from the e2e bypass; manual verification covers
 * those interactions against real data.
 */
import { test, expect } from '@playwright/test';
import { goto } from './helpers.js';

test.beforeEach(async ({ page }) => {
  await goto(page, 'calculations');
});

test('empty state references the Eligible for Calculations toggle', async ({ page }) => {
  const body = await page.locator('body').innerText();
  expect(body).toContain('Eligible for Calculations');
});

test('empty state CTA navigates to the Projects page', async ({ page }) => {
  await page.locator('button').filter({ hasText: 'Go to Projects' }).first().click();
  await page.waitForTimeout(400);
  const hash = await page.evaluate(() => window.location.hash);
  expect(hash).toContain('projects');
});

test('module evaluates without runtime error', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.waitForTimeout(400);
  expect(errors.filter(e => !e.includes('ResizeObserver'))).toHaveLength(0);
});
