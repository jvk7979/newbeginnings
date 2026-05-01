import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { auth, googleProvider, db } from '../firebase';
import {
  signInWithPopup, signInWithRedirect, getRedirectResult, signOut,
  onAuthStateChanged, setPersistence, browserLocalPersistence, browserSessionPersistence,
} from 'firebase/auth';
import { doc, getDoc, getDocFromServer, setDoc, serverTimestamp } from 'firebase/firestore';

// On mobile we try signInWithPopup first — it avoids the cross-domain redirect
// bounce (github.io → google.com → firebaseapp.com → github.io) that iOS
// Safari's ITP bounce-tracking protection can break by clearing localStorage.
// signInWithPopup opens Google in a separate window and communicates back via
// postMessage, which ITP does not block.
//
// If the popup is blocked by the browser, we silently fall back to
// signInWithRedirect. We still process getRedirectResult on every mobile
// load so that a redirect-fallback session is not lost on return.
const isMobile = typeof navigator !== 'undefined'
  && /iPhone|iPad|iPod|Android|Mobile/i.test(navigator.userAgent || '');

const AuthContext = createContext(null);

export const ADMIN_EMAIL = 'thenewbeginningsventure@gmail.com';
const ADMIN_EMAILS = new Set([
  'thenewbeginningsventure@gmail.com',
  'nsivasree99@gmail.com',
]);

export function AuthProvider({ children }) {
  const [user, setUser]                 = useState(null);
  const [loading, setLoading]           = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [userRole, setUserRole]         = useState('Editor');

  // appReady gates the final loading flag. On mobile we keep the spinner
  // until getRedirectResult settles, so a redirect-fallback session is never
  // interrupted by a premature sign-in screen.
  const [appReady, setAppReady]         = useState(!isMobile);
  const redirectReadyRef                = useRef(!isMobile);
  const pendingNullRef                  = useRef(false); // null arrived while redirect was pending

  useEffect(() => {
    if (!isMobile) return;

    // Prefer local persistence; fall back to session if IndexedDB is blocked
    // (common in iOS Safari private mode where ITP clears IndexedDB).
    setPersistence(auth, browserLocalPersistence)
      .catch(() => setPersistence(auth, browserSessionPersistence).catch(() => {}));

    // Process any redirect-fallback result from a previous signInWithRedirect
    // call. Most of the time this returns null (popup path was used).
    getRedirectResult(auth)
      .catch(err => {
        const code = err?.code || 'unknown';
        const msg  = err?.message || String(err);
        console.error('[auth/redirect]', code, msg);
        try {
          sessionStorage.setItem('auth_redirect_error', JSON.stringify({ code, msg, at: Date.now() }));
        } catch { /* sessionStorage may be blocked in private mode */ }
      })
      .finally(() => {
        redirectReadyRef.current = true;
        // If onAuthStateChanged already parked a null while we were waiting,
        // no redirect user is coming — safe to show the sign-in screen now.
        if (pendingNullRef.current) {
          setUser(null);
          setLoading(false);
        }
        setAppReady(true);
      });
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        if (isMobile && !redirectReadyRef.current) {
          // Redirect hasn't settled yet — this null is the pre-redirect state.
          // Park it; getRedirectResult.finally() will resolve the loading state.
          pendingNullRef.current = true;
          return;
        }
        setUser(null);
        setLoading(false);
        return;
      }

      // A real user arrived — discard any parked null.
      pendingNullRef.current = false;

      // Normalize email (lowercase + trim) so allowedUsers/<id> lookups
      // are case-insensitive — matches the same rule used server-side
      // in functions/index.js and firestore.rules.
      const email = (u.email || '').toLowerCase().trim();

      // Reject unverified emails — defense in depth against a federated
      // provider that doesn't confirm ownership (Google sign-in always
      // returns email_verified=true, so this never blocks the happy path).
      if (!u.emailVerified) {
        await signOut(auth);
        setUser(null);
        setAccessDenied(true);
        setLoading(false);
        return;
      }
      if (ADMIN_EMAILS.has(email)) {
        setUser(u);
        setAccessDenied(false);
        setLoading(false);
        return;
      }
      try {
        // Try a live server read first so we always see the current allowlist.
        // If the network is unavailable, fall back to the local Firestore cache
        // so users on spotty mobile connections aren't incorrectly signed out.
        let snap;
        try {
          snap = await getDocFromServer(doc(db, 'allowedUsers', email));
        } catch (serverErr) {
          if (serverErr?.code !== 'unavailable') throw serverErr;
          snap = await getDoc(doc(db, 'allowedUsers', email));
        }

        if (snap.exists()) {
          setUser(u);
          setAccessDenied(false);
          setUserRole(snap.data()?.role || 'Editor');
          // Non-critical: record last active time for admin visibility.
          // Fails silently for non-admins (Firestore write rule = admins only).
          setDoc(doc(db, 'allowedUsers', email), { lastSeenAt: serverTimestamp() }, { merge: true }).catch(() => {});
        } else {
          await signOut(auth);
          setUser(null);
          setAccessDenied(true);
        }
      } catch (err) {
        // Only hard-deny on permission errors — the user is definitively not
        // allowed. Network/timeout errors are transient (common on mobile);
        // signing the user out with accessDenied=true would show a false
        // "Access denied" message. Instead, sign out silently so they can retry.
        await signOut(auth);
        setUser(null);
        if (err?.code === 'permission-denied' || err?.code === 'PERMISSION_DENIED') {
          setAccessDenied(true);
        }
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signInWithGoogle = async () => {
    setAccessDenied(false);
    if (isMobile) {
      try {
        // Popup is more reliable than redirect on modern iOS Safari (15+).
        // It communicates via postMessage so ITP's bounce-tracker protection
        // cannot clear the auth state mid-flow.
        return await signInWithPopup(auth, googleProvider);
      } catch (err) {
        const code = err?.code || '';
        if (
          code === 'auth/popup-blocked' ||
          code === 'auth/popup-closed-by-user' ||
          code === 'auth/cancelled-popup-request' ||
          code === 'auth/operation-not-supported-in-this-environment'
        ) {
          // Popup was blocked or the environment doesn't support it.
          // Fall back to redirect flow — getRedirectResult above handles
          // the return trip.
          return signInWithRedirect(auth, googleProvider);
        }
        throw err;
      }
    }
    return signInWithPopup(auth, googleProvider);
  };
  const signOutUser = () => signOut(auth);

  const isAdmin = ADMIN_EMAILS.has((user?.email || '').toLowerCase().trim());

  return (
    <AuthContext.Provider value={{
      user, loading: loading || !appReady, accessDenied,
      isAdmin,
      isViewer: !isAdmin && userRole === 'Viewer',
      userRole,
      signInWithGoogle, signOutUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
