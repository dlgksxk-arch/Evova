import React from 'react';
import type { PaymentStatusDetails } from '../../hooks/usePaymentSessionStatus';

interface PaymentStatusPageProps {
  title: string;
  description: string;
  credits: number;
  details: PaymentStatusDetails | null;
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
  credits,
  details,
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
        {description ? <p>{description}</p> : null}
        {isSuccess && (
          <>
            {(typeof details?.addedPaidCredit === 'number' || (
              details?.previousSubscriptionPlan
              && details?.nextSubscriptionPlan
              && details.previousSubscriptionPlan !== details.nextSubscriptionPlan
            )) ? (
              <div className="payment-result-summary">
                {typeof details?.addedPaidCredit === 'number' ? (
                  <div className="payment-result-line">
                    <span>{copy.paymentCreditsAddedLabel}</span>
                    <strong>{copy.paymentCreditsAddedValue(details.addedPaidCredit)}</strong>
                  </div>
                ) : null}
                {details?.previousSubscriptionPlan
                && details?.nextSubscriptionPlan
                && details.previousSubscriptionPlan !== details.nextSubscriptionPlan ? (
                  <div className="payment-result-line">
                    <span>{copy.paymentSubscriptionChangedLabel}</span>
                    <strong>{`${copy.subscriptionPlanValue(details.previousSubscriptionPlan)} -> ${copy.subscriptionPlanValue(details.nextSubscriptionPlan)}`}</strong>
                  </div>
                  ) : null}
              </div>
            ) : null}
            <div className="credit-balance-grid">
              <div className="credit-balance-card">
                <span>{copy.totalCreditLabel}</span>
                <strong>{credits}</strong>
              </div>
            </div>
          </>
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
