import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: 'AIzaSyAi5RSkSlAWy6Tu8avZeisBRjJ_PkE09jc',
  authDomain: 'newbeginnings-b4abe.firebaseapp.com',
  projectId: 'newbeginnings-b4abe',
  storageBucket: 'newbeginnings-b4abe.firebasestorage.app',
  messagingSenderId: '161687769990',
  appId: '1:161687769990:web:9a450011384e7ab3445207',
};

export const app            = initializeApp(firebaseConfig);

// Firestore offline persistence — every read hits IndexedDB first, so
// pages render instantly on flaky / no-connection visits, and any writes
// made while offline get queued and flushed when the network returns.
// `persistentMultipleTabManager` lets the cache be shared across tabs of
// the same app (vs each tab keeping its own isolated cache). Falling back
// to in-memory if IndexedDB fails is automatic — `initializeFirestore`
// silently downgrades on browsers that don't support it.
export const db             = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export const storage        = getStorage(app);
export const auth           = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
// Region must match the deploy region declared in functions/index.js
// (us-central1 is the default for v2 callables).
export const functions      = getFunctions(app, 'us-central1');
