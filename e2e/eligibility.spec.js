/**
 * Calculations eligibility toggle — verifies the New Project form has an
 * "Eligible for Calculations" checkbox that defaults to unchecked.
 *
 * Persistence (the toggle survives a save/reload) requires Firestore
 * writes that the e2e bypass intentionally skips, so we only assert UI
 * presence + default state here.
 */
import { test, expect } from '@playwright/test';
import { goto } from './helpers.js';

test('New Project form has Eligible for Calculations checkbox', async ({ page }) => {
  await goto(page, 'new-project');
  await expect(
    page.locator('label').filter({ hasText: 'Eligible for Calculations' }).first()
  ).toBeVisible();
});

test('Eligible for Calculations defaults to unchecked', async ({ page }) => {
  await goto(page, 'new-project');
  // Find the checkbox inside the label whose text contains the toggle name.
  const checked = await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('label'));
    const target = labels.find(l => l.textContent.includes('Eligible for Calculations'));
    if (!target) return null;
    const cb = target.querySelector('input[type="checkbox"]');
    return cb ? cb.checked : null;
  });
  expect(checked).toBe(false);
});

test('Toggling the checkbox flips its state', async ({ page }) => {
  await goto(page, 'new-project');
  // Click the checkbox (via the label) and verify the state flips.
  await page.locator('label').filter({ hasText: 'Eligible for Calculations' }).first().click();
  await page.waitForTimeout(150);
  const checked = await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('label'));
    const target = labels.find(l => l.textContent.includes('Eligible for Calculations'));
    return target?.querySelector('input[type="checkbox"]')?.checked ?? null;
  });
  expect(checked).toBe(true);
});
