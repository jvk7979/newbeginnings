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
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error('AI API key not configured. Add VITE_GROQ_API_KEY to GitHub secrets.');

  if (file.type !== 'application/pdf') {
    throw new Error('AI summary is only supported for PDF files.');
  }

  const text = await extractAllText(file);
  if (!text || text.trim().length < 100) {
    throw new Error('Could not extract readable text from this PDF. It may be a scanned image.');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: SUMMARY_PROMPT + text.slice(0, 12000) }],
      max_tokens: 600,
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `AI request failed (${response.status})`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}
