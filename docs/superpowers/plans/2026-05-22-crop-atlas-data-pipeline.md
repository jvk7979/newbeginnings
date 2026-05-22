# Crop Atlas — Data Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce `public/crop-atlas.json` and `public/india-districts.geo.json` — the two static data files the Crop Atlas page will consume — from government APY crop data and an open district-boundary GeoJSON.

**Architecture:** A standalone Node ESM build pipeline under `scripts/crop-atlas/`, separate from the app bundle. Pure, unit-tested helper functions (ID slugs, district-name reconciliation, APY aggregation, atlas assembly) are composed by one orchestrator script that reads the raw downloads and writes the two clean JSON assets. GeoJSON geometry is simplified with mapshaper.

**Tech Stack:** Node 22 ESM, `node:test` for unit tests, `csv-parse` for the APY CSV, `mapshaper` for geometry simplification.

This is **Plan 1 of 2** for the Crop Atlas feature (see `docs/superpowers/specs/2026-05-22-crop-atlas-design.md`). Plan 1 produces the data assets; Plan 2 builds the React page that consumes them.

---

## Prerequisite: manual data download

The build needs two source files the user downloads by hand (Task 1 documents this). They go in `data-raw/` (gitignored). The pipeline cannot run until both exist.

## File Structure

| File | Responsibility |
|---|---|
| `scripts/crop-atlas/README.md` | Where to download the two source files |
| `scripts/crop-atlas/lib/ids.mjs` | `slugify`, `makeDistrictId` — deterministic IDs |
| `scripts/crop-atlas/lib/normalizeDistrict.mjs` | District-name reconciliation between APY and GeoJSON |
| `scripts/crop-atlas/lib/aggregateApy.mjs` | Reduce raw APY rows to per-district per-crop totals for one year |
| `scripts/crop-atlas/lib/assembleCropAtlas.mjs` | Join aggregated data onto GeoJSON district IDs → final atlas object |
| `scripts/crop-atlas/build-crop-atlas.mjs` | Orchestrator — reads raw files, writes outputs |
| `public/crop-atlas.json` | Generated: per-district crop figures |
| `public/india-districts.geo.json` | Generated: simplified district polygons tagged with `districtId` |
| `.gitignore`, `package.json` | Modified: ignore `data-raw/`, add devDeps + `test:unit` script |

Each `lib/*.mjs` has a sibling `*.test.mjs` run by `node:test`.

---

## Task 1: Project setup

**Files:**
- Modify: `.gitignore`
- Modify: `package.json`
- Create: `scripts/crop-atlas/README.md`

- [ ] **Step 1: Ignore the raw-data folder**

Append to `.gitignore`:

```
data-raw/
```

- [ ] **Step 2: Add devDependencies and the unit-test script**

In `package.json`, add to `devDependencies`:

```json
"csv-parse": "^5.5.6",
"mapshaper": "^0.6.95"
```

And add to `scripts`:

```json
"test:unit": "node --test scripts/"
```

- [ ] **Step 3: Install**

Run: `npm install`
Expected: completes with no errors; `node_modules/csv-parse` and `node_modules/mapshaper` exist.

- [ ] **Step 4: Write the download instructions**

Create `scripts/crop-atlas/README.md`:

```markdown
# Crop Atlas — source data

The build script needs two files in `data-raw/` (gitignored). Download both,
then run `node scripts/crop-atlas/build-crop-atlas.mjs` from the repo root.

## 1. APY crop data  →  data-raw/apy.csv

District-wise Area, Production, Yield. Download the CSV from either:
- India Data Portal — https://indiadataportal.com (search "APY")
- data.gov.in — https://data.gov.in/catalog/district-wise-season-wise-crop-production-statistics

Save it as `data-raw/apy.csv`.

## 2. District boundaries  →  data-raw/india-districts.geo.json

India district polygons as GeoJSON in EPSG:4326. Download from either:
- india-geodata — https://github.com/yashveeeeeeer/india-geodata
- DataMeet maps — https://projects.datameet.org/maps/

Save it as `data-raw/india-districts.geo.json`.

## After downloading

Open `scripts/crop-atlas/build-crop-atlas.mjs` and set the CONFIG block
(column names / GeoJSON property names) to match your two files, then run
the build.
```

