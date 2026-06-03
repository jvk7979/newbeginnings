/**
 * UX polish tests — covers the four follow-up items beyond the theme system:
 *   #1 atmospheric propagation across pages (page-pad.page-hero-atmo)
 *   #3 themed empty states (.empty-state + .themed-cta)
 *   #4 form pages polish (.form-input focus halo, .themed-cta save buttons)
 *   #6 page transitions (.page-enter wrapper around the route)
 *
 * Plus the Sign-in atmospheric backdrop, which lives behind the auth gate
 * so it's only checked at the class-presence level (the e2e bypass renders
 * the authenticated app, not SignInPage).
 */
import { test, expect } from '@playwright/test';
import { goto } from './helpers.js';

const ATMO_PAGES = [
  'ideas', 'projects', 'settings', 'about', 'new-idea', 'new-project',
];

test.describe('Page atmospheric layer (#1)', () => {

  for (const hash of ATMO_PAGES) {
    test(`${hash} page-pad carries .page-hero-atmo`, async ({ page }) => {
      await goto(page, hash);
      // Class lives on the page-pad container itself — uses ::before to
      // paint the soft accent halo behind the title.
      const atmo = page.locator('.page-pad.page-hero-atmo').first();
      await expect(atmo).toBeVisible();
    });
  }

  test('atmospheric ::before halo uses --c-accent-rgb (positive opacity background)', async ({ page }) => {
    await goto(page, 'ideas');
    // The ::before pseudo isn't directly inspectable via boundingBox, but
    // its background-image (a radial-gradient) is queryable via
    // getComputedStyle on the pseudo. The container itself stays
    // transparent — the halo only lives on the pseudo.
    const bgImage = await page.locator('.page-pad.page-hero-atmo').first()
      .evaluate(el => window.getComputedStyle(el, '::before').backgroundImage);
    expect(bgImage).toContain('radial-gradient');
  });
});

test.describe('Page transitions (#6)', () => {

  test('every routed page is wrapped in .page-enter', async ({ page }) => {
    await goto(page, 'dashboard');
    await expect(page.locator('.page-enter').first()).toBeVisible();
  });

  test('navigating to a different route still finds .page-enter', async ({ page }) => {
    await goto(page, 'dashboard');
    await page.evaluate(() => { window.location.hash = '#/ideas'; });
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.page-enter').first()).toBeVisible();
    // Confirm we actually landed on Ideas (atmosphere is page-specific).
    await expect(page.locator('.page-pad.page-hero-atmo .page-title').filter({ hasText: /Ideas/ }))
      .toBeVisible();
  });

  test('html scroll-behavior is smooth for anchor-based scroll (e.g. Plan TOC)', async ({ page }) => {
    await goto(page);
    const behavior = await page.evaluate(
      () => window.getComputedStyle(document.documentElement).scrollBehavior
    );
    expect(behavior).toBe('smooth');
  });
});

test.describe('Themed empty states (#3)', () => {

  test('Ideas empty state has the .empty-state-art badge + .themed-cta', async ({ page }) => {
    await goto(page, 'ideas');
    await expect(page.locator('.empty-state-art').first()).toBeVisible();
    await expect(page.locator('.empty-state .themed-cta').filter({ hasText: /Capture an idea/i }))
      .toBeVisible();
  });

  test('Projects empty state has the badge + themed CTA with new copy', async ({ page }) => {
    await goto(page, 'projects');
    await expect(page.locator('.empty-state-art').first()).toBeVisible();
    await expect(page.locator('.empty-state .themed-cta').filter({ hasText: /Create a project/i }))
      .toBeVisible();
  });

  test('empty-state ::before paints a radial accent halo', async ({ page }) => {
    await goto(page, 'ideas');
    const halo = await page.locator('.empty-state').first()
      .evaluate(el => window.getComputedStyle(el, '::before').backgroundImage);
    expect(halo).toContain('radial-gradient');
  });
});

