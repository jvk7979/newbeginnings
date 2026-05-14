import { useState, useEffect } from 'react';
import { C } from '../../tokens';
import { db } from '../../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { pctChange } from './marketsMath';
import IndexedTrendChart from './IndexedTrendChart';

// Editable-override notes live here; the auto-summary is computed client-side.
const CALLOUTS_REF = doc(db, 'marketsConfig', 'callouts');

const WINDOWS = [
  { weeks: 4,  label: '4w' },
  { weeks: 12, label: '12w' },
  { weeks: 26, label: '26w' },
  { weeks: 52, label: '52w' },
];

// Auto-summary of the commodities trending up / down over the window.
function autoCallout(commodities, weeks, direction) {
  const moved = commodities
    .map(c => ({ name: c.name, pct: pctChange(c.history, weeks) }))
    .filter(m => m.pct != null && (direction === 'up' ? m.pct > 0 : m.pct < 0))
    .sort((a, b) => (direction === 'up' ? b.pct - a.pct : a.pct - b.pct))
    .slice(0, 4);
  if (moved.length === 0) {
    return `No commodities trending ${direction} over this window.`;
  }
  return moved.map(m => `${m.name} ${m.pct >= 0 ? '+' : ''}${m.pct.toFixed(1)}%`).join(' · ')
    + ` over ${weeks} weeks.`;
}

function CalloutCard({ title, autoText, override, canEdit, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const isCustom = !!(override && override.trim());
  const text = isCustom ? override : autoText;

  return (
    <div style={{ flex: 1, minWidth: 240, background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.fg3 }}>{title}</span>
        {canEdit && !editing && (
          <button onClick={() => { setDraft(override || ''); setEditing(true); }}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            {isCustom ? 'Edit' : 'Add note'}
          </button>
        )}
      </div>
      {editing ? (
        <>
          <textarea value={draft} onChange={e => setDraft(e.target.value)} autoFocus
            placeholder="Leave blank to use the auto-summary"
            style={{ width: '100%', background: C.bg0, border: `1px solid ${C.border}`, borderRadius: 6, color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: '8px 10px', outline: 'none', resize: 'vertical', minHeight: 60, lineHeight: 1.5, boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={() => { onSave(draft.trim()); setEditing(false); }}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, padding: '5px 14px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}>Save</button>
            <button onClick={() => setEditing(false)}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: '5px 12px', borderRadius: 6, background: 'transparent', color: C.fg2, border: `1px solid ${C.border}`, cursor: 'pointer' }}>Cancel</button>
          </div>
        </>
      ) : (
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2, lineHeight: 1.6 }}>
          {text}
          {isCustom && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.fg3, marginLeft: 8 }}>· custom note</span>}
        </div>
      )}
    </div>
  );
}

// The "Commodity Watch" analytics view: a window selector, the indexed
// multi-commodity trend chart, and two trending-up / trending-down callout
// cards (auto-summary with an optional editable override).
export default function CommodityWatch({ commodities }) {
  const { user, isViewer } = useAuth();
  const { showToast } = useToast();
  const [weeks, setWeeks] = useState(12);
  const [callouts, setCallouts] = useState({});
  const canEdit = !isViewer;

  useEffect(() => {
    const unsub = onSnapshot(
      CALLOUTS_REF,
      snap => setCallouts(snap.exists() ? snap.data() : {}),
      err => { console.error('[CommodityWatch/callouts]', err); setCallouts({}); },
    );
    return () => unsub();
  }, []);

  const saveCallout = async (field, value) => {
    try {
      await setDoc(CALLOUTS_REF, { [field]: value, updatedBy: user?.email || user?.uid || '' }, { merge: true });
    } catch (err) {
      console.error('[CommodityWatch/saveCallout]', err);
      showToast('Could not save the note.', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.fg3 }}>
          Indexed price trend · 0–1 normalised within band
        </span>
        <div role="group" aria-label="Window" style={{ display: 'flex', border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
          {WINDOWS.map(w => (
            <button key={w.weeks} onClick={() => setWeeks(w.weeks)} aria-pressed={weeks === w.weeks}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '6px 12px', border: 'none', cursor: 'pointer', background: weeks === w.weeks ? C.accent : 'transparent', color: weeks === w.weeks ? '#fff' : C.fg2 }}>
              {w.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <IndexedTrendChart commodities={commodities} weeks={weeks} />
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <CalloutCard title="Trending Up" autoText={autoCallout(commodities, weeks, 'up')}
          override={callouts.upNote} canEdit={canEdit} onSave={v => saveCallout('upNote', v)} />
        <CalloutCard title="Trending Down" autoText={autoCallout(commodities, weeks, 'down')}
          override={callouts.downNote} canEdit={canEdit} onSave={v => saveCallout('downNote', v)} />
      </div>
    </div>
  );
}
