// src/utils/format.js
//
// Shared formatters. Previously each consumer page (Dashboard,
// IdeaDetailPage, IdeaCard, calc/primitives) had its own copy of
// fmtINR — with subtle behaviour differences:
//   - calc/primitives  : Math.abs + explicit sign, "-₹3 L" style
//   - Dashboard        : raw n in template (so "-₹3 L" but Math.abs in
//                        the threshold guards, which silently flipped
//                        a negative-just-below-10k into "-₹3 K" when
//                        it should have been "-₹3 K")
//   - IdeaCard         : NO sign handling at all — negative numbers
//                        rendered "₹-3 K" (₹ glyph then minus)
//   - IdeaDetailPage   : duplicate of IdeaCard's broken-for-negatives
//                        version, inline inside the component
// This single source-of-truth follows the calc/primitives signature
// (Math.abs + explicit leading sign) so negative numbers render
// consistently as "-₹3 L" everywhere.

/**
 * Compact INR formatter.
 *   1_50_00_000   → '₹1.50 Cr'   (>= 1 crore  / 10,000,000)
 *   1_50_000      → '₹1.5 L'     (>= 1 lakh   / 100,000)
 *   1_500         → '₹1.5 K'     (>= 1 thousand)
 *   500           → '₹500'
 *   -1_50_000     → '-₹1.5 L'    (sign leads, ₹ stays glued to the number)
 *   null / NaN    → '—'
 */
export function fmtINR(n) {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(2)} Cr`;
  if (abs >= 100000)   return `${sign}₹${(abs / 100000).toFixed(1)} L`;
  if (abs >= 1000)     return `${sign}₹${(abs / 1000).toFixed(1)} K`;
  return `${sign}₹${abs.toFixed(0)}`;
}
