// Cloud Functions for The New Beginnings — server-side Gemini proxy.
//
// Why this exists: previously every browser had VITE_GEMINI_API_KEY inlined
// into its JS bundle, meaning anyone could extract the key from DevTools and
// burn the family's billing quota. These callable functions verify the
// caller is signed in + on the allowlist, then forward to Gemini using a
// server-side key stored as a Firebase secret (never shipped to clients).

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret } from 'firebase-functions/params';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';

initializeApp();
const db = getFirestore();

// Server-side Gemini key — stored via `firebase functions:secrets:set GEMINI_API_KEY`.
// NOT bundled with the client.
const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');
// data.gov.in API key for the Agmarknet price feed — set via
// `firebase functions:secrets:set DATA_GOV_IN_API_KEY`. Never shipped to clients.
const DATA_GOV_IN_API_KEY = defineSecret('DATA_GOV_IN_API_KEY');

const ADMIN_EMAILS = new Set([
  'thenewbeginningsventure@gmail.com',
  'nsivasree99@gmail.com',
]);

// Mirror the auth model in firestore.rules: admin emails always allowed,
// everyone else needs an entry in /allowedUsers/{email}.
//
// Email is normalized (lowercase + trimmed) so casing/whitespace variants
// can't bypass the allowlist — `Foo@Gmail.com` and `foo@gmail.com` resolve
// to the same allowedUsers doc id. We also reject unverified emails so a
// federated provider that doesn't verify ownership can't be used to squat
// on an admin address.
async function assertAllowed(auth) {
  const rawEmail = auth?.token?.email;
  if (!auth || !rawEmail) {
    throw new HttpsError('unauthenticated', 'Sign in to use AI features.');
  }
  if (auth.token.email_verified !== true) {
    throw new HttpsError('permission-denied', 'Your email address is not verified.');
  }
  const email = String(rawEmail).toLowerCase().trim();
  if (ADMIN_EMAILS.has(email)) return;
  const snap = await db.doc(`allowedUsers/${email}`).get();
  if (!snap.exists) {
    throw new HttpsError('permission-denied', 'Your account is not allowed to use AI features.');
  }
}

// withAuth(handler) — single chokepoint for "is the caller signed in,
// verified, and on the allowlist?" Every callable funnels through this
// so a future auth/quota/rate-limit change only has to be made in one
// place. Previously the assertAllowed call was duplicated at the top of
// every onCall handler, which is exactly the kind of repetition that
// drifts out of sync the moment one of the four sites is forgotten.
const withAuth = (handler) => async (req) => {
  await assertAllowed(req.auth);
  return handler(req);
};

// Single shared Gemini client for the function instance — survives between
// invocations while the function stays warm.
let _genAI = null;
function getGenAI() {
  if (!_genAI) _genAI = new GoogleGenerativeAI(GEMINI_API_KEY.value());
  return _genAI;
}

// Transient Gemini failures (region failover, brief overload, hot-key
// throttling) come back as 429 / 503 / 504 or as fetch-layer errors and
// almost always succeed on the next attempt within a second. The Gemini
// SDK exposes the HTTP code on `err.status`, the GAPIs taxonomy on
// `err.errorDetails[*].reason`, and falls back to encoding the code in
// the message string — we check all three so we don't miss anything.
function isRetryableError(err) {
  if (!err) return false;
  const status = err.status ?? err.code;
  if (status === 429 || status === 503 || status === 504) return true;
  const reason = err.errorDetails?.[0]?.reason || '';
  if (/RESOURCE_EXHAUSTED|UNAVAILABLE|DEADLINE_EXCEEDED/i.test(reason)) return true;
  const msg = String(err.message || err);
  if (/\b(429|503|504)\b/.test(msg)) return true;
  if (/RESOURCE_EXHAUSTED|UNAVAILABLE|DEADLINE_EXCEEDED/i.test(msg)) return true;
  // Node fetch / undici transient network errors.
  if (/ECONNRESET|ETIMEDOUT|EAI_AGAIN|socket hang up|fetch failed|other side closed/i.test(msg)) return true;
  return false;
}

