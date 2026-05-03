/**
 * Smoke tests — every page loads, renders key elements, and has no
 * horizontal overflow. Run these before every deploy.
 */
import { test, expect } from '@playwright/test';
import { goto, expectNoOverflow } from './helpers.js';

const PAGES = [
  { hash: 'dashboard',    label: 'Dashboard' },
  { hash: 'ideas',        label: 'Ideas' },
  { hash: 'new-idea',     label: 'New Idea' },
  { hash: 'projects',     label: 'Projects' },
  { hash: 'new-project',  label: 'New Project' },
  { hash: 'documents',    label: 'Documents' },
  { hash: 'calculations', label: 'Calculations' },
  { hash: 'about',        label: 'About' },
];

for (const { hash, label } of PAGES) {
  test(`${label} — loads without error or overflow`, async ({ page }) => {
    await goto(page, hash);
    await expectNoOverflow(page, label);

    // No unhandled JS errors
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.waitForTimeout(300);
    expect(errors.filter(e => !e.includes('ResizeObserver'))).toHaveLength(0);
  });
}
