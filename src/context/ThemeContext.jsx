import { createContext, useContext, useEffect, useState, useCallback } from 'react';

// Five-palette theme set (locked in 2026-05-08, rev 4). Heritage is the
// default — coconut-cream + deep coconut green + river blue + gold +
// dark warm-brown text, paired with the Godavari hero photo. Four
// alternates each keep the editorial typography (Cormorant Garamond /
// Playfair Display / DM Sans / JetBrains Mono) but bring a distinct
// atmospheric layer:
//   • aura   — soft pastel gradient backdrop, glass-blur KPI tiles,
//              lavender pill CTA. Calm, multi-tonal pastel palette.
//   • prism  — white page with indigo+cyan radial corner glows, gradient
//              KPI tile, gradient CTA, gradient italic in the hero
//              headline. Confident, saturated, cool register.
//   • citrus — sibling of prism with the same atmospheric structure but
//              shifted warm: orange primary, orange→yellow gradient
//              signature, lime green secondary. Energetic, sunset feel.
//   • lemon  — sibling of prism / citrus with lime / chartreuse primary
//              and lime → yellow gradient signature. Spring meadow / fresh
//              citrus mood; brightest of the vibrants.
// All atmospheric overrides live in styles.css under "Theme atmospheric
// overrides"; this file is just the palette + picker registration.
//
// Each entry's `swatch` is [bg0, bg1, accent] — used by any consumer that
// wants a quick three-dot preview. The Settings picker renders fuller
// previews; it doesn't depend on this array beyond {id, label}.
//
// Legacy migration (handled in the useState initialiser below):
//   sprout            → heritage  (2026-05 rename — pre-rev-1 default)
//   forest            → heritage  (rev-1 retirement — closest in mood now)
//   amber             → heritage  (rev-1 retirement)
//   field             → heritage  (rev-2 retirement — clean light gone)
//   linen             → heritage  (rev-2 retirement — monochrome gone)
//   oxford / burgundy → heritage  (rev-2 retirement — blue / red gone)
//   vellum            → heritage  (rev-2 retirement — warm ledger gone)
export const THEMES = [
  { id: 'heritage', label: 'Heritage', mode: 'light', swatch: ['#F6F1E7', '#FDFAF2', '#37986b'] },
  { id: 'aura',     label: 'Aura',     mode: 'light', swatch: ['#F4F6FB', '#EBE9FB', '#7674ef'] },
  { id: 'prism',    label: 'Prism',    mode: 'light', swatch: ['#FFFFFF', '#F8F9FB', '#635BFF'] },
  { id: 'citrus',   label: 'Citrus',   mode: 'light', swatch: ['#FFFFFF', '#FFFBF5', '#F97316'] },
  { id: 'lemon',    label: 'Lemon',    mode: 'light', swatch: ['#FFFFFF', '#FCFFF5', '#82c41f'] },
];

const DEFAULT_THEME = 'heritage';
const STORAGE_KEY   = 'nb_theme';
const DARK_KEY      = 'nb_dark_mode'; // 'light' | 'dark' | 'system'

// Silent one-time normalisation of retired theme ids stored from earlier
// versions. Anything not in this map and not in THEMES falls through to
// DEFAULT_THEME on next load.
const LEGACY_THEME_MAP = {
  sprout:   'heritage',
  forest:   'heritage',
  amber:    'heritage',
  field:    'heritage',
  vellum:   'heritage',
  linen:    'heritage',
  oxford:   'heritage',
  burgundy: 'heritage',
  // Candidates that were live for a session and then trimmed.
  // Anyone who clicked one falls back to heritage on next load.
  rose:     'heritage',
  mint:     'heritage',
  twilight: 'heritage',
  aqua:     'heritage',
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
