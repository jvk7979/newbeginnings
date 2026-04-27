// Theme tokens — values resolve to CSS custom properties so the theme can be
// switched at runtime by setting `document.documentElement.dataset.theme`.
//
// Every property accessed on `C` returns `var(--c-<kebab-case-name>)`, which is
// a valid CSS value usable in inline styles, template literals, and event
// handlers (e.g. `el.style.background = C.bg0`).

const cache = {};
const toCssVar = (key) => {
  if (cache[key]) return cache[key];
  const kebab = key.replace(/([A-Z])/g, '-$1').toLowerCase();
  return (cache[key] = `var(--c-${kebab})`);
};

export const C = new Proxy({}, {
  get(_, key) {
    if (typeof key !== 'string') return undefined;
    return toCssVar(key);
  },
});

// Helper for translucent variants. Replaces the old `${C.accent}33` pattern.
// Reads matching precomputed CSS vars like `--c-accent-33`, defined per theme
// in styles.css.
export const alpha = (cssVar, pct) => {
  // cssVar looks like "var(--c-accent)" — extract the inner name
  const match = /var\(--c-([a-z0-9-]+)\)/.exec(cssVar);
  if (!match) return cssVar;
  return `var(--c-${match[1]}-${pct})`;
};
