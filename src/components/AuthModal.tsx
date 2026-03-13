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
  mode,
  onClose,
  onEmailChange,
  onGoogleLogin,
  onPasswordChange,
  onSubmit,
  onSwitchMode,
}) => {
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

        <div className="auth-modal-body">
          <label className="auth-field">
            <span>{copy.emailLabel}</span>
            <input
              autoComplete="email"
              type="email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
            />
          </label>

          <label className="auth-field">
            <span>{copy.passwordLabel}</span>
            <input
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              type="password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
            />
          </label>

          {error && <p className="auth-error-text">{error}</p>}

          <button className="generate-btn auth-submit-btn" disabled={isSubmitting} onClick={onSubmit} type="button">
            {mode === 'login' ? copy.loginButton : copy.signupButton}
          </button>

          <button className="outline-btn auth-google-btn" disabled={isSubmitting} onClick={onGoogleLogin} type="button">
            {copy.googleButton}
          </button>

          <button
            className="text-link-btn auth-switch-btn"
            onClick={() => onSwitchMode(mode === 'login' ? 'signup' : 'login')}
            type="button"
          >
            {mode === 'login' ? copy.switchToSignup : copy.switchToLogin}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;

