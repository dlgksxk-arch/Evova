import React, { useEffect } from 'react';

type AuthMode = 'login' | 'signup';

interface AuthCopy {
  loginTitle: string;
  signupTitle: string;
  emailLabel: string;
  passwordLabel: string;
  loginButton: string;
  signupButton: string;
  googleButton: string;
  switchToSignup: string;
  switchToLogin: string;
}

interface AuthModalProps {
  copy: AuthCopy;
  email: string;
  password: string;
  error: string | null;
  isSubmitting: boolean;
  loginDisabled?: boolean;
  mode: AuthMode;
  onClose: () => void;
  onEmailChange: (value: string) => void;
  onGoogleLogin: () => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  onSwitchMode: (mode: AuthMode) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({
  copy,
  email,
  password,
  error,
  isSubmitting,
  loginDisabled = false,
  mode,
  onClose,
  onEmailChange,
  onGoogleLogin,
  onPasswordChange,
  onSubmit,
  onSwitchMode,
}) => {
  const loginActionsDisabled = loginDisabled || isSubmitting;
  const loginSwitchDisabled = loginDisabled && mode === 'signup';

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content auth-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3>{mode === 'login' ? copy.loginTitle : copy.signupTitle}</h3>
          <button className="close-btn" onClick={onClose} type="button">
            &times;
          </button>
        </div>

        <form
          className="auth-modal-body"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <label className="auth-field">
            <span>{copy.emailLabel}</span>
            <input
              autoComplete="email"
              type="email"
              required
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
            />
          </label>

          <label className="auth-field">
            <span>{copy.passwordLabel}</span>
            <input
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              type="password"
              required
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
            />
          </label>

          {error && <p className="auth-error-text">{error}</p>}

          <button
            className="generate-btn auth-submit-btn"
            disabled={mode === 'login' ? loginActionsDisabled : isSubmitting}
            onClick={onSubmit}
            type="submit"
          >
            {mode === 'login' ? copy.loginButton : copy.signupButton}
          </button>

          <button
            className="outline-btn auth-google-btn"
            disabled={loginActionsDisabled}
            onClick={onGoogleLogin}
            type="button"
          >
            {copy.googleButton}
          </button>

          <button
            className="text-link-btn auth-switch-btn"
            disabled={loginSwitchDisabled}
            onClick={() => onSwitchMode(mode === 'login' ? 'signup' : 'login')}
            type="button"
          >
            {mode === 'login' ? copy.switchToSignup : copy.switchToLogin}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
