import { createContext, useContext, useEffect, useState, useCallback } from 'react';

// Six-palette theme set (locked in 2026-05-08). Heritage is the default —
// coconut-cream + deep coconut green + river blue + gold + dark warm-brown
// text. The other five sit alongside as alternates, each picked to fill a
// distinct mood the original three didn't cover (warm ledger, work-mode,
// monochrome, academic blue, classics red). All six are light themes;
// dark mode is a separate scheme overlay that works with any of them.
//
// Each entry's `swatch` is [bg0, bg1, accent] — used by any consumer that
// wants a quick three-dot preview. The Settings picker renders fuller
// previews from CSS vars directly; it does not depend on this array's
// shape beyond {id, label}.
//
// Legacy migration (handled in the useState initialiser below):
//   sprout → heritage  (2026-05 rename, retained for older clients)
//   forest → field     (2026-05-08 rename — palette unchanged, new id)
//   amber  → heritage  (2026-05-08 retirement — closest in mood)
export const THEMES = [
  { id: 'heritage', label: 'Heritage', mode: 'light', swatch: ['#F6F1E7', '#FDFAF2', '#2F6B4F'] },
  { id: 'vellum',   label: 'Vellum',   mode: 'light', swatch: ['#F2EBDA', '#FAF4E5', '#6B3F2A'] },
  { id: 'field',    label: 'Field',    mode: 'light', swatch: ['#FAFAF7', '#FFFFFF', '#15803D'] },
  { id: 'linen',    label: 'Linen',    mode: 'light', swatch: ['#FBFAF6', '#FFFFFF', '#1F1F1F'] },
  { id: 'oxford',   label: 'Oxford',   mode: 'light', swatch: ['#F4F2EA', '#FBF9F1', '#1A2238'] },
  { id: 'burgundy', label: 'Burgundy', mode: 'light', swatch: ['#F5EFE6', '#FCF7EE', '#7A2C25'] },
];

const DEFAULT_THEME = 'heritage';
const STORAGE_KEY   = 'nb_theme';
const DARK_KEY      = 'nb_dark_mode'; // 'light' | 'dark' | 'system'

// Silent one-time normalisation of retired theme ids stored from earlier
// versions. Anything not in this map and not in THEMES falls through to
// DEFAULT_THEME, same as before.
const LEGACY_THEME_MAP = {
  sprout: 'heritage',
  forest: 'field',
  amber:  'heritage',
};

const ThemeContext = createContext(null);

function applyTheme(id) {
  document.documentElement.dataset.theme = id;
}

function applyDarkMode(mode) {
  if (mode === 'dark') {
    document.documentElement.dataset.mode = 'dark';
  } else if (mode === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.mode = prefersDark ? 'dark' : 'light';
  } else {
    document.documentElement.dataset.mode = 'light';
  }
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_THEME;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_THEME;
    const normalised = LEGACY_THEME_MAP[stored] ?? stored;
    if (THEMES.some(t => t.id === normalised)) {
      if (normalised !== stored) {
        try { localStorage.setItem(STORAGE_KEY, normalised); } catch { /* private mode */ }
      }
      return normalised;
    }
    return DEFAULT_THEME;
  });

  const [darkMode, setDarkModeState] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    return localStorage.getItem(DARK_KEY) || 'light';
  });

  useEffect(() => { applyTheme(theme); }, [theme]);

  useEffect(() => {
    applyDarkMode(darkMode);
    if (darkMode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyDarkMode('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [darkMode]);

  const setTheme = useCallback((id) => {
    if (!THEMES.some(t => t.id === id)) return;
    setThemeState(id);
    try { localStorage.setItem(STORAGE_KEY, id); } catch { /* private mode */ }
  }, []);

  const setDarkMode = useCallback((mode) => {
    setDarkModeState(mode);
    try { localStorage.setItem(DARK_KEY, mode); } catch { /* private mode */ }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES, darkMode, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() { return useContext(ThemeContext); }
