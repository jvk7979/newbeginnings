// Build web-ready GeoJSON for the Crop Atlas from official Survey of India
// shapefiles.
//
// Source files (download once, not committed — see .gitignore) live in
// data-raw/soi/ and are the free "Administrative Boundary" products from
// https://onlinemaps.surveyofindia.gov.in (product OVSF/1M, 1:1M scale):
//   STATE_BOUNDARY.shp     — 40 records (36 states/UTs + 4 internal disputes)
//   DISTRICT_BOUNDARY.shp  — 808 records, carries LGD codes
//
// The shapefiles are projected in Lambert Conformal Conic (metres); the
// Atlas map renderer (src/pages/Atlas/geoHelpers.js) expects WGS84
// degrees, so every layer is reprojected to wgs84 here.
//
// Output (committed — these are app assets):
//   public/atlas/india-states.geojson  — all states/UTs, simplified
//   public/atlas/ap-districts.geojson  — Andhra Pradesh districts only
//                                        (the only state the Atlas drills into)
//
// Run via:  node scripts/build-atlas-geojson.mjs
//   (needs ~4 GB free RAM — DISTRICT_BOUNDARY.shp is 182 MB. If it OOMs,
//    re-run with: node --max-old-space-size=8192 scripts/build-atlas-geojson.mjs)

import mapshaper from 'mapshaper';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, statSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root   = resolve(__dirname, '..');
const RAW    = resolve(root, 'data-raw', 'soi');
const OUT    = resolve(root, 'public', 'atlas');

mkdirSync(OUT, { recursive: true });

const kb = (file) => `${(statSync(file).size / 1024).toFixed(0)} KB`;

// India states/UTs. 3% retention stays crisp at country zoom (~3 km/px)
// while keeping the file light; keep-shapes stops tiny UTs (Lakshadweep,
// Chandigarh, Puducherry) vanishing. Only the STATE name field is kept —
// stateNameOf() resolves it.
const statesOut = resolve(OUT, 'india-states.geojson');
await mapshaper.runCommands([
  `-i "${resolve(RAW, 'STATE_BOUNDARY.shp')}"`,
  '-proj wgs84',
  '-filter-fields STATE',
  '-simplify 3% keep-shapes',
  '-clean',
  `-o "${statesOut}" format=geojson precision=0.001`,
].join(' '));
console.log(`wrote india-states.geojson  (${kb(statesOut)})`);

// Andhra Pradesh districts. Filter to AP first so the reprojection and
// simplification only touch ~26 records, not all 808. LGD codes are kept
// as stable join keys; districtNameOf() resolves the DISTRICT name.
const apOut = resolve(OUT, 'ap-districts.geojson');
await mapshaper.runCommands([
  `-i "${resolve(RAW, 'DISTRICT_BOUNDARY.shp')}"`,
  '-filter \'STATE_UT === "ANDHRA PRADESH"\'',
  '-proj wgs84',
  '-filter-fields DIST_LGD,DISTRICT,STATE_LGD,STATE_UT',
  '-simplify 12% keep-shapes',
  '-clean',
  `-o "${apOut}" format=geojson precision=0.001`,
].join(' '));
console.log(`wrote ap-districts.geojson  (${kb(apOut)})`);
