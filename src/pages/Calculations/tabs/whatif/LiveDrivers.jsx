import { useState, useMemo } from 'react';
import { C } from '../../../../tokens';
import { runCalc } from '../../../../utils/calcEngine';
import { fmtINR } from '../../../../components/calc/primitives';

// Quick "what-if" sandbox: pick a single driver, slide it, watch the
// headline KPIs settle live. Doesn't mutate the saved input — flexes a
// throwaway runCalc on every render so the rail stays untouched. The
// "Apply to project" button writes the slider value back via setI() if
// the user wants to commit the change.
const DRIVERS = [
  {
    key: 'capacityCeilingPct',
    label: 'Capacity Ceiling',
    unit: '%',
    min: 10, max: 100, step: 5,
    read: (i) => Number(i.capacityCeilingPct ?? i.capacityPct ?? 80),
    patch: (v) => ({ capacityCeilingPct: v, capacityPct: v }),
  },
  {
    key: 'discountRate',
    label: 'Discount Rate',
    unit: '%',
    min: 1, max: 30, step: 0.5,
    read: (i) => Number(i.discountRate ?? 12),
    patch: (v) => ({ discountRate: v }),
  },
  {
    key: 'interestRate',
    label: 'Interest Rate',
    unit: '%',
    min: 0, max: 25, step: 0.5,
    read: (i) => Number(i.interestRate ?? 12),
    patch: (v) => ({ interestRate: v }),
  },
  {
    key: 'debtPct',
    label: 'Debt %',
    unit: '%',
    min: 0, max: 100, step: 5,
    read: (i) => Number(i.debtPct ?? 60),
    patch: (v) => ({ debtPct: v }),
  },
  {
    key: 'taxRate',
    label: 'Tax Rate',
    unit: '%',
    min: 0, max: 50, step: 0.5,
    read: (i) => Number(i.taxRate ?? 25),
    patch: (v) => ({ taxRate: v }),
  },
  {
    key: 'revenueInflationPct',
    label: 'Revenue Inflation',
    unit: '%/yr',
    min: -10, max: 20, step: 0.5,
    read: (i) => Number(i.revenueInflationPct ?? 0),
    patch: (v) => ({ revenueInflationPct: v }),
  },
  {
    key: 'costInflationPct',
    label: 'Cost Inflation',
    unit: '%/yr',
    min: -10, max: 20, step: 0.5,
    read: (i) => Number(i.costInflationPct ?? 0),
    patch: (v) => ({ costInflationPct: v }),
  },
];

