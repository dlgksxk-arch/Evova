import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../../firebase';
import { isNativeAndroidApp } from '../platform';

const buildNativeGoogleCredential = (credential?: {
  idToken?: string;
  accessToken?: string;
} | null) => {
  const idToken = credential?.idToken?.trim() || undefined;
  const accessToken = credential?.accessToken?.trim() || undefined;

  if (!idToken && !accessToken) {
    throw new Error('NATIVE_GOOGLE_CREDENTIAL_MISSING');
  }

  return GoogleAuthProvider.credential(idToken, accessToken);
};

export const signInWithGoogleOnAndroid = async (): Promise<User> => {
  if (!isNativeAndroidApp()) {
    throw new Error('NATIVE_ANDROID_ONLY');
  }
  if (!auth) {
    throw new Error('FIREBASE_AUTH_NOT_READY');
  }

  const nativeResult = await FirebaseAuthentication.signInWithGoogle({
    skipNativeAuth: true,
  });

  const firebaseCredential = buildNativeGoogleCredential(nativeResult.credential);
  const credential = await signInWithCredential(auth, firebaseCredential);
  return credential.user;
};
