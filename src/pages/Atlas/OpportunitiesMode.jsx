// src/pages/Atlas/OpportunitiesMode.jsx
//
// Venture-radar — every raw-material stream in the atlas scored on
// Volume × Concentration × Access (see opportunityScore.js) and tiered
// S/A/B/C. Filter by tier, sort by axis.

import { useMemo, useState } from 'react';
import { scoreOpportunity } from './opportunityScore';

export default function OpportunitiesMode({ states }) {
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('score');

  const ranked = useMemo(() => {
    const list = [];
    for (const [stateName, s] of Object.entries(states)) {
      for (const raw of s.raw || []) {
        const sc = scoreOpportunity(stateName, raw, states);
        list.push({
          stateName,
          name:    raw[0],
          use:     raw[1],
          volStr:  raw[2],
          where:   raw[3] || s.capital,
          score:   sc.score,
          tier:    sc.tier,
          meters:  sc.meters,
        });
      }
    }
    let f = list;
    if (filter !== 'all') f = list.filter((x) => x.tier === filter);
    const cmp = {
      score:  (a, b) => b.score - a.score,
      volume: (a, b) => b.meters.volume - a.meters.volume,
      conc:   (a, b) => b.meters.conc - a.meters.conc,
    }[sort];
    f.sort(cmp);
    return f;
  }, [filter, sort, states]);

  const tierCount = { S: 0, A: 0, B: 0, C: 0 };
  for (const r of ranked) tierCount[r.tier]++;

  return (
    <section className="atlas-mode-pane">
      <div className="pane-head">
        <div className="kicker">Mode 03 · Venture Radar</div>
        <h2>Where the <span className="it">raw material</span> is cheap and the concentration is real.</h2>
        <div className="sub">
          Every raw-material stream in the atlas scored on three axes — <b>volume</b> (log-scaled
          tonnes/yr), <b>concentration</b> (national share of the source state's flagship crop), and
          <b> access</b> (irrigation × farmer-density proxy). Tier-S streams sit at the intersection
          of all three: cheap, abundant, and infrastructurally reachable.
        </div>
      </div>

      <div className="opp-toolbar">
        <span className="legend">Tier filter</span>
        <TierChip on={filter === 'all'} onClick={() => setFilter('all')} label={`All · ${ranked.length}`}/>
        {['S', 'A', 'B', 'C'].map((t) => (
          <TierChip key={t} on={filter === t} onClick={() => setFilter(t)} label={`Tier ${t} · ${tierCount[t]}`}/>
        ))}
        <span style={{ flex: 1 }}/>
        <span className="legend">Sort</span>
        {[['score', 'composite'], ['volume', 'volume'], ['conc', 'concentration']].map(([k, lbl]) => (
          <TierChip key={k} on={sort === k} onClick={() => setSort(k)} label={lbl}/>
        ))}
      </div>

      <div className="opp-grid">
        {ranked.slice(0, 48).map((r, i) => (
          <article key={i} className={`opp-card tier-${r.tier}`}>
            <div className="score-strip">Tier {r.tier} · {r.score}</div>
            <div className="nm">{r.name} <span className="it">— {r.stateName}</span></div>
            <div className="where">{r.where} · {r.volStr}</div>
            <div className="use">{r.use}</div>
            <div className="meters">
              <Meter cls="volume" lbl="Volume"    v={r.meters.volume}/>
              <Meter cls="conc"   lbl="Concentr." v={r.meters.conc}/>
              <Meter cls="access" lbl="Access"    v={r.meters.access}/>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function TierChip({ on, onClick, label }) {
  return (
    <button className={`chip ${on ? 'on' : ''}`} onClick={onClick}>{label}</button>
  );
}

function Meter({ cls, lbl, v }) {
  return (
    <div className={`meter ${cls}`}>
      <span>{lbl}</span>
      <div className="bar"><span style={{ width: `${v}%` }}/></div>
      <span className="v">{v}</span>
    </div>
  );
}
