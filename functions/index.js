// Cloud Functions for The New Beginnings — server-side Gemini proxy.
//
// Why this exists: previously every browser had VITE_GEMINI_API_KEY inlined
// into its JS bundle, meaning anyone could extract the key from DevTools and
// burn the family's billing quota. These callable functions verify the
// caller is signed in + on the allowlist, then forward to Gemini using a
// server-side key stored as a Firebase secret (never shipped to clients).

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';

initializeApp();
const db = getFirestore();

// Server-side Gemini key — stored via `firebase functions:secrets:set GEMINI_API_KEY`.
// NOT bundled with the client.
const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');

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
