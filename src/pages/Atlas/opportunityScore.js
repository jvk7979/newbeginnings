// src/pages/Atlas/opportunityScore.js
//
// Score every raw-material stream in the atlas on three dimensions:
//   - Volume        log-scaled tonnes-per-year (parsed from the raw[2] string)
//   - Concentration national share of the source state's flagship crop
//   - Access        irrigation% × farmer-density proxy
//
// Final score = weighted blend, 0–100, mapped to S/A/B/C tier.

// Tune the weights to bias toward volume, monopoly, or accessibility.
const WEIGHTS = { volume: 0.55, conc: 0.30, access: 0.15 };

// Parse common raw-material volume strings — "1.1 MT/yr", "420 KT/yr",
// "1.1B husks/yr", "large", "massive", etc — into a comparable
// MT-equivalent number. Best-effort only; missing data falls back to a
// small positive number so the row still ranks low rather than 0.
export function parseVolume(str) {
  if (!str) return 0.3;
  const s = String(str).toLowerCase();
  if (s.includes('massive')) return 8;
  if (s.includes('large')) return 5;
  if (s.includes('niche') || s.includes('minor') || s.includes('restricted')) return 0.05;
  const match = s.match(/([\d.]+)\s*(b|m|k)/);
  if (!match) return 0.3;
  const v = parseFloat(match[1]);
  const u = match[2];
  if (u === 'b') return v * 1000; // billion units -> very large MT-equiv
  if (u === 'm') return v;        // MT
  if (u === 'k') return v / 1000; // KT -> MT
  return v;
}

export function scoreOpportunity(stateName, raw, states) {
  const s = states[stateName] || {};
  const vol = parseVolume(raw[2]);
  const irr = (s.irrigated_pct || 30) / 100;
  const farmers = (s.farmers || 1) / 24;                    // normalised 0-1
  const flagshipShare = (s.crops?.[0]?.[4] || 10) / 100;    // top-row crop's national share

  const volScore = Math.min(100, Math.log10(vol + 1) * 40); // 0.1MT->16, 1MT->40, 10MT->80
  const concScore = Math.min(100, flagshipShare * 100);
  const accessScore = (irr * 0.6 + farmers * 0.4) * 100;

  const final = (volScore * WEIGHTS.volume) + (concScore * WEIGHTS.conc) + (accessScore * WEIGHTS.access);
  let tier = 'C';
  if (final > 72) tier = 'S';
  else if (final > 58) tier = 'A';
  else if (final > 44) tier = 'B';

  return {
    score: Math.round(final),
    tier,
    meters: {
      volume: Math.round(volScore),
      conc:   Math.round(concScore),
      access: Math.round(accessScore),
    },
  };
}
