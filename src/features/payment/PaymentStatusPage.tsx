import React from 'react';

interface PaymentStatusPageProps {
  title: string;
  description: string;
  sessionId: string | null;
  dailyCredit: number;
  paidCredit: number;
  copy: Record<string, any>;
  status: 'success' | 'pending' | 'failed';
  primaryLabel: string;
  secondaryLabel: string;
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
  status,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
}) => {
  const isSuccess = status === 'success';

  return (
    <div className="payment-page-shell">
      <article className="page-article">
        <h2>{title}</h2>
        <p>{description}</p>
        {sessionId && <p>{copy.paymentSessionLabel}: {sessionId}</p>}
        {isSuccess && (
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
            {primaryLabel}
          </button>
          <button className="outline-btn auth-inline-btn" onClick={onSecondary} type="button">
            {secondaryLabel}
          </button>
        </div>
      </article>
    </div>
  );
};

export default PaymentStatusPage;
