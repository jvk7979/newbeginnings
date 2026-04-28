import { GoogleGenerativeAI } from '@google/generative-ai';
import { extractAllText } from './pdfParser';

const SUMMARY_PROMPT = `You are a business analyst. Read the document below and write a concise executive summary of 2-3 paragraphs.

Focus on:
- What the business or plan is about
- The core opportunity or problem being addressed
- Key financial highlights, market size, or projections if present
- The main approach or strategy

Write in clear, professional English. Use flowing paragraphs — no bullet points, no headings. Keep it under 300 words.

DOCUMENT:
`;

export async function generateSummaryFromFile(file) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini API key not configured. Add VITE_GEMINI_API_KEY to your environment.');

  if (file.type !== 'application/pdf') {
    throw new Error('AI summary is only supported for PDF files.');
  }

  const text = await extractAllText(file);
  if (!text || text.trim().length < 100) {
    throw new Error('Could not extract readable text from this PDF. It may be a scanned image.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent(SUMMARY_PROMPT + text.slice(0, 12000));
  return result.response.text().trim();
}
