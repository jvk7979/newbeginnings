// src/pages/Atlas/ModeBar.jsx
//
// Five-tab navigation under the masthead. Mono numeric prefix +
// DM-Sans label + optional badge ("new", "AI"). Active tab gets a
// green underline. Uses --c-* tokens; theme-aware.

const TABS = [
  { id: 'atlas',    label: 'Atlas' },
  { id: 'compare',  label: 'Compare' },
  { id: 'opps',     label: 'Opportunities', badge: 'new' },
];

export default function ModeBar({ tab, setTab }) {
  return (
    <nav className="atlas-modebar">
      {TABS.map((t, i) => (
        <button key={t.id}
                className={`tab${tab === t.id ? ' active' : ''}`}
                data-mode={t.id}
                onClick={() => setTab(t.id)}>
          <span className="idx">0{i+1}</span>
          <span>{t.label}</span>
          {t.badge && <span className="badge">{t.badge}</span>}
        </button>
      ))}
    </nav>
  );
}