- [ ] **Step 5: Commit**

```bash
git add .gitignore package.json package-lock.json scripts/crop-atlas/README.md
git commit -m "chore: scaffold crop-atlas build pipeline (deps, gitignore, docs)"
```

---

## Task 2: ID helpers

**Files:**
- Create: `scripts/crop-atlas/lib/ids.mjs`
- Test: `scripts/crop-atlas/lib/ids.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `scripts/crop-atlas/lib/ids.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { slugify, makeDistrictId } from './ids.mjs';

test('slugify lowercases and hyphenates spaces', () => {
  assert.equal(slugify('East Godavari'), 'east-godavari');
});

test('slugify collapses punctuation and ampersands', () => {
  assert.equal(slugify('Andaman & Nicobar Islands'), 'andaman-nicobar-islands');
});

test('slugify trims leading and trailing separators', () => {
  assert.equal(slugify('  (Hyderabad)  '), 'hyderabad');
});

test('makeDistrictId joins state and district with a double underscore', () => {
  assert.equal(makeDistrictId('Andhra Pradesh', 'East Godavari'), 'andhra-pradesh__east-godavari');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test scripts/crop-atlas/lib/ids.test.mjs`
Expected: FAIL — cannot find module `./ids.mjs`.

- [ ] **Step 3: Write the implementation**

Create `scripts/crop-atlas/lib/ids.mjs`:

```js
// Deterministic ID helpers for the crop-atlas build.

// Lowercase, non-alphanumeric runs become single hyphens, no leading or
// trailing hyphen.
export function slugify(str) {
  return String(str ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Stable district id used to join crop data to map geometry.
export function makeDistrictId(state, district) {
  return `${slugify(state)}__${slugify(district)}`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test scripts/crop-atlas/lib/ids.test.mjs`
Expected: PASS — 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/crop-atlas/lib/ids.mjs scripts/crop-atlas/lib/ids.test.mjs
git commit -m "feat: add slugify and makeDistrictId helpers for crop atlas"
```

---

## Task 3: District-name reconciliation

**Files:**
- Create: `scripts/crop-atlas/lib/normalizeDistrict.mjs`
- Test: `scripts/crop-atlas/lib/normalizeDistrict.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `scripts/crop-atlas/lib/normalizeDistrict.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeName, buildNameIndex, resolveDistrict } from './normalizeDistrict.mjs';

test('normalizeName lowercases and strips punctuation', () => {
  assert.equal(normalizeName('East Godavari'), 'east godavari');
  assert.equal(normalizeName('Y.S.R. Kadapa'), 'y s r kadapa');
});

test('normalizeName drops a trailing "district" word', () => {
  assert.equal(normalizeName('Guntur District'), 'guntur');
});

test('resolveDistrict matches on the normalized name', () => {
  const idx = buildNameIndex(['East Godavari', 'Guntur']);
  assert.equal(resolveDistrict('EAST GODAVARI', idx), 'East Godavari');
});

test('resolveDistrict uses an alias before a normalized match', () => {
  const idx = buildNameIndex(['Kadapa']);
  assert.equal(resolveDistrict('Cuddapah', idx, { cuddapah: 'Kadapa' }), 'Kadapa');
});

test('resolveDistrict returns null when nothing matches', () => {
  const idx = buildNameIndex(['Guntur']);
  assert.equal(resolveDistrict('Nonexistent', idx), null);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test scripts/crop-atlas/lib/normalizeDistrict.test.mjs`
Expected: FAIL — cannot find module `./normalizeDistrict.mjs`.

- [ ] **Step 3: Write the implementation**

Create `scripts/crop-atlas/lib/normalizeDistrict.mjs`:

```js
// District-name reconciliation between the APY dataset and the GeoJSON.
// The two disagree on spelling, punctuation, and — for districts renamed
// or created after the GeoJSON was made — on the name itself.

// Canonical comparison key: lowercase, punctuation -> space, drop a
// "district" noise word, collapse spaces. Matches names that differ
// only cosmetically.
export function normalizeName(name) {
  return String(name ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\bdistrict\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Map of normalized name -> the GeoJSON's original district name.
export function buildNameIndex(geoNames) {
  const index = new Map();
  for (const name of geoNames) index.set(normalizeName(name), name);
  return index;
}

// Resolve an APY district name to a GeoJSON district name:
// 1. an explicit alias (keyed by normalized APY name) wins;
// 2. else a normalized exact match;
// 3. else null — the caller records it as unmatched.
export function resolveDistrict(apyName, nameIndex, aliases = {}) {
  const key = normalizeName(apyName);
  if (aliases[key]) return aliases[key];
  return nameIndex.get(key) ?? null;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test scripts/crop-atlas/lib/normalizeDistrict.test.mjs`
Expected: PASS — 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/crop-atlas/lib/normalizeDistrict.mjs scripts/crop-atlas/lib/normalizeDistrict.test.mjs
git commit -m "feat: add district-name reconciliation for crop atlas"
```

---

## Task 4: APY aggregation

**Files:**
- Create: `scripts/crop-atlas/lib/aggregateApy.mjs`
- Test: `scripts/crop-atlas/lib/aggregateApy.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `scripts/crop-atlas/lib/aggregateApy.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { pickLatestYear, aggregateApy } from './aggregateApy.mjs';

const ROWS = [
  { yr: '2020-21', st: 'AP', dt: 'Guntur', cp: 'Rice',    prod: '100', ar: '10' },
  { yr: '2021-22', st: 'AP', dt: 'Guntur', cp: 'Rice',    prod: '120', ar: '12' },
  { yr: '2021-22', st: 'AP', dt: 'Guntur', cp: 'Rice',    prod: '30',  ar: '3'  },
  { yr: '2021-22', st: 'AP', dt: 'Guntur', cp: 'Coconut', prod: '50',  ar: '5'  },
];
const FIELDS = {
  yearField: 'yr', stateField: 'st', districtField: 'dt', cropField: 'cp',
  productionField: 'prod', areaField: 'ar',
};

test('pickLatestYear returns the most recent year string', () => {
  assert.equal(pickLatestYear(ROWS, 'yr'), '2021-22');
});

test('aggregateApy sums seasons within the latest year', () => {
  const { districts } = aggregateApy(ROWS, FIELDS);
  assert.equal(districts.get('AP||Guntur').crops.Rice.production, 150);
  assert.equal(districts.get('AP||Guntur').crops.Rice.area, 15);
});

test('aggregateApy excludes rows from other years', () => {
  const { districts, year } = aggregateApy(ROWS, FIELDS);
  assert.equal(year, '2021-22');
  // the 2020-21 Rice row (prod 100) must not be counted
  assert.equal(districts.get('AP||Guntur').crops.Rice.production, 150);
});

test('aggregateApy keeps multiple crops separate', () => {
  const { districts } = aggregateApy(ROWS, FIELDS);
  assert.equal(districts.get('AP||Guntur').crops.Coconut.production, 50);
});

test('aggregateApy tolerates blank and comma-formatted numbers', () => {
  const rows = [
    { yr: '2021', st: 'AP', dt: 'X', cp: 'Rice', prod: '1,200', ar: '' },
  ];
  const { districts } = aggregateApy(rows, FIELDS);
  assert.equal(districts.get('AP||X').crops.Rice.production, 1200);
  assert.equal(districts.get('AP||X').crops.Rice.area, 0);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test scripts/crop-atlas/lib/aggregateApy.test.mjs`
Expected: FAIL — cannot find module `./aggregateApy.mjs`.

- [ ] **Step 3: Write the implementation**

Create `scripts/crop-atlas/lib/aggregateApy.mjs`:

```js
// Reduce raw APY rows (one row per district x crop x season x year) to
// per-district per-crop totals for a single year.

// APY numbers arrive as strings, sometimes blank or comma-grouped.
function num(v) {
  if (v == null) return 0;
  const n = Number(String(v).replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : 0;
}

// The most recent year present. Year values may be "2021-22" strings or
// plain numbers; compared by their leading 4-digit year.
export function pickLatestYear(rows, yearField) {
  let best = null;
  for (const r of rows) {
    const raw = String(r[yearField] ?? '').trim();
    const lead = parseInt(raw.slice(0, 4), 10);
    if (Number.isFinite(lead) && (best == null || lead > best.lead)) {
      best = { lead, raw };
    }
  }
  return best ? best.raw : null;
}

// Aggregate to Map<"state||district", { state, district, crops }> where
// crops is { [crop]: { production, area } }, summed across seasons for
// the chosen year. Returns { year, districts }.
export function aggregateApy(rows, fields) {
  const { yearField, stateField, districtField, cropField, productionField, areaField } = fields;
  const year = fields.year ?? pickLatestYear(rows, yearField);
  const districts = new Map();
  for (const r of rows) {
    if (String(r[yearField] ?? '').trim() !== year) continue;
    const state = String(r[stateField] ?? '').trim();
    const district = String(r[districtField] ?? '').trim();
    const crop = String(r[cropField] ?? '').trim();
    if (!state || !district || !crop) continue;
    const key = `${state}||${district}`;
    if (!districts.has(key)) districts.set(key, { state, district, crops: {} });
    const entry = districts.get(key);
    if (!entry.crops[crop]) entry.crops[crop] = { production: 0, area: 0 };
    entry.crops[crop].production += num(r[productionField]);
    entry.crops[crop].area += num(r[areaField]);
  }
  return { year, districts };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test scripts/crop-atlas/lib/aggregateApy.test.mjs`
Expected: PASS — 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/crop-atlas/lib/aggregateApy.mjs scripts/crop-atlas/lib/aggregateApy.test.mjs
git commit -m "feat: add APY row aggregation for crop atlas"
```

---

## Task 5: Atlas assembly

**Files:**
- Create: `scripts/crop-atlas/lib/assembleCropAtlas.mjs`
- Test: `scripts/crop-atlas/lib/assembleCropAtlas.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `scripts/crop-atlas/lib/assembleCropAtlas.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildNameIndex } from './normalizeDistrict.mjs';
import { assembleCropAtlas } from './assembleCropAtlas.mjs';

test('assembleCropAtlas joins APY districts onto GeoJSON ids', () => {
  const aggregated = {
    year: '2021-22',
    districts: new Map([
      ['AP||Cuddapah', { state: 'AP', district: 'Cuddapah', crops: { Rice: { production: 10, area: 1 } } }],
    ]),
  };
  const { atlas, unmatched } = assembleCropAtlas(aggregated, {
    nameIndex: buildNameIndex(['Kadapa']),
    geoStateByName: new Map([['Kadapa', 'Andhra Pradesh']]),
    aliases: { cuddapah: 'Kadapa' },
    meta: { year: '2021-22' },
  });
  assert.equal(unmatched.length, 0);
  assert.ok(atlas.districts['andhra-pradesh__kadapa']);
  assert.equal(atlas.districts['andhra-pradesh__kadapa'].crops.Rice.production, 10);
  assert.deepEqual(atlas.crops, ['Rice']);
});

test('assembleCropAtlas records unmatched districts and skips them', () => {
  const aggregated = {
    year: '2021-22',
    districts: new Map([
      ['XX||Nowhere', { state: 'XX', district: 'Nowhere', crops: { Rice: { production: 1, area: 1 } } }],
    ]),
  };
  const { atlas, unmatched } = assembleCropAtlas(aggregated, {
    nameIndex: buildNameIndex(['Guntur']),
    geoStateByName: new Map(),
    aliases: {},
    meta: {},
  });
  assert.equal(unmatched.length, 1);
  assert.equal(Object.keys(atlas.districts).length, 0);
});

test('assembleCropAtlas sums two APY districts that map to one geo district', () => {
  const aggregated = {
    year: '2021-22',
    districts: new Map([
      ['AP||Old A', { state: 'AP', district: 'Old A', crops: { Rice: { production: 4, area: 1 } } }],
      ['AP||Old B', { state: 'AP', district: 'Old B', crops: { Rice: { production: 6, area: 2 } } }],
    ]),
  };
  const { atlas } = assembleCropAtlas(aggregated, {
    nameIndex: buildNameIndex(['Merged']),
    geoStateByName: new Map([['Merged', 'Andhra Pradesh']]),
    aliases: { 'old a': 'Merged', 'old b': 'Merged' },
    meta: {},
  });
  assert.equal(atlas.districts['andhra-pradesh__merged'].crops.Rice.production, 10);
  assert.equal(atlas.districts['andhra-pradesh__merged'].crops.Rice.area, 3);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test scripts/crop-atlas/lib/assembleCropAtlas.test.mjs`
Expected: FAIL — cannot find module `./assembleCropAtlas.mjs`.

- [ ] **Step 3: Write the implementation**

Create `scripts/crop-atlas/lib/assembleCropAtlas.mjs`:

```js
// Final assembly: turn aggregated APY districts into the crop-atlas.json
// shape, resolving each APY district to a GeoJSON district + districtId.

import { makeDistrictId } from './ids.mjs';
import { resolveDistrict } from './normalizeDistrict.mjs';

// aggregated:      { year, districts: Map } from aggregateApy()
// nameIndex:       from buildNameIndex(geo district names)
// geoStateByName:  Map<geoDistrictName, geoStateName> so the id and the
//                  stored state use the GeoJSON's own spelling
// aliases:         normalized-APY-name -> exact GeoJSON district name
// meta:            { source, year, generatedAt }
// Returns { atlas: { meta, crops, districts }, unmatched: string[] }.
export function assembleCropAtlas(aggregated, { nameIndex, geoStateByName, aliases, meta }) {
  const districts = {};
  const cropSet = new Set();
  const unmatched = [];

  for (const entry of aggregated.districts.values()) {
    const geoName = resolveDistrict(entry.district, nameIndex, aliases);
    if (!geoName) {
      unmatched.push(`${entry.state} / ${entry.district}`);
      continue;
    }
    const geoState = geoStateByName.get(geoName) ?? entry.state;
    const id = makeDistrictId(geoState, geoName);
    if (!districts[id]) districts[id] = { district: geoName, state: geoState, crops: {} };
    for (const [crop, v] of Object.entries(entry.crops)) {
      cropSet.add(crop);
      const c = districts[id].crops[crop] ?? { production: 0, area: 0 };
      c.production += v.production;
      c.area += v.area;
      districts[id].crops[crop] = c;
    }
  }

  return {
    atlas: { meta, crops: [...cropSet].sort((a, b) => a.localeCompare(b)), districts },
    unmatched: unmatched.sort(),
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test scripts/crop-atlas/lib/assembleCropAtlas.test.mjs`
Expected: PASS — 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/crop-atlas/lib/assembleCropAtlas.mjs scripts/crop-atlas/lib/assembleCropAtlas.test.mjs
git commit -m "feat: add crop-atlas assembly joining APY data to geo districts"
```

---

## Task 6: Orchestrator script

**Files:**
- Create: `scripts/crop-atlas/build-crop-atlas.mjs`

This task reads the real downloaded files. It has no unit test — it is verified by running it and inspecting its console report. The district-name `ALIASES` table is filled iteratively.

- [ ] **Step 1: Write the orchestrator**

Create `scripts/crop-atlas/build-crop-atlas.mjs`:

```js
// Crop Atlas build orchestrator. Reads the two raw downloads, writes
// public/crop-atlas.json and an intermediate tagged GeoJSON. Run from
// the repo root:  node scripts/crop-atlas/build-crop-atlas.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { parse } from 'csv-parse/sync';
import { buildNameIndex } from './lib/normalizeDistrict.mjs';
import { aggregateApy } from './lib/aggregateApy.mjs';
import { assembleCropAtlas } from './lib/assembleCropAtlas.mjs';
import { makeDistrictId } from './lib/ids.mjs';

// ─── CONFIG — set these to match your downloaded files ────────────────
const APY_CSV   = 'data-raw/apy.csv';
const GEO_JSON  = 'data-raw/india-districts.geo.json';
const OUT_ATLAS = 'public/crop-atlas.json';
const OUT_GEO   = 'data-raw/india-districts.tagged.geo.json';

// Open data-raw/apy.csv, read the header row, set each to the exact
// column name used there.
const FIELDS = {
  yearField:       'Crop_Year',
  stateField:      'State_Name',
  districtField:   'District_Name',
  cropField:       'Crop',
  productionField: 'Production',
  areaField:       'Area',
};

// GeoJSON feature.properties keys holding the district and state names.
const GEO_DISTRICT_PROP = 'district';
const GEO_STATE_PROP    = 'st_nm';

// Filled iteratively: normalized-APY-name -> exact GeoJSON district name.
const ALIASES = {
  // 'cuddapah': 'Kadapa',
};
// ──────────────────────────────────────────────────────────────────────

const apyRows = parse(readFileSync(APY_CSV), { columns: true, skip_empty_lines: true, trim: true });
const geo = JSON.parse(readFileSync(GEO_JSON, 'utf8'));

const geoNames = geo.features.map(f => f.properties[GEO_DISTRICT_PROP]);
const nameIndex = buildNameIndex(geoNames);
const geoStateByName = new Map(
  geo.features.map(f => [f.properties[GEO_DISTRICT_PROP], f.properties[GEO_STATE_PROP]]),
);

const aggregated = aggregateApy(apyRows, FIELDS);
const meta = {
  source: 'data.gov.in APY',
  year: aggregated.year,
  generatedAt: new Date().toISOString().slice(0, 10),
};
const { atlas, unmatched } = assembleCropAtlas(aggregated, { nameIndex, geoStateByName, aliases: ALIASES, meta });

// Tag every GeoJSON feature with its districtId so the runtime can join.
for (const f of geo.features) {
  const d = f.properties[GEO_DISTRICT_PROP];
  const s = f.properties[GEO_STATE_PROP];
  f.properties = { districtId: makeDistrictId(s, d), district: d, state: s };
}

writeFileSync(OUT_ATLAS, JSON.stringify(atlas));
writeFileSync(OUT_GEO, JSON.stringify(geo));

console.log(`year:               ${aggregated.year}`);
console.log(`crops:              ${atlas.crops.length}`);
console.log(`districts matched:  ${Object.keys(atlas.districts).length}`);
console.log(`districts UNMATCHED:${unmatched.length}`);
if (unmatched.length) console.log('  ' + unmatched.join('\n  '));
console.log(`coconut present:    ${atlas.crops.includes('Coconut')}`);
```

- [ ] **Step 2: Confirm the source files are present**

Run: `ls -la data-raw/apy.csv data-raw/india-districts.geo.json`
Expected: both files exist. If not, follow `scripts/crop-atlas/README.md` to download them first.

- [ ] **Step 3: Align the CONFIG block with the real files**

Run: `head -1 data-raw/apy.csv`
Set the six `FIELDS` values to the exact column names printed.

Run: `node -e "const g=require('./data-raw/india-districts.geo.json'); console.log(Object.keys(g.features[0].properties))"`
Set `GEO_DISTRICT_PROP` and `GEO_STATE_PROP` to the district-name and state-name keys printed.

- [ ] **Step 4: Run the build and reconcile unmatched districts**

Run: `node scripts/crop-atlas/build-crop-atlas.mjs`

Expected on a good run: `year` is a recent year, `crops` is 40+, `coconut present: true`, and `districts matched` is in the high hundreds.

For each name in the `UNMATCHED` list, find the correct GeoJSON district name and add an entry to `ALIASES` (key = the APY name lowercased with punctuation as spaces, value = the exact GeoJSON name). Re-run. Repeat until `UNMATCHED` is empty or only contains districts genuinely absent from the GeoJSON (note those in a comment).

- [ ] **Step 5: Verify the output shape**

Run:
```bash
node -e "const a=require('./public/crop-atlas.json'); const id=Object.keys(a.districts)[0]; console.log('meta',a.meta); console.log('sample',id,JSON.stringify(a.districts[id]).slice(0,200))"
```
Expected: `meta` has `source`/`year`/`generatedAt`; the sample district has `district`, `state`, and a non-empty `crops` object with `production`/`area` numbers.

- [ ] **Step 6: Commit**

```bash
git add scripts/crop-atlas/build-crop-atlas.mjs public/crop-atlas.json
git commit -m "feat: add crop-atlas build orchestrator and generate crop-atlas.json"
```

---

## Task 7: Simplify geometry and finalize the map asset

**Files:**
- Create: `public/india-districts.geo.json`

- [ ] **Step 1: Simplify the tagged GeoJSON with mapshaper**

Run:
```bash
npx mapshaper data-raw/india-districts.tagged.geo.json -simplify 15% keep-shapes -o format=geojson public/india-districts.geo.json
```
Expected: mapshaper prints the output path with no errors.

- [ ] **Step 2: Verify the simplified asset**

Run:
```bash
node -e "const g=require('./public/india-districts.geo.json'); console.log('features',g.features.length); console.log('props',Object.keys(g.features[0].properties))"
ls -la public/india-districts.geo.json
```
Expected: `features` matches the source district count; `props` is `['districtId','district','state']`; file size is roughly 0.5–1.5 MB. If it is well over 2 MB, re-run Step 1 with `-simplify 8%`.

- [ ] **Step 3: Cross-check that ids line up with the atlas**

Run:
```bash
node -e "const g=require('./public/india-districts.geo.json'),a=require('./public/crop-atlas.json'); const gids=new Set(g.features.map(f=>f.properties.districtId)); const hit=Object.keys(a.districts).filter(id=>gids.has(id)).length; console.log('atlas districts:',Object.keys(a.districts).length,'matched to geometry:',hit)"
```
Expected: `matched to geometry` equals (or nearly equals) `atlas districts` — confirming the join works end to end.

- [ ] **Step 4: Commit**

```bash
git add public/india-districts.geo.json
git commit -m "feat: add simplified India district GeoJSON for crop atlas"
```

---

## Self-Review

**Spec coverage:** Plan 1 covers the spec's "Layer 1 — Build-time pipeline" and the two data-model assets (`crop-atlas.json`, `india-districts.geo.json`). Layers 2 and 3 (the runtime page and Firestore overrides) are Plan 2 — out of scope here by design.

**Placeholder scan:** No "TBD"/"handle edge cases" placeholders. The `ALIASES` table starting empty is intentional and Step-4 of Task 6 describes exactly how to fill it.

**Type consistency:** `slugify`/`makeDistrictId` (Task 2) are consumed by `assembleCropAtlas` (Task 5) and the orchestrator (Task 6) with matching signatures. `buildNameIndex`/`resolveDistrict`/`normalizeName` (Task 3) are consumed consistently. `aggregateApy` returns `{ year, districts: Map }` (Task 4) and `assembleCropAtlas` reads `aggregated.districts` / `aggregated.year` accordingly (Task 5). `assembleCropAtlas` returns `{ atlas, unmatched }`, used as such in Task 6.

**Known real-world risk:** the exact APY column names and GeoJSON property keys are unknown until the files are downloaded — Task 6 Step 3 handles this explicitly via the CONFIG block. Coconut unit inconsistency (nuts vs tonnes) is visible in the Task 6 Step 5 sample check; if coconut production looks implausible, a per-crop unit fix is added to `aggregateApy` before finalizing.
