import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyAi5RSkSlAWy6Tu8avZeisBRjJ_PkE09jc',
  authDomain: 'newbeginnings-b4abe.firebaseapp.com',
  projectId: 'newbeginnings-b4abe',
  storageBucket: 'newbeginnings-b4abe.firebasestorage.app',
  messagingSenderId: '161687769990',
  appId: '1:161687769990:web:9a450011384e7ab3445207',
  databaseURL: 'https://newbeginnings-b4abe-default-rtdb.firebaseio.com',
};

export const app            = initializeApp(firebaseConfig);
export const db             = getFirestore(app);
export const rtdb           = getDatabase(app);
export const auth           = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
