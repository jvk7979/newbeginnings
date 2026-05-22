// src/pages/Atlas/AtlasSidebar.jsx
//
// Left rail of the Atlas tab — the choropleth INTENSITY key and a
// CATEGORIES filter. Picking a category recolours the map by that
// category's aggregate (geoHelpers.computeStateMetric already reads
// filter.category); "All categories" clears it. Picking a category
// also clears any single-crop selection, since the two are alternative
// ways to scope the map.

import { useMemo } from 'react';
import { C } from '../../tokens';
import { CATEGORIES } from './cropData';
import { intensityColor } from './geoHelpers';

const RAMP = [0, 0.2, 0.4, 0.6, 0.8, 1.0];

export default function AtlasSidebar({ filter, setFilter, states }) {
  // Distinct crop names per category across every state in the dataset.
  const counts = useMemo(() => {
    const sets = {};
    const all = new Set();
    for (const s of Object.values(states || {})) {
      for (const c of s.crops || []) {
        (sets[c[1]] || (sets[c[1]] = new Set())).add(c[0]);
        all.add(c[0]);
      }
    }
    const out = { all: all.size };
    for (const k of Object.keys(CATEGORIES)) out[k] = sets[k] ? sets[k].size : 0;
    return out;
  }, [states]);

  const pick = (cat) => setFilter((f) => ({ ...f, category: cat, crop: null }));
  // A picked crop overrides category colouring, so nothing is "active" then.
  const activeCat = filter.crop ? null : (filter.category || 'all');

  return (
    <aside className="atlas-sidebar">
      <div className="as-block">
        <div className="as-label">Intensity</div>
        <div className="as-ramp">
          {RAMP.map((t, i) => <span key={i} style={{ background: intensityColor(t) }}/>)}
        </div>
        <div className="as-ramp-caps"><span>Low</span><span>median</span><span>peak</span></div>
        <p className="as-note">
          Colour scales with production of <b>all selected crops</b>.
          Gold-dotted states open district detail.
        </p>
      </div>

      <div className="as-block">
        <div className="as-label">Categories</div>
        <div className="as-cats">
          <CatRow on={activeCat === 'all'} color={C.accent}
                  label="All categories" count={counts.all}
                  onClick={() => pick('all')}/>
          {Object.entries(CATEGORIES).map(([k, v]) => (
            <CatRow key={k} on={activeCat === k} color={v.color}
                    label={v.label} count={counts[k]} dim={counts[k] === 0}
                    onClick={() => { if (counts[k] > 0) pick(k); }}/>
          ))}
        </div>
      </div>
    </aside>
  );
}

function CatRow({ on, color, label, count, dim, onClick }) {
  return (
    <button type="button" className={`as-cat${on ? ' on' : ''}${dim ? ' dim' : ''}`}
            onClick={onClick} disabled={dim}>
      <span className="sw" style={{ background: color }}/>
      <span className="nm">{label}</span>
      <span className="ct">{count}</span>
    </button>
  );
}
