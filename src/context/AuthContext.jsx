import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
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

// Firestore error codes that are transient (network / server congestion, not
// a security decision). These should fall back to the local cache and / or
// offer a retry rather than hard-denying the user.
const isTransient = (code) =>
  code === 'unavailable' ||
  code === 'deadline-exceeded' ||
  code === 'resource-exhausted' ||
  code === 'internal' ||
  code === 'cancelled';

export function AuthProvider({ children }) {
  const [user, setUser]                 = useState(null);
  const [loading, setLoading]           = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  // verifyError=true means the allowedUsers Firestore read failed transiently.
  // The Firebase Auth session is kept alive so retryAuth() can re-check
  // without opening the Google popup again.
  const [verifyError, setVerifyError]   = useState(false);
  const [userRole, setUserRole]         = useState('Editor');

  // appReady gates the final loading flag. On mobile we keep the spinner
  // until getRedirectResult settles, so a redirect-fallback session is never
  // interrupted by a premature sign-in screen.
  const [appReady, setAppReady]         = useState(!isMobile);
  const redirectReadyRef                = useRef(!isMobile);
  const pendingNullRef                  = useRef(false); // null arrived while redirect was pending
  // Holds the Firebase user when verifyError=true so retryAuth can re-check
  // without a new Google sign-in.
  const pendingFirebaseUserRef          = useRef(null);

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

  // Core allowlist check — extracted so retryAuth can call it without
  // reopening the Google popup. All values it closes over are stable
  // (state setters, refs, module-level constants) so useCallback(fn, []).
  const verifyAndSetUser = useCallback(async (u) => {
    const email = (u.email || '').toLowerCase().trim();

    // Reject unverified emails — defense in depth; Google always returns
    // email_verified=true so this never blocks the happy path.
    if (!u.emailVerified) {
      await signOut(auth);
      pendingFirebaseUserRef.current = null;
      setUser(null); setAccessDenied(true); setVerifyError(false);
      setLoading(false);
      return;
    }

    // Admin fast-path: skip Firestore read entirely.
    if (ADMIN_EMAILS.has(email)) {
      pendingFirebaseUserRef.current = null;
      setUser(u); setAccessDenied(false); setVerifyError(false);
      setLoading(false);
      return;
    }

    try {
      let snap;
      try {
        // Live server read — always sees the current allowlist, not cache.
        snap = await getDocFromServer(doc(db, 'allowedUsers', email));
      } catch (serverErr) {
        const code = serverErr?.code || '';
        // Fall back to the local Firestore cache for ANY transient error
        // (not just 'unavailable'). On mobile, deadline-exceeded and other
        // transient codes are common when the network is flaky.
        if (!isTransient(code)) throw serverErr;
        snap = await getDoc(doc(db, 'allowedUsers', email));
      }

      if (snap.exists()) {
        pendingFirebaseUserRef.current = null;
        setUser(u); setAccessDenied(false); setVerifyError(false);
        setUserRole(snap.data()?.role || 'Editor');
        // Non-critical: record last active time. Fails silently for non-admins
        // (Firestore write rule = admins only).
        setDoc(doc(db, 'allowedUsers', email), { lastSeenAt: serverTimestamp() }, { merge: true }).catch(() => {});
      } else {
        await signOut(auth);
        pendingFirebaseUserRef.current = null;
        setUser(null); setAccessDenied(true); setVerifyError(false);
      }
    } catch (err) {
      const code = err?.code || '';
      const isSecurityErr =
        code === 'permission-denied' || code === 'PERMISSION_DENIED' || code === 'unauthenticated';

      if (isSecurityErr) {
        // Hard deny — the user is definitively not in the allowlist.
        await signOut(auth);
        pendingFirebaseUserRef.current = null;
        setUser(null); setAccessDenied(true); setVerifyError(false);
      } else {
        // Transient network error — do NOT call signOut(). Keeping the
        // Firebase Auth session alive lets retryAuth() re-run this check
        // without forcing the user through the Google popup again.
        pendingFirebaseUserRef.current = u;
        setUser(null); setVerifyError(true);
      }
    }
    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        if (isMobile && !redirectReadyRef.current) {
          // Redirect hasn't settled yet — park this null.
          pendingNullRef.current = true;
          return;
        }
        pendingFirebaseUserRef.current = null;
        setUser(null); setVerifyError(false);
        setLoading(false);
        return;
      }

      // A real user arrived — discard any parked null.
      pendingNullRef.current = false;
      await verifyAndSetUser(u);
    });
    return unsub;
  }, [verifyAndSetUser]);

  // Re-runs the allowlist check using the saved Firebase Auth session.
  // The user never sees the Google popup again — only needed when a
  // previous attempt failed due to a transient network error.
  const retryAuth = useCallback(async () => {
    const u = pendingFirebaseUserRef.current;
    if (!u) {
      // Firebase session expired; fall back to a full sign-in.
      return signInWithGoogle();
    }
    setVerifyError(false);
    setLoading(true);
    await verifyAndSetUser(u);
  }, [verifyAndSetUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const signInWithGoogle = async () => {
    setAccessDenied(false);
    setVerifyError(false);
    if (isMobile) {
      try {
        // Popup is more reliable than redirect on modern iOS Safari (15+).
        // It communicates via postMessage so ITP's bounce-tracker protection
        // cannot clear the auth state mid-flow.
        return await signInWithPopup(auth, googleProvider);
      } catch (err) {
        const code = err?.code || '';
        // Only fall back to redirect in environments that have no window.open()
        // at all (e.g., iOS WKWebView). For popup-blocked / popup-closed errors
        // we throw instead: the redirect fallback also fails on iOS Safari because
        // ITP's bounce-tracker protection strips the auth state mid-redirect,
        // silently dropping the user back on the sign-in page in a loop.
        if (code === 'auth/operation-not-supported-in-this-environment') {
          return signInWithRedirect(auth, googleProvider);
        }
        throw err;
      }
    }
    return signInWithPopup(auth, googleProvider);
  };

  const signOutUser = () => {
    pendingFirebaseUserRef.current = null;
    setVerifyError(false);
    return signOut(auth);
  };

  const isAdmin = ADMIN_EMAILS.has((user?.email || '').toLowerCase().trim());

  return (
    <AuthContext.Provider value={{
      user, loading: loading || !appReady, accessDenied, verifyError,
      isAdmin,
      isViewer: !isAdmin && userRole === 'Viewer',
      userRole,
      signInWithGoogle, signOutUser, retryAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
