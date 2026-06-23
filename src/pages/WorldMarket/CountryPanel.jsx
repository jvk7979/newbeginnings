// src/pages/WorldMarket/CountryPanel.jsx
//
// Right panel — commodity breakdown for a clicked country, or top-10
// importer list when nothing is selected.

import { useEffect, useState } from 'react';
import { loadCountryCommodities, fmtUsd } from './comtradeDataset';
import { CATEGORIES } from '../Atlas/cropData';

// HS chapter 2-digit prefix → existing category key.
const HS_CATEGORY = {
  '01': 'livestock', '02': 'livestock', '03': 'livestock',
  '04': 'livestock', '05': 'livestock',
  '06': 'horti', '07': 'horti', '08': 'horti',
  '09': 'spice', '10': 'cereal', '11': 'cereal',
  '12': 'oilseed', '13': 'plantation', '14': 'fiber',
  '15': 'oilseed', '16': 'livestock',
  '17': 'sugar', '18': 'plantation',
  '19': 'cereal', '20': 'horti', '21': 'horti',
  '22': 'horti', '23': 'cereal', '24': 'residue',
};

function categoryColor(hsCode) {
  const cat = HS_CATEGORY[String(hsCode).slice(0, 2)];
  return CATEGORIES[cat]?.color || 'var(--c-accent)';
}

export default function CountryPanel({ code, partnerData, year, source, topPartners, onSelectCode }) {
  const [commodities, setCommodities] = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);

  useEffect(() => {
    if (!code) { setCommodities(null); return; }
    let cancelled = false;
    setLoading(true); setError(null); setCommodities(null);
    loadCountryCommodities(code, year, source)
      .then(data => { if (!cancelled) { setCommodities(data); setLoading(false); } })
      .catch(err => { if (!cancelled) { setError(err.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, [code, year, source]);

  const partner = partnerData?.[code];

  if (!code) {
    return (
      <div className="wm-panel">
        <div className="wm-panel-head">
          <div className="wm-panel-eyebrow">Top Importers from India</div>
          <div className="wm-panel-name" style={{ fontSize: 14 }}>
            Click a country to see commodity breakdown
          </div>
        </div>
        <div className="wm-panel-list">
          {topPartners.slice(0, 10).map((p, i) => (
            <div key={p.code} className="wm-default-row" onClick={() => onSelectCode(p.code)}>
              <span className="wm-default-rank">{String(i + 1).padStart(2, '0')}</span>
              <span className="wm-default-name">{p.name}</span>
              <span className="wm-default-val">{fmtUsd(p.value_usd)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const max = commodities?.[0]?.value_usd || 1;

  return (
    <div className="wm-panel">
      <div className="wm-panel-head">
        <div className="wm-panel-eyebrow">Selected Country</div>
        <div className="wm-panel-name">{partner?.name || `Country ${code}`}</div>
        <div className="wm-panel-sub">
          {fmtUsd(partner?.value_usd)} total imports from India · {year}
        </div>
      </div>
      <div className="wm-panel-list">
        {loading && <div className="wm-loading">Loading commodities…</div>}
        {error && (
          <div className="wm-loading" style={{ flexDirection: 'column', gap: 6 }}>
            <span style={{ color: 'var(--c-danger)' }}>API error</span>
            <span style={{ fontSize: 10 }}>{error}</span>
          </div>
        )}
        {!loading && !error && commodities?.length === 0 && (
          <div className="wm-loading" style={{ textAlign: 'center', padding: 20 }}>
            {source === 'oec'
              ? 'Commodity breakdown not available for OEC source.'
              : 'No detailed commodity data for this country.'}
          </div>
        )}
        {!loading && !error && commodities?.map((c) => {
          const color = categoryColor(c.hsCode);
          const w = Math.max(3, (c.value_usd / max) * 100);
          return (
            <div key={c.hsCode} className="wm-commodity-row"
              style={{ borderLeft: `3px solid ${color}` }}>
              <div className="wm-commodity-meta">
                <span className="wm-commodity-name">{c.name}</span>
                <span className="wm-commodity-val">{fmtUsd(c.value_usd)}</span>
              </div>
              <div className="wm-bar-track">
                <div className="wm-bar-fill" style={{ width: `${w}%`, background: color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
