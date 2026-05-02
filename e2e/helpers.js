/** Navigate to a page using the e2e bypass (skips Firebase auth). */
export async function goto(page, hash = 'dashboard') {
  const current = page.url();
  const alreadyLoaded = current.includes('localhost') && current.includes('e2e=1');

  if (!alreadyLoaded) {
    await page.goto('/?e2e=1');
    await page.waitForTimeout(800);
  }

  if (hash !== 'dashboard') {
    await page.evaluate(h => { window.location.hash = `#/${h}`; }, hash);
    await page.waitForTimeout(500);
  }
}

/** Assert no horizontal scrollbar on the current page. */
export async function expectNoOverflow(page, label) {
  const overflow = await page.evaluate(
    () => document.body.scrollWidth > window.innerWidth + 4
  );
  if (overflow) throw new Error(`Horizontal overflow on: ${label}`);
}

/** Returns the viewport name from the Playwright project. */
export function viewportName(viewport) {
  if (!viewport) return 'unknown';
  if (viewport.width >= 1400) return 'web';
  if (viewport.width >= 900)  return 'ipad';
  return 'mobile';
}
