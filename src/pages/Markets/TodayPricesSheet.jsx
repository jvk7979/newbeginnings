import { useId, useState } from 'react';
import { useDialogA11y } from '../../utils/useDialogA11y';
import { useToast } from '../../context/ToastContext';
import { currentPrice } from './marketsMath';

// "Update today's prices" — type the day's price for every tracked commodity
// on one screen instead of opening each card. Leave a row blank to skip it.

const todayISO = () => {
  // Local calendar date (the family is in IST), not UTC.
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const fmtDate = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const fmtPrice = (n) => (n == null ? '—' : `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`);

export default function TodayPricesSheet({ commodities, onClose, onSave }) {
  const { dialogProps, titleId } = useDialogA11y(onClose);
  const { showToast } = useToast();
  const fid = useId();
  const [date, setDate] = useState(todayISO());
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);

  const entries = commodities
    .map(c => ({ c, raw: (values[c.id] ?? '').trim() }))
    .filter(e => e.raw !== '');
  const invalid = entries.filter(e => !(Number.isFinite(parseFloat(e.raw)) && parseFloat(e.raw) > 0));
  const canSave = entries.length > 0 && invalid.length === 0 && !!date && date <= todayISO() && !saving;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const ts = Date.parse(`${date}T12:00:00Z`);
      await onSave(entries.map(({ c, raw }) => ({
        id: c.id,
        point: { ts, date: fmtDate(date), price: parseFloat(raw), source: 'manual' },
      })));
      showToast(`Saved ${entries.length} price${entries.length === 1 ? '' : 's'}`, 'success');
      onClose();
    } catch (err) {
      console.error('[TodayPricesSheet]', err);
      showToast('Could not save the prices. Check your connection and try again.', 'error');
      setSaving(false);
    }
  };

  return (
    <div className="mk-sheet-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      {/* dialogProps carries its own className (nb-dialog: the shared mobile
          bottom-sheet style), so merge rather than let it replace ours. */}
      <div {...dialogProps} className={`mk-sheet ${dialogProps.className || ''}`}>
        <div className="mk-sheet-head">
          <h2 id={titleId}>Update today's prices</h2>
          <p>Type the price for each commodity you checked. Leave a row blank to skip it.</p>
        </div>

        <label className="mk-sheet-date" htmlFor={`${fid}-date`}>
          Price date
          <input id={`${fid}-date`} type="date" value={date} max={todayISO()} onChange={e => setDate(e.target.value)} />
        </label>

        <ul className="mk-sheet-rows">
          {commodities.map(c => {
            const raw = values[c.id] ?? '';
            const bad = raw.trim() !== '' && !(Number.isFinite(parseFloat(raw)) && parseFloat(raw) > 0);
            return (
              <li key={c.id}>
                <label htmlFor={`${fid}-${c.id}`}>
                  <span className="mk-sheet-name">{c.name}</span>
                  <span className="mk-sheet-meta">{c.unit} · last {fmtPrice(currentPrice(c.history))}</span>
                </label>
                <input id={`${fid}-${c.id}`} inputMode="decimal" placeholder="Price" value={raw}
                  aria-invalid={bad || undefined}
                  onChange={e => setValues(v => ({ ...v, [c.id]: e.target.value }))} />
              </li>
            );
          })}
        </ul>

        {invalid.length > 0 && <p className="mk-sheet-error">Prices must be numbers above zero.</p>}

        <div className="mk-sheet-actions">
          <button type="button" className="ui-btn ui-btn--ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="ui-btn ui-btn--primary" onClick={save} disabled={!canSave}>
            {saving ? 'Saving…' : entries.length ? `Save ${entries.length} price${entries.length === 1 ? '' : 's'}` : 'Save prices'}
          </button>
        </div>
      </div>
    </div>
  );
}
