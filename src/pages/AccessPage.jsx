import { useState, useEffect, useCallback } from 'react';
import { C, alpha } from '../tokens';
import { useAuth, ADMIN_EMAIL } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { listAllUploadedBlobs, deleteFileFromDB, fmtSize } from '../utils/fileStorage';
import ConfirmModal from '../components/ConfirmModal';

export default function AccessPage() {
  const { user, isAdmin } = useAuth();
  const [users,   setUsers]   = useState([]);
  const [email,   setEmail]   = useState('');
  const [name,    setName]    = useState('');
  const [loading, setLoading] = useState(true);
  const [adding,  setAdding]  = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  // Storage maintenance — orphan scan/cleanup
  const [scanning,    setScanning]    = useState(false);
  const [cleaning,    setCleaning]    = useState(false);
  const [orphans,     setOrphans]     = useState(null); // null = not scanned yet
  const [scanError,   setScanError]   = useState('');
  const [confirmCleanup, setConfirmCleanup] = useState(false);
  const [cleanupResult,  setCleanupResult]  = useState('');

  const scanForOrphans = async () => {
    setScanning(true);
    setScanError('');
    setCleanupResult('');
    try {
      const [allBlobs, plansSnap, ideasSnap, filesSnap] = await Promise.all([
        listAllUploadedBlobs(),
        getDocs(collection(db, 'sharedPlans')),
        getDocs(collection(db, 'sharedIdeas')),
        getDocs(collection(db, 'sharedFiles')),
      ]);
      const referenced = new Set();
      const collect = (snap, key) => snap.docs.forEach(d => {
        const data = d.data();
        const id = key === 'attachedFile' ? data?.attachedFile?.blobId : data?.blobId || data?.attachedFile?.blobId;
        if (id) referenced.add(id);
      });
      collect(plansSnap, 'attachedFile');
      collect(ideasSnap, 'attachedFile');
      collect(filesSnap, 'either');
      const orphanList = allBlobs.filter(b => !referenced.has(b.blobId));
      setOrphans(orphanList);
    } catch (e) {
      console.error('[scanForOrphans]', e);
      setScanError(e?.message || 'Scan failed.');
    }
    setScanning(false);
  };

  const runCleanup = async () => {
    setConfirmCleanup(false);
    if (!orphans?.length) return;
    setCleaning(true);
    setCleanupResult('');
    let deleted = 0;
    let failed = 0;
    for (const o of orphans) {
      try { await deleteFileFromDB(o.blobId); deleted++; }
      catch { failed++; }
    }
    setCleanupResult(`Deleted ${deleted} orphan${deleted === 1 ? '' : 's'}${failed ? ` (${failed} failed)` : ''}.`);
    setOrphans([]);
    setCleaning(false);
  };

  const orphanTotalSize = orphans?.reduce((sum, o) => sum + (o.size || 0), 0) || 0;

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const snap = await getDocs(collection(db, 'allowedUsers'));
    setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) loadUsers();
  }, [isAdmin, loadUsers]);

  const addUser = async () => {
    const emailLower = email.trim().toLowerCase();
    if (!emailLower) return;
    if (emailLower === ADMIN_EMAIL) { setError('Admin is always allowed — no need to add.'); return; }
    if (!emailLower.includes('@')) { setError('Enter a valid email address.'); return; }
    setAdding(true); setError(''); setSuccess('');
    try {
      await setDoc(doc(db, 'allowedUsers', emailLower), {
        email: emailLower,
        name: name.trim() || emailLower.split('@')[0],
        addedAt: serverTimestamp(),
        addedBy: user.email,
      });
      setEmail(''); setName('');
      setSuccess(`${emailLower} can now sign in.`);
      await loadUsers();
    } catch (e) {
      setError('Failed to add user: ' + e.message);
    }
    setAdding(false);
  };

  const removeUser = async (uid) => {
    await deleteDoc(doc(db, 'allowedUsers', uid));
    await loadUsers();
  };

  if (!isAdmin) {
    return (
      <div className="page-pad" style={{ background: C.bg0, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: C.fg3 }}>Admin access only.</div>
      </div>
    );
  }

  return (
    <div className="page-pad" style={{ background: C.bg0 }}>
      <div style={{ maxWidth: 680, margin: '0 auto', width: '100%' }}>

        <div className="grad-text page-title" style={{ marginBottom: 6 }}>Access Control</div>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: C.fg2, margin: '0 0 28px 0', lineHeight: 1.6 }}>
          Only invited users can sign in. Add their Gmail address below — they'll be able to sign in immediately on their next attempt.
        </p>

        {/* Add user card */}
        <div style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px 22px', marginBottom: 28 }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: C.fg1, marginBottom: 14 }}>
            Invite a user
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Name (optional)"
              style={{ flex: 1, minWidth: 120, background: C.bg0, border: `1px solid ${C.border}`, borderRadius: 6, color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 15, padding: '8px 12px', outline: 'none', boxSizing: 'border-box' }} />
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Gmail address"
              onKeyDown={e => e.key === 'Enter' && addUser()}
              style={{ flex: 2, minWidth: 180, background: C.bg0, border: `1px solid ${C.border}`, borderRadius: 6, color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 15, padding: '8px 12px', outline: 'none', boxSizing: 'border-box' }} />
            <button onClick={addUser} disabled={adding || !email.trim()}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, padding: '8px 20px', borderRadius: 6, background: email.trim() ? C.accent : C.bg2, color: email.trim() ? '#fff' : C.fg3, border: 'none', cursor: email.trim() ? 'pointer' : 'not-allowed', flexShrink: 0 }}>
              {adding ? 'Adding…' : 'Add'}
            </button>
          </div>
          {error   && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.danger,  marginTop: 4 }}>{error}</div>}
          {success && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.accent,  marginTop: 4 }}>{success}</div>}
        </div>

        {/* Storage maintenance */}
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: C.fg3, marginBottom: 10, marginTop: 8 }}>
          Storage maintenance
        </div>
        <div style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px 22px', marginBottom: 28 }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg2, lineHeight: 1.6, marginBottom: 14 }}>
            Find files in Firebase Storage that are no longer referenced by any plan, idea, or document — and delete them to reclaim space.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={scanForOrphans} disabled={scanning || cleaning}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, padding: '7px 16px', borderRadius: 6, background: scanning ? C.bg2 : C.accent, color: scanning ? C.fg3 : '#fff', border: 'none', cursor: scanning || cleaning ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              {scanning
                ? <><span style={{ display: 'inline-block', width: 10, height: 10, border: `1.5px solid ${C.fg3}`, borderTopColor: C.fg1, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Scanning…</>
                : 'Scan for orphaned files'}
            </button>
            {orphans !== null && orphans.length > 0 && !cleaning && (
              <button onClick={() => setConfirmCleanup(true)}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, padding: '7px 16px', borderRadius: 6, background: 'none', color: C.danger, border: `1px solid ${alpha(C.danger, 44)}`, cursor: 'pointer' }}>
                Delete {orphans.length} orphan{orphans.length === 1 ? '' : 's'} ({fmtSize(orphanTotalSize)})
              </button>
            )}
            {cleaning && (
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ display: 'inline-block', width: 10, height: 10, border: `1.5px solid ${C.border}`, borderTopColor: C.accent, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                Deleting…
              </span>
            )}
          </div>
          {scanError && (
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.danger, marginTop: 10 }}>{scanError}</div>
          )}
          {orphans !== null && !scanning && (
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: orphans.length === 0 ? C.success : C.fg2, marginTop: 10 }}>
              {orphans.length === 0
                ? '✓ No orphaned files found — Storage is clean.'
                : `Found ${orphans.length} orphaned file${orphans.length === 1 ? '' : 's'} totalling ${fmtSize(orphanTotalSize)}.`}
            </div>
          )}
          {cleanupResult && (
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.accent, marginTop: 10 }}>{cleanupResult}</div>
          )}
        </div>

        {/* List */}
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: C.fg3, marginBottom: 10 }}>
          Allowed users {!loading && `(${users.length + 1})`}
        </div>

        {/* Admin row — always shown */}
        <UserRow
          initials={ADMIN_EMAIL[0].toUpperCase()}
          name="You (Admin)"
          email={ADMIN_EMAIL}
          badge="Admin"
          accent
        />

        {loading ? (
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.fg3, padding: '20px 0', textAlign: 'center' }}>Loading…</div>
        ) : users.length === 0 ? (
          <div style={{ background: C.bg1, border: `1px dashed ${C.border}`, borderRadius: 8, padding: '24px 16px', textAlign: 'center', marginTop: 6 }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.fg3 }}>No invited users yet. Add a Gmail address above.</div>
          </div>
        ) : (
          users.map(u => (
            <UserRow key={u.id}
              initials={(u.name || u.email)[0].toUpperCase()}
              name={u.name}
              email={u.email}
              onRemove={() => removeUser(u.id)}
            />
          ))
        )}
      </div>
      {confirmCleanup && (
        <ConfirmModal
          title="Delete orphaned files?"
          message={`This will permanently delete ${orphans?.length || 0} file${(orphans?.length || 0) === 1 ? '' : 's'} (${fmtSize(orphanTotalSize)}) from Firebase Storage. These files are not referenced by any plan, idea, or document. This cannot be undone.`}
          confirmLabel="Delete orphans"
          variant="danger"
          onConfirm={runCleanup}
          onCancel={() => setConfirmCleanup(false)} />
      )}
    </div>
  );
}

function UserRow({ initials, name, email, badge, accent, onRemove }) {
  return (
    <div style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 16px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 34, height: 34, borderRadius: '50%', background: accent ? C.accentBg : C.bg2, border: `1px solid ${accent ? alpha(C.accent, 33) : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent ? C.accent : C.fg2, fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: C.fg1 }}>{name}</div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.fg3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
      </div>
      {badge && (
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.accent, background: C.accentBg, border: `1px solid ${alpha(C.accent, 33)}`, borderRadius: 4, padding: '2px 8px', flexShrink: 0 }}>{badge}</span>
      )}
      {onRemove && (
        <button onClick={onRemove}
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.danger, background: 'none', border: `1px solid ${alpha(C.danger, 33)}`, borderRadius: 6, cursor: 'pointer', padding: '4px 10px', flexShrink: 0 }}
          onMouseEnter={e => e.currentTarget.style.background = alpha(C.danger, 11)}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}>
          Remove
        </button>
      )}
    </div>
  );
}
