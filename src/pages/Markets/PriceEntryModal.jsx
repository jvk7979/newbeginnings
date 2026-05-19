import { useState } from 'react';
import { C } from '../../tokens';
import { COMMODITY_COLORS } from './commodityColors';
import { useToast } from '../../context/ToastContext';

const inputStyle = { width: '100%', background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6, color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 15, padding: '9px 12px', outline: 'none', boxSizing: 'border-box' };
const labelStyle = { fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: C.fg2, marginBottom: 5, display: 'block' };

// ISO yyyy-mm-dd for the date <input>; today by default.
const todayISO = () => new Date().toISOString().slice(0, 10);
// Display string matching the app's convention ("May 09, 2026").
const fmtDate = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// mode 'price' — add a dated price point; calls onSubmitPrice({ ts, date, price }).
// mode 'edit'  — edit commodity fields; calls onSubmitEdit({ name, unit, mandi, color, notes }).
export default function PriceEntryModal({ mode, commodity, onClose, onSubmitPrice, onSubmitEdit }) {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [date, setDate]   = useState(todayISO());
  const [price, setPrice] = useState('');

  const [name, setName]   = useState(commodity?.name || '');
  const [unit, setUnit]   = useState(commodity?.unit || '');
  const [mandi, setMandi] = useState(commodity?.mandi || '');
  const [color, setColor] = useState(commodity?.color || COMMODITY_COLORS[0].key);
  const [notes, setNotes] = useState(commodity?.notes || '');

  const priceNum = parseFloat(price);
  const priceValid = price.trim() && Number.isFinite(priceNum) && priceNum > 0;
  const dateValid  = !!date && date <= todayISO();
  const canSubmit = mode === 'price'
    ? (priceValid && dateValid)
    : (!!name.trim() && !!unit.trim());

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      if (mode === 'price') {
        await onSubmitPrice({ ts: new Date(date + 'T00:00:00').getTime(), date: fmtDate(date), price: priceNum });
      } else {
        await onSubmitEdit({ name: name.trim(), unit: unit.trim(), mandi: mandi.trim(), color, notes: notes.trim() });
      }
      onClose();
    } catch (err) {
      console.error('[PriceEntryModal]', err);
      showToast('Could not save. Please try again.', 'error');
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,25,20,0.55)', zIndex: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ position: 'relative', background: C.bg0, borderRadius: 12, padding: '26px 24px', width: '100%', maxWidth: 440, maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.22)', animation: 'fadeIn 160ms ease' }}>
        <button onClick={onClose} aria-label="Close"
          style={{ position: 'absolute', top: 6, right: 6, width: 44, height: 44, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: C.fg3, fontSize: 26, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onMouseEnter={e => { e.currentTarget.style.color = C.fg1; e.currentTarget.style.background = C.bg2; }}
          onMouseLeave={e => { e.currentTarget.style.color = C.fg3; e.currentTarget.style.background = 'none'; }}>×</button>

        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 21, fontWeight: 600, color: C.fg1, marginBottom: 18, paddingRight: 36 }}>
          {mode === 'price' ? 'Add a Price' : 'Edit Commodity'}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'price' ? (
            <>
              <div>
                <label style={labelStyle}>Date</label>
                <input style={inputStyle} type="date" max={todayISO()} value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Price ({commodity?.unit || '₹'})</label>
                <input style={inputStyle} type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" />
              </div>
            </>
          ) : (
            <>
              <div>
                <label style={labelStyle}>Name</label>
                <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} maxLength={80} />
              </div>
              <div>
                <label style={labelStyle}>Unit</label>
                <input style={inputStyle} value={unit} onChange={e => setUnit(e.target.value)} maxLength={24} />
              </div>
              <div>
                <label style={labelStyle}>Mandi / market</label>
                <input style={inputStyle} value={mandi} onChange={e => setMandi(e.target.value)} maxLength={60} />
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
                <label style={labelStyle}>Notes (optional)</label>
                <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 60, lineHeight: 1.6 }} value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
          <button onClick={onClose}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, padding: '9px 18px', borderRadius: 6, background: 'transparent', color: C.fg2, border: `1px solid ${C.border}`, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={!canSubmit || submitting}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, padding: '9px 20px', borderRadius: 6, background: (!canSubmit || submitting) ? C.bg2 : C.accent, color: (!canSubmit || submitting) ? C.fg3 : '#fff', border: 'none', cursor: (!canSubmit || submitting) ? 'not-allowed' : 'pointer' }}>
            {submitting ? 'Saving…' : (mode === 'price' ? 'Add Price' : 'Save')}
          </button>
        </div>
      </div>
    </div>
  );
}
