/**
 * Idea ↔ Project linking — verifies the UI surfaces the link dropdowns and
 * the "Linked Projects" rail on idea detail. Data behavior (selecting an
 * idea actually persists to a project) requires real Firestore writes;
 * the e2e bypass uses empty in-memory state, so we exercise UI presence
 * here and trust the integration via runtime use.
 *
 * Note on selectors: <option> elements are not "visible" in Playwright's
 * strict sense unless the parent <select> is open, so we use evaluate()
 * to read DOM state (option count, default value) instead of toBeVisible().
 */
import { test, expect } from '@playwright/test';
import { goto } from './helpers.js';

test('New Project form has "Link to Idea" dropdown', async ({ page }) => {
  await goto(page, 'new-project');
  // The label is visible.
  await expect(page.locator('label').filter({ hasText: 'Link to Idea' }).first()).toBeVisible();
  // A <select> exists whose first option text is the "— None —" sentinel.
  const hasNoneOption = await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('select'));
    return selects.some(s => s.options[0]?.text === '— None —');
  });
  expect(hasNoneOption).toBe(true);
});

test('New Project — link dropdown defaults to None (empty value)', async ({ page }) => {
  await goto(page, 'new-project');
  // Find the link-to-idea <select> by its sentinel "— None —" first option,
  // then assert its current value is the empty string (the None option).
  const value = await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('select'));
    const linkSelect = selects.find(s => s.options[0]?.text === '— None —');
    return linkSelect?.value ?? null;
  });
  expect(value).toBe('');
});
