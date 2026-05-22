// src/pages/Atlas/CompareMode.jsx
//
// Multi-state side-by-side compare. Pick up to four states from the
// chip rail and render their profile + top-6 crops + raw-stream count
// in matched cards.

import { useState } from 'react';
import { CATEGORIES } from './cropData';
import { formatVal } from './geoHelpers';

export default function CompareMode({ states }) {
  const allNames = Object.keys(states);
  const [picked, setPicked] = useState(() => {
    // Sensible default: the user's coastal-belt comparison set
    return ['Andhra Pradesh', 'Tamil Nadu', 'Kerala'].filter((n) => states[n]);
  });

  const toggle = (n) => {
    setPicked((p) => {
      if (p.includes(n)) return p.filter((x) => x !== n);
      if (p.length >= 4) return [...p.slice(1), n];
      return [...p, n];
    });
  };

  return (
    <section className="atlas-mode-pane">
      <div className="pane-head">
        <div className="kicker">Mode 02 · Comparative</div>
        <h2>Two states, side by side. <span className="it">Tell me the difference.</span></h2>
        <div className="sub">
          Pick up to four states. Each chapter renders its top crops, raw-material pool,
          irrigation share, and farmer base — instantly comparable. Useful when scouting a
          venture across a coastal-belt neighbourhood or weighing breadbasket states.
        </div>
      </div>

      <div className="compare-pickers">
        <label>Add states</label>
        {allNames.map((n) => (
          <button key={n} className={`chip ${picked.includes(n) ? 'on' : ''}`} onClick={() => toggle(n)}>
            {n}{picked.includes(n) && <span className="x"> ×</span>}
          </button>
        ))}
      </div>

      <div className="compare-grid">
        {picked.map((n) => {
          const s = states[n];
          if (!s) return null;
          const top = s.crops.slice().sort((a, b) => b[2] - a[2]).slice(0, 6);
          const maxV = top[0]?.[2] || 1;
          return (
            <article key={n} className="compare-card">
              <h3 className="h">{n} <span className="code">{s.code}</span></h3>
              <div className="ckicker">{s.capital} · flagship: {s.flagship}</div>

              <div className="stats">
                <Stat v={`${s.farmers}M`} l="Farmers" role="time"/>
                <Stat v={`${(s.netSown_kha / 1000).toFixed(1)}M`} l="Ha sown" role="return"/>
                <Stat v={`${s.irrigated_pct}%`} l="Irrigated" role="coverage"/>
                <Stat v={String(s.raw?.length || 0)} l="Raw streams" role="category"/>
              </div>

              <div className="cgroup">Top crops by production</div>
              <div className="crops-mini">
                {top.map((c, i) => (
                  <div key={i} className="row">
                    <div className="nm">
                      {c[0]} <span className="cat">{CATEGORIES[c[1]]?.short}</span>
                    </div>
                    <div className="barwrap">
                      <span style={{
                        width: `${(c[2] / maxV) * 100}%`,
                        background: CATEGORIES[c[1]]?.color || 'var(--c-accent)',
                      }}/>
                    </div>
                    <div className="v">{formatVal(c[2], 'production')}</div>
                  </div>
                ))}
              </div>

              <div className="cnote">{s.note}</div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Stat({ v, l, role }) {
  return (
    <div className="stat" data-role={role || 'return'}>
      <div className="v">{v}</div>
      <div className="l">{l}</div>
    </div>
  );
}
