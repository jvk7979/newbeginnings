// Hash-route parsing — pure, unit tested in hashRoute.test.js.
// Extracted from App.jsx so the id rules can be tested without mounting the app.

export const LINKABLE = ['dashboard', 'ideas', 'projects', 'suppliers', 'markets', 'atlas', 'world-market', 'world-market-concepts', 'about', 'access', 'calculations', 'scenarios', 'portfolio', 'settings'];
export const DETAIL   = ['idea-detail', 'project-detail', 'new-idea', 'new-project', 'research', 'commodity-detail'];

const PARENT_FOR = {
  'idea-detail': 'ideas', 'project-detail': 'projects', 'new-idea': 'ideas',
  'new-project': 'projects', 'research': 'projects', 'commodity-detail': 'markets',
};

// Routes whose ids are not always numeric. Ideas, projects and plans get
// Date.now() ids, but the starter commodities use slug ids such as
// "seed-coconut-husk" — parseInt turned every one of those into NaN, so
// opening a starter commodity bounced straight back to Markets.
const STRING_ID_ROUTES = new Set(['commodity-detail']);

function safeDecode(s) {
  try { return decodeURIComponent(s); } catch { return null; }
}

/** Parse a location hash such as "#/commodity-detail/seed-coconut-husk". */
export function parseHashString(rawHash) {
  const hash = String(rawHash || '').replace(/^#\/?/, '');
  const [page, idStr] = hash.split('/');
  if (LINKABLE.includes(page)) return { page, itemId: null };
  if (DETAIL.includes(page)) {
    // A route hit without an id keeps its own page (research/{id} has its own
    // NotFound surface). An id that can't be understood is almost always a
    // stale link or a copy-paste mistake, so route to the parent list page
    // rather than shipping NaN down to a detail page.
    if (!idStr) return { page, itemId: null };
    let itemId = null;
    if (STRING_ID_ROUTES.has(page)) {
      // Numeric ids stay numbers (as before); anything else stays a string.
      itemId = /^\d+$/.test(idStr) ? parseInt(idStr, 10) : (safeDecode(idStr) || null);
    } else {
      const n = parseInt(idStr, 10);
      itemId = Number.isFinite(n) ? n : null;
    }
    if (itemId === null) return { page: PARENT_FOR[page] || 'dashboard', itemId: null };
    return { page, itemId };
  }
  return { page: 'dashboard', itemId: null };
}