test.describe('Form pages polish (#4)', () => {

  test('NewIdea title input + description textarea use .form-input', async ({ page }) => {
    await goto(page, 'new-idea');
    await expect(page.locator('input.form-input').first()).toBeVisible();
    await expect(page.locator('textarea.form-input').first()).toBeVisible();
  });

  test('NewIdea Save button uses .themed-cta', async ({ page }) => {
    await goto(page, 'new-idea');
    await expect(page.locator('button.themed-cta').filter({ hasText: /Save Idea/i })).toBeVisible();
  });

  test('NewPlan title input + summary textarea use .form-input', async ({ page }) => {
    await goto(page, 'new-project');
    await expect(page.locator('input.form-input').first()).toBeVisible();
    await expect(page.locator('textarea.form-input').first()).toBeVisible();
  });

  test('NewPlan Save button uses .themed-cta', async ({ page }) => {
    await goto(page, 'new-project');
    await expect(page.locator('button.themed-cta').filter({ hasText: /Save Project/i })).toBeVisible();
  });

  test('focusing a .form-input renders an accent halo box-shadow', async ({ page }) => {
    await goto(page, 'new-idea');
    const input = page.locator('input.form-input').first();
    await input.focus();
    await page.waitForTimeout(180);
    const shadow = await input.evaluate(el => window.getComputedStyle(el).boxShadow);
    // Focus halo: 0 0 0 4px rgba(--c-accent-rgb / 0.16). When unfocused
    // the rule doesn't apply so boxShadow is 'none'.
    expect(shadow).not.toBe('none');
    expect(shadow.length).toBeGreaterThan(5);
  });

  test('error state on the title input swaps the border to danger', async ({ page }) => {
    await goto(page, 'new-idea');
    // Click Save without entering a title — triggers the error path which
    // adds .has-error to the title input.
    await page.locator('button.themed-cta').filter({ hasText: /Save Idea/i }).click();
    await page.waitForTimeout(200);
    await expect(page.locator('input.form-input.has-error')).toBeVisible();
    await expect(page.locator('.form-error').filter({ hasText: /required/i })).toBeVisible();
  });

  test('themed-cta save button has a non-empty box-shadow (coloured glow)', async ({ page }) => {
    await goto(page, 'new-idea');
    const cta = page.locator('button.themed-cta').filter({ hasText: /Save Idea/i });
    const shadow = await cta.evaluate(el => window.getComputedStyle(el).boxShadow);
    expect(shadow).not.toBe('none');
  });
});

test.describe('Sign-in atmospheric polish (#7) — class presence', () => {
  // The e2e bypass renders the authenticated app, not SignInPage. We can
  // still confirm the CSS classes are wired up by checking they exist as
  // selectors in the page's stylesheets.

  test('auth atmospheric classes are defined in the loaded stylesheet', async ({ page }) => {
    await goto(page);
    const found = await page.evaluate(() => {
      const target = ['.auth-page-bg', '.auth-left-atmo', '.auth-google-btn'];
      let hit = 0;
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.selectorText && target.some(t => rule.selectorText.includes(t))) {
              hit++;
            }
          }
        } catch { /* cross-origin sheets — ignore */ }
      }
      return hit;
    });
    // Each of the 3 classes has at least one rule (base + hover/focus/active
    // for the button), so the count is >= 3.
    expect(found).toBeGreaterThanOrEqual(3);
  });
});

test.describe('Plan Detail reading view (#5) — CSS infrastructure', () => {
  // Without a real plan in e2e mode we can't render the detail view, but
  // we can confirm the supporting CSS shipped (drop cap selector, TOC
  // class, scroll-margin on section ids).

  test('Plan Detail polish CSS is loaded', async ({ page }) => {
    await goto(page);
    const hits = await page.evaluate(() => {
      const want = [
        '.plan-detail-toc',
        '.plan-detail-layout',
        '.plan-section-summary',
      ];
      const found = new Set();
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (!rule.selectorText) continue;
            for (const w of want) if (rule.selectorText.includes(w)) found.add(w);
          }
        } catch { /* */ }
      }
      return Array.from(found);
    });
    expect(hits).toContain('.plan-detail-toc');
    expect(hits).toContain('.plan-detail-layout');
    expect(hits).toContain('.plan-section-summary');
  });
});
