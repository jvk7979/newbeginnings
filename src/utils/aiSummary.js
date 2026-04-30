import { GoogleGenerativeAI } from '@google/generative-ai';
import { extractAllText } from './pdfParser';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

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

const SUMMARY_PROMPT = `You are a business analyst. Read the document below and write a concise executive summary of 2-3 paragraphs.

Focus on:
- What the business or plan is about
- The core opportunity or problem being addressed
- Key financial highlights, market size, or projections if present
- The main approach or strategy

Write in clear, professional English. Use flowing paragraphs — no bullet points, no headings. Keep it under 300 words.

DOCUMENT:
`;

async function extractTextFromDocx(file) {
  const mammoth = (await import('mammoth/mammoth.browser.min.js')).default || (await import('mammoth/mammoth.browser.min.js'));
  const buf = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buf });
  return (result.value || '').trim();
}

async function extractTextFromTxt(file) {
  return (await file.text()).trim();
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
  if (isPdf)       text = await extractAllText(file);
  else if (isDocx) text = await extractTextFromDocx(file);
  else if (isTxt)  text = await extractTextFromTxt(file);
  else throw new Error('AI summary supports PDF, DOCX, and TXT files.');

  if (!text || text.trim().length < 100) {
    throw new Error('Could not extract readable text from this file. It may be a scanned image or empty.');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent(SUMMARY_PROMPT + text.slice(0, 12000));
  return result.response.text().trim();
}
