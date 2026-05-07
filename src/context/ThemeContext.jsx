import { createContext, useContext, useEffect, useState, useCallback } from 'react';

export const THEMES = [
  // ── Modern palettes (added 2026-05) — saturated single accent on
  // near-white. Designed for the financial workspace; surface first
  // in the picker so they're discoverable.
  { id: 'quant',    label: 'Quant',      mode: 'light', swatch: ['#FFFFFF', '#2563EB', '#F8FAFC'] },
  { id: 'forest',   label: 'Forest',     mode: 'light', swatch: ['#FAFAF7', '#15803D', '#FFFFFF'] },
  { id: 'sapphire', label: 'Sapphire',   mode: 'light', swatch: ['#FAFAF8', '#1E3A8A', '#FFFFFF'] },
  // ── Editorial / earthy palettes (heritage; the previous default set).
  // The id 'forest' previously belonged to the Saffron palette below;
  // it was renamed to 'saffron' (matching its label) when the new
  // green Forest palette claimed the slot. Existing users with
  // 'forest' saved in localStorage will resolve to the new green
  // Forest palette — a graceful break.
  { id: 'sage',     label: 'Botanical',  mode: 'light', swatch: ['#F4F0E8', '#5A7244', '#FDFCFA'] },
  { id: 'saffron',  label: 'Saffron',    mode: 'light', swatch: ['#FDFAF6', '#C2600A', '#FAF3E8'] },
  { id: 'meadow',   label: 'Meadow',     mode: 'light', swatch: ['#F0E7DA', '#4E6813', '#FAFAF7'] },
  { id: 'amber',    label: 'Amber Haze', mode: 'light', swatch: ['#FDF8EE', '#B45309', '#FFFFFF'] },
  { id: 'regalia',  label: 'Regalia',    mode: 'light', swatch: ['#FBF8F0', '#B8860B', '#FFFFFF'] },
  { id: 'espresso', label: 'Espresso',   mode: 'light', swatch: ['#FFF9E8', '#4A2C0F', '#FFFFFF'] },
  { id: 'mahogany', label: 'Mahogany',   mode: 'light', swatch: ['#FAF5F0', '#6E2A1E', '#FFFFFF'] },
  { id: 'clay',     label: 'Clay',       mode: 'light', swatch: ['#FBF1EC', '#B8553B', '#FFFFFF'] },
  { id: 'monogram', label: 'Monogram',   mode: 'light', swatch: ['#FFFFFF', '#74070E', '#FAFAFA'] },
  { id: 'teal',     label: 'Transformative Teal', mode: 'light', swatch: ['#F0FAF8', '#00897B', '#FFFFFF'] },
];

const DEFAULT_THEME = 'sage';
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
