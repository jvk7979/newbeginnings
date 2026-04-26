export function formatText(raw) {
  if (!raw || !raw.trim()) return '';

  // Remove inline citation groups like [1], [2, 3, 4], [1,2,3,4,5]
  let text = raw.replace(/\[\d[\d,\s]*\]/g, '');

  // Split into lines, process each
  const lines = text.split('\n').map(l => l.trim());
  const cleaned = [];

  for (const line of lines) {
    if (!line) continue;
    // Skip bare URLs
    if (/^https?:\/\/\S+$/.test(line)) continue;
    // Skip "[N] https://..." citation reference lines
    if (/^\[\d+\]\s+https?:\/\//.test(line)) continue;
    // Skip "AI responses may include mistakes" disclaimers
    if (/^AI responses may include mistakes/i.test(line)) continue;
    // Skip lines that are purely numeric citation lists like "1. https://..."
    if (/^\d+\.\s+https?:\/\//.test(line)) continue;
    cleaned.push(line);
  }

  // Join all lines into one pass so we can split on bullet markers
  let result = cleaned.join(' ');

  // Split on bullet markers (•, ·, *, –) that appear mid-text → new line
  result = result.replace(/\s*[•·–]\s*/g, '\n• ');

  // If the text starts with "• " from the replacement, fix that
  result = result.replace(/^\n•\s*/, '• ');

  // Split on section headers that look like "Something Something:"
  // (capital-word sequence ending with colon) and give them their own line
  result = result.replace(/\s+([A-Z][A-Za-z &/]+:)\s+/g, '\n\n$1 ');

  // Collapse multiple spaces
  result = result.replace(/  +/g, ' ');

  // Collapse more than 2 consecutive newlines
  result = result.replace(/\n{3,}/g, '\n\n');

  return result.trim();
}
