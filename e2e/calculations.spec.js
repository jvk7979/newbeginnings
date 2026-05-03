/**
 * Calculations page — verifies the redesigned layout (project-driven,
 * one calc per project, empty-state guard rails).
 *
 * In e2e mode the data layer is empty, so the page renders the
 * "no eligible projects" empty state. We assert the page mounts cleanly,
 * shows the empty state, and the CTA navigates to Projects.
 *
 * Tab interactivity, the input rail, and persistence are exercised
 * manually against real Firestore data — the e2e bypass intentionally
 * skips the data layer so they aren't reachable from automated tests.
 */
import { test, expect } from '@playwright/test';
import { goto } from './helpers.js';

test.beforeEach(async ({ page }) => {
  await goto(page, 'calculations');
});

test('page mounts without runtime errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.waitForTimeout(400);
  const real = errors.filter(e => !e.includes('ResizeObserver'));
  expect(real).toHaveLength(0);
});

test('empty state heading is shown when no projects are eligible', async ({ page }) => {
  await expect(
    page.locator('text=No projects ready to calculate').first()
  ).toBeVisible();
});

test('empty state explains how to mark a project eligible', async ({ page }) => {
  // The body text references the toggle by its actual label.
  const body = await page.locator('body').innerText();
  expect(body).toContain('Eligible for Calculations');
});

test('Go to Projects CTA navigates to the projects page', async ({ page }) => {
  await page.locator('button').filter({ hasText: 'Go to Projects' }).first().click();
  await page.waitForTimeout(400);
  const hash = await page.evaluate(() => window.location.hash);
  expect(hash).toContain('projects');
});

test('no horizontal overflow on the empty-state page', async ({ page }) => {
  const overflow = await page.evaluate(
    () => document.body.scrollWidth > window.innerWidth + 4
  );
  expect(overflow).toBe(false);
});
