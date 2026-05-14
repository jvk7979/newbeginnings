import { useState } from 'react';
import { C } from '../../tokens';
import { COMMODITY_COLORS } from './commodityColors';
import { useToast } from '../../context/ToastContext';
import { AGMARKNET_COMMODITIES } from './agmarknetCommodities';

const inputStyle = { width: '100%', background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6, color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 15, padding: '9px 12px', outline: 'none', boxSizing: 'border-box' };
const labelStyle = { fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: C.fg2, marginBottom: 5, display: 'block' };

const todayStr = () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function AddCommodityModal({ onClose, onAdd }) {
  const { showToast } = useToast();
  const [name, setName]   = useState('');
  const [unit, setUnit]   = useState('');
  const [mandi, setMandi] = useState('');
  const [color, setColor] = useState(COMMODITY_COLORS[0].key);
  const [price, setPrice] = useState('');
  const [agmarknetKey, setAgmarknetKey] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = name.trim() && unit.trim();

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const ag = AGMARKNET_COMMODITIES.find(c => c.key === agmarknetKey);
      const commodity = {
        name: name.trim(),
        unit: unit.trim(),
        mandi: mandi.trim(),
        color,
        notes: '',
        agmarknet: ag ? { key: ag.key, name: ag.name } : null,
        history: [],
      };
      const p = parseFloat(price);
      if (price.trim() && Number.isFinite(p) && p > 0) {
        commodity.history = [{ ts: Date.now(), date: todayStr(), price: p }];
      }
      await onAdd(commodity);
      onClose();
    } catch (err) {
      console.error('[AddCommodityModal]', err);
      showToast('Could not add commodity. Please try again.', 'error');
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,25,20,0.55)', zIndex: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ position: 'relative', background: C.bg0, borderRadius: 12, padding: '26px 24px', width: '100%', maxWidth: 460, maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.22)', animation: 'fadeIn 160ms ease' }}>
        <button onClick={onClose} aria-label="Close"
          style={{ position: 'absolute', top: 6, right: 6, width: 44, height: 44, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: C.fg3, fontSize: 26, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onMouseEnter={e => { e.currentTarget.style.color = C.fg1; e.currentTarget.style.background = C.bg2; }}
          onMouseLeave={e => { e.currentTarget.style.color = C.fg3; e.currentTarget.style.background = 'none'; }}>×</button>

        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 600, color: C.fg1, marginBottom: 18, paddingRight: 36 }}>
          Track a Commodity
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Name</label>
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} maxLength={80} placeholder="e.g. Coconut Husk" />
          </div>
          <div>
            <label style={labelStyle}>Unit</label>
            <input style={inputStyle} value={unit} onChange={e => setUnit(e.target.value)} maxLength={24} placeholder="e.g. ₹/piece, ₹/kg, ₹/quintal" />
          </div>
          <div>
            <label style={labelStyle}>Mandi / market (optional)</label>
            <input style={inputStyle} value={mandi} onChange={e => setMandi(e.target.value)} maxLength={60} placeholder="e.g. Rajahmundry mandi" />
          </div>
          <div>
            <label style={labelStyle}>Colour</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {COMMODITY_COLORS.map(c => (
                <button key={c.key} type="button" onClick={() => setColor(c.key)}
                  aria-label={c.label} aria-pressed={color === c.key}
                  style={{ width: 30, height: 30, borderRadius: 7, background: c.hex, cursor: 'pointer', border: `2px solid ${color === c.key ? C.fg1 : 'transparent'}` }} />
              ))}
            </div>
          </div>
          <div>
            <label style={labelStyle}>Auto-fetch source (optional)</label>
            <select style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
              value={agmarknetKey} onChange={e => setAgmarknetKey(e.target.value)}>
              <option value="">Manual only</option>
              {AGMARKNET_COMMODITIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, marginTop: 4 }}>
              Mapped commodities auto-update weekly from Agmarknet (Andhra Pradesh average).
            </div>
          </div>
          <div>
            <label style={labelStyle}>Current price (optional)</label>
            <input style={inputStyle} type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="Today's price — you can add this later" />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
          <button onClick={onClose}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, padding: '9px 18px', borderRadius: 6, background: 'transparent', color: C.fg2, border: `1px solid ${C.border}`, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={!canSubmit || submitting}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, padding: '9px 20px', borderRadius: 6, background: (!canSubmit || submitting) ? C.bg2 : C.accent, color: (!canSubmit || submitting) ? C.fg3 : '#fff', border: 'none', cursor: (!canSubmit || submitting) ? 'not-allowed' : 'pointer' }}>
            {submitting ? 'Adding…' : 'Add Commodity'}
          </button>
        </div>
      </div>
    </div>
  );
}
