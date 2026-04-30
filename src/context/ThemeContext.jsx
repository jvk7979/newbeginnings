import { createContext, useContext, useEffect, useState, useCallback } from 'react';

export const THEMES = [
  { id: 'sage',      label: 'Botanical', mode: 'light', swatch: ['#F4F0E8', '#5A7244', '#FDFCFA'] },
  { id: 'sandstone', label: 'Pearl',     mode: 'light', swatch: ['#FAFAFA', '#0070F3', '#F4F4F5'] },
  { id: 'teal',      label: 'Verdant',   mode: 'light', swatch: ['#F7FAF9', '#0D9373', '#EDFAF5'] },
  { id: 'forest',    label: 'Saffron',   mode: 'light', swatch: ['#FDFAF6', '#C2600A', '#FAF3E8'] },
  { id: 'coral',     label: 'Crimson',   mode: 'light', swatch: ['#FDFBFB', '#C0152A', '#FAF2F3'] },
  { id: 'indigo',    label: 'Obsidian',  mode: 'dark',  swatch: ['#09090B', '#3B82F6', '#18181B'] },
  { id: 'midnight',  label: 'Nautical',  mode: 'dark',  swatch: ['#0F172A', '#F59E0B', '#1E293B'] },
  { id: 'slate',     label: 'Cosmos',    mode: 'dark',  swatch: ['#07050F', '#8B5CF6', '#0F0B1F'] },
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
