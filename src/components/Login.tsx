import React, { useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { auth, firebaseConfigError, googleProvider } from '../firebase';

type AuthMode = 'login' | 'signup';

interface LoginProps {
  className?: string;
}

const buildAuthErrorMessage = (error: unknown): string => {
  const errorCode =
    typeof error === 'object' && error && 'code' in error && typeof error.code === 'string'
      ? error.code
      : '';

  if (errorCode.includes('auth/invalid-credential') || errorCode.includes('auth/wrong-password')) {
    return 'Invalid email or password.';
  }
  if (errorCode.includes('auth/user-not-found')) {
    return 'No account exists for this email.';
  }
  if (errorCode.includes('auth/email-already-in-use')) {
    return 'This email is already registered.';
  }
  if (errorCode.includes('auth/popup-closed-by-user')) {
    return 'The Google sign-in popup was closed.';
  }
  if (errorCode.includes('auth/too-many-requests')) {
    return 'Too many attempts. Please try again later.';
  }

  return error instanceof Error && error.message ? error.message : 'Authentication failed.';
};

const Login: React.FC<LoginProps> = ({ className }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setError(firebaseConfigError || 'Firebase Auth is not configured.');
      return;
    }
    if (!email.trim() || !password) {
      setError('Enter both email and password.');
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
      setError(buildAuthErrorMessage(nextError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth || !googleProvider) {
      setError(firebaseConfigError || 'Google sign-in is not configured.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (nextError) {
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
          <p>Signed in as {currentUser.email || 'Google user'}.</p>
          <button className="outline-btn auth-google-btn" disabled={isSubmitting} onClick={handleLogout} type="button">
            Sign out
          </button>
        </div>
      ) : (
        <form className="auth-modal-body" onSubmit={handleEmailSubmit}>
          <label className="auth-field">
            <span>Email</span>
            <input
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              value={email}
            />
          </label>

          <label className="auth-field">
            <span>Password</span>
            <input
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
          </label>

          {error && <p className="auth-error-text">{error}</p>}

          <button className="generate-btn auth-submit-btn" disabled={isSubmitting} type="submit">
            {mode === 'login' ? 'Log in with email' : 'Create account'}
          </button>

          <button
            className="outline-btn auth-google-btn"
            disabled={isSubmitting}
            onClick={handleGoogleLogin}
            type="button"
          >
            Continue with Google
          </button>

          <button
            className="text-link-btn auth-switch-btn"
            disabled={isSubmitting}
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            type="button"
          >
            {mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Log in'}
          </button>
        </form>
      )}
    </section>
  );
};

export default Login;
