import { useState, useEffect } from 'react';
import { C, alpha } from '../../tokens';
import { db } from '../../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

// Single shared config doc — read live here, written by this panel and by the
// scheduled Cloud Function (which gates its run on `paused` / `hourIST` /
// `frequencyDays`).
const CONFIG_REF = doc(db, 'marketsConfig', 'autoFetch');

const FREQ_OPTIONS = [
  { value: 1, label: 'Every day' },
  { value: 3, label: 'Every 3 days' },
  { value: 7, label: 'Weekly' },
];

// 0–23 IST hour options for the time-of-day picker; value === array index.
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, h) => ({
  value: h,
  label: `${((h + 11) % 12) + 1}:00 ${h < 12 ? 'AM' : 'PM'} IST`,
}));

const relTime = (ms) => {
  if (!ms) return 'never';
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 3600)  return `${Math.max(1, Math.floor(s / 60))}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const selectStyle = {
  background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6, color: C.fg1,
  fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: '6px 10px', outline: 'none',
  appearance: 'none', cursor: 'pointer',
};

// Compact "Agmarknet auto-fetch" control panel for the Markets page. Lets any
// editor pause/resume the scheduled price fetch and set its frequency and
// time of day. Rendered only for non-viewers.
export default function AutoFetchSettings() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [cfg, setCfg] = useState(null);   // null = still loading
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      CONFIG_REF,
      snap => setCfg(snap.exists() ? snap.data() : {}),
      err => { console.error('[AutoFetchSettings/onSnapshot]', err); setCfg({}); },
    );
    return () => unsub();
  }, []);

  if (cfg === null) return null; // keep the panel out of the layout until known

  const paused        = cfg.paused === true;
  const frequencyDays = Number(cfg.frequencyDays) > 0 ? Number(cfg.frequencyDays) : 1;
  const hourIST       = Number.isInteger(cfg.hourIST) ? cfg.hourIST : 6;

  const patch = async (fields) => {
    setSaving(true);
    try {
      await setDoc(CONFIG_REF, { ...fields, updatedBy: user?.email || user?.uid || '' }, { merge: true });
    } catch (err) {
      console.error('[AutoFetchSettings/patch]', err);
      showToast('Could not save auto-fetch settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const freqLabel = frequencyDays === 1 ? 'every day' : frequencyDays === 7 ? 'weekly' : `every ${frequencyDays} days`;

  return (
    <div style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 18px', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: C.fg1 }}>
            Agmarknet auto-fetch
          </div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, marginTop: 2 }}>
            {paused
              ? 'Paused — prices update only when you enter them manually.'
              : `Runs ${freqLabel} at ${HOUR_OPTIONS[hourIST].label} · last run ${relTime(cfg.lastRunAt)}`}
          </div>
        </div>
        <button onClick={() => patch({ paused: !paused })} disabled={saving}
          style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, padding: '7px 16px', borderRadius: 6,
            border: `1px solid ${paused ? alpha(C.accent, 44) : C.border}`,
            background: paused ? C.accent : 'transparent', color: paused ? '#fff' : C.fg2,
            cursor: saving ? 'not-allowed' : 'pointer', flexShrink: 0,
          }}>
          {paused ? 'Resume' : 'Pause'}
        </button>
      </div>

      {!paused && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 14 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3 }}>Frequency</span>
            <select style={selectStyle} value={frequencyDays} disabled={saving}
              onChange={e => patch({ frequencyDays: Number(e.target.value) })}>
              {FREQ_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3 }}>Time of day</span>
            <select style={selectStyle} value={hourIST} disabled={saving}
              onChange={e => patch({ hourIST: Number(e.target.value) })}>
              {HOUR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
        </div>
      )}
    </div>
  );
}
