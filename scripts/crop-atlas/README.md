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
(column names / property names) to match your files, then run the build.
