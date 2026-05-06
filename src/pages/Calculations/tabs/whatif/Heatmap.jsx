import { useState, useMemo } from 'react';
import { C } from '../../../../tokens';
import { runCalc } from '../../../../utils/calcEngine';
import { fmtINR } from '../../../../components/calc/primitives';

// 2D Sensitivity Heatmap. Pick X-axis driver, Y-axis driver, and a
// metric to shade. Engine grid-runs runCalc 7×7 = 49 times across the
// driver ranges. Cells coloured red (worst) → amber → green (best)
// using the metric's higherWins direction. The cell containing the
// user's current saved values gets a bordered highlight. Hover any
// cell to see exact values + driver levels.

const AXES = [
  {
    key: 'capacityCeilingPct', label: 'Capacity Ceiling', unit: '%',
    min: 30, max: 100, steps: 7,
    read: (i) => Number(i.capacityCeilingPct ?? i.capacityPct ?? 80),
    patch: (v) => ({ capacityCeilingPct: v, capacityPct: v }),
  },
  {
    key: 'interestRate', label: 'Interest Rate', unit: '%',
    min: 6, max: 18, steps: 7,
    read: (i) => Number(i.interestRate ?? 12),
    patch: (v) => ({ interestRate: v }),
  },
  {
    key: 'capex', label: 'Total CAPEX', unit: '₹',
    min: 1000000, max: 50000000, steps: 7,
    read: (i) => Number(i.capex || 0),
    patch: (v) => ({ capex: v, capexRows: [] }),
  },
  {
    key: 'debtPct', label: 'Debt %', unit: '%',
    min: 30, max: 80, steps: 6,
    read: (i) => Number(i.debtPct ?? 60),
    patch: (v) => ({ debtPct: v }),
  },
  {
    key: 'taxRate', label: 'Tax Rate', unit: '%',
    min: 15, max: 35, steps: 5,
    read: (i) => Number(i.taxRate ?? 25),
    patch: (v) => ({ taxRate: v }),
  },
  {
    key: 'salePriceMult', label: 'Sale-Price ×', unit: '×',
    min: 0.7, max: 1.3, steps: 7,
    read: () => 1,
    patch: null, // resolved in component (needs `input`)
  },
  {
    key: 'varCostMult', label: 'Variable-Cost ×', unit: '×',
    min: 0.7, max: 1.3, steps: 7,
    read: () => 1,
    patch: null,
  },
];

const METRICS = [
  { key: 'irr',     label: 'IRR',         higherWins: true,  fmt: (r) => r.irr  !== null ? `${r.irr.toFixed(1)}%` : '—', score: (r) => r.irr ?? -Infinity },
  { key: 'npv',     label: 'NPV',         higherWins: true,  fmt: (r) => fmtINR(r.npv),                                  score: (r) => r.npv ?? -Infinity },
  { key: 'ebitda',  label: 'EBITDA Y1',   higherWins: true,  fmt: (r) => fmtINR(r.rows[0]?.ebitda ?? 0),                 score: (r) => r.rows[0]?.ebitda ?? 0 },
  { key: 'payback', label: 'Payback',     higherWins: false, fmt: (r) => r.payback !== null ? `${r.payback}y` : '> life', score: (r) => r.payback ?? 99 },
  { key: 'dscrY1',  label: 'Y1 DSCR',     higherWins: true,  fmt: (r) => r.dscrY1 !== null ? r.dscrY1.toFixed(2) : '—',  score: (r) => r.dscrY1 ?? 0 },
];

