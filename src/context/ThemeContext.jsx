import { createContext, useContext, useEffect, useState, useCallback } from 'react';

export const THEMES = [
  { id: 'sage',     label: 'Botanical',  mode: 'light', swatch: ['#F4F0E8', '#5A7244', '#FDFCFA'] },
  { id: 'forest',   label: 'Saffron',    mode: 'light', swatch: ['#FDFAF6', '#C2600A', '#FAF3E8'] },
  { id: 'meadow',   label: 'Meadow',     mode: 'light', swatch: ['#F0E7DA', '#4E6813', '#FAFAF7'] },
  { id: 'pink',     label: 'Pink',       mode: 'light', swatch: ['#FDF4F6', '#C2185B', '#FFFFFF'] },
  { id: 'aura',     label: 'Blue Aura',  mode: 'light', swatch: ['#F4F5FC', '#4945A8', '#FFFFFF'] },
  { id: 'monogram', label: 'Monogram',   mode: 'light', swatch: ['#FFFFFF', '#74070E', '#FAFAFA'] },
  { id: 'phoenix',  label: 'Phoenix',    mode: 'light', swatch: ['#F4F7FB', '#E04A0F', '#FFFFFF'] },
  { id: 'amber',    label: 'Amber Haze', mode: 'light', swatch: ['#FDF8EE', '#B45309', '#FFFFFF'] },
  { id: 'regalia',  label: 'Regalia',    mode: 'light', swatch: ['#FBF8F0', '#B8860B', '#FFFFFF'] },
  { id: 'teal',     label: 'Transformative Teal', mode: 'light', swatch: ['#F0FAF8', '#00897B', '#FFFFFF'] },
];

const DEFAULT_THEME = 'sage';
const STORAGE_KEY = 'nb_theme';

const ThemeContext = createContext(null);

function applyTheme(id) {
  document.documentElement.dataset.theme = id;
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_THEME;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && THEMES.some(t => t.id === stored)) return stored;
    return DEFAULT_THEME;
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((id) => {
    if (!THEMES.some(t => t.id === id)) return;
    setThemeState(id);
    try { localStorage.setItem(STORAGE_KEY, id); } catch { /* private mode */ }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() { return useContext(ThemeContext); }
