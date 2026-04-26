const API_KEY = 'AIzaSyDE3P15HP0LBjgHdwHTIDdtdU64x_GVs9w';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

async function ask(prompt) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!res.ok) throw new Error(`Gemini error ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

const CONTEXT = `You are a business advisor specializing in rural Indian manufacturing and agri-processing in Andhra Pradesh, particularly East Godavari / Rajahmundry / Konaseema region. Coconut processing, coir, agri-processing, and rural MSME ventures are your expertise. Keep answers concise and practical.`;

export async function analyzeIdea(title, desc) {
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
  return ask(prompt);
}

export async function generatePlanSection(sectionTitle, planTitle, existingContent) {
  const prompt = `${CONTEXT}

Business plan title: ${planTitle}
Section: ${sectionTitle}
${existingContent ? `Existing notes: ${existingContent}` : ''}

Write a concise, professional business plan section (150-250 words) for the above. Plain text only, no markdown headers.`;
  return ask(prompt);
}

export async function improveSummary(title, summary) {
  const prompt = `${CONTEXT}

Improve and expand this executive summary for a business plan titled "${title}":
${summary}

Write a polished 2-3 paragraph executive summary (200-300 words). Plain text only.`;
  return ask(prompt);
}
