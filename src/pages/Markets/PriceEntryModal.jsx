import { useState, useId } from 'react';
import { C } from '../../tokens';
import { COMMODITY_COLORS } from './commodityColors';
import { useToast } from '../../context/ToastContext';
import { useDialogA11y } from '../../utils/useDialogA11y';

const inputStyle = { width: '100%', background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6, color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 15, padding: '9px 12px', outline: 'none', boxSizing: 'border-box' };
const labelStyle = { fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: C.fg2, marginBottom: 5, display: 'block' };

// ISO yyyy-mm-dd for the date <input>; today by default.
const todayISO = () => new Date().toISOString().slice(0, 10);
// Display string matching the app's convention ("May 09, 2026").
const fmtDate = (iso) => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
// Convert a yyyy-mm-dd to an epoch-ms timestamp anchored at NOON UTC of
// that day. Using local-midnight (`T00:00:00`, no Z suffix) puts an IST
// user's "today" entry into yesterday's UTC bucket, so the rolling 7-day
// Markets chart dropped the newest point. Noon UTC is the same calendar
// day in every timezone except those crossing the date line — safe for
// India users; safe for the chart bucketing; safe for sort order.
const dateToTs = (iso) => new Date(iso + 'T12:00:00Z').getTime();

// mode 'price' — add a dated price point; calls onSubmitPrice({ ts, date, price }).
// mode 'edit'  — edit commodity fields; calls onSubmitEdit({ name, unit, mandi, color, notes }).
export default function PriceEntryModal({ mode, commodity, onClose, onSubmitPrice, onSubmitEdit }) {
  const { showToast } = useToast();
  const { dialogProps, titleId } = useDialogA11y(onClose);
  const fid = useId();
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
        await onSubmitPrice({ ts: dateToTs(date), date: fmtDate(date), price: priceNum });
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
      <div {...dialogProps}
           style={{ position: 'relative', background: C.bg0, borderRadius: 12, padding: '26px 24px', width: '100%', maxWidth: 440, maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.22)', animation: 'fadeIn 160ms ease' }}>
        <button onClick={onClose} aria-label="Close"
          style={{ position: 'absolute', top: 6, right: 6, width: 44, height: 44, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: C.fg3, fontSize: 26, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onMouseEnter={e => { e.currentTarget.style.color = C.fg1; e.currentTarget.style.background = C.bg2; }}
          onMouseLeave={e => { e.currentTarget.style.color = C.fg3; e.currentTarget.style.background = 'none'; }}>×</button>

        <div id={titleId} style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 21, fontWeight: 600, color: C.fg1, marginBottom: 18, paddingRight: 36 }}>
          {mode === 'price' ? 'Add a Price' : 'Edit Commodity'}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'price' ? (
            <>
              <div>
                <label style={labelStyle} htmlFor={`${fid}-date`}>Date</label>
                <input id={`${fid}-date`} style={inputStyle} type="date" max={todayISO()} value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle} htmlFor={`${fid}-price`}>Price ({commodity?.unit || '₹'})</label>
                <input id={`${fid}-price`} style={inputStyle} type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" />
              </div>
            </>
          ) : (
            <>
              <div>
                <label style={labelStyle} htmlFor={`${fid}-name`}>Name</label>
                <input id={`${fid}-name`} style={inputStyle} value={name} onChange={e => setName(e.target.value)} maxLength={80} />
              </div>
              <div>
                <label style={labelStyle} htmlFor={`${fid}-unit`}>Unit</label>
                <input id={`${fid}-unit`} style={inputStyle} value={unit} onChange={e => setUnit(e.target.value)} maxLength={24} />
              </div>
              <div>
                <label style={labelStyle} htmlFor={`${fid}-mandi`}>Mandi / market</label>
                <input id={`${fid}-mandi`} style={inputStyle} value={mandi} onChange={e => setMandi(e.target.value)} maxLength={60} />
              </div>
              <div>
                <label style={labelStyle} id={`${fid}-colour-label`}>Colour</label>
                <div role="radiogroup" aria-labelledby={`${fid}-colour-label`} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {COMMODITY_COLORS.map(c => (
                    <button key={c.key} type="button" onClick={() => setColor(c.key)}
                      aria-label={c.label} aria-pressed={color === c.key}
                      style={{ width: 30, height: 30, borderRadius: 7, background: c.hex, cursor: 'pointer', border: `2px solid ${color === c.key ? C.fg1 : 'transparent'}` }} />
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle} htmlFor={`${fid}-notes`}>Notes (optional)</label>
                <textarea id={`${fid}-notes`} style={{ ...inputStyle, resize: 'vertical', minHeight: 60, lineHeight: 1.6 }} value={notes} onChange={e => setNotes(e.target.value)} />
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
