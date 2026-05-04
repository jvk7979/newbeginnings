import { useState, lazy, Suspense } from 'react';
import { C } from '../../../tokens';

// Sub-tab orchestrator for the What-If Lab workspace. Three views:
//   Tornado     — sensitivity analysis (default landing)
//   Live Drivers — single-slider sandbox with live KPI deltas
//   Goal Seek   — solve a target metric for a chosen lever
const Tornado     = lazy(() => import('./whatif/Tornado'));
const LiveDrivers = lazy(() => import('./whatif/LiveDrivers'));
const GoalSeek    = lazy(() => import('./whatif/GoalSeek'));

const Fallback = () => (
  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, padding: '12px 0' }}>
    Loading…
  </div>
);

export default function WhatIfLab(props) {
  const [sub, setSub] = useState('tornado');

  const tabs = [
    ['tornado',  'Sensitivity Tornado'],
    ['drivers',  'Live Drivers'],
    ['goalseek', 'Goal Seek'],
  ];

  return (
    <div className="calc-whatif-shell">
      <div className="calc-whatif-subtabs" role="tablist" aria-label="What-If Lab views">
        {tabs.map(([id, lbl]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={sub === id}
            data-active={sub === id ? 'true' : 'false'}
            onClick={() => setSub(id)}
            className="calc-whatif-subtab">
            {lbl}
          </button>
        ))}
      </div>

      <div className="calc-whatif-subbody" role="tabpanel">
        <Suspense fallback={<Fallback />}>
          {sub === 'tornado'  && <Tornado     input={props.input} calc={props.calc} />}
          {sub === 'drivers'  && <LiveDrivers input={props.input} calc={props.calc} setI={props.setI} />}
          {sub === 'goalseek' && <GoalSeek    input={props.input} calc={props.calc} setI={props.setI} />}
        </Suspense>
      </div>
    </div>
  );
}
