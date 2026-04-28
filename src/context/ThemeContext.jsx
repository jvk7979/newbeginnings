import { createContext, useContext, useEffect, useState, useCallback } from 'react';

export const THEMES = [
  { id: 'sandstone', label: 'Pearl',    mode: 'light', swatch: ['#FBFBFD', '#0071E3', '#F5F5F7'] },
  { id: 'teal',      label: 'Alpine',   mode: 'light', swatch: ['#F8FFFC', '#1E8C3A', '#EEFAF4'] },
  { id: 'forest',    label: 'Sunrise',  mode: 'light', swatch: ['#FFFCF8', '#B86000', '#F9F2E8'] },
  { id: 'coral',     label: 'Blossom',  mode: 'light', swatch: ['#FFFCFD', '#BF0840', '#F9F0F4'] },
  { id: 'indigo',    label: 'Midnight', mode: 'dark',  swatch: ['#000000', '#2997FF', '#1C1C1E'] },
  { id: 'midnight',  label: 'Graphite', mode: 'dark',  swatch: ['#161617', '#FFD60A', '#1D1D1F'] },
  { id: 'slate',     label: 'Nebula',   mode: 'dark',  swatch: ['#080010', '#BF5AF2', '#100018'] },
];

const DEFAULT_THEME = 'sandstone';
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
