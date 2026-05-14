/**
 * Theme system tests — covers the five-palette set (heritage / aura / prism /
 * citrus / lemon), the Settings picker, persistence to localStorage, legacy
 * id migration, and SideNav per-theme active-state chrome.
 *
 * The Settings picker buttons carry aria-label="Use <Label> theme" so we can
 * locate each one by accessible name. Theme switching is read off
 * `document.documentElement.dataset.theme` and the `nb_theme` localStorage
 * key written by ThemeContext.
 */
import { test, expect } from '@playwright/test';
import { goto } from './helpers.js';

const THEME_LABELS = {
  heritage: 'Heritage',
  aura:     'Aura',
  prism:    'Prism',
  citrus:   'Citrus',
  lemon:    'Lemon',
};
const VIBRANT_THEMES = ['prism', 'citrus', 'lemon'];

test.describe('Theme system — picker + switching + persistence', () => {

  test.beforeEach(async ({ page }) => {
    // Reset to a known state so tests are independent.
    await goto(page);
    await page.evaluate(() => localStorage.removeItem('nb_theme'));
    await page.reload();
    await page.waitForTimeout(800);
  });

  test('default theme is heritage on fresh load', async ({ page }) => {
    const theme = await page.evaluate(() => document.documentElement.dataset.theme);
    expect(theme).toBe('heritage');
  });

  test('Settings picker shows all five theme cards', async ({ page }) => {
    await goto(page, 'settings');
    for (const id of Object.keys(THEME_LABELS)) {
      const label = THEME_LABELS[id];
      await expect(page.getByRole('button', { name: new RegExp(`^Use ${label} theme$`, 'i') }))
        .toBeVisible();
    }
  });

  test('clicking a theme card updates dataset.theme and persists to localStorage', async ({ page }) => {
    await goto(page, 'settings');
    await page.getByRole('button', { name: /^Use Prism theme$/i }).click();
    await page.waitForTimeout(250);

    const theme = await page.evaluate(() => document.documentElement.dataset.theme);
    const stored = await page.evaluate(() => localStorage.getItem('nb_theme'));
    expect(theme).toBe('prism');
    expect(stored).toBe('prism');
  });

  test('theme survives a page reload', async ({ page }) => {
    await goto(page, 'settings');
    await page.getByRole('button', { name: /^Use Citrus theme$/i }).click();
    await page.waitForTimeout(250);

    await page.reload();
    await page.waitForTimeout(800);

    const theme = await page.evaluate(() => document.documentElement.dataset.theme);
    expect(theme).toBe('citrus');
  });

  test('Lemon theme can be selected and is reflected on dataset', async ({ page }) => {
    await goto(page, 'settings');
    await page.getByRole('button', { name: /^Use Lemon theme$/i }).click();
    await page.waitForTimeout(250);
    const theme = await page.evaluate(() => document.documentElement.dataset.theme);
    expect(theme).toBe('lemon');
  });

  test('legacy theme id (forest) silently migrates to heritage on load', async ({ page }) => {
    // Simulate a user who picked Forest in an earlier app version.
    await page.evaluate(() => localStorage.setItem('nb_theme', 'forest'));
    await page.reload();
    await page.waitForTimeout(800);

    const theme = await page.evaluate(() => document.documentElement.dataset.theme);
    const stored = await page.evaluate(() => localStorage.getItem('nb_theme'));
    // ThemeContext.LEGACY_THEME_MAP should normalise forest → heritage and
    // also rewrite the stored value so the migration is one-time.
    expect(theme).toBe('heritage');
    expect(stored).toBe('heritage');
  });

  test('legacy theme id (vellum) silently migrates to heritage', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('nb_theme', 'vellum'));
    await page.reload();
    await page.waitForTimeout(800);
    const theme = await page.evaluate(() => document.documentElement.dataset.theme);
    expect(theme).toBe('heritage');
  });

  test('an unknown theme id falls back to heritage', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('nb_theme', 'completely-bogus'));
    await page.reload();
    await page.waitForTimeout(800);
    const theme = await page.evaluate(() => document.documentElement.dataset.theme);
    expect(theme).toBe('heritage');
  });
});

