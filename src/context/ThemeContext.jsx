import { createContext, useContext, useEffect, useState, useCallback } from 'react';

export const THEMES = [
  { id: 'sandstone', label: 'Warm Sandstone', mode: 'light', swatch: ['#FFFFFF', '#B8892A', '#FDF5E4'] },
  { id: 'teal',      label: 'Coastal Teal',   mode: 'light', swatch: ['#FFFFFF', '#0F766E', '#ECFDF5'] },
  { id: 'forest',    label: 'Forest & Cream', mode: 'light', swatch: ['#FAF7F0', '#5C7A3D', '#F0F4E8'] },
  { id: 'indigo',    label: 'Indigo & Slate', mode: 'light', swatch: ['#FFFFFF', '#4F46E5', '#EEF2FF'] },
  { id: 'coral',     label: 'Sunset Coral',   mode: 'light', swatch: ['#FFFBF8', '#DC2A5C', '#FFF1F2'] },
  { id: 'midnight',  label: 'Midnight',       mode: 'dark',  swatch: ['#0F1115', '#E0A94C', '#21252E'] },
  { id: 'slate',     label: 'Slate Dark',     mode: 'dark',  swatch: ['#0B1220', '#6366F1', '#1D2438'] },
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
