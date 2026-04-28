import { createContext, useContext, useEffect, useState, useCallback } from 'react';

export const THEMES = [
  { id: 'sandstone', label: 'Saffron Dawn',      mode: 'light', swatch: ['#FEFCF3', '#C07800', '#F6E8BE'] },
  { id: 'teal',      label: 'River Jade',         mode: 'light', swatch: ['#F4FDF8', '#0A7850', '#DCEEE6'] },
  { id: 'forest',    label: 'Paddy Season',       mode: 'light', swatch: ['#F6FAF0', '#4A8A00', '#E6F4D4'] },
  { id: 'coral',     label: 'Vermillion Shore',   mode: 'light', swatch: ['#FEF9F6', '#B82800', '#FDEEE0'] },
  { id: 'indigo',    label: 'Firefly Grove',      mode: 'dark',  swatch: ['#030A08', '#28C880', '#071412'] },
  { id: 'midnight',  label: 'Marigold Night',     mode: 'dark',  swatch: ['#080602', '#F0A800', '#100C00'] },
  { id: 'slate',     label: 'Monsoon Deep',       mode: 'dark',  swatch: ['#020C12', '#00C8E0', '#041820'] },
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
