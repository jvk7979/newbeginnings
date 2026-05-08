// One-shot image optimisation pass for src/assets/.
// Hero photo + logo both ship as oversized PNGs that dominate first paint.
// This script writes WebP variants alongside the originals so we can flip
// the imports without losing the source PNGs in case we ever need to
// re-encode at a different quality. Run via:
//   node scripts/optimize-images.mjs
//
// Targets (informed by actual rendered sizes in the app):
//   hero_gpdavari1.png  →  hero_gpdavari1.webp  (max-width 1916, q 78)
//   logo.png            →  logo.webp            (max-width 600,  q 90)

import sharp from 'sharp';
import { readFileSync, writeFileSync, statSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS = resolve(__dirname, '..', 'src', 'assets');

const TARGETS = [
  // The Dashboard hero is rendered up to ~1440 px wide. 1916 px keeps a
  // little headroom for retina without re-encoding the source resolution.
  { src: 'hero_gpdavari1.png', dst: 'hero_gpdavari1.webp', maxWidth: 1916, quality: 78 },
  // The logo is rendered at most clamp(200px, 45vw, 380px) on AboutPage,
  // 200 px in the spinner, 36 px in the side-nav. 600 px max width covers
  // every site (incl. high-DPR) at a fraction of the source 2172 px width.
  { src: 'logo.png',           dst: 'logo.webp',           maxWidth: 600,  quality: 90 },
];

const fmtKB = (b) => (b / 1024).toFixed(1) + ' KB';

for (const { src, dst, maxWidth, quality } of TARGETS) {
  const input  = resolve(ASSETS, src);
  const output = resolve(ASSETS, dst);
  const beforeSize = statSync(input).size;

  await sharp(input)
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality, effort: 6 })
    .toFile(output);

  const afterSize = statSync(output).size;
  const reduction = ((1 - afterSize / beforeSize) * 100).toFixed(1);
  console.log(`${src} (${fmtKB(beforeSize)})  →  ${dst} (${fmtKB(afterSize)})  −${reduction}%`);
}
