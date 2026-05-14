import { useState } from 'react';
import { C, alpha } from '../../tokens';
import { useCommodities } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ConfirmModal';
import Sparkline from './Sparkline';
import PriceEntryModal from './PriceEntryModal';
import { colorFor } from './commodityColors';
import { currentPrice, pctChange, range52w, sortHistory } from './marketsMath';

const fmtPrice = (n) => {
  if (n == null) return '—';
  return Number.isInteger(n)
    ? n.toLocaleString('en-IN')
    : n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
};

// Short relative-time label for the sync indicator. `ms` is an epoch.
const relTime = (ms) => {
  if (!ms) return '';
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 3600)  return `${Math.max(1, Math.floor(s / 60))}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

// Derives the sync-indicator text + colour from a commodity's `sync` field.
// Only called for commodities with an `agmarknet` mapping.
const syncIndicator = (commodity, dangerColor, mutedColor) => {
  const sync = commodity.sync;
  if (!sync)                     return { text: 'Auto-fetch enabled — first sync pending', color: mutedColor };
  if (sync.status === 'ok')      return { text: `Auto-synced from Agmarknet · ${relTime(sync.at)}`, color: mutedColor };
  if (sync.status === 'no-data') return { text: 'No Andhra Pradesh market data this week', color: mutedColor };
  return { text: `Sync error — ${sync.message || 'check the API key'}`, color: dangerColor };
};

export default function CommodityDetailPage({ commodity, onNavigate }) {
  const { updateCommodity, deleteCommodity, restoreCommodity } = useCommodities();
  const { isViewer } = useAuth();
  const { showToast } = useToast();
  const [priceOpen, setPriceOpen]   = useState(false);
  const [editOpen, setEditOpen]     = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const canEdit = !isViewer;
  const color  = colorFor(commodity.color);
  const sorted = sortHistory(commodity.history);
  const price  = currentPrice(commodity.history);
  const change = pctChange(commodity.history, 12);
  const range  = range52w(commodity.history);
  const up = change != null && change >= 0;
  const changeColor = change == null ? C.fg3 : up ? C.success : C.danger;

  const handleAddPrice = async (point) => {
    const next = sortHistory([...(commodity.history || []), point]);
    await updateCommodity(commodity.id, { history: next });
    showToast('Price added', 'success');
  };

  const handleEdit = async (patch) => {
    await updateCommodity(commodity.id, patch);
    showToast('Commodity updated', 'success');
  };

  const handleDelete = () => {
    const backup = { ...commodity };
    deleteCommodity(commodity.id);
    showToast('Commodity deleted', 'info', { label: 'Undo', onClick: () => restoreCommodity(backup) });
    onNavigate('markets');
  };

  return (
    <div className="page-pad" style={{ background: C.bg0, flex: 1, overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, letterSpacing: '0.06em', color: C.fg3, marginBottom: 10 }}>
        <button onClick={() => onNavigate('markets')}
          style={{ background: 'none', border: 'none', color: C.fg3, cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: 'inherit', letterSpacing: 'inherit', textTransform: 'uppercase' }}>
          Markets
        </button>
        <span aria-hidden="true">/</span>
        <span style={{ textTransform: 'uppercase', color: C.accent, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 320 }}>{commodity.name}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: 3, background: color, flexShrink: 0 }} />
            <h1 className="page-title" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 32, fontWeight: 600, color: C.fg1, margin: 0, lineHeight: 1.15 }}>{commodity.name}</h1>
          </div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3 }}>
            {commodity.unit}{commodity.mandi ? ` · ${commodity.mandi}` : ''}
          </div>
          {commodity.agmarknet && (() => {
            const ind = syncIndicator(commodity, C.danger, C.fg3);
            return (
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: ind.color, marginTop: 4 }}>
                {ind.text}
              </div>
            );
          })()}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 14 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 34, fontWeight: 700, color: C.fg1 }}>
              {price != null ? `₹${fmtPrice(price)}` : '—'}
            </span>
            {change != null && (
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, color: changeColor }}>
                {up ? '↑' : '↓'} {Math.abs(change).toFixed(1)}% · 12 weeks
              </span>
            )}
          </div>
        </div>
        {canEdit && (
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
            <button onClick={() => setPriceOpen(true)}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, padding: '8px 14px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}>+ Add price</button>
            <button onClick={() => setEditOpen(true)}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: '8px 14px', borderRadius: 6, background: 'transparent', color: C.fg2, border: `1px solid ${C.border}`, cursor: 'pointer' }}>Edit</button>
            <button onClick={() => setConfirmDel(true)}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: '8px 14px', borderRadius: 6, background: 'transparent', color: C.danger, border: `1px solid ${alpha(C.danger, 33)}`, cursor: 'pointer' }}>Delete</button>
          </div>
        )}
      </div>

      <div style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.fg3, marginBottom: 14 }}>
          Price history
        </div>
        {sorted.length >= 2 ? (
          <Sparkline history={commodity.history} color={color} width={640} height={200} />
        ) : (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3, fontStyle: 'italic' }}>
            {sorted.length === 1 ? 'One price point so far — add more to see the trend.' : 'No prices yet — add the first one.'}
          </div>
        )}
        {range && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.fg3 }}>
            <span>52w low ₹{fmtPrice(range.low)}</span>
            <span>52w high ₹{fmtPrice(range.high)}</span>
          </div>
        )}
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.fg3, marginBottom: 10 }}>
          Entries ({sorted.length})
        </div>
        {sorted.length === 0 ? (
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3 }}>No price entries yet.</div>
        ) : (
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
            {[...sorted].reverse().map((e, i) => (
              <div key={e.ts} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: i < sorted.length - 1 ? `1px solid ${C.border}` : 'none', background: i % 2 ? C.bg0 : C.bg1 }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {e.date}
                  {e.source === 'agmarknet' && (
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.accent, background: alpha(C.accent, 11), border: `1px solid ${alpha(C.accent, 33)}`, borderRadius: 3, padding: '1px 5px' }}>auto</span>
                  )}
                </span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: C.fg1 }}>₹{fmtPrice(e.price)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {commodity.notes && (
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2, lineHeight: 1.6, background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 16px', whiteSpace: 'pre-wrap' }}>
          {commodity.notes}
        </div>
      )}

      {priceOpen && (
        <PriceEntryModal mode="price" commodity={commodity} onClose={() => setPriceOpen(false)} onSubmitPrice={handleAddPrice} />
      )}
      {editOpen && (
        <PriceEntryModal mode="edit" commodity={commodity} onClose={() => setEditOpen(false)} onSubmitEdit={handleEdit} />
      )}
      {confirmDel && (
        <ConfirmModal
          title="Delete commodity?"
          message="This removes the commodity and its entire price history. You can undo for a few seconds."
          confirmLabel="Delete"
          onConfirm={() => { setConfirmDel(false); handleDelete(); }}
          onCancel={() => setConfirmDel(false)} />
      )}
    </div>
  );
}
