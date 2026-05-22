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
