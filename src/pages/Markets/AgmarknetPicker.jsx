import { useState, useEffect, useRef, useMemo } from 'react';
import { C, alpha } from '../../tokens';
import { functions } from '../../firebase';
import { httpsCallable } from 'firebase/functions';
import { useCommodities } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { COMMODITY_COLORS } from './commodityColors';

// Session cache — the Agmarknet commodity list barely changes within a
// visit, so we fetch it once per page load and reuse it every time the
// dropdown reopens.
let _cachedList = null;

const hintStyle = {
  fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3,
  fontStyle: 'italic', padding: '8px 9px',
};

// Searchable multi-select for choosing which Agmarknet commodities to
// auto-fetch. Each picked commodity becomes a `sharedCommodities` card
// (so it shows on the Today's Mandi grid and gets swept by the scheduled
// sync / "Sync now"); removing a chip deletes that card. The currently
// tracked set is derived live from the commodities that carry an
// `agmarknet.name` mapping — the cards themselves are the source of truth.
export default function AgmarknetPicker() {
  const { commodities, addCommodity, deleteCommodity } = useCommodities();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [list, setList] = useState(_cachedList); // null = not loaded yet
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const panelRef = useRef(null);

  // Tracked = every commodity card carrying an agmarknet mapping, keyed by
  // the exact Agmarknet name so it matches against the API list.
  const trackedByName = useMemo(() => {
    const m = new Map();
    commodities.forEach(c => { if (c.agmarknet?.name) m.set(c.agmarknet.name, c); });
    return m;
  }, [commodities]);

  // Fetch the commodity list the first time the dropdown opens.
  useEffect(() => {
    if (!open || list !== null) return;
    let cancelled = false;
    setLoading(true);
    httpsCallable(functions, 'listAgmarknetCommodities')()
      .then(({ data }) => {
        if (cancelled) return;
        const arr = Array.isArray(data?.commodities) ? data.commodities : [];
        if (arr.length === 0) {
          // Empty / malformed success response — don't cache it (an empty
          // `_cachedList` would stick for the whole session) and leave
          // `list` null so the next time the dropdown opens it retries.
          showToast('Agmarknet returned an empty commodity list — try again.', 'error');
          return;
        }
        _cachedList = arr;
        setList(arr);
      })
      .catch(err => {
        console.error('[AgmarknetPicker/list]', err);
        if (!cancelled) showToast('Could not load the Agmarknet commodity list.', 'error');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, list, showToast]);

  // Close the dropdown on an outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const addOne = async (name) => {
    if (busy || trackedByName.has(name)) return;
    setBusy(true);
    try {
      await addCommodity({
        name,
        unit: '₹/quintal', // Agmarknet modal_price is quoted per quintal
        mandi: 'Agmarknet (multi-state avg)',
        color: COMMODITY_COLORS[commodities.length % COMMODITY_COLORS.length].key,
        notes: '',
        agmarknet: { name },
        autoCreated: true,
        history: [],
      });
      showToast(`${name} added — hit “↻ Sync now” to pull its price.`, 'success');
      setQuery('');
    } catch (err) {
      console.error('[AgmarknetPicker/add]', err);
      showToast('Could not add the commodity.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const removeOne = async (card) => {
    if (busy) return;
    if (!window.confirm(`Remove “${card.name}” and its price history? This can't be undone.`)) return;
    setBusy(true);
    try {
      await deleteCommodity(card.id);
      showToast(`${card.name} removed.`, 'success');
    } catch (err) {
      console.error('[AgmarknetPicker/remove]', err);
      showToast('Could not remove the commodity.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const tracked = [...trackedByName.values()];

  // Options = API list minus what's already tracked, filtered by the search.
  const filtered = useMemo(() => {
    if (!list) return [];
    const q = query.trim().toLowerCase();
    return list
      .filter(n => !trackedByName.has(n))
      .filter(n => !q || n.toLowerCase().includes(q));
  }, [list, query, trackedByName]);

  return (
    <div style={{ marginTop: 14, borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, marginBottom: 8 }}>
        Auto-fetched commodities — picked from the live Agmarknet feed. Each becomes a card on Today's Mandi.
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        {tracked.map(card => (
          <span key={card.id}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: "'DM Sans', sans-serif", fontSize: 13, background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 14, padding: '4px 5px 4px 11px' }}>
            {card.name}
            <button onClick={() => removeOne(card)} disabled={busy} aria-label={`Remove ${card.name}`}
              style={{ width: 18, height: 18, borderRadius: '50%', border: 'none', background: 'transparent', color: C.fg3, cursor: busy ? 'not-allowed' : 'pointer', fontSize: 16, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </span>
        ))}
        {tracked.length === 0 && (
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, fontStyle: 'italic' }}>None yet.</span>
        )}
        <div ref={panelRef} style={{ position: 'relative' }}>
          <button onClick={() => setOpen(o => !o)}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, padding: '5px 12px', borderRadius: 14, border: `1px dashed ${alpha(C.accent, 66)}`, background: 'transparent', color: C.accent, cursor: 'pointer' }}>
            + Add commodity
          </button>
          {open && (
            <div style={{ position: 'absolute', top: '112%', left: 0, zIndex: 50, width: 280, background: C.bg0, border: `1px solid ${C.border}`, borderRadius: 10, boxShadow: '0 8px 30px rgba(0,0,0,0.18)', padding: 10 }}>
              <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search commodities…"
                style={{ width: '100%', boxSizing: 'border-box', background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6, color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: '7px 10px', outline: 'none', marginBottom: 8 }} />
              <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                {loading && <div style={hintStyle}>Loading the Agmarknet list…</div>}
                {!loading && list && filtered.length === 0 && (
                  <div style={hintStyle}>{query.trim() ? 'No matches.' : 'Everything is already tracked.'}</div>
                )}
                {!loading && filtered.map(name => (
                  <button key={name} onClick={() => addOne(name)} disabled={busy}
                    style={{ display: 'block', width: '100%', textAlign: 'left', fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg1, background: 'transparent', border: 'none', borderRadius: 6, padding: '7px 9px', cursor: busy ? 'not-allowed' : 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.background = C.bg2; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
