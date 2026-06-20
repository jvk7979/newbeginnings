// src/pages/Atlas/AtlasMasthead.jsx
//
// Collapsible editorial header strip. Sits directly below AtlasNavBar.
// Renders null when collapsed so the map fills the extra vertical space.
// KPI chips (crop count, state count, peak output) live on the right side
// so the strip doubles as a quick-read data summary.

export default function AtlasMasthead({ view, kpiCrops, kpiStates, kpiPeak }) {
  const isIndia = view.level === 'india';

  return (
    <div className="atlas-header-strip">
      <div className="atlas-header-text">
        <div className="atlas-eyebrow">
          {isIndia ? 'Crops & Raw Materials' : view.state}
        </div>
        <h1 className="atlas-title">
          {isIndia ? 'Crops & Raw Materials' : view.state}{' '}
          <span className="atlas-title-it">
            {isIndia ? 'Atlas' : '· Districts'}
          </span>
        </h1>
        <p className="atlas-subhead">
          {isIndia
            ? 'State-wise crop production by financial year — pick a crop to recolour the map, or click a gold-dotted state to drill into its districts.'
            : 'District-level breakdown of crops and downstream raw-material streams for venture exploration.'}
        </p>
      </div>

      <div className="atlas-kpi-chips">
        <div className="atlas-kpi-chip">
          <span className="atlas-kpi-value">{kpiCrops ?? '—'}</span>
          <span className="atlas-kpi-label">CROPS</span>
        </div>
        <div className="atlas-kpi-chip">
          <span className="atlas-kpi-value">{kpiStates ?? '—'}</span>
          <span className="atlas-kpi-label">STATES</span>
        </div>
        <div className="atlas-kpi-chip">
          <span className="atlas-kpi-value">
            {kpiPeak != null ? `${kpiPeak}` : '—'}
            {kpiPeak != null && <span className="atlas-kpi-unit">MT</span>}
          </span>
          <span className="atlas-kpi-label">PEAK OUTPUT</span>
        </div>
      </div>
    </div>
  );
}
