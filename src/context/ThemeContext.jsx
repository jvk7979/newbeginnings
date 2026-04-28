import { createContext, useContext, useEffect, useState, useCallback } from 'react';

export const THEMES = [
  { id: 'sandstone', label: 'Golden Hour',        mode: 'light', swatch: ['#FEFCF5', '#A85500', '#F8F0DC'] },
  { id: 'teal',      label: 'River Blue',          mode: 'light', swatch: ['#F6FBFD', '#0878A0', '#EAF5FA'] },
  { id: 'forest',    label: 'Paddy Green',         mode: 'light', swatch: ['#F7FAF3', '#367A08', '#EEF5E6'] },
  { id: 'indigo',    label: 'Royal Indigo',        mode: 'light', swatch: ['#F9FAFF', '#3A38E8', '#F1F3FF'] },
  { id: 'coral',     label: 'Terracotta Sunset',   mode: 'light', swatch: ['#FEFCF8', '#C03208', '#FFF0E4'] },
  { id: 'midnight',  label: 'Midnight River',      mode: 'dark',  swatch: ['#060810', '#E89820', '#0C1020'] },
  { id: 'slate',     label: 'Sapphire Night',      mode: 'dark',  swatch: ['#060E1C', '#4A9CF0', '#0C1630'] },
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
