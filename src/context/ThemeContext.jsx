import { createContext, useContext, useEffect, useState, useCallback } from 'react';

// Three-palette theme set (locked in 2026-05). Sprout is the default —
// a fresh leaf-green on cream-mint near-white, applied across the
// entire app. Forest is a deeper banking-green for users who want a
// more conservative tone. Amber Haze keeps a warm-cream heritage
// option for users who prefer that over the green family.
//
// Twelve other palettes (sage, saffron, meadow, regalia, espresso,
// mahogany, clay, monogram, transformative-teal, quant, sapphire)
// were retired here. Existing users with any retired theme id saved
// in localStorage will fail validation in setTheme() below and fall
// through to sprout on next visit — a graceful break.
export const THEMES = [
  { id: 'sprout', label: 'Sprout',     mode: 'light', swatch: ['#FAFEF7', '#00B25E', '#FFFFFF'] },
  { id: 'forest', label: 'Forest',     mode: 'light', swatch: ['#FAFAF7', '#15803D', '#FFFFFF'] },
  { id: 'amber',  label: 'Amber Haze', mode: 'light', swatch: ['#FDF8EE', '#B45309', '#FFFFFF'] },
];

const DEFAULT_THEME = 'sprout';
const STORAGE_KEY   = 'nb_theme';
const DARK_KEY      = 'nb_dark_mode'; // 'light' | 'dark' | 'system'

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
    if (stored && THEMES.some(t => t.id === stored)) return stored;
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
