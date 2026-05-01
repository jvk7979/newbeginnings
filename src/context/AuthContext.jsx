import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { auth, googleProvider, db } from '../firebase';
import {
  signInWithPopup, signInWithRedirect, getRedirectResult, signOut,
  onAuthStateChanged, setPersistence, browserLocalPersistence, browserSessionPersistence,
} from 'firebase/auth';
import { doc, getDocFromServer, setDoc, serverTimestamp } from 'firebase/firestore';

// iOS Safari + signInWithPopup is unreliable: Intelligent Tracking Prevention
// strips third-party storage on the popup, and even when it succeeds the
// pop-up window is often blocked. signInWithRedirect avoids both problems
// because the auth flow happens in the top-level navigation. We use the
// redirect path on any touch device and keep the popup on desktop where
// it's faster.
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

  // On mobile we use signInWithRedirect. The page navigates away and returns,
  // causing Firebase to fire onAuthStateChanged(null) before the redirect
  // result is processed. We must NOT drop the loading spinner on that null —
  // a real user may arrive milliseconds later.
  //
  // Strategy: park the null in a ref and only resolve it after
  // getRedirectResult() settles. appReady gates the final loading flag so
  // the spinner stays up until we have a definitive auth decision.
  const [appReady, setAppReady]         = useState(!isMobile);
  const redirectReadyRef                = useRef(!isMobile);
  const pendingNullRef                  = useRef(false); // null arrived while redirect was pending

  useEffect(() => {
    if (!isMobile) return;

    // Prefer local persistence; fall back to session if IndexedDB is blocked
    // (common in iOS Safari private mode where ITP clears IndexedDB).
    setPersistence(auth, browserLocalPersistence)
      .catch(() => setPersistence(auth, browserSessionPersistence).catch(() => {}));

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
        // the redirect brought no user — safe to show the sign-in screen now.
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
        // getDocFromServer bypasses Firestore's offline cache so we always
        // hit the live allowlist. A cached doc could be stale (e.g. user
        // was added after a previous denied attempt that got cached).
        const snap = await getDocFromServer(doc(db, 'allowedUsers', email));
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

  const signInWithGoogle = () => {
    setAccessDenied(false);
    if (isMobile) {
      // On mobile we navigate to Google. The browser leaves the page; the
      // returned promise resolves before the redirect, but visibly the
      // user never sees that resolution.
      return signInWithRedirect(auth, googleProvider);
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