export default function LiveDrivers({ input, calc, setI }) {
  const [driverKey, setDriverKey] = useState('capacityCeilingPct');
  const driver = DRIVERS.find(d => d.key === driverKey) || DRIVERS[0];
  const baseValue = driver.read(input);
  const [value, setValue] = useState(baseValue);

  // Reset slider when the user switches drivers (the new driver's
  // current value is the natural starting point).
  const handleDriverChange = (key) => {
    setDriverKey(key);
    const next = DRIVERS.find(d => d.key === key) || DRIVERS[0];
    setValue(next.read(input));
  };

  // Flexed snapshot — re-runs runCalc with the patch applied. Cheap;
  // single calc engine pass per render.
  const flexed = useMemo(() => {
    return runCalc({ ...input, ...driver.patch(value) });
  }, [input, driver, value]);

  // Deltas vs the project's saved state (calc, passed in from the
  // orchestrator — that's what the rail is currently set to).
  const deltaIRR     = (flexed.irr ?? 0) - (calc.irr ?? 0);
  const deltaEbitda  = flexed.ebitda - calc.ebitda;
  const deltaNPV     = flexed.npv - calc.npv;
  const deltaPayback = (flexed.payback ?? Infinity) - (calc.payback ?? Infinity);

  const fmtDelta = (v, suffix = '') => {
    if (!isFinite(v)) return '—';
    const sign = v > 0 ? '+' : (v < 0 ? '' : '');
    return `${sign}${typeof v === 'number' ? v.toFixed(suffix === '' ? 0 : 1) : v}${suffix}`;
  };

  const apply = () => setI(driver.patch(value));
  const reset = () => setValue(baseValue);

  return (
    <div className="calc-livedrivers">
      <div className="calc-livedrivers-head">
        <div>
          <div className="calc-livedrivers-title">Live Drivers</div>
          <div className="calc-livedrivers-sub">Slide a single lever, watch the KPIs settle. The rail stays untouched until you Apply.</div>
        </div>
        <select
          value={driverKey}
          onChange={e => handleDriverChange(e.target.value)}
          className="calc-livedrivers-picker">
          {DRIVERS.map(d => (
            <option key={d.key} value={d.key}>{d.label}</option>
          ))}
        </select>
      </div>

      {/* Big slider with current value */}
      <div className="calc-livedrivers-slider-row">
        <div className="calc-livedrivers-value">
          {value}<small>{driver.unit}</small>
        </div>
        <input
          type="range"
          min={driver.min}
          max={driver.max}
          step={driver.step}
          value={value}
          onChange={e => setValue(Number(e.target.value))}
          className="calc-livedrivers-range"
          aria-label={`${driver.label} slider`} />
      </div>
      <div className="calc-livedrivers-bounds">
        <span>{driver.min}{driver.unit}</span>
        <span>Saved: <strong>{baseValue}{driver.unit}</strong></span>
        <span>{driver.max}{driver.unit}</span>
      </div>

      {/* Live KPI strip */}
      <div className="calc-livedrivers-kpis">
        {[
          {
            label: 'IRR',
            value: flexed.irr !== null ? `${flexed.irr.toFixed(1)}%` : '—',
            delta: calc.irr !== null && flexed.irr !== null ? `${fmtDelta(deltaIRR, '%')}` : null,
            positive: deltaIRR > 0.01,
            negative: deltaIRR < -0.01,
          },
          {
            label: 'EBITDA',
            value: fmtINR(flexed.ebitda),
            delta: calc.ebitda !== flexed.ebitda ? `${deltaEbitda > 0 ? '+' : ''}${fmtINR(deltaEbitda)}` : null,
            positive: deltaEbitda > 0,
            negative: deltaEbitda < 0,
          },
          {
            label: 'NPV',
            value: fmtINR(flexed.npv),
            delta: Math.abs(deltaNPV) > 1 ? `${deltaNPV > 0 ? '+' : ''}${fmtINR(deltaNPV)}` : null,
            positive: deltaNPV > 0,
            negative: deltaNPV < 0,
          },
          {
            label: 'Payback',
            value: flexed.payback !== null ? `${flexed.payback} yr${flexed.payback !== 1 ? 's' : ''}` : '> life',
            // Lower payback is better, so positive delta = worse
            delta: calc.payback !== null && flexed.payback !== null && deltaPayback !== 0
              ? `${deltaPayback > 0 ? '+' : ''}${deltaPayback} yr${Math.abs(deltaPayback) !== 1 ? 's' : ''}`
              : null,
            positive: deltaPayback < 0,
            negative: deltaPayback > 0,
          },
        ].map(t => (
          <div key={t.label} className="calc-livedrivers-kpi">
            <div className="calc-livedrivers-kpi-label">{t.label}</div>
            <div className="calc-livedrivers-kpi-value">{t.value}</div>
            {t.delta && (
              <div className="calc-livedrivers-kpi-delta"
                   data-pos={t.positive ? 'true' : 'false'}
                   data-neg={t.negative ? 'true' : 'false'}>
                {t.delta}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Apply / Reset */}
      <div className="calc-livedrivers-actions">
        <button type="button" onClick={reset} className="calc-livedrivers-btn secondary"
                disabled={value === baseValue}>
          Reset to saved
        </button>
        <button type="button" onClick={apply} className="calc-livedrivers-btn primary"
                disabled={value === baseValue}>
          Apply to project
        </button>
      </div>
    </div>
  );
}
