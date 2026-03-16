import React from 'react';
import type { User } from 'firebase/auth';
import type { CheckoutProductId, GenerationRecord, UserProfile } from '../../types/hamdeva';

interface MyPageSectionProps {
  currentUser: User | null;
  userProfile: UserProfile | null;
  currentDailyCredit: number;
  currentPaidCredit: number;
  currentCredits: number;
  historyItems: GenerationRecord[];
  isFirebaseConfigured: boolean;
  firebaseDisabledMessage: string | null;
  isStartingCheckout: CheckoutProductId | null;
  products: ReadonlyArray<{
    id: CheckoutProductId;
    label: string;
    priceLabel: string;
    paidCredit: number;
  }>;
  copy: Record<string, any>;
  onLogin: () => void;
  onNavigateSiteManagement: () => void;
  onNavigateTerms: () => void;
  onStartCheckout: (productId: CheckoutProductId) => void;
  formatTimestampLabel: (value?: any) => string;
}

const MyPageSection: React.FC<MyPageSectionProps> = ({
  currentUser,
  userProfile,
  currentDailyCredit,
  currentPaidCredit,
  currentCredits,
  historyItems,
  isFirebaseConfigured,
  firebaseDisabledMessage,
  isStartingCheckout,
  products,
  copy,
  onLogin,
  onNavigateSiteManagement,
  onNavigateTerms,
  onStartCheckout,
  formatTimestampLabel,
}) => (
  <div className="mypage-layout">
    <article className="page-article">
      <h2>{copy.myPage}</h2>
      {currentUser && userProfile ? (
        <div className="mypage-summary">
          <p><strong>{copy.emailLabel}</strong> {currentUser.email}</p>
          <div className="credit-balance-grid">
            <div className="credit-balance-card"><span>{copy.dailyCreditLabel}</span><strong>{currentDailyCredit}</strong></div>
            <div className="credit-balance-card"><span>{copy.paidCreditLabel}</span><strong>{currentPaidCredit}</strong></div>
            <div className="credit-balance-card"><span>{copy.totalCreditLabel}</span><strong>{currentCredits}</strong></div>
          </div>
          <p><strong>{copy.subscriptionPlanLabel}</strong> {copy.subscriptionPlanValue(userProfile.subscriptionPlan)}</p>
          <div className="credit-cta-actions">
            {userProfile.role === 'admin' && (
              <button className="outline-btn auth-inline-btn" onClick={onNavigateSiteManagement} type="button">{copy.creditCheck}</button>
            )}
            <button className="outline-btn auth-inline-btn" onClick={onNavigateTerms} type="button">{copy.viewSubscription}</button>
          </div>
        </div>
      ) : (
        <div className="mypage-empty">
          <p>{firebaseDisabledMessage || copy.authRequired}</p>
          {isFirebaseConfigured && (
            <button className="generate-btn auth-inline-btn" onClick={onLogin} type="button">
              {copy.login}
            </button>
          )}
        </div>
      )}
    </article>
    {currentUser && (
      <article className="page-article">
        <h3>{copy.chargeCredits}</h3>
        <p>{copy.chargeDescription}</p>
        <div className="credit-product-grid">
          {products.map((product) => (
            <article key={product.id} className="credit-product-card">
              <div>
                <strong>{product.label}</strong>
                <p>{product.priceLabel}</p>
                <p>{copy.paidCreditLabel}: {product.paidCredit.toLocaleString()}</p>
              </div>
              <button
                className="generate-btn auth-inline-btn"
                disabled={isStartingCheckout === product.id}
                onClick={() => onStartCheckout(product.id)}
                type="button"
              >
                {isStartingCheckout === product.id ? copy.paymentRedirecting : copy.purchaseNow}
              </button>
            </article>
          ))}
        </div>
      </article>
    )}
    {currentUser && (
      <div className="history-grid">
        {historyItems.length > 0 ? historyItems.map((item) => (
          <article key={item.id} className="history-card">
            <div className="history-result-box">
              <img src={item.imageUrl} alt="Generated result history" />
            </div>
            <div className="history-meta">
              <span>{item.usedCreditType === 'paid' ? copy.paidCreditLabel : copy.dailyCreditLabel}</span>
              <span>{item.watermarkApplied ? copy.watermarkEnabled : copy.watermarkRemoved}</span>
              <span>{formatTimestampLabel(item.createdAt)}</span>
            </div>
          </article>
        )) : (
          <article className="page-article">
            <p>{copy.noHistory}</p>
          </article>
        )}
      </div>
    )}
  </div>
);

export default MyPageSection;