// Linearly interpolate a colour from red → amber → green as t moves
// from 0 → 0.5 → 1. Returns `rgb(r,g,b)`.
function ramp(t) {
  const clamped = Math.max(0, Math.min(1, t));
  if (clamped < 0.5) {
    // red (#dc2626) → amber (#eab308)
    const k = clamped / 0.5;
    return `rgb(${Math.round(220 + (234 - 220) * k)}, ${Math.round(38 + (179 - 38) * k)}, ${Math.round(38 + (8 - 38) * k)})`;
  } else {
    // amber (#eab308) → green (#16a34a)
    const k = (clamped - 0.5) / 0.5;
    return `rgb(${Math.round(234 + (22 - 234) * k)}, ${Math.round(179 + (163 - 179) * k)}, ${Math.round(8 + (74 - 8) * k)})`;
  }
}

function fmtAxisVal(axis, v) {
  if (axis.unit === '₹') return fmtINR(v);
  if (axis.unit === '×') return `${v.toFixed(2)}×`;
  return `${typeof v === 'number' ? v.toFixed(0) : v}${axis.unit}`;
}

export default function Heatmap({ input, calc }) {
  const [xKey, setXKey] = useState('capacityCeilingPct');
  const [yKey, setYKey] = useState('interestRate');
  const [metricKey, setMetricKey] = useState('irr');

  const xAxis = AXES.find(a => a.key === xKey) || AXES[0];
  const yAxis = AXES.find(a => a.key === yKey) || AXES[1];
  const metric = METRICS.find(m => m.key === metricKey) || METRICS[0];

  // Resolve patch fns for multiplier axes (need closure over input)
  const resolvePatch = (axis) => {
    if (axis.key === 'salePriceMult') {
      return (v) => ({
        revenueRows: input.revenueRows.map(r => ({ ...r, price: Number(r.price || 0) * v })),
      });
    }
    if (axis.key === 'varCostMult') {
      return (v) => ({
        varRows: input.varRows.map(r => ({ ...r, price: Number(r.price || 0) * v })),
      });
    }
    return axis.patch;
  };

  const xPatch = resolvePatch(xAxis);
  const yPatch = resolvePatch(yAxis);

  // Build the grid + scores + min/max for normalisation. useMemo so we
  // only re-run runCalc when an axis or the input changes.
  const { rows, gridMin, gridMax, savedX, savedY } = useMemo(() => {
    const xSteps = xAxis.steps;
    const ySteps = yAxis.steps;
    const xValues = Array.from({ length: xSteps }, (_, i) =>
      xAxis.min + ((xAxis.max - xAxis.min) * i) / Math.max(1, xSteps - 1));
    const yValues = Array.from({ length: ySteps }, (_, i) =>
      yAxis.min + ((yAxis.max - yAxis.min) * i) / Math.max(1, ySteps - 1));

    const result = [];
    let gMin = Infinity, gMax = -Infinity;
    for (let yi = 0; yi < ySteps; yi++) {
      const row = [];
      for (let xi = 0; xi < xSteps; xi++) {
        const xv = xValues[xi];
        const yv = yValues[yi];
        const r = runCalc({ ...input, ...xPatch(xv), ...yPatch(yv) });
        const s = metric.score(r);
        if (isFinite(s)) {
          gMin = Math.min(gMin, s);
          gMax = Math.max(gMax, s);
        }
        row.push({ x: xv, y: yv, score: s, result: r });
      }
      result.push({ y: yValues[yi], cells: row });
    }
    return {
      rows: result,
      gridMin: gMin,
      gridMax: gMax,
      savedX: xAxis.read(input),
      savedY: yAxis.read(input),
    };
  }, [input, xAxis, yAxis, metric, xPatch, yPatch]);

  const range = gridMax - gridMin || 1;
  const normalise = (s) => {
    if (!isFinite(s)) return 0;
    const t = (s - gridMin) / range;
    return metric.higherWins ? t : 1 - t;
  };

  // Detect which cell contains the saved values (closest in both
  // dimensions) so we can highlight it.
  const closestCell = useMemo(() => {
    const xSteps = xAxis.steps;
    const ySteps = yAxis.steps;
    const xStep = (xAxis.max - xAxis.min) / Math.max(1, xSteps - 1);
    const yStep = (yAxis.max - yAxis.min) / Math.max(1, ySteps - 1);
    const xi = Math.max(0, Math.min(xSteps - 1, Math.round((savedX - xAxis.min) / xStep)));
    const yi = Math.max(0, Math.min(ySteps - 1, Math.round((savedY - yAxis.min) / yStep)));
    return { xi, yi };
  }, [savedX, savedY, xAxis, yAxis]);

  return (
    <div className="calc-heatmap">
      <div className="calc-heatmap-head">
        <div>
          <div className="calc-heatmap-title">Sensitivity Heatmap</div>
          <div className="calc-heatmap-sub">
            Two drivers vs the metric. Red = worst, green = best. The cell
            ringed in sage is your saved value.
          </div>
        </div>
      </div>

      {/* Picker row — X axis / Y axis / metric */}
      <div className="calc-heatmap-pickers">
        <label>
          <span>X axis</span>
          <select value={xKey} onChange={e => setXKey(e.target.value)}>
            {AXES.filter(a => a.key !== yKey).map(a => <option key={a.key} value={a.key}>{a.label}</option>)}
          </select>
        </label>
        <label>
          <span>Y axis</span>
          <select value={yKey} onChange={e => setYKey(e.target.value)}>
            {AXES.filter(a => a.key !== xKey).map(a => <option key={a.key} value={a.key}>{a.label}</option>)}
          </select>
        </label>
        <label>
          <span>Metric</span>
          <select value={metricKey} onChange={e => setMetricKey(e.target.value)}>
            {METRICS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
        </label>
      </div>

      {/* Grid: a single overflow-wrapping CSS-grid with X labels on top
          and Y labels on the left. Use grid-template so columns and rows
          line up cleanly. */}
      <div className="calc-heatmap-table-wrap">
        <table className="calc-heatmap-table">
          <thead>
            <tr>
              <th className="calc-heatmap-corner">
                <span>{yAxis.label}</span>
                <small>↓ {xAxis.label} →</small>
              </th>
              {rows[0]?.cells.map((c, xi) => (
                <th key={xi} className="calc-heatmap-x-label">{fmtAxisVal(xAxis, c.x)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice().reverse().map((row, yiReversed) => {
              const yi = rows.length - 1 - yiReversed;
              return (
                <tr key={yi}>
                  <th className="calc-heatmap-y-label">{fmtAxisVal(yAxis, row.y)}</th>
                  {row.cells.map((cell, xi) => {
                    const t = normalise(cell.score);
                    const bg = ramp(t);
                    const isSaved = xi === closestCell.xi && yi === closestCell.yi;
                    return (
                      <td
                        key={xi}
                        className="calc-heatmap-cell"
                        data-saved={isSaved ? 'true' : 'false'}
                        style={{ background: bg }}
                        title={`${xAxis.label}: ${fmtAxisVal(xAxis, cell.x)}\n${yAxis.label}: ${fmtAxisVal(yAxis, cell.y)}\n${metric.label}: ${metric.fmt(cell.result)}`}>
                        {metric.fmt(cell.result)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Colour-ramp legend */}
      <div className="calc-heatmap-legend">
        <span className="calc-heatmap-legend-label">Worst</span>
        <div className="calc-heatmap-legend-bar" />
        <span className="calc-heatmap-legend-label">Best</span>
        <span className="calc-heatmap-legend-saved-key">
          <span className="calc-heatmap-legend-saved-swatch" /> Saved
        </span>
      </div>

      <div className="calc-heatmap-hint">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14" height="14">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <circle cx="12" cy="16" r="0.5" fill="currentColor"/>
        </svg>
        <span>Hover a cell to see exact axis values + the metric. Each grid run is a fresh runCalc, so the grid reflects the live input including subsidies, capex breakdown, capacity ramp, and inflation.</span>
      </div>
    </div>
  );
}
