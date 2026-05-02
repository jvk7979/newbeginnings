/**
 * Navigation tests — sidebar on web/iPad, topbar on mobile,
 * and hash-routing to every page works correctly.
 */
import { test, expect } from '@playwright/test';
import { goto } from './helpers.js';

test('sidebar is visible on web and iPad', async ({ page, viewport }) => {
  if (viewport.width < 769) test.skip();
  await goto(page, 'dashboard');
  await expect(page.locator('[class*="sidenav"]').first()).toBeVisible();
});

test('mobile topbar is visible on mobile', async ({ page, viewport }) => {
  if (viewport.width >= 769) test.skip();
  await goto(page, 'dashboard');
  // hamburger button or topbar wrapper
  await expect(page.locator('.sidenav-topbar, [class*="topbar"]').first()).toBeVisible();
});

test('About is last nav item after Calculations', async ({ page, viewport }) => {
  if (viewport.width < 769) test.skip();
  await goto(page, 'dashboard');
  const navItems = await page.locator('[class*="sidenav"] a, [class*="sidenav"] button')
    .filter({ hasText: /Home|Ideas|Plans|Documents|Calculations|About/ })
    .allInnerTexts();
  const clean = navItems.map(t => t.trim()).filter(Boolean);
  const calcIdx = clean.findIndex(t => t.includes('Calculations'));
  const aboutIdx = clean.findIndex(t => t.includes('About'));
  expect(calcIdx).toBeGreaterThan(-1);
  expect(aboutIdx).toBeGreaterThan(calcIdx);
});

const NAV_PAGES = ['dashboard', 'ideas', 'plans', 'documents', 'calculations', 'about'];

for (const hash of NAV_PAGES) {
  test(`hash routing to #/${hash} renders content`, async ({ page }) => {
    await goto(page, hash);
    // Page should not show the sign-in screen
    await expect(page.locator('text=Continue with Google')).not.toBeVisible();
    // Page should show *something* meaningful (not blank)
    const body = await page.locator('body').innerText();
    expect(body.length).toBeGreaterThan(50);
  });
}