const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 250;

async function ask(prompt) {
  const model = getGenAI().getGenerativeModel({ model: 'gemini-2.5-flash' });
  let lastErr;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (err) {
      lastErr = err;
      if (attempt === MAX_ATTEMPTS || !isRetryableError(err)) throw err;
      // Exponential backoff with ±25% jitter so concurrent failures
      // don't all retry on the same tick (which is what tipped Gemini
      // over in the first place). 250ms, 500ms.
      const base   = BASE_BACKOFF_MS * 2 ** (attempt - 1);
      const jitter = base * 0.25 * (Math.random() * 2 - 1);
      const delay  = Math.max(50, Math.round(base + jitter));
      const code   = err?.status ?? err?.code ?? 'error';
      console.warn(`[gemini] retry ${attempt}/${MAX_ATTEMPTS - 1} after ${code} in ${delay}ms — ${(err?.message || '').slice(0, 160)}`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

const CONTEXT = `You are a business advisor specializing in rural Indian manufacturing and agri-processing in Andhra Pradesh, particularly East Godavari / Rajahmundry / Konaseema region. Coconut processing, coir, agri-processing, and rural MSME ventures are your expertise. Keep answers concise and practical.`;

const SUMMARY_PROMPT = `You are a business analyst. Read the document below and write a concise executive summary of 2-3 paragraphs.

Focus on:
- What the business or plan is about
- The core opportunity or problem being addressed
- Key financial highlights, market size, or projections if present
- The main approach or strategy

Write in clear, professional English. Use flowing paragraphs — no bullet points, no headings. Keep it under 300 words.

DOCUMENT:
`;

// CORS allowlist is environment-scoped. The Firebase Functions runtime
// sets FUNCTIONS_EMULATOR=true automatically when invoked via
// `firebase emulators:start`, so prod deploys never see this flag and
// only accept requests from the production origin. Localhost dev
// servers are accepted only when the function is itself running under
// the emulator. Without this, a malicious page on localhost could
// invoke prod functions with the user's auth token attached whenever
// the user happened to be running a local dev server.
const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true';
const ALLOWED_ORIGINS = isEmulator
  ? ['https://jvk7979.github.io', 'http://localhost:5173', 'http://localhost:5174']
  : ['https://jvk7979.github.io'];

const callOpts = {
  secrets: [GEMINI_API_KEY],
  timeoutSeconds: 60,
  memory: '512MiB',
  cors: ALLOWED_ORIGINS,
};

// ── analyzeIdea ─────────────────────────────────────────────────────────
export const analyzeIdea = onCall(callOpts, withAuth(async (req) => {
  const { title = '', desc = '' } = req.data || {};
  if (!title.trim() && !desc.trim()) {
    throw new HttpsError('invalid-argument', 'Title or description required.');
  }
  const prompt = `${CONTEXT}

Analyze this business idea briefly:
Title: ${title}
Description: ${desc || '(no description)'}

Reply in exactly this format (plain text, no markdown):
RISKS
• [risk 1]
• [risk 2]
• [risk 3]

OPPORTUNITY
[2-3 sentences on market opportunity]

NEXT STEPS
• [step 1]
• [step 2]
• [step 3]`;
  const text = await ask(prompt);
  return { text };
}));

// ── generatePlanSection ─────────────────────────────────────────────────
export const generatePlanSection = onCall(callOpts, withAuth(async (req) => {
  const { sectionTitle = '', planTitle = '', existingContent = '' } = req.data || {};
  if (!sectionTitle.trim()) {
    throw new HttpsError('invalid-argument', 'sectionTitle required.');
  }
  const prompt = `${CONTEXT}

Business plan title: ${planTitle}
Section: ${sectionTitle}
${existingContent ? `Existing notes: ${existingContent}` : ''}

Write a concise, professional business plan section (150-250 words) for the above. Plain text only, no markdown headers.`;
  const text = await ask(prompt);
  return { text };
}));

// ── improveSummary ──────────────────────────────────────────────────────
export const improveSummary = onCall(callOpts, withAuth(async (req) => {
  const { title = '', summary = '' } = req.data || {};
  if (!summary.trim()) {
    throw new HttpsError('invalid-argument', 'summary required.');
  }
  const prompt = `${CONTEXT}

Improve and expand this executive summary for a business plan titled "${title}":
${summary}

Write a polished 2-3 paragraph executive summary (200-300 words). Plain text only.`;
  const text = await ask(prompt);
  return { text };
}));

// ── summariseDocumentText ───────────────────────────────────────────────
// The client extracts text from PDF/DOCX/TXT (using pdfjs / mammoth in the
// browser, which is fine — those libraries don't need an API key) and sends
// the plain text here. We keep the extraction client-side because shipping
// 50MB PDFs to the function would be slow and trip the 10MB callable limit.
export const summariseDocumentText = onCall(callOpts, withAuth(async (req) => {
  const { text = '' } = req.data || {};
  if (!text || text.trim().length < 100) {
    throw new HttpsError('invalid-argument', 'Document text is empty or too short to summarise.');
  }
  const result = await ask(SUMMARY_PROMPT + text.slice(0, 12000));
  return { text: result };
}));

// ── Agmarknet auto-fetch (Markets Phase 2) ──────────────────────────────
// A scheduled function pulls daily mandi prices from the data.gov.in
// Agmarknet API for every commodity the user has mapped (via the curated
// picker) to an Agmarknet source, keeping one price point per ISO week in
// the commodity's `history`. It only touches commodities with an
// `agmarknet` mapping — a no-op until the user maps one, so Phase 1 seed
// and manual commodities are never modified.

const AGMARKNET_RESOURCE = '9ef84268-d588-465a-a308-a864a43d0070';

// Monday 00:00 (server-local) of the week containing `now`. Used as the
// stable `ts` for the current week's auto-fetched point so a daily re-run
// updates that point in place instead of appending duplicates.
function startOfWeek(now = Date.now()) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7; // Mon=0 .. Sun=6
  d.setDate(d.getDate() - day);
  return d.getTime();
}

const agmarknetDateLabel = () =>
  new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// Fetch the modal price for one Agmarknet commodity, trying states in
// order until one returns data. We prefer Andhra Pradesh (the user's
// region) but AP mandi reporting on the data.gov.in feed is patchy, so
// we fall back to Tamil Nadu → Karnataka → Kerala — together with AP
// these four cover ~95% of India's coconut/copra trade, so at least one
// almost always has fresh records. Returns { price, state } on success
// (state names whichever bucket the data came from, so the sync message
// can show "Tamil Nadu average — AP had no data"), or null if no state
// returned any rows.
const FALLBACK_STATES = ['Andhra Pradesh', 'Tamil Nadu', 'Karnataka', 'Kerala'];

async function fetchAgmarknetPrice(apiKey, commodityName) {
  for (const state of FALLBACK_STATES) {
    const url = new URL(`https://api.data.gov.in/resource/${AGMARKNET_RESOURCE}`);
    url.searchParams.set('api-key', apiKey);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1000');
    url.searchParams.set('filters[commodity]', commodityName);
    url.searchParams.set('filters[state]', state);

    const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(`Agmarknet API responded ${res.status}`);
    const data = await res.json();
    const records = Array.isArray(data?.records) ? data.records : [];

    // The modal-price field in the data.gov.in JSON is `modal_price`.
    const modals = records
      .map(r => parseFloat(r.modal_price))
      .filter(n => Number.isFinite(n) && n > 0);
    if (modals.length === 0) continue; // no data for this state — try the next
    const avg = modals.reduce((a, b) => a + b, 0) / modals.length;
    return { price: avg, state };
  }
  return null;
}

// IST is UTC+5:30 — derive the IST hour / IST calendar-day directly from the
// epoch so the schedule gate is immune to the server's timezone.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const istHourOf = (ms) => new Date(ms + IST_OFFSET_MS).getUTCHours();
const istDayOf  = (ms) => Math.floor((ms + IST_OFFSET_MS) / 86400000);

// Core per-commodity fetch loop. Shared by the scheduled cron AND the
// manual "Sync Now" callable so the actual work lives in exactly one
// place. Doesn't read the config doc — callers decide when to invoke
// (scheduler gates on hour/frequency; manual call bypasses).
async function runAgmarknetSync(apiKey) {
  const snap = await db.collection('sharedCommodities').get();
  const mapped = snap.docs.filter(d => d.data()?.agmarknet?.name);

  const weekTs = startOfWeek();
  const weekDate = agmarknetDateLabel();

  let ok = 0, noData = 0, errors = 0;
  for (const docSnap of mapped) {
    const commodity = docSnap.data();
    const ref = docSnap.ref;
    try {
      const result = await fetchAgmarknetPrice(apiKey, commodity.agmarknet.name);
      if (result == null) {
        await ref.update({
          sync: { at: Date.now(), status: 'no-data', message: 'No data from AP, TN, KA or KL for this commodity.' },
        });
        noData++;
        continue;
      }
      const { price, state } = result;
      const rounded = Math.round(price * 100) / 100;
      // One point per ISO week, updated in place: drop any existing
      // agmarknet point for this week, append the fresh one, re-sort.
      const history = Array.isArray(commodity.history) ? commodity.history : [];
      const kept = history.filter(p => !(p.source === 'agmarknet' && p.ts === weekTs));
      kept.push({ ts: weekTs, date: weekDate, price: rounded, source: 'agmarknet', state });
      kept.sort((a, b) => (a.ts || 0) - (b.ts || 0));
      // Note in the sync message when we had to fall back off Andhra Pradesh
      // so the user can tell why their "AP-averaged" feature pulled a
      // Tamil Nadu / Karnataka / Kerala price.
      const stateNote = state === 'Andhra Pradesh'
        ? 'AP average'
        : `${state} average — AP had no data this run`;
      await ref.update({
        history: kept,
        sync: { at: Date.now(), status: 'ok', message: `Synced ₹${rounded} from Agmarknet (${stateNote}).` },
      });
      ok++;
    } catch (err) {
      console.error('[runAgmarknetSync]', commodity.name, err);
      errors++;
      try {
        await ref.update({
          sync: { at: Date.now(), status: 'error', message: String(err?.message || err).slice(0, 200) },
        });
      } catch (writeErr) {
        console.error('[runAgmarknetSync] failed to write error status for', commodity.name, writeErr);
      }
    }
  }
  return { processed: mapped.length, ok, noData, errors };
}

// Runs hourly. The actual fetch is gated by the marketsConfig/autoFetch doc
// (UI-controlled from the Markets page): it only runs when not paused, the
// current IST hour matches the configured hour, and at least `frequencyDays`
// IST days have passed since the last run. A missing config doc defaults to
// daily at 6am IST.
export const syncAgmarknetPrices = onSchedule(
  {
    schedule: '0 * * * *',
    timeZone: 'Asia/Kolkata',
    secrets: [DATA_GOV_IN_API_KEY],
    timeoutSeconds: 300,
    memory: '256MiB',
  },
  async () => {
    const cfgRef = db.doc('marketsConfig/autoFetch');
    const cfgSnap = await cfgRef.get();
    const cfg = cfgSnap.exists ? cfgSnap.data() : {};
    const frequencyDays = Number(cfg.frequencyDays) > 0 ? Number(cfg.frequencyDays) : 1;
    const hourIST = Number.isInteger(cfg.hourIST) ? cfg.hourIST : 6;
    const now = Date.now();

    if (cfg.paused === true) {
      console.log('[syncAgmarknetPrices] paused — skipping.');
      return;
    }
    if (istHourOf(now) !== hourIST) {
      return; // not the configured hour
    }
    if (cfg.lastRunAt && (istDayOf(now) - istDayOf(cfg.lastRunAt)) < frequencyDays) {
      console.log('[syncAgmarknetPrices] not due yet — skipping.');
      return;
    }

    const result = await runAgmarknetSync(DATA_GOV_IN_API_KEY.value());
    await cfgRef.set({ lastRunAt: now }, { merge: true });
    console.log(`[syncAgmarknetPrices] processed=${result.processed} ok=${result.ok} noData=${result.noData} errors=${result.errors}`);
  }
);

// Manual "Sync Now" trigger from the Markets page. Same auth gate as the
// AI callables (must be signed in + on the allowlist), bypasses the
// schedule's hour/frequency/paused checks, and updates lastRunAt so the
// scheduler's day-counter resets too (no duplicate fetch later in the day).
const marketsCallOpts = {
  secrets: [DATA_GOV_IN_API_KEY],
  timeoutSeconds: 120,
  memory: '256MiB',
  cors: ALLOWED_ORIGINS,
};

export const runAgmarknetSyncNow = onCall(marketsCallOpts, withAuth(async () => {
  const result = await runAgmarknetSync(DATA_GOV_IN_API_KEY.value());
  await db.doc('marketsConfig/autoFetch').set({ lastRunAt: Date.now() }, { merge: true });
  console.log(`[runAgmarknetSyncNow] processed=${result.processed} ok=${result.ok} noData=${result.noData} errors=${result.errors}`);
  return result;
}));

// Returns the live list of commodity names the Agmarknet feed currently
// carries — used to populate the searchable multi-select on the Markets
// page. data.gov.in exposes no "distinct values" endpoint, so we page
// through recent records and collect unique `commodity` values. A handful
// of 1000-row pages covers essentially every actively-traded commodity
// nationwide. Returns `{ commodities: string[] }`, alphabetically sorted.
export const listAgmarknetCommodities = onCall(marketsCallOpts, withAuth(async () => {
  const apiKey = DATA_GOV_IN_API_KEY.value();
  const names = new Set();
  const PAGE_SIZE = 1000;
  // 5 pages × 15s = 75s worst case, safely inside the 120s function
  // timeout (8 × 20s = 160s could be killed mid-loop). 5000 records is
  // still ample to surface essentially every actively-traded commodity.
  const MAX_PAGES = 5;
  for (let page = 0; page < MAX_PAGES; page++) {
    const url = new URL(`https://api.data.gov.in/resource/${AGMARKNET_RESOURCE}`);
    url.searchParams.set('api-key', apiKey);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', String(PAGE_SIZE));
    url.searchParams.set('offset', String(page * PAGE_SIZE));
    let records;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`Agmarknet API responded ${res.status}`);
      const data = await res.json();
      records = Array.isArray(data?.records) ? data.records : [];
    } catch (err) {
      // A later page failed — keep whatever earlier pages collected
      // rather than discarding everything. Only surface a hard error if
      // page 0 itself failed (nothing gathered yet).
      console.warn(`[listAgmarknetCommodities] page ${page} failed:`, err?.message || err);
      if (page === 0) throw new HttpsError('unavailable', 'Could not reach the Agmarknet API. Try again.');
      break;
    }
    for (const r of records) {
      const c = r?.commodity;
      if (c) names.add(String(c).trim());
    }
    if (records.length < PAGE_SIZE) break; // reached the last page
  }
  const commodities = [...names].filter(Boolean).sort((a, b) => a.localeCompare(b));
  console.log(`[listAgmarknetCommodities] returned ${commodities.length} distinct commodities`);
  return { commodities };
}));
