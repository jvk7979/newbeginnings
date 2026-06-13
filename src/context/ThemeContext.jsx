import { createContext, useContext, useEffect, useState, useCallback } from 'react';

// Seven-palette theme set (rev 7, 2026-05-31 — retired Prism: its
// indigo+cyan gradient stuck out from the editorial Heritage / Terracotta
// / Plum / Coastal family). Heritage is the default — coconut-cream +
// deep coconut green + river blue + gold + dark warm-brown text, paired
// with the Godavari hero photo. All alternates keep the editorial
// typography (Cormorant Garamond / Playfair Display / DM Sans /
// JetBrains Mono) but bring a distinct atmospheric layer.
//
//   • citrus     — vibrant — hot orange primary, orange→yellow gradient
//                  signature, lime green secondary. Energetic, sunset feel.
//   • midnight   — DARK — near-black slate backdrop, warm brass primary,
//                  dim sage secondary, parchment text. Library-after-dark.
//                  First-class dark palette (mode: 'dark').
//   • coastal    — vibrant — slate ocean blue primary + sunset coral
//                  secondary, slate→coral gradient. Pacific Northwest calm.
//   • plum       — vibrant — deep aubergine primary + brass secondary,
//                  aubergine→brass gradient. Boutique-hotel luxury.
//   • terracotta — editorial — warm sand backdrop, burnt sienna primary,
//                  sage secondary. Mediterranean clay village. Sister to
//                  Heritage warmer / southern.
//   • mono       — editorial — paper white, ink-black primary + one red
//                  pop (#C9302C). Sunday Times newspaper / maximum
//                  typography.
//
// All atmospheric overrides live in styles.css under "Theme atmospheric
// overrides"; this file is just the palette + picker registration.
//
// Each entry's `swatch` is [bg0, bg1, accent] — used by any consumer that
// wants a quick three-dot preview. The Settings picker renders fuller
// previews; it doesn't depend on this array beyond {id, label}.
//
// Legacy migration (handled in the useState initialiser below):
//   aura / lemon / jade → heritage  (rev-6 retirement)
//   sprout              → heritage  (2026-05 rename — pre-rev-1 default)
//   forest              → heritage  (rev-1 retirement — closest in mood now)
//   amber               → heritage  (rev-1 retirement)
//   field               → heritage  (rev-2 retirement — clean light gone)
//   linen               → heritage  (rev-2 retirement — monochrome gone)
//   oxford / burgundy   → heritage  (rev-2 retirement — blue / red gone)
//   vellum              → heritage  (rev-2 retirement — warm ledger gone)
export const THEMES = [
  { id: 'heritage',   label: 'Heritage',   mode: 'light', swatch: ['#F6F1E7', '#FDFAF2', '#37986b'] },
  { id: 'citrus',     label: 'Citrus',     mode: 'light', swatch: ['#FFFFFF', '#FFFBF5', '#F97316'] },
  { id: 'midnight',   label: 'Midnight',   mode: 'dark',  swatch: ['#0E1116', '#161A22', '#E8B97B'] },
  { id: 'terracotta', label: 'Terracotta', mode: 'light', swatch: ['#FBF5EE', '#FFFCF6', '#B5532A'] },
  { id: 'aurora',     label: 'Aurora',     mode: 'light', swatch: ['#FFFFFF', '#F0FDF9', '#009974'] },
];

const DEFAULT_THEME = 'heritage';
const STORAGE_KEY   = 'nb_theme';
const DARK_KEY      = 'nb_dark_mode'; // 'light' | 'dark' | 'system'

// Silent one-time normalisation of retired theme ids stored from earlier
// versions. Anything not in this map and not in THEMES falls through to
// DEFAULT_THEME on next load.
const LEGACY_THEME_MAP = {
  // Rev-8 retirement (2026-06-12) — Coastal, Plum, Mono removed.
  coastal:  'heritage',
  plum:     'heritage',
  mono:     'heritage',
  // Rev-7 retirement (2026-05-31) — Prism dropped.
  prism:    'heritage',
  // Rev-6 retirements (2026-05-11) — picker trimmed from 11 → 8.
  aura:     'heritage',
  lemon:    'heritage',
  jade:     'heritage',
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
