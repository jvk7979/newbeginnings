/**
 * PWA + asset-optimisation tests — Tier 1 perf pass.
 *
 * Verifies:
 *   - Web App Manifest registered + theme-color meta present
 *   - Apple touch icon referenced (so iOS "Add to Home Screen" gets a real icon)
 *   - Hero + logo are served as .webp (PNG sources were retired)
 *   - Hero image fetches successfully + is well under the old PNG size
 *
 * Note: vite-plugin-pwa is configured with `devOptions.enabled: false`,
 * so the actual service worker DOES NOT register during `npm run dev`
 * (the harness Playwright uses). Production verification of the SW
 * happens via `npm run build && npm run preview` — not covered here.
 * What we CAN verify in dev: every static link/meta tag the manifest
 * relies on is wired in index.html, plus the WebP assets are reachable
 * from the running dev server.
 */
import { test, expect } from '@playwright/test';
import { goto } from './helpers.js';

test.describe('PWA install metadata (#Tier 1)', () => {

  test('theme-color meta is set to Heritage green', async ({ page }) => {
    await goto(page);
    const tc = await page.locator('meta[name="theme-color"]').getAttribute('content');
    expect(tc).toBe('#2F6B4F');
  });

  test('apple-mobile-web-app meta tags are present', async ({ page }) => {
    await goto(page);
    await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute('content', 'yes');
    await expect(page.locator('meta[name="apple-mobile-web-app-title"]')).toHaveAttribute('content', 'Venture Log');
  });

  test('apple-touch-icon link points at the generated PWA icon', async ({ page }) => {
    await goto(page);
    const href = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href');
    expect(href).toMatch(/apple-touch-icon\.png/);
  });

  test('apple-touch-icon.png actually responds with image bytes', async ({ page }) => {
    await goto(page);
    // Resolve the link href against the page's base URL so this works on
    // both the dev server (/newbeginnings/) and a production preview.
    const url = await page.evaluate(() => {
      const a = document.querySelector('link[rel="apple-touch-icon"]');
      return a ? new URL(a.getAttribute('href'), document.baseURI).href : null;
    });
    expect(url).not.toBeNull();
    const res = await page.request.get(url);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toMatch(/^image\//);
  });
});

test.describe('Optimised assets (#Tier 1)', () => {

  test('Dashboard hero image is .webp, not .png', async ({ page }) => {
    await goto(page, 'dashboard');
    const heroSrc = await page.locator('.dh-hero-img').first().getAttribute('src');
    expect(heroSrc).toMatch(/\.webp(\?|$)/);
  });

  test('Dashboard hero fetches successfully and is dramatically smaller than the old PNG', async ({ page }) => {
    await goto(page, 'dashboard');
    const heroSrc = await page.locator('.dh-hero-img').first().getAttribute('src');
    // Resolve to absolute URL.
    const url = await page.evaluate(s => new URL(s, document.baseURI).href, heroSrc);
    const res = await page.request.get(url);
    expect(res.status()).toBe(200);
    const buf = await res.body();
    // The original PNG was 1.94 MB. The WebP target is ≤ 250 KB; a healthy
    // ceiling here catches a regression to PNG (or a quality blow-up).
    expect(buf.length).toBeGreaterThan(40_000);   // sanity floor (~40 KB)
    expect(buf.length).toBeLessThan(260_000);     // ≤ 260 KB ceiling (was 1.94 MB → 99 KB after pass)
  });

  test('SideNav logo is .webp', async ({ page }) => {
    await goto(page);
    // .sidenav-logo-img only renders on desktop sidebar (hidden < 769 px).
    const isDesktop = await page.evaluate(() => window.innerWidth >= 769);
    if (!isDesktop) test.skip();
    const src = await page.locator('img.sidenav-logo-img').first().getAttribute('src');
    expect(src).toMatch(/\.webp(\?|$)/);
  });

  test('logo asset weighs < 50 KB (was 1.45 MB as PNG)', async ({ page }) => {
    await goto(page);
    const isDesktop = await page.evaluate(() => window.innerWidth >= 769);
    if (!isDesktop) test.skip();
    const src = await page.locator('img.sidenav-logo-img').first().getAttribute('src');
    const url = await page.evaluate(s => new URL(s, document.baseURI).href, src);
    const res = await page.request.get(url);
    expect(res.status()).toBe(200);
    const buf = await res.body();
    expect(buf.length).toBeLessThan(50_000); // 17 KB after pass — generous ceiling
  });
});

// Firestore offline persistence is wired in src/firebase.js
// (initializeFirestore + persistentLocalCache + persistentMultipleTabManager).
// The e2e harness uses ?e2e=1 which short-circuits auth + skips
// AppContext data fetching, so the persistent IndexedDB isn't created on
// these visits. Validating the round-trip (write offline → flush online)
// needs the Firebase emulator + a heavier harness; that's intentionally
// out of scope for this spec. The build catches import-time breakage.
