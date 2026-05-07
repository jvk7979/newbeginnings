import { useState, lazy, Suspense } from 'react';

// Lazy-import the five sub-views so each one ships in its own chunk.
// Previously they all bundled into the DeepDiveTab chunk (~33 KB);
// after this split, only the active sub-view ships on first paint
// and the others fetch in the background when the user clicks them.
// Mirrors the pattern used in WhatIfLab.jsx and the top-level
// CalculationsPage workspace switcher.
const PLStatement  = lazy(() => import('./deepdive/PLStatement'));
const CashFlow     = lazy(() => import('./deepdive/CashFlow'));
const CapexReturns = lazy(() => import('./deepdive/CapexReturns'));
const LoanSchedule = lazy(() => import('./deepdive/LoanSchedule'));
const Projection   = lazy(() => import('./deepdive/Projection'));

const Fallback = () => (
  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: '12px 0', color: '#888' }}>
    Loading…
  </div>
);

// Deep Dive workspace. Five sub-views — P&L Statement (banker's
// document), Cash Flow (waterfall), Capex & Returns (financing
// breakdown), Loan Schedule (amortisation chart), and the year-by-year
// Projection (chart + optional table).
export default function DeepDiveTab(props) {
  const [sub, setSub] = useState('pl');

  const tabs = [
    ['pl',         'P&L Statement'],
    ['cashflow',   'Cash Flow'],
    ['capex',      'Capex & Returns'],
    ['loan',       'Loan Schedule'],
    ['projection', `${Math.min(5, props.calc?.rows?.length ?? 5)}-Year Projection`],
  ];

  return (
    <div className="calc-deepdive">
      <div className="calc-deepdive-tabs" role="tablist" aria-label="Deep Dive views">
        {tabs.map(([id, lbl]) => (
          <button key={id}
            type="button"
            role="tab"
            aria-selected={sub === id}
            className="calc-deepdive-tab"
            data-active={sub === id ? 'true' : 'false'}
            onClick={() => setSub(id)}>
            {lbl}
          </button>
        ))}
      </div>

      <div className="calc-deepdive-body" role="tabpanel">
        <Suspense fallback={<Fallback />}>
          {sub === 'pl'         && <PLStatement   calc={props.calc} input={props.input} />}
          {sub === 'cashflow'   && <CashFlow      calc={props.calc} />}
          {sub === 'capex'      && <CapexReturns  calc={props.calc} input={props.input} dr={props.dr} tn={props.tn} irrColor={props.irrColor} npvColor={props.npvColor} paybackColor={props.paybackColor} dscrColor={props.dscrColor} setI={props.setI} setRow={props.setRow} addRow={props.addRow} delRow={props.delRow} />}
          {sub === 'loan'       && <LoanSchedule  calc={props.calc} input={props.input} />}
          {sub === 'projection' && <Projection    calc={props.calc} />}
        </Suspense>
      </div>
    </div>
  );
}
