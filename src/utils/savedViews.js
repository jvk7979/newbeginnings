const KEY_PREFIX = 'nb_views_';

export function loadViews(scope) {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + scope);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

export function saveViews(scope, views) {
  try { localStorage.setItem(KEY_PREFIX + scope, JSON.stringify(views)); } catch { /* private mode */ }
}
