import { C, alpha } from '../../tokens';
import Sparkline from './Sparkline';
import { colorFor } from './commodityColors';
import { currentPrice, pctChange, range52w } from './marketsMath';

// ₹ formatting — thousands grouping; up to 2 decimals for sub-rupee prices.
const fmtPrice = (n) => {
  if (n == null) return '—';
  return Number.isInteger(n)
    ? n.toLocaleString('en-IN')
    : n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
};

export default function CommodityCard({ commodity, onOpen }) {
  const color   = colorFor(commodity.color);
  const price   = currentPrice(commodity.history);
  const change  = pctChange(commodity.history, 12);
  const range   = range52w(commodity.history);
  const hasData = price != null;
  const points  = Array.isArray(commodity.history) ? commodity.history.length : 0;
  const up = change != null && change >= 0;
  const changeColor = change == null ? C.fg3 : up ? C.success : C.danger;

  return (
    <button onClick={() => onOpen(commodity)}
      style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12, background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color 140ms' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = alpha(C.accent, 44); }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
            <span style={{ fontFamily: "'Inter', Georgia, serif", fontSize: 19, fontWeight: 600, color: C.fg1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{commodity.name}</span>
          </div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3 }}>
            {commodity.unit}{commodity.mandi ? ` · ${commodity.mandi}` : ''}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: C.fg1 }}>
            {hasData ? `₹${fmtPrice(price)}` : '—'}
          </div>
          {change != null && (
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: changeColor }}>
              {up ? '↑' : '↓'} {Math.abs(change).toFixed(1)}% 12w
            </div>
          )}
        </div>
      </div>

      {points >= 2
        ? <Sparkline history={commodity.history} color={color} height={56} />
        : <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, fontStyle: 'italic' }}>
            {hasData ? 'one price point — add more to see the trend' : 'awaiting first price'}
          </div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg3 }}>
        <span>52w low {range ? fmtPrice(range.low) : '—'}</span>
        <span>52w high {range ? fmtPrice(range.high) : '—'}</span>
      </div>
    </button>
  );
}
