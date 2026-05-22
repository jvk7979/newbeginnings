// src/pages/Atlas/AtlasMasthead.jsx
//
// Compact page header — matches the app-wide pattern used by Markets,
// Suppliers and Portfolio: a JetBrains-Mono eyebrow, a Playfair title
// with a Cormorant italic flourish, and a DM Sans subhead. It lives
// inside the scroll region (see index.jsx) so it scrolls away as the
// user moves down a mode. Uses only the app's --c-* tokens via the
// .atlas-header classes in atlas-v2.css, so it respects every theme.

export default function AtlasMasthead({ view }) {
  const isIndia = view.level === 'india';
  return (
    <header className="atlas-header">
      <div className="atlas-eyebrow">
        Atlas · {isIndia ? 'India' : view.state}
      </div>
      <h1 className="atlas-title">
        {isIndia ? 'Crops & Raw Materials' : view.state}{' '}
        <span className="atlas-title-it">{isIndia ? 'Atlas' : '· Districts'}</span>
      </h1>
      <div className="atlas-subhead">
        {isIndia
          ? 'State-wise crop production by financial year — pick a crop to recolour the map, or click a gold-dotted state to drill into its districts.'
          : 'District-level breakdown of crops and downstream raw-material streams for venture exploration.'}
      </div>
    </header>
  );
}
