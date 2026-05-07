import { createContext, useContext, useEffect, useState, useCallback } from 'react';

// Three-palette theme set (locked in 2026-05). Heritage is the default —
// coconut-cream + deep coconut green + river blue + gold + dark warm-
// brown text, designed for the agriculture / food-processing / regional-
// investment audience the app serves. Forest is a deeper banking-green
// alternative; Amber Haze keeps a warm-cream amber option.
//
// Note: the previous default 'sprout' was renamed to 'heritage' on
// 2026-05; users with 'sprout' in localStorage will fail validation in
// setTheme() and fall through to the new heritage default — graceful.
export const THEMES = [
  { id: 'heritage', label: 'Heritage',   mode: 'light', swatch: ['#F6F1E7', '#2F6B4F', '#FDFAF2'] },
  { id: 'forest',   label: 'Forest',     mode: 'light', swatch: ['#FAFAF7', '#15803D', '#FFFFFF'] },
  { id: 'amber',    label: 'Amber Haze', mode: 'light', swatch: ['#FDF8EE', '#B45309', '#FFFFFF'] },
];

const DEFAULT_THEME = 'heritage';
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
