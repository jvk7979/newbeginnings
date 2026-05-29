import { defineConfig } from 'vitest/config';

// Vitest configuration — limits the test surface to `src/**/*.test.{js,jsx}`
// so the Playwright e2e specs (which use a totally different `test()` API
// from `@playwright/test`) are NOT picked up. Without this, Vitest tries
// to load every e2e/*.spec.js and crashes on `test.describe` because the
// Playwright import-time call hits Vitest's `describe.fn` and explodes.
//
// The e2e suite continues to run via `npm run test:e2e` / `:web` / `:ipad`
// / `:mobile` — see package.json.
export default defineConfig({
  test: {
    include: ['src/**/*.test.{js,jsx}'],
    exclude: ['node_modules', 'dist', 'e2e', 'playwright-report', 'test-results'],
    environment: 'node',
  },
});
