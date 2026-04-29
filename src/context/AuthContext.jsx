import { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider, db } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext(null);

export const ADMIN_EMAIL = 'thenewbeginningsventure@gmail.com';

export function AuthProvider({ children }) {
  const [user, setUser]                 = useState(null);
  const [loading, setLoading]           = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        setLoading(false);
        return;
      }
      if (u.email === ADMIN_EMAIL) {
        setUser(u);
        setAccessDenied(false);
        setLoading(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'allowedUsers', u.email));
        if (snap.exists()) {
          setUser(u);
          setAccessDenied(false);
        } else {
          await signOut(auth);
          setUser(null);
          setAccessDenied(true);
        }
      } catch {
        await signOut(auth);
        setUser(null);
        setAccessDenied(true);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signInWithGoogle = () => {
    setAccessDenied(false);
    return signInWithPopup(auth, googleProvider);
  };
  const signOutUser = () => signOut(auth);

  return (
    <AuthContext.Provider value={{
      user, loading, accessDenied,
      isAdmin: user?.email === ADMIN_EMAIL,
      signInWithGoogle, signOutUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
