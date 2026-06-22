// src/pages/WorldMarket/comtradeDataset.js
//
// UN Comtrade Plus API (v2) — free tier, no key required.
// 500 req/hr rate limit.
//
// Two queries:
//   loadPartnerTotals(year)              — total export value to each country
//                                          (for choropleth shading)
//   loadCountryCommodities(code, year)   — HS-2 agricultural breakdown for
//                                          one partner country (on click)
//
// Results cached in localStorage for 24 hours.

const BASE = 'https://comtradeplus.un.org/TradeData/Annual';
const INDIA = 356;
const TTL_MS = 24 * 60 * 60 * 1000;

// Agricultural HS chapters 01-24 (animals, food, beverages, tobacco,
// hides, fats, prepared food).
const AGRI_CODES = Array.from({ length: 24 }, (_, i) =>
  String(i + 1).padStart(2, '0')
).join(',');

// ── Cache helpers ──────────────────────────────────────────────

function cacheRead(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, exp } = JSON.parse(raw);
    if (Date.now() > exp) { localStorage.removeItem(key); return null; }
    return data;
  } catch { return null; }
}

function cacheWrite(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ data, exp: Date.now() + TTL_MS }));
  } catch { /* storage full — skip */ }
}

// ── Fetch helper ───────────────────────────────────────────────

async function comtradeFetch(params) {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 15000);
  try {
    const url = `${BASE}?${new URLSearchParams(params)}`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`Comtrade ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(tid);
  }
}

// ── Public API ─────────────────────────────────────────────────

// Returns { [partnerCode]: { name, value_usd } } for all countries.
// cmdCode=TOTAL — all commodities combined, so one call covers everything
// needed to shade the choropleth.
export async function loadPartnerTotals(year) {
  const key = `wm-totals-${year}`;
  const cached = cacheRead(key);
  if (cached) return cached;

  const json = await comtradeFetch({
    typeCode: 'C', freqCode: 'A', clCode: 'HS',
    reporterCode: INDIA, cmdCode: 'TOTAL', flowCode: 'X',
    period: year, includeDesc: true,
  });

  const out = {};
  for (const row of json.data || []) {
    if (!row.partnerCode || row.partnerCode === 0) continue;
    out[row.partnerCode] = {
      name: row.partnerDesc || String(row.partnerCode),
      value_usd: row.primaryValue || 0,
    };
  }
  cacheWrite(key, out);
  return out;
}

// Returns [{ hsCode, name, value_usd }] sorted desc for one partner country.
// Called only when a country is clicked.
export async function loadCountryCommodities(partnerCode, year) {
  const key = `wm-cmd-${partnerCode}-${year}`;
  const cached = cacheRead(key);
  if (cached) return cached;

  const json = await comtradeFetch({
    typeCode: 'C', freqCode: 'A', clCode: 'HS',
    reporterCode: INDIA, cmdCode: AGRI_CODES, flowCode: 'X',
    partnerCode, period: year, includeDesc: true,
  });

  const out = (json.data || [])
    .filter(r => r.primaryValue > 0)
    .map(r => ({ hsCode: r.cmdCode, name: r.cmdDesc || r.cmdCode, value_usd: r.primaryValue }))
    .sort((a, b) => b.value_usd - a.value_usd)
    .slice(0, 12);

  cacheWrite(key, out);
  return out;
}

// Format USD value: "$1.24B", "$840M", "$12K"
export function fmtUsd(usd) {
  if (!usd || isNaN(usd)) return '—';
  if (usd >= 1e9) return `$${(usd / 1e9).toFixed(2)}B`;
  if (usd >= 1e6) return `$${Math.round(usd / 1e6)}M`;
  return `$${Math.round(usd / 1e3)}K`;
}
