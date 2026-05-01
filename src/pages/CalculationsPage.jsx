import { useState, useMemo } from 'react';
import { C, alpha } from '../tokens';


const PRODUCT_COLORS = ['#b5860d', '#2563a8', '#2d7a3c', '#7c3d9a', '#c0392b', '#0891b2', '#d97706'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtINR(n) {
  if (n === null || n === undefined || !isFinite(n)) return '—';
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(2)} Cr`;
  if (abs >= 100000)   return `${sign}₹${(abs / 100000).toFixed(1)} L`;
  if (abs >= 1000)     return `${sign}₹${(abs / 1000).toFixed(1)} K`;
  return `${sign}₹${abs.toFixed(0)}`;
}

function calcIRR(cashFlows) {
  if (!cashFlows[0] || cashFlows[0] >= 0) return null;
  let rate = 0.15;
  for (let i = 0; i < 200; i++) {
    let npv = 0, dnpv = 0;
    for (let t = 0; t < cashFlows.length; t++) {
      const pv = Math.pow(1 + rate, t);
      npv  += cashFlows[t] / pv;
      dnpv -= t * cashFlows[t] / (pv * (1 + rate));
    }
    if (Math.abs(dnpv) < 1e-10) break;
    const next = rate - npv / dnpv;
    if (!isFinite(next)) break;
    if (Math.abs(next - rate) < 1e-9) { rate = next; break; }
    rate = Math.max(-0.99, Math.min(next, 5));
  }
  return (rate > -0.99 && rate < 5) ? rate * 100 : null;
}

// ─── DonutChart ───────────────────────────────────────────────────────────────

function DonutChart({ segments, totalLabel }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return (
    <svg viewBox="0 0 100 100" width={120} height={120}>
      <circle cx="50" cy="50" r="38" fill="none" stroke={C.border} strokeWidth="16" />
    </svg>
  );
  if (segments.length === 1) return (
    <svg viewBox="0 0 100 100" width={130} height={130}>
      <circle cx="50" cy="50" r="38" fill="none" stroke={segments[0].color} strokeWidth="16" />
      <text x="50" y="46" textAnchor="middle" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '9px', fill: C.fg3 }}>TOTAL</text>
      <text x="50" y="60" textAnchor="middle" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: 'bold', fill: C.fg1 }}>{totalLabel}</text>
    </svg>
  );
  const R = 38, IR = 22, cx = 50, cy = 50;
  let angle = -Math.PI / 2;
  const arcs = segments.map(seg => {
    const sweep = (seg.value / total) * 2 * Math.PI;
    const cos1 = Math.cos(angle), sin1 = Math.sin(angle);
    const cos2 = Math.cos(angle + sweep), sin2 = Math.sin(angle + sweep);
    const x1 = cx + R * cos1, y1 = cy + R * sin1;
    const x2 = cx + R * cos2, y2 = cy + R * sin2;
    const ix1 = cx + IR * cos1, iy1 = cy + IR * sin1;
    const ix2 = cx + IR * cos2, iy2 = cy + IR * sin2;
    const large = sweep > Math.PI ? 1 : 0;
    const path = `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} L ${ix2.toFixed(2)} ${iy2.toFixed(2)} A ${IR} ${IR} 0 ${large} 0 ${ix1.toFixed(2)} ${iy1.toFixed(2)} Z`;
    angle += sweep;
    return { ...seg, path };
  });
  return (
    <svg viewBox="0 0 100 100" width={130} height={130}>
      {arcs.map((seg, i) => <path key={i} d={seg.path} fill={seg.color} />)}
      <text x="50" y="46" textAnchor="middle" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '9px', fill: C.fg3 }}>TOTAL</text>
      <text x="50" y="60" textAnchor="middle" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: 'bold', fill: C.fg1 }}>{totalLabel}</text>
    </svg>
  );
}

// ─── Section (collapsible) ────────────────────────────────────────────────────

function Section({ id, label, open, onToggle, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <button onClick={() => onToggle(id)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '5px 0', marginBottom: open ? 8 : 0 }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: C.fg3, whiteSpace: 'nowrap' }}>{label}</span>
        <div style={{ flex: 1, height: 1, background: C.border }} />
        <svg viewBox="0 0 24 24" fill="none" stroke={C.fg3} strokeWidth="2" strokeLinecap="round" width="10" height="10"
          style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 150ms', flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

const IS = { fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'inherit', background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 5, padding: '5px 8px', width: '100%', boxSizing: 'border-box', outline: 'none' };

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CalculationsPage() {
  const [projectName, setProjectName]   = useState('');
  const [capex, setCapex]               = useState(0);
  const [lifetime, setLifetime]         = useState(10);
  const [discountRate, setDiscountRate] = useState(12);
  const [debtPct, setDebtPct]           = useState(60);
  const [interestRate, setInterestRate] = useState(10);
  const [tenure, setTenure]             = useState(7);
  const [pmegpEnabled, setPmegpEnabled] = useState(false);
  const [pmegpPct, setPmegpPct]         = useState(25);
  const [citusEnabled, setCitusEnabled] = useState(false);
  const [apmsmeEnabled, setApmsmeEnabled] = useState(false);
  const [revenueRows, setRevenueRows]   = useState([{ id: 1, name: '', unit: '', price: 0, qty: 0 }]);
  const [varRows, setVarRows]           = useState([]);
  const [fixedRows, setFixedRows]       = useState([{ id: 1, name: '', amount: 0 }]);
  const [receivableDays, setReceivableDays] = useState(30);
  const [payableDays, setPayableDays]   = useState(15);
  const [inventoryDays, setInventoryDays] = useState(20);
  const [capacityPct, setCapacityPct]   = useState(100);
  const [openSections, setOpenSections] = useState(['capacity', 'products', 'costs', 'financing', 'wc']);
  const [costTab, setCostTab]           = useState('fixed');
  const [rightTab, setRightTab]         = useState('summary');

  const toggleSection = (id) => setOpenSections(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const updateRevenueRow = (id, f, v) => setRevenueRows(rs => rs.map(r => r.id === id ? {...r, [f]: v} : r));
  const addRevenueRow    = () => setRevenueRows(rs => [...rs, { id: Date.now(), name: '', unit: '', price: 0, qty: 0 }]);
  const removeRevenueRow = (id) => setRevenueRows(rs => rs.filter(r => r.id !== id));

  const updateVarRow = (id, f, v) => setVarRows(rs => rs.map(r => r.id === id ? {...r, [f]: v} : r));
  const addVarRow    = () => setVarRows(rs => [...rs, { id: Date.now(), name: '', unit: '', price: 0, qty: 0 }]);
  const removeVarRow = (id) => setVarRows(rs => rs.filter(r => r.id !== id));

  const updateFixedRow = (id, f, v) => setFixedRows(rs => rs.map(r => r.id === id ? {...r, [f]: v} : r));
  const addFixedRow    = () => setFixedRows(rs => [...rs, { id: Date.now(), name: '', amount: 0 }]);
  const removeFixedRow = (id) => setFixedRows(rs => rs.filter(r => r.id !== id));

  // ── Calculation engine ──────────────────────────────────────────────────────

  const calc = useMemo(() => {
    const pmegp  = pmegpEnabled ? pmegpPct / 100 : 0;
    const citus  = citusEnabled ? 0.25 : 0;
    const apmsme = apmsmeEnabled ? 0.20 : 0;
    const effectiveCapex  = capex * (1 - pmegp) * (1 - citus) * (1 - apmsme);
    const loan            = effectiveCapex * (debtPct / 100);
    const equity          = effectiveCapex * ((100 - debtPct) / 100);
    const annualPrincipal = tenure > 0 ? loan / tenure : 0;
    const cap             = capacityPct / 100;

    const fullRevenue       = revenueRows.reduce((s, r) => s + (Number(r.price) || 0) * (Number(r.qty) || 0), 0);
    const fullVariableCosts = varRows.reduce((s, r) => s + (Number(r.price) || 0) * (Number(r.qty) || 0), 0);
    const fixedCosts        = fixedRows.reduce((s, r) => s + (Number(r.amount) || 0), 0);

    const revenue       = fullRevenue * cap;
    const variableCosts = fullVariableCosts * cap;
    const ebitda        = revenue - variableCosts - fixedCosts;
    const ebitdaMargin  = revenue > 0 ? (ebitda / revenue) * 100 : 0;

    const breakEvenCapacity = (fullRevenue - fullVariableCosts) > 0
      ? (fixedCosts / (fullRevenue - fullVariableCosts)) * 100
      : null;

    const rows = [];
    let wdvBook = capex;
    let cumNCF  = -equity;
    for (let t = 1; t <= lifetime; t++) {
      const depreciation = wdvBook * 0.15;
      wdvBook = Math.max(0, wdvBook - depreciation);
      const loanBalance = Math.max(0, loan - (t - 1) * annualPrincipal);
      const principal   = t <= tenure ? annualPrincipal : 0;
      const interest    = loanBalance * (interestRate / 100);
      const ebit        = ebitda - depreciation;
      const ebt         = ebit - interest;
      const tax         = Math.max(0, ebt * 0.30);
      const pat         = ebt - tax;
      const ncf         = pat + depreciation - principal;
      cumNCF += ncf;
      const dscr = (principal + interest) > 0 ? ebitda / (principal + interest) : null;
      rows.push({ t, revenue, variableCosts, fixedCosts, ebitda, depreciation, interest, ebt, tax, pat, principal, ncf, cumNCF, dscr, loanBalance });
    }

    const cashFlows = [-equity, ...rows.map(r => r.ncf)];
    const irr = equity > 0 ? calcIRR(cashFlows) : null;

    const r   = discountRate / 100;
    const npv = cashFlows.reduce((s, cf, t) => s + cf / Math.pow(1 + r, t), 0);

    const paybackRow = rows.find(row => row.cumNCF >= 0);
    const payback    = paybackRow ? paybackRow.t : null;

    const varPct       = revenue > 0 ? variableCosts / revenue : 0;
    const breakEvenRev = revenue > 0 && (1 - varPct) > 0 ? fixedCosts / (1 - varPct) : null;

    const workingCapital = revenue > 0
      ? (receivableDays + inventoryDays - payableDays) * revenue / 365
      : 0;

    const revenueByProduct = revenueRows.map((row, i) => ({
      name: row.name || `Product ${i + 1}`,
      value: (Number(row.price) || 0) * (Number(row.qty) || 0) * cap,
      color: PRODUCT_COLORS[i % PRODUCT_COLORS.length],
    })).filter(s => s.value > 0);

    const dscrY1 = rows[0]?.dscr ?? null;

    return {
      effectiveCapex, equity, revenue, variableCosts, fixedCosts, ebitda, ebitdaMargin,
      rows, irr, npv, payback, breakEvenRev, breakEvenCapacity, workingCapital,
      revenueByProduct, dscrY1,
    };
  }, [capex, lifetime, discountRate, debtPct, interestRate, tenure,
      pmegpEnabled, pmegpPct, citusEnabled, apmsmeEnabled,
      revenueRows, varRows, fixedRows,
      receivableDays, payableDays, inventoryDays, capacityPct]);

  // ── Insight text ─────────────────────────────────────────────────────────────

  const insight = useMemo(() => {
    const { irr, payback } = calc;
    if (irr === null && payback === null)
      return { verdict: 'Add data', text: 'Enter revenue and cost rows to see projections.', positive: false };
    if (irr !== null && irr > discountRate * 1.5 && payback !== null && payback < tenure * 0.6)
      return { verdict: `Strong returns at ${capacityPct}% capacity`, text: `Payback in ${payback} yr${payback !== 1 ? 's' : ''} with IRR of ${irr.toFixed(0)}% — comfortably exceeds cost of capital.`, positive: true };
    if (irr !== null && irr > discountRate && payback !== null && payback <= tenure)
      return { verdict: `Viable at ${capacityPct}% capacity`, text: `Payback in ${payback} yr${payback !== 1 ? 's' : ''} with IRR of ${irr.toFixed(1)}% — meets the ${discountRate}% hurdle rate.`, positive: true };
    return { verdict: `Marginal at ${capacityPct}% capacity`, text: `IRR of ${irr !== null ? irr.toFixed(1) + '%' : '—'} does not meet the ${discountRate}% hurdle rate. Review pricing or cost structure.`, positive: false };
  }, [calc, discountRate, tenure, capacityPct]);

  // ── Color helpers ─────────────────────────────────────────────────────────────

  const irrColor     = calc.irr === null ? C.fg3 : calc.irr > discountRate + 3 ? '#2a7d3c' : calc.irr > discountRate - 3 ? '#b06000' : '#c0392b';
  const npvColor     = !isFinite(calc.npv) ? C.fg3 : calc.npv > 0 ? '#2a7d3c' : '#c0392b';
  const paybackColor = calc.payback === null ? C.fg3 : calc.payback < tenure * 0.6 ? '#2a7d3c' : calc.payback < tenure * 0.8 ? '#b06000' : '#c0392b';
  const dscrColor    = calc.dscrY1 === null ? C.fg3 : calc.dscrY1 >= 1.5 ? '#2a7d3c' : calc.dscrY1 >= 1.25 ? '#b06000' : '#c0392b';
  const ebitdaColor  = calc.ebitda > 0 ? '#2a7d3c' : '#c0392b';

  const sliderMin = 10, sliderMax = 100;
  const bePct  = calc.breakEvenCapacity !== null ? Math.min(sliderMax, Math.max(sliderMin, calc.breakEvenCapacity)) : null;
  const beLeft = bePct !== null ? `${((bePct - sliderMin) / (sliderMax - sliderMin)) * 100}%` : null;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: C.bg0 }}>

      {/* ── Top metric bar ──────────────────────────────────────────────────── */}
      <div style={{ background: C.bg1, borderBottom: `1px solid ${C.border}`, padding: '12px 20px', flexShrink: 0, display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {[
          { label: 'Annual Revenue', value: fmtINR(calc.revenue), sub: null, color: C.fg1 },
          { label: 'EBITDA', value: fmtINR(calc.ebitda), sub: `${calc.ebitdaMargin.toFixed(0)}% margin`, color: ebitdaColor },
          { label: 'IRR', value: calc.irr !== null ? `${calc.irr.toFixed(0)}%` : '—', sub: `vs ${discountRate}% hurdle`, color: irrColor },
          { label: 'Payback', value: calc.payback !== null ? `${calc.payback} yr${calc.payback !== 1 ? 's' : ''}` : '—', sub: `${tenure}-yr tenure`, color: paybackColor },
        ].map(m => (
          <div key={m.label}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: C.fg3, marginBottom: 3 }}>{m.label}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 26, fontWeight: 800, color: m.color, lineHeight: 1 }}>{m.value}</div>
            {m.sub && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, marginTop: 2 }}>{m.sub}</div>}
          </div>
        ))}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          {insight.positive && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: alpha(C.accent, 22), border: `1px solid ${alpha(C.accent, 55)}`, borderRadius: 20, padding: '5px 14px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round" width="13" height="13"><polyline points="20 6 9 17 4 12"/></svg>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: C.accent }}>{insight.verdict}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Two-panel split ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* ── LEFT PANEL: Inputs ──────────────────────────────────────────────── */}
        <div style={{ width: '40%', minWidth: 280, overflowY: 'auto', borderRight: `1px solid ${C.border}`, padding: '16px 14px' }}>

          {/* Capacity Utilisation */}
          <Section id="capacity" label="Capacity Utilisation" open={openSections.includes('capacity')} onToggle={toggleSection}>
            <div style={{ textAlign: 'center', marginBottom: 6 }}>
              <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 56, fontWeight: 700, color: C.accent, lineHeight: 1 }}>{capacityPct}</span>
              <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 32, fontWeight: 700, color: C.accent }}>%</span>
            </div>
            <div style={{ position: 'relative', marginBottom: 18, paddingTop: 18 }}>
              {beLeft && (
                <div style={{ position: 'absolute', top: 0, left: beLeft, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, pointerEvents: 'none' }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: C.fg3, whiteSpace: 'nowrap' }}>break-even {Math.round(bePct)}%</span>
                  <div style={{ width: 1, height: 8, background: C.fg3 }} />
                </div>
              )}
              <input type="range" min={sliderMin} max={sliderMax} step={5} value={capacityPct}
                onChange={e => setCapacityPct(Number(e.target.value))}
                style={{ width: '100%', accentColor: C.accent, cursor: 'pointer' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3 }}>10%</span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3 }}>100%</span>
              </div>
            </div>
          </Section>

          {/* Product Mix (revenue rows) */}
          <Section id="products" label="Product Mix" open={openSections.includes('products')} onToggle={toggleSection}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 0.7fr 0.7fr 0.7fr auto', gap: 4, marginBottom: 4, alignItems: 'center' }}>
              {['Product', 'Unit', 'Price ₹', 'Qty/yr', ''].map((h, i) => (
                <div key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: C.fg3, paddingLeft: i === 0 ? 14 : 0 }}>{h}</div>
              ))}
            </div>
            {revenueRows.map((row, i) => (
              <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '1.8fr 0.7fr 0.7fr 0.7fr auto', gap: 4, marginBottom: 5, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: PRODUCT_COLORS[i % PRODUCT_COLORS.length], flexShrink: 0 }} />
                  <input value={row.name} placeholder="Product" onChange={e => updateRevenueRow(row.id, 'name', e.target.value)} style={{ ...IS, flex: 1 }} />
                </div>
                <input value={row.unit} placeholder="kg" onChange={e => updateRevenueRow(row.id, 'unit', e.target.value)} style={IS} />
                <input type="number" value={row.price} min={0} onChange={e => updateRevenueRow(row.id, 'price', e.target.value)} style={IS} />
                <input type="number" value={row.qty} min={0} onChange={e => updateRevenueRow(row.id, 'qty', e.target.value)} style={IS} />
                <button onClick={() => removeRevenueRow(row.id)} disabled={revenueRows.length === 1}
                  style={{ background: 'none', border: 'none', cursor: revenueRows.length === 1 ? 'default' : 'pointer', color: revenueRows.length === 1 ? C.fg3 : '#c0392b', fontSize: 16, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}>×</button>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
              <button onClick={addRevenueRow} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.accent, background: 'none', border: `1px dashed ${alpha(C.accent, 66)}`, borderRadius: 5, padding: '3px 10px', cursor: 'pointer' }}>+ Add product</button>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg2 }}>{fmtINR(calc.revenue)}/yr at {capacityPct}%</span>
            </div>
          </Section>

          {/* Costs */}
          <Section id="costs" label="Costs" open={openSections.includes('costs')} onToggle={toggleSection}>
            <div style={{ display: 'flex', gap: 0, marginBottom: 10, borderBottom: `1px solid ${C.border}` }}>
              {[['variable', 'Variable'], ['fixed', 'Fixed']].map(([id, lbl]) => (
                <button key={id} onClick={() => setCostTab(id)}
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: costTab === id ? 700 : 400, color: costTab === id ? C.accent : C.fg3, background: 'none', border: 'none', borderBottom: `2px solid ${costTab === id ? C.accent : 'transparent'}`, padding: '3px 12px 7px', cursor: 'pointer' }}>
                  {lbl}
                </button>
              ))}
            </div>
            {costTab === 'variable' ? (
              <>
                {varRows.length === 0 && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, marginBottom: 8 }}>No variable costs — add raw materials, packaging, etc.</div>}
                {varRows.map((row, i) => (
                  <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '1.8fr 0.7fr 0.7fr 0.7fr auto', gap: 4, marginBottom: 5, alignItems: 'center' }}>
                    {i === 0 && ['Item', 'Unit', 'Cost ₹', 'Qty/yr', ''].map((h, j) => <div key={j} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: C.fg3 }}>{h}</div>)}
                    <input value={row.name} placeholder="Material" onChange={e => updateVarRow(row.id, 'name', e.target.value)} style={IS} />
                    <input value={row.unit} placeholder="kg" onChange={e => updateVarRow(row.id, 'unit', e.target.value)} style={IS} />
                    <input type="number" value={row.price} min={0} onChange={e => updateVarRow(row.id, 'price', e.target.value)} style={IS} />
                    <input type="number" value={row.qty} min={0} onChange={e => updateVarRow(row.id, 'qty', e.target.value)} style={IS} />
                    <button onClick={() => removeVarRow(row.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c0392b', fontSize: 16, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}>×</button>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <button onClick={addVarRow} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.accent, background: 'none', border: `1px dashed ${alpha(C.accent, 66)}`, borderRadius: 5, padding: '3px 10px', cursor: 'pointer' }}>+ Add</button>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg2 }}>{fmtINR(calc.variableCosts)}/yr</span>
                </div>
              </>
            ) : (
              <>
                {fixedRows.map((row, i) => (
                  <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr auto', gap: 4, marginBottom: 5, alignItems: 'center' }}>
                    {i === 0 && ['Item', 'Annual (₹)', ''].map((h, j) => <div key={j} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: C.fg3 }}>{h}</div>)}
                    <input value={row.name} placeholder="Expense" onChange={e => updateFixedRow(row.id, 'name', e.target.value)} style={IS} />
                    <input type="number" value={row.amount} min={0} onChange={e => updateFixedRow(row.id, 'amount', e.target.value)} style={IS} />
                    <button onClick={() => removeFixedRow(row.id)} disabled={fixedRows.length === 1}
                      style={{ background: 'none', border: 'none', cursor: fixedRows.length === 1 ? 'default' : 'pointer', color: fixedRows.length === 1 ? C.fg3 : '#c0392b', fontSize: 16, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}>×</button>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <button onClick={addFixedRow} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.accent, background: 'none', border: `1px dashed ${alpha(C.accent, 66)}`, borderRadius: 5, padding: '3px 10px', cursor: 'pointer' }}>+ Add</button>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg2 }}>{fmtINR(calc.fixedCosts)}/yr</span>
                </div>
              </>
            )}
          </Section>

          {/* Financing & Subsidies */}
          <Section id="financing" label="Financing & Subsidies" open={openSections.includes('financing')} onToggle={toggleSection}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg2, marginBottom: 4 }}>Project name</div>
            <input value={projectName} placeholder="e.g. Coir Unit Konaseema"
              onChange={e => setProjectName(e.target.value)}
              style={{ ...IS, marginBottom: 10 }} />
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg2, marginBottom: 4 }}>Total CAPEX (₹)</div>
            <input type="number" value={capex} min={0} step={100000} onChange={e => setCapex(Number(e.target.value) || 0)} style={{ ...IS, marginBottom: 10 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
              <div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg2, marginBottom: 4 }}>Lifetime (yrs)</div>
                <input type="number" value={lifetime} min={1} max={30} onChange={e => setLifetime(Number(e.target.value) || 1)} style={IS} />
              </div>
              <div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg2, marginBottom: 4 }}>Discount rate (%)</div>
                <input type="number" value={discountRate} min={1} max={50} step={0.5} onChange={e => setDiscountRate(Number(e.target.value) || 1)} style={IS} />
              </div>
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg2, marginBottom: 4 }}>Debt {debtPct}% / Equity {100 - debtPct}%</div>
            <input type="range" min={0} max={100} step={5} value={debtPct} onChange={e => setDebtPct(Number(e.target.value))} style={{ width: '100%', accentColor: C.accent, marginBottom: 10 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
              <div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg2, marginBottom: 4 }}>Interest rate (%)</div>
                <input type="number" value={interestRate} min={0} max={30} step={0.5} onChange={e => setInterestRate(Number(e.target.value) || 0)} style={IS} />
              </div>
              <div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg2, marginBottom: 4 }}>Loan tenure (yrs)</div>
                <input type="number" value={tenure} min={1} max={20} onChange={e => setTenure(Number(e.target.value) || 1)} style={IS} />
              </div>
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg2, marginBottom: 6 }}>Subsidies</div>
            {[
              { id: 'pmegp', label: 'PMEGP', enabled: pmegpEnabled, setEnabled: setPmegpEnabled, pct: pmegpPct, setPct: setPmegpPct, editable: true },
              { id: 'citus', label: 'CITUS (25%)', enabled: citusEnabled, setEnabled: setCitusEnabled, editable: false },
              { id: 'apmsme', label: 'AP MSME 4.0 (20%)', enabled: apmsmeEnabled, setEnabled: setApmsmeEnabled, editable: false },
            ].map(sub => (
              <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <input type="checkbox" id={`sub-${sub.id}`} checked={sub.enabled} onChange={e => sub.setEnabled(e.target.checked)} style={{ accentColor: C.accent, width: 15, height: 15, cursor: 'pointer', flexShrink: 0 }} />
                <label htmlFor={`sub-${sub.id}`} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg1, cursor: 'pointer', flex: 1 }}>{sub.label}</label>
                {sub.editable && sub.enabled && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <input type="number" value={sub.pct} min={0} max={100} step={5} onChange={e => sub.setPct(Number(e.target.value) || 0)}
                      style={{ width: 48, fontFamily: "'DM Sans', sans-serif", fontSize: 12, padding: '3px 5px', border: `1px solid ${C.border}`, borderRadius: 4, background: C.bg2, color: C.fg1, outline: 'none' }} />
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3 }}>%</span>
                  </div>
                )}
              </div>
            ))}
            {(pmegpEnabled || citusEnabled || apmsmeEnabled) && (
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.accent, marginTop: 4 }}>
                Effective CAPEX: {fmtINR(calc.effectiveCapex)}
              </div>
            )}
          </Section>

          {/* Working Capital */}
          <Section id="wc" label="Working Capital" open={openSections.includes('wc')} onToggle={toggleSection}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[['Receivable days', receivableDays, setReceivableDays], ['Payable days', payableDays, setPayableDays], ['Inventory days', inventoryDays, setInventoryDays]].map(([lbl, val, set]) => (
                <div key={lbl}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg2, marginBottom: 4 }}>{lbl}</div>
                  <input type="number" value={val} min={0} max={180} onChange={e => set(Number(e.target.value) || 0)} style={IS} />
                </div>
              ))}
            </div>
            {calc.workingCapital > 0 && (
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, marginTop: 8 }}>
                Required: <strong style={{ color: C.fg1 }}>{fmtINR(calc.workingCapital)}</strong>
              </div>
            )}
          </Section>

        </div>

        {/* ── RIGHT PANEL: Output ──────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, background: C.bg1, padding: '0 20px', flexShrink: 0 }}>
            {[['summary', 'Summary'], ['pl', 'P&L Breakdown'], ['projection', `${lifetime}-Yr Projection`]].map(([id, lbl]) => (
              <button key={id} onClick={() => setRightTab(id)}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: rightTab === id ? 600 : 400, color: rightTab === id ? C.accent : C.fg3, background: 'none', border: 'none', borderBottom: `2px solid ${rightTab === id ? C.accent : 'transparent'}`, padding: '10px 16px 12px', cursor: 'pointer', marginRight: 4 }}>
                {lbl}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

            {/* ── Summary tab ──────────────────────────────────────────────── */}
            {rightTab === 'summary' && (
              <div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: C.fg3, marginBottom: 14 }}>Revenue Composition</div>
                <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 28, flexWrap: 'wrap' }}>
                  <DonutChart segments={calc.revenueByProduct} totalLabel={fmtINR(calc.revenue)} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {calc.revenueByProduct.map(seg => {
                      const pct = calc.revenue > 0 ? ((seg.value / calc.revenue) * 100).toFixed(0) : 0;
                      return (
                        <div key={seg.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 10, height: 10, borderRadius: 2, background: seg.color, flexShrink: 0 }} />
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg1, minWidth: 120 }}>{seg.name}</span>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 600, color: C.fg1 }}>{fmtINR(seg.value)}</span>
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3 }}>· {pct}%</span>
                        </div>
                      );
                    })}
                    {calc.revenueByProduct.length === 0 && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3 }}>Add products to see breakdown.</div>}
                  </div>
                </div>

                {/* Insight card */}
                <div style={{ background: insight.positive ? alpha(C.accent, 11) : C.bg2, border: `1px solid ${insight.positive ? alpha(C.accent, 44) : C.border}`, borderRadius: 10, padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: insight.positive ? alpha(C.accent, 33) : C.bg3, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    {insight.positive
                      ? <svg viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>
                      : <svg viewBox="0 0 24 24" fill="none" stroke={C.fg3} strokeWidth="2" strokeLinecap="round" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
                  </div>
                  <div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700, color: insight.positive ? C.accent : C.fg2, marginBottom: 4 }}>{insight.verdict}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2, lineHeight: 1.6 }}>{insight.text}</div>
                  </div>
                </div>
              </div>
            )}

            {/* ── P&L Breakdown tab ────────────────────────────────────────── */}
            {rightTab === 'pl' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                {[
                  { label: 'Effective CAPEX', value: fmtINR(calc.effectiveCapex), sub: 'after subsidies', color: C.fg1 },
                  { label: 'Annual Revenue', value: fmtINR(calc.revenue), sub: `at ${capacityPct}% capacity`, color: C.fg1 },
                  { label: 'EBITDA', value: fmtINR(calc.ebitda), sub: `${calc.ebitdaMargin.toFixed(1)}% margin`, color: ebitdaColor },
                  { label: 'IRR', value: calc.irr !== null ? `${calc.irr.toFixed(1)}%` : '—', sub: `vs ${discountRate}% hurdle`, color: irrColor },
                  { label: 'NPV', value: fmtINR(calc.npv), sub: `at ${discountRate}% discount`, color: npvColor },
                  { label: 'Payback', value: calc.payback !== null ? `${calc.payback} yr${calc.payback !== 1 ? 's' : ''}` : '> lifetime', sub: `${tenure}-yr loan tenure`, color: paybackColor },
                  { label: 'Y1 DSCR', value: calc.dscrY1 !== null ? calc.dscrY1.toFixed(2) : '—', sub: '≥ 1.25 comfortable', color: dscrColor },
                  { label: 'Break-even Rev', value: calc.breakEvenRev !== null ? fmtINR(calc.breakEvenRev) + '/yr' : '—', sub: 'revenue to cover fixed costs', color: C.fg1 },
                  { label: 'Working Capital', value: fmtINR(calc.workingCapital), sub: `${receivableDays}R + ${inventoryDays}I − ${payableDays}P days`, color: C.fg1 },
                ].map(card => (
                  <div key={card.label} style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.fg3, marginBottom: 6 }}>{card.label}</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: card.color, marginBottom: 4 }}>{card.value}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3 }}>{card.sub}</div>
                  </div>
                ))}
              </div>
            )}

            {/* ── 5-Yr Projection tab ──────────────────────────────────────── */}
            {rightTab === 'projection' && (
              <div style={{ overflowX: 'auto', border: `1px solid ${C.border}`, borderRadius: 10 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: C.bg2 }}>
                      {['Yr', 'Revenue', 'Var', 'Fixed', 'EBITDA', 'Depr.', 'Interest', 'EBT', 'Tax', 'PAT', 'Principal', 'NCF', 'Cum NCF', 'DSCR', 'Loan Bal.'].map(h => (
                        <th key={h} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 700, color: C.fg3, padding: '8px 9px', textAlign: 'right', whiteSpace: 'nowrap', borderBottom: `1px solid ${C.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {calc.rows.map((row, i) => {
                      const isBreakEven = row.cumNCF >= 0 && (i === 0 || calc.rows[i - 1].cumNCF < 0);
                      const rowDscrColor = row.dscr === null ? C.fg2 : row.dscr >= 1.5 ? '#2a7d3c' : row.dscr >= 1.25 ? '#b06000' : '#c0392b';
                      return (
                        <tr key={row.t} style={{ background: isBreakEven ? alpha(C.accent, 22) : i % 2 === 0 ? C.bg0 : C.bg1, borderBottom: `1px solid ${C.border}` }}>
                          <td style={{ padding: '6px 9px', textAlign: 'right', color: C.fg2, fontWeight: 600 }}>{row.t}</td>
                          <td style={{ padding: '6px 9px', textAlign: 'right', color: C.fg1 }}>{fmtINR(row.revenue)}</td>
                          <td style={{ padding: '6px 9px', textAlign: 'right', color: C.fg2 }}>{fmtINR(row.variableCosts)}</td>
                          <td style={{ padding: '6px 9px', textAlign: 'right', color: C.fg2 }}>{fmtINR(row.fixedCosts)}</td>
                          <td style={{ padding: '6px 9px', textAlign: 'right', color: C.fg1, fontWeight: 600 }}>{fmtINR(row.ebitda)}</td>
                          <td style={{ padding: '6px 9px', textAlign: 'right', color: C.fg3 }}>{fmtINR(row.depreciation)}</td>
                          <td style={{ padding: '6px 9px', textAlign: 'right', color: C.fg3 }}>{fmtINR(row.interest)}</td>
                          <td style={{ padding: '6px 9px', textAlign: 'right', color: row.ebt < 0 ? '#c0392b' : C.fg1 }}>{fmtINR(row.ebt)}</td>
                          <td style={{ padding: '6px 9px', textAlign: 'right', color: C.fg3 }}>{fmtINR(row.tax)}</td>
                          <td style={{ padding: '6px 9px', textAlign: 'right', color: row.pat < 0 ? '#c0392b' : C.fg1 }}>{fmtINR(row.pat)}</td>
                          <td style={{ padding: '6px 9px', textAlign: 'right', color: C.fg3 }}>{fmtINR(row.principal)}</td>
                          <td style={{ padding: '6px 9px', textAlign: 'right', color: row.ncf < 0 ? '#c0392b' : '#2a7d3c', fontWeight: 700 }}>{fmtINR(row.ncf)}</td>
                          <td style={{ padding: '6px 9px', textAlign: 'right', color: row.cumNCF < 0 ? '#c0392b' : '#2a7d3c', fontWeight: 700 }}>{fmtINR(row.cumNCF)}</td>
                          <td style={{ padding: '6px 9px', textAlign: 'right', color: rowDscrColor, fontWeight: 600 }}>{row.dscr !== null ? row.dscr.toFixed(2) : '—'}</td>
                          <td style={{ padding: '6px 9px', textAlign: 'right', color: C.fg3 }}>{fmtINR(row.loanBalance)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
