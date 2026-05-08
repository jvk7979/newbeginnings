// Generate PWA icons from the logo source. The browser registry expects
// square PNGs at common Android sizes (192, 512) plus a maskable variant
// with safe-area padding for OSes that crop icons into a circle / squircle.
//
// Logo source is naturally wide (text masthead), so we fit it onto a
// cream square that matches the Heritage page background (#F6F1E7) so
// installed-app icons feel on-brand instead of floating in white.
//
// Run via:  node scripts/generate-pwa-icons.mjs

import sharp from 'sharp';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOGO    = resolve(__dirname, '..', 'src', 'assets', 'logo.webp');
const OUT_DIR = resolve(__dirname, '..', 'public');

const HERITAGE_CREAM = { r: 246, g: 241, b: 231, alpha: 1 }; // matches --c-bg0

async function makeIcon({ size, padding, file }) {
  // The masthead is wide; make the inner image fit a generous safe area
  // (1 - padding × 2) of the icon canvas, centred on cream.
  const inner = Math.round(size * (1 - padding * 2));
  const buffer = await sharp(LOGO)
    .resize({ width: inner, fit: 'inside', withoutEnlargement: false })
    .toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: HERITAGE_CREAM },
  })
    .composite([{ input: buffer, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toFile(resolve(OUT_DIR, file));
  console.log(`wrote ${file}  (${size}×${size})`);
}

// Standard Android / Chrome PWA install prompts use these sizes.
await makeIcon({ size: 192, padding: 0.10, file: 'pwa-icon-192.png' });
await makeIcon({ size: 512, padding: 0.10, file: 'pwa-icon-512.png' });
// Maskable variant — Android may crop to a circle/squircle, so push the
// padding higher so the masthead survives the crop.
await makeIcon({ size: 512, padding: 0.20, file: 'pwa-icon-512-maskable.png' });
// Apple touch icon — used by iOS Safari for "Add to Home Screen".
await makeIcon({ size: 180, padding: 0.10, file: 'apple-touch-icon.png' });
