import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// PWA strategy: `generateSW` (Workbox builds the service worker for us).
// We don't run Firebase Cloud Messaging today, so we don't need
// `injectManifest` to layer custom code into the SW. If FCM ever lands
// here, swap to injectManifest and merge the firebase-messaging-sw.js
// into the same worker.
//
// Caching plan:
//   - precacheAndRoute everything Vite emits (JS / CSS / fonts / icons)
//     so a fresh visit while offline still boots the app shell.
//   - StaleWhileRevalidate the Google Fonts stylesheet + woff2 files so
//     the editorial typography still loads on flaky connections.
//   - skipWaiting + clientsClaim so a new deploy takes over immediately
//     instead of waiting for the user to close every tab.

export default defineConfig({
  base: '/newbeginnings/',
  build: {
    rollupOptions: {
      output: {
        // Manual chunk strategy — peel the big, rarely-changing deps off
        // the main app chunk so a CSS / component edit doesn't bust
        // their long-cached entries.
        //
        // The old single 828 KB index.js included every dep + every
        // page's React component. Now:
        //   firebase     — Firestore, Auth, Storage, Functions SDK
        //                  (~250 KB; only changes when we bump the SDK)
        //   react-vendor — React + ReactDOM + scheduler (~135 KB; only
        //                  changes when React itself releases)
        //   dompurify    — XSS sanitiser for clip rendering (~22 KB)
        //
        // We don't try to chunk-split Atlas data or @react-pdf — those
        // already live in their own lazy chunks (per-route lazy imports
        // + the dynamic import inside DPRExportButton).
        manualChunks(id) {
          if (id.includes('node_modules/firebase') ||
              id.includes('node_modules/@firebase')) {
            return 'firebase';
          }
          if (id.includes('node_modules/react-dom') ||
              id.includes('node_modules/scheduler') ||
              id.match(/node_modules\/react\//)) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/dompurify')) {
            return 'dompurify';
          }
        },
      },
    },
    // Keep the chunk-size warning at the default 500 KB. The new chunks
    // (Firebase ~250 KB, react-pdf ~1.4 MB but lazy-loaded) flag here on
    // purpose — re-evaluate any new dep that pushes past it.
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: [
        'favicon.png',
        'apple-touch-icon.png',
      ],
      manifest: {
        name: 'The New Beginnings — Venture Log',
        short_name: 'Venture Log',
        description: 'A field journal for Rajahmundry / Godavari / Konaseema venture ideas, projects, and feasibility plans.',
        theme_color: '#2F6B4F',
        background_color: '#F6F1E7',
        display: 'standalone',
        orientation: 'any',
        scope: '/newbeginnings/',
        start_url: '/newbeginnings/',
        lang: 'en',
        icons: [
          { src: 'pwa-icon-192.png',          sizes: '192x192', type: 'image/png' },
          { src: 'pwa-icon-512.png',          sizes: '512x512', type: 'image/png' },
          { src: 'pwa-icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache every Vite-emitted asset (chunked JS, CSS, fonts, images).
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2,ico,mjs}'],
        // PDF worker is large (~1.4 MB) and not always used; let it fetch
        // on demand instead of bloating the precache install step.
        globIgnores: ['**/pdf.worker.*'],
        // Single-page hash router — every navigation lives at index.html.
        navigateFallback: '/newbeginnings/index.html',
        // Don't intercept hash route changes; the SPA handles them.
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // Google Fonts stylesheet — small, mostly static; SWR keeps
            // the user on the latest version while serving instantly.
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-css' },
          },
          {
            // Google Fonts woff2 files — large, immutable; cache-first
            // wins and never expires until storage pressure evicts.
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-files',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            // PDF worker — fetched lazily; keep what we've fetched so
            // re-opening a PDF offline still works.
            urlPattern: /pdf\.worker\..*\.(?:js|mjs)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pdfjs-worker',
              expiration: { maxEntries: 4, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
        // A new deploy should take over immediately — no "click to update"
        // dance, just refresh-once-and-it's-fixed.
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
      },
      // Don't enable in dev — the SW interferes with HMR and serves stale
      // chunks during a fresh edit. Production build only.
      devOptions: { enabled: false },
    }),
  ],
})
