import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { auth, firebaseConfigError, googleProvider } from '../firebase';
import { isNativeAndroidApp } from '../lib/platform';

type AuthMode = 'login' | 'signup';

interface LoginProps {
  className?: string;
}

const Login: React.FC<LoginProps> = ({ className }) => {
  const { t } = useTranslation();
  const loginComingSoonLabel = `${t('login.loginWithEmail')} (Coming Soon)`;
  const googleLoginComingSoonLabel = `${t('login.continueWithGoogle')} (Coming Soon)`;
  const isNativeAndroid = isNativeAndroidApp();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const buildAuthErrorMessage = (nextError: unknown): string => {
    const errorCode =
      typeof nextError === 'object' && nextError && 'code' in nextError && typeof nextError.code === 'string'
        ? nextError.code
        : '';

    if (errorCode.includes('auth/invalid-credential') || errorCode.includes('auth/wrong-password')) {
      return t('errors.auth.invalidCredential');
    }
    if (errorCode.includes('auth/user-not-found')) {
      return t('errors.auth.userNotFound');
    }
    if (errorCode.includes('auth/email-already-in-use')) {
      return t('errors.auth.emailAlreadyInUse');
    }
    if (errorCode.includes('auth/popup-closed-by-user')) {
      return t('errors.auth.popupClosed');
    }
    if (errorCode.includes('auth/too-many-requests')) {
      return t('errors.auth.tooManyRequests');
    }

    return nextError instanceof Error && nextError.message
      ? nextError.message
      : t('errors.auth.authenticationFailed');
  };

  useEffect(() => {
    if (!auth) {
      setCurrentUser(null);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setError(null);
    });

    return () => unsubscribe();
  }, []);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!auth) {
      setError(firebaseConfigError || t('errors.auth.firebaseAuthNotConfigured'));
      return;
    }
    if (!email.trim() || !password) {
      setError(t('errors.auth.enterEmailPassword'));
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      }
      setPassword('');
    } catch (nextError) {
      console.error('[HAMDEVA] auth submit failed', nextError);
      setError(buildAuthErrorMessage(nextError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth || !googleProvider) {
      setError(firebaseConfigError || t('errors.auth.googleSignInNotConfigured'));
      return;
    }
    if (isNativeAndroid) {
      const message = t('errors.auth.nativeAppGoogleUnsupported');
      console.error('[HAMDEVA] google sign-in blocked on native android app');
      setError(message);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (nextError) {
      console.error('[HAMDEVA] google sign-in failed', nextError);
      setError(buildAuthErrorMessage(nextError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    if (!auth) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await signOut(auth);
      setEmail('');
      setPassword('');
    } catch (nextError) {
      setError(buildAuthErrorMessage(nextError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={className}>
      {currentUser ? (
        <div className="auth-modal-body">
          <p>{t('login.signedInAs', { email: currentUser.email || t('login.googleUser') })}</p>
          <button className="outline-btn auth-google-btn" disabled={isSubmitting} onClick={handleLogout} type="button">
            {t('login.signOut')}
          </button>
        </div>
      ) : (
        <form className="auth-modal-body" onSubmit={handleEmailSubmit}>
          <label className="auth-field">
            <span>{t('ui.emailLabel', { defaultValue: 'Email' })}</span>
            <input
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              value={email}
            />
          </label>

          <label className="auth-field">
            <span>{t('ui.passwordLabel', { defaultValue: 'Password' })}</span>
            <input
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
          </label>

          {error && <p className="auth-error-text">{error}</p>}

          <button
            className={`generate-btn auth-submit-btn ${mode === 'login' ? 'auth-disabled-btn' : ''}`}
            disabled={mode === 'login' ? true : isSubmitting}
            type="submit"
          >
            {mode === 'login' ? loginComingSoonLabel : t('login.createAccount')}
          </button>

          <button
            className="outline-btn auth-google-btn auth-disabled-btn"
            disabled={true}
            onClick={handleGoogleLogin}
            type="button"
          >
            {googleLoginComingSoonLabel}
          </button>

          <button
            className="text-link-btn auth-switch-btn"
            disabled={mode === 'signup'}
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            type="button"
          >
            {mode === 'login' ? t('login.needAccount') : t('login.haveAccount')}
          </button>
        </form>
      )}
    </section>
  );
};

export default Login;
