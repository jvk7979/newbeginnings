import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyAECbFJhBK5NQ3tXCzQHjsr8uIobUHAuDQ',
  authDomain: 'newbeginnings-eb4b0.firebaseapp.com',
  projectId: 'newbeginnings-eb4b0',
  storageBucket: 'newbeginnings-eb4b0.firebasestorage.app',
  messagingSenderId: '243821759961',
  appId: '1:243821759961:web:64e203adafa4967bf59dc8',
};

export const app  = initializeApp(firebaseConfig);
export const db   = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
