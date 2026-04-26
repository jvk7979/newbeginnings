// Evaluated at build time — Vite copies the worker asset
export const PDF_WORKER_SRC = new URL('pdfjs-dist/build/pdf.worker.min.js', import.meta.url).href;

function isTableRow(line) {
  return /^\|.+\|/.test(line);
}

function isTableSeparator(line) {
  return /^\|[\s\-:|]+\|/.test(line);
}

function cleanMarkdown(text) {
  return text
    .replace(/^#{1,6}\s+/, '')       // strip leading # heading markers
    .replace(/\*\*(.+?)\*\*/g, '$1') // **bold**
    .replace(/\*(.+?)\*/g, '$1')     // *italic*
    .replace(/__(.+?)__/g, '$1')     // __bold__
    .replace(/_(.+?)_/g, '$1')       // _italic_
    .replace(/`(.+?)`/g, '$1')       // `code`
    .trim();
}

function isMarkdownHeading(line) {
  return /^#{1,6}\s+/.test(line);
}

// Common business-plan section headings
const HEADING_KEYWORDS = [
  'executive summary', 'business overview', 'introduction', 'background',
  'problem statement', 'market analysis', 'market opportunity', 'target market',
  'competitive analysis', 'value proposition', 'business model', 'revenue model',
  'financial projections', 'financial summary', 'capex', 'investment summary',
  'subsidy', 'funding', 'operations plan', 'operational plan', 'implementation plan',
  'timeline', 'roadmap', 'team structure', 'management team', 'organizational',
  'risk assessment', 'risk analysis', 'mitigation', 'next steps', 'appendix',
  'swot analysis', 'conclusion', 'recommendation',
];

// Detect inline citation-chip lines extracted from PDFs (e.g. "coconutboard India Atlas", "NIIR EximData")
function isCitationLine(line) {
  if (line.length > 80) return false;
  // All tokens are word-chars only (no punctuation, no numbers), ≤ 6 tokens
  const tokens = line.trim().split(/\s+/);
  if (tokens.length > 6) return false;
  return tokens.every(t => /^[A-Za-z][A-Za-z0-9]*$/.test(t)) &&
    tokens.every(t => t.length <= 25) &&
    // Must not look like an English sentence (no common English words that would appear in headings)
    !/^(The|A|An|In|On|For|With|From|This|That|These|Those|And|But|Or)\b/i.test(line);
}

function isHeading(line) {
  if (isMarkdownHeading(line)) return true;
  if (line.length < 3 || line.length > 110) return false;
  // Numbered sections like "1. The optimal product mix..." or "Section 1 —"
  if (/^\d+[\.\)]\s+[A-Z]/.test(line) && line.length < 90) return true;
  // All-caps short lines (e.g. "EXECUTIVE SUMMARY", "NIIR" excluded by length)
  if (line === line.toUpperCase() && /^[A-Z]/.test(line) && line.replace(/\s/g, '').length > 4 && line.length < 60) return true;
  // "Title Case words ending with colon:" pattern
  if (/^[A-Z][^.!?]*:$/.test(line) && line.length < 80) return true;
  // Keyword match — ONLY if line starts with uppercase (rules out mid-sentence fragments)
  if (!/^[A-Z]/.test(line)) return false;
  const lower = line.toLowerCase().replace(/[^a-z\s]/g, ' ');
  if (line.length < 80 && HEADING_KEYWORDS.some(kw => lower.includes(kw))) return true;
  return false;
}

export async function loadPdfJs() {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;
  return pdfjsLib;
}

export async function extractAllText(file) {
  const pdfjsLib = await loadPdfJs();
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const pageTexts = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const ct = await page.getTextContent();
    // Group items by Y position (rounded to 1dp to handle slight baseline shifts)
    const byY = {};
    ct.items.forEach(item => {
      if (!item.str) return;
      const y = Math.round(item.transform[5] * 2) / 2; // 0.5-unit buckets
      if (!byY[y]) byY[y] = [];
      byY[y].push({
        str: item.str,
        x: item.transform[4],
        width: Math.abs(item.width) || 0,
        fontSize: Math.abs(item.transform[0]) || 10,
      });
    });
    const linesSorted = Object.keys(byY)
      .sort((a, b) => Number(b) - Number(a))
      .map(y => {
        const items = byY[y].sort((a, b) => a.x - b.x);
        if (items.length === 0) return '';
        let result = items[0].str;
        for (let i = 1; i < items.length; i++) {
          const prev = items[i - 1];
          const curr = items[i];
          const gap = curr.x - (prev.x + prev.width);
          const fontSize = (prev.fontSize + curr.fontSize) / 2;
          // Only insert a space if the gap between items is large enough to be a word boundary
          // Threshold: 25% of font size (inter-char kerning is typically < 10%)
          if (gap > fontSize * 0.25) {
            result += ' ';
          }
          result += curr.str;
        }
        return result.trim();
      })
      .filter(l => l.length > 0);
    pageTexts.push(linesSorted.join('\n'));
  }
  return pageTexts.join('\n');
}

export function parseTextForIdea(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    .filter(l => !isTableRow(l) && !isTableSeparator(l) && !isCitationLine(l));
  const title = cleanMarkdown(lines[0] || '').slice(0, 120);
  const descLines = lines.slice(1).filter(l => l.length > 20).slice(0, 30);
  const desc = descLines.map(cleanMarkdown).join(' ').slice(0, 1200);
  return { title, desc };
}

export function parseTextForPlan(text) {
  const rawLines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (rawLines.length === 0) return { title: '', summary: '', sections: [] };

  // Strip table rows and PDF citation chips before processing
  const lines = rawLines.filter(l => !isTableRow(l) && !isTableSeparator(l) && !isCitationLine(l));
  if (lines.length === 0) return { title: '', summary: '', sections: [] };

  const title = cleanMarkdown(lines[0]).slice(0, 140);
  const sections = [];
  let currentSection = null;
  let summaryLines = [];
  let preambleDone = false;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (isHeading(line)) {
      if (currentSection) sections.push(currentSection);
      const sectionTitle = cleanMarkdown(line).replace(/:$/, '').trim();
      currentSection = { title: sectionTitle, content: '' };
      preambleDone = true;
    } else if (!preambleDone && summaryLines.length < 8) {
      summaryLines.push(cleanMarkdown(line));
    } else if (currentSection) {
      const cleaned = cleanMarkdown(line);
      currentSection.content = currentSection.content
        ? currentSection.content + ' ' + cleaned
        : cleaned;
    } else {
      if (!currentSection) currentSection = { title: 'Overview', content: '' };
      const cleaned = cleanMarkdown(line);
      currentSection.content = currentSection.content
        ? currentSection.content + ' ' + cleaned
        : cleaned;
    }
  }
  if (currentSection && (currentSection.content || currentSection.title !== 'Overview')) {
    sections.push(currentSection);
  }

  // Fallback: if no sections detected, split into chunks of ~20 lines
  if (sections.length === 0) {
    const contentLines = lines.slice(1).filter(l => l.length > 10).map(cleanMarkdown);
    const chunkSize = Math.ceil(contentLines.length / Math.max(1, Math.ceil(contentLines.length / 20)));
    for (let i = 0; i < contentLines.length; i += chunkSize) {
      sections.push({
        title: `Section ${Math.floor(i / chunkSize) + 1}`,
        content: contentLines.slice(i, i + chunkSize).join(' '),
      });
    }
  }

  const summary = summaryLines.join(' ').slice(0, 800) ||
    (sections[0]?.content?.slice(0, 400) || '');

  return { title, summary, sections: sections.slice(0, 15) };
}
