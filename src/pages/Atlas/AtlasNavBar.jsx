// src/pages/Atlas/AtlasNavBar.jsx
//
// Compact accent-coloured nav bar that replaces the separate AtlasMasthead
// + ModeBar combo. Sits at the top of the Atlas root (never scrolls).
// Left: breadcrumb. Centre: mode tabs. Right: INFO ▲/▼ toggle.

const TABS = [
  { id: 'atlas',   label: 'Atlas' },
  { id: 'compare', label: 'Compare' },
  { id: 'opps',    label: 'Opportunities', badge: 'new' },
];

export default function AtlasNavBar({ tab, setTab, headerCollapsed, onToggleHeader }) {
  return (
    <div className="atlas-navbar">
      <span className="atlas-navbar-crumb">ATLAS · INDIA</span>

      <nav className="atlas-navbar-tabs" role="tablist">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`atlas-navbar-tab${tab === t.id ? ' active' : ''}`}
            data-mode={t.id}
            onClick={() => setTab(t.id)}
          >
            <span className="atlas-navbar-idx">0{i + 1}</span>
            {t.label}
            {t.badge && <span className="atlas-navbar-badge">{t.badge}</span>}
          </button>
        ))}
      </nav>

      <button
        className="atlas-navbar-toggle"
        onClick={onToggleHeader}
        aria-label={headerCollapsed ? 'Expand info panel' : 'Collapse info panel'}
      >
        <span className="atlas-navbar-toggle-label">INFO</span>
        <span className="atlas-navbar-toggle-arrow">{headerCollapsed ? '▼' : '▲'}</span>
      </button>
    </div>
  );
}
