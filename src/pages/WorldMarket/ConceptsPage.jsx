// Concept preview gallery — A / B / C switcher.
// Loads partner data once and passes it to each concept component.

import { useState, useEffect, useMemo } from 'react';
import { loadPartnerTotals } from './comtradeDataset';
import ConceptA from './ConceptA';
import ConceptB from './ConceptB';
import ConceptC from './ConceptC';
import '../../concepts.css';

const CONCEPTS = [
  { id: 'A', label: 'Night City',     desc: 'Dark navy · amber glow · animated arcs' },
  { id: 'B', label: 'Editorial Atlas', desc: 'Paper texture · ink hatch · bottom strip' },
  { id: 'C', label: 'Trade Flows',    desc: 'Teal map · live Sankey flow chart' },
];

export default function ConceptsPage({ onNavigate }) {
  const [active, setActive]           = useState('A');
  const [partnerData, setPartnerData] = useState(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    loadPartnerTotals('2025', 'apeda')
      .then(d => { setPartnerData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const topPartners = useMemo(() => {
    if (!partnerData) return [];
    return Object.entries(partnerData)
      .map(([code, d]) => ({ code: Number(code), ...d }))
      .sort((a, b) => b.value_usd - a.value_usd);
  }, [partnerData]);

  return (
    <div className="cp-root">
      {/* ── Switcher bar ───────────────────────── */}
      <div className="cp-bar">
        <div className="cp-bar-left">
          <span className="cp-bar-eye">DESIGN CONCEPTS</span>
          <span className="cp-bar-sep">·</span>
          <span className="cp-bar-sub">India World Market · pick a direction</span>
        </div>
        <div className="cp-tabs">
          {CONCEPTS.map(c => (
            <button
              key={c.id}
              className={`cp-tab${active === c.id ? ' cp-tab-active' : ''}`}
              onClick={() => setActive(c.id)}
            >
              <span className="cp-tab-id">{c.id}</span>
              <span className="cp-tab-label">{c.label}</span>
              <span className="cp-tab-desc">{c.desc}</span>
            </button>
          ))}
        </div>
        <button className="cp-back" onClick={() => onNavigate('world-market')}>
          ← Live page
        </button>
      </div>

      {/* ── Concept view ───────────────────────── */}
      <div className="cp-view">
        {loading && (
          <div className="cp-loading">Loading data…</div>
        )}
        {!loading && active === 'A' && (
          <ConceptA partnerData={partnerData} topPartners={topPartners}/>
        )}
        {!loading && active === 'B' && (
          <ConceptB partnerData={partnerData} topPartners={topPartners}/>
        )}
        {!loading && active === 'C' && (
          <ConceptC partnerData={partnerData} topPartners={topPartners}/>
        )}
      </div>
    </div>
  );
}