test.describe('Theme system — every theme renders the dashboard without errors', () => {

  for (const id of Object.keys(THEME_LABELS)) {
    test(`${id} renders dashboard hero + KPI strip without JS errors`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));

      // Pre-set the theme so the very first paint uses it.
      await goto(page);
      await page.evaluate((t) => {
        localStorage.setItem('nb_theme', t);
      }, id);
      await page.reload();
      await page.waitForTimeout(800);

      // The hero photo + KPI strip are the most theme-sensitive surfaces.
      // If the theme overrides break stacking or the photo wash, these go
      // missing or land at impossible coordinates.
      await expect(page.locator('.dh-hero').first()).toBeVisible();
      await expect(page.locator('.dh-kpi-strip').first()).toBeVisible();
      await expect(page.locator('.dh-kpi-tile')).toHaveCount(3);

      // Confirm the active theme actually got applied.
      const applied = await page.evaluate(() => document.documentElement.dataset.theme);
      expect(applied).toBe(id);

      // No render-time exceptions thrown by any theme's atmospheric layer.
      expect(errors.filter(e => !e.includes('ResizeObserver'))).toHaveLength(0);
    });
  }
});

test.describe('SideNav theme identity (#2)', () => {
  // The desktop sidebar collapses into a hamburger drawer below 769 px, so
  // the .sidenav-desktop / .sidenav-item nodes don't render at the mobile
  // viewport. Skip these on mobile — same pattern as navigation.spec.js.
  test.beforeEach(({ viewport }) => {
    if (viewport && viewport.width < 769) test.skip();
  });

  test('active nav item carries .sidenav-item class with aria-current=page', async ({ page }) => {
    await goto(page, 'ideas');
    const active = page.locator('.sidenav-item[aria-current="page"]').first();
    await expect(active).toBeVisible();
  });

  test('all main nav buttons have .sidenav-item class', async ({ page }) => {
    await goto(page);
    // 8 items in NAV_ITEMS (Home, Ideas, Projects, Markets, Calculations,
    // Scenarios, Settings, About). Admin-only Access button is conditional.
    const count = await page.locator('.sidenav-desktop .sidenav-item').count();
    expect(count).toBeGreaterThanOrEqual(8);
  });

  for (const id of VIBRANT_THEMES) {
    test(`${id} active nav item paints with a gradient background`, async ({ page }) => {
      await goto(page);
      await page.evaluate((t) => localStorage.setItem('nb_theme', t), id);
      await page.reload();
      await page.waitForTimeout(800);

      // Navigate somewhere so an active item exists in the sidebar.
      await page.evaluate(() => { window.location.hash = '#/ideas'; });
      await page.waitForTimeout(400);

      // Per-theme override paints a linear-gradient on the active item.
      // computed-style backgroundImage is where CSS gradients show up.
      const bgImage = await page.locator('.sidenav-desktop .sidenav-item[aria-current="page"]').first()
        .evaluate(el => window.getComputedStyle(el).backgroundImage);
      expect(bgImage).toContain('gradient');
    });
  }

  test('Heritage active nav item uses a flat accent-bg (no gradient)', async ({ page }) => {
    // Heritage stays on the inline default styling — the per-theme override
    // section in styles.css intentionally skips heritage to preserve it.
    await goto(page);
    await page.evaluate(() => localStorage.removeItem('nb_theme'));
    await page.reload();
    await page.waitForTimeout(800);
    await page.evaluate(() => { window.location.hash = '#/ideas'; });
    await page.waitForTimeout(400);

    const bgImage = await page.locator('.sidenav-desktop .sidenav-item[aria-current="page"]').first()
      .evaluate(el => window.getComputedStyle(el).backgroundImage);
    expect(bgImage).not.toContain('gradient');
  });
});
