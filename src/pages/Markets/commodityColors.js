// Fixed data-series palette for commodities — mirrors the PRODUCT_COLORS
// pattern in calcEngine.js. Each commodity stores a `color` key (stable per
// commodity); it resolves to a hex for sparklines, dots, and charts. Fixed
// hexes (not theme tokens) because these are data-viz series colours — the
// same approach the Calculations charts use.
export const COMMODITY_COLORS = [
  { key: 'amber', label: 'Amber', hex: '#D4A853' },
  { key: 'sage',  label: 'Sage',  hex: '#7BA874' },
  { key: 'clay',  label: 'Clay',  hex: '#B08968' },
  { key: 'rust',  label: 'Rust',  hex: '#C4704F' },
  { key: 'slate', label: 'Slate', hex: '#6B8CAE' },
  { key: 'plum',  label: 'Plum',  hex: '#9B7EA8' },
];

const FALLBACK = COMMODITY_COLORS[0];

// Resolve a stored colour key to its hex. Unknown / missing keys fall back
// to the first palette entry so a card never renders without a colour.
export function colorFor(key) {
  return (COMMODITY_COLORS.find(c => c.key === key) || FALLBACK).hex;
}
