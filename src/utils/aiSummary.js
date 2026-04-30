// Browser-side document → AI summary helper.
//
// Text extraction (pdfjs / mammoth) stays in the browser — those libraries
// don't need an API key, and shipping a 50 MB PDF to a Cloud Function would
// trip the 10 MB callable limit anyway. Only the trimmed extracted text is
// sent to the `summariseDocumentText` callable, which talks to Gemini
// server-side using a key that's never bundled with the client.

import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const DOC_MIME  = 'application/msword';
const TXT_MIME  = 'text/plain';

export const SUMMARY_SUPPORTED_MIME = new Set([
  'application/pdf',
  DOCX_MIME,
  DOC_MIME,
  TXT_MIME,
]);

export function isSummarySupported(file) {
  if (!file) return false;
  if (SUMMARY_SUPPORTED_MIME.has(file.type)) return true;
  // Fallback by extension when MIME is missing/wrong (common with .docx on
  // some platforms which report empty type)
  const name = (file.name || '').toLowerCase();
  return /\.(pdf|docx|doc|txt)$/.test(name);
}

async function extractTextFromDocx(file) {
  const mod = await import('mammoth/mammoth.browser.min.js');
  const mammoth = mod.default ?? mod;
  const buf = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buf });
  return (result.value || '').trim();
}

async function extractTextFromPdf(file) {
  const { extractAllText } = await import('./pdfParser');
  return extractAllText(file);
}

async function extractTextFromTxt(file) {
  return (await file.text()).trim();
}

let _summarise = null;
function summariseCallable() {
  if (!_summarise) _summarise = httpsCallable(functions, 'summariseDocumentText');
  return _summarise;
}

export async function generateSummaryFromFile(file) {
  const name = (file.name || '').toLowerCase();
  const isPdf  = file.type === 'application/pdf' || name.endsWith('.pdf');
  const isDocx = file.type === DOCX_MIME || name.endsWith('.docx');
  const isDoc  = file.type === DOC_MIME  || name.endsWith('.doc');
  const isTxt  = file.type === TXT_MIME  || name.endsWith('.txt');

  if (isDoc && !isDocx) {
    throw new Error('Legacy .doc files are not supported. Save as .docx and try again.');
  }

  let text;
  if (isPdf)       text = await extractTextFromPdf(file);
  else if (isDocx) text = await extractTextFromDocx(file);
  else if (isTxt)  text = await extractTextFromTxt(file);
  else throw new Error('AI summary supports PDF, DOCX, and TXT files.');

  if (!text || text.trim().length < 100) {
    throw new Error('Could not extract readable text from this file. It may be a scanned image or empty.');
  }

  // Send the extracted text to the callable; the function applies the
  // summary prompt and returns the rendered text. We trim to 12 KB on the
  // server side as well — sending more than that doesn't change output.
  try {
    const res = await summariseCallable()({ text });
    return res?.data?.text ?? '';
  } catch (err) {
    throw new Error(err?.message || 'AI summary failed. Please try again.');
  }
}
