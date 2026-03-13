import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseEnv = {
  VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY?.trim() || '',
  VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim() || '',
  VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim() || '',
  VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim() || '',
  VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim() || '',
  VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID?.trim() || '',
} as const;

export const firebaseConfig = {
  apiKey: firebaseEnv.VITE_FIREBASE_API_KEY,
  authDomain: firebaseEnv.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: firebaseEnv.VITE_FIREBASE_PROJECT_ID,
  storageBucket: firebaseEnv.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: firebaseEnv.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: firebaseEnv.VITE_FIREBASE_APP_ID,
};

export const missingFirebaseEnvKeys = Object.entries(firebaseEnv)
  .filter(([, value]) => !value)
  .map(([key]) => key);

let firebaseConfigError: string | null = missingFirebaseEnvKeys.length > 0
  ? `Firebase 설정 누락: ${missingFirebaseEnvKeys.join(', ')}`
  : null;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (!firebaseConfigError) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Firebase initialization failed';
    firebaseConfigError = message.includes('invalid-api-key')
      ? 'Firebase 설정이 올바르지 않습니다. VITE_FIREBASE_API_KEY를 확인해 주세요.'
      : `Firebase 초기화 실패: ${message}`;
  }
}

export { app, auth, db, googleProvider, firebaseConfigError };
export const isFirebaseConfigured = !firebaseConfigError;
