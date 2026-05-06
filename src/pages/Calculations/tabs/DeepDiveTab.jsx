import { useState } from 'react';
import PLStatement from './deepdive/PLStatement';
import CashFlow from './deepdive/CashFlow';
import CapexReturns from './deepdive/CapexReturns';
import Projection from './deepdive/Projection';

// Deep Dive workspace. Four sub-views — P&L Statement (banker's
// document), Cash Flow (waterfall view of the same numbers), Capex &
// Returns (financing breakdown), and the year-by-year Projection
// (chart + optional table).
export default function DeepDiveTab(props) {
  const [sub, setSub] = useState('pl');

  const tabs = [
    ['pl',         'P&L Statement'],
    ['cashflow',   'Cash Flow'],
    ['capex',      'Capex & Returns'],
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
        {sub === 'pl'         && <PLStatement   calc={props.calc} input={props.input} />}
        {sub === 'cashflow'   && <CashFlow      calc={props.calc} />}
        {sub === 'capex'      && <CapexReturns  calc={props.calc} input={props.input} dr={props.dr} tn={props.tn} irrColor={props.irrColor} npvColor={props.npvColor} paybackColor={props.paybackColor} dscrColor={props.dscrColor} setI={props.setI} setRow={props.setRow} addRow={props.addRow} delRow={props.delRow} />}
        {sub === 'projection' && <Projection    calc={props.calc} />}
      </div>
    </div>
  );
}
