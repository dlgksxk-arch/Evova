import React from 'react';

interface PaymentStatusPageProps {
  title: string;
  description: string;
  sessionId: string | null;
  dailyCredit: number;
  paidCredit: number;
  copy: Record<string, any>;
  success: boolean;
  onPrimary: () => void;
  onSecondary: () => void;
}

const PaymentStatusPage: React.FC<PaymentStatusPageProps> = ({
  title,
  description,
  sessionId,
  dailyCredit,
  paidCredit,
  copy,
  success,
  onPrimary,
  onSecondary,
}) => (
  <div className="payment-page-shell">
    <article className="page-article">
      <h2>{title}</h2>
      <p>{description}</p>
      {success && sessionId && <p>{copy.paymentSessionLabel}: {sessionId}</p>}
      {success && (
        <div className="credit-balance-grid">
          <div className="credit-balance-card">
            <span>{copy.dailyCreditLabel}</span>
            <strong>{dailyCredit}</strong>
          </div>
          <div className="credit-balance-card">
            <span>{copy.paidCreditLabel}</span>
            <strong>{paidCredit}</strong>
          </div>
        </div>
      )}
      <div className="credit-cta-actions">
        <button className="generate-btn auth-inline-btn" onClick={onPrimary} type="button">
          {success ? copy.goToMyPage : copy.chargeCredits}
        </button>
        <button className="outline-btn auth-inline-btn" onClick={onSecondary} type="button">
          {copy.heroCta}
        </button>
      </div>
    </article>
  </div>
);

export default PaymentStatusPage;
