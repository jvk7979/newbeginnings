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
