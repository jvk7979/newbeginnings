// Lazy-load the Gemini SDK on first call so its ~30 KB gz doesn't ship in
// the main bundle. Cached after first import; subsequent calls reuse the
// same client instance.
let _genAIPromise = null;
function getGenAI() {
  if (!_genAIPromise) {
    _genAIPromise = import('@google/generative-ai').then(
      mod => new mod.GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)
    );
  }
  return _genAIPromise;
}

async function ask(prompt) {
  const genAI = await getGenAI();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
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
