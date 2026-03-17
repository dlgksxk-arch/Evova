import React from 'react';
import type { User } from 'firebase/auth';
import type { CheckoutProductId, GenerationRecord, UserProfile } from '../../types/hamdeva';
import CreationHistoryPanel from '../mypage/CreationHistoryPanel';

interface MyPageSectionProps {
  currentUser: User | null;
  userProfile: UserProfile | null;
  currentDailyCredit: number;
  currentPaidCredit: number;
  currentCredits: number;
  historyItems: GenerationRecord[];
  preservedHistoryCount: number;
  historyPreserveLimit: number;
  isFirebaseConfigured: boolean;
  firebaseDisabledMessage: string | null;
  isStartingCheckout: CheckoutProductId | null;
  products: ReadonlyArray<{
    id: CheckoutProductId;
    label: string;
    salePriceUsd: number;
    compareAtPriceUsd: number;
    paidCredit: number;
    badge?: string;
    extraBadge?: string;
  }>;
  copy: Record<string, any>;
  onLogin: () => void;
  onNavigateSiteManagement: () => void;
  onNavigateTerms: () => void;
  onStartCheckout: (productId: CheckoutProductId) => void;
  formatTimestampLabel: (value?: any) => string;
  onOpenHistoryItem: (item: GenerationRecord) => void;
  onToggleHistoryPreserve: (item: GenerationRecord) => void;
  onDownloadHistoryItem: (item: GenerationRecord) => void;
  onDeleteHistoryItem: (item: GenerationRecord) => void;
}

const MyPageSection: React.FC<MyPageSectionProps> = ({
  currentUser,
  userProfile,
  currentDailyCredit,
  currentPaidCredit,
  currentCredits,
  isFirebaseConfigured,
  firebaseDisabledMessage,
  isStartingCheckout,
  products,
  copy,
  onLogin,
  onNavigateSiteManagement: _onNavigateSiteManagement,
  onNavigateTerms: _onNavigateTerms,
  onStartCheckout,
  formatTimestampLabel: _formatTimestampLabel,
  historyItems: _historyItems,
  preservedHistoryCount: _preservedHistoryCount,
  historyPreserveLimit: _historyPreserveLimit,
  onOpenHistoryItem: _onOpenHistoryItem,
  onToggleHistoryPreserve: _onToggleHistoryPreserve,
  onDownloadHistoryItem: _onDownloadHistoryItem,
  onDeleteHistoryItem: _onDeleteHistoryItem,
}) => {
  return (
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
          </div>
        ) : (
          <div className="mypage-empty">
            <p>{firebaseDisabledMessage || copy.authRequired}</p>
            {isFirebaseConfigured && (
              <button className="generate-btn auth-inline-btn auth-disabled-btn" disabled onClick={onLogin} type="button">
                {copy.loginComingSoon ?? `${copy.login} (Coming Soon)`}
              </button>
            )}
          </div>
        )}
      </article>
      {currentUser && (
        <CreationHistoryPanel currentUser={currentUser} />
      )}
      {currentUser && (
        <article className="page-article">
          <h3>{copy.chargeCredits}</h3>
          <p>{copy.chargeDescription}</p>
          <div className="credit-product-grid">
            {products.map((product) => (
              <article key={product.id} className="credit-product-card">
                <div className="credit-plan-copy">
                  <div className="credit-plan-badges">
                    {product.badge ? <span className="credit-plan-badge">{product.badge}</span> : null}
                    {product.extraBadge ? <span className="credit-plan-badge accent">{product.extraBadge}</span> : null}
                  </div>
                  <strong>{product.label} - {product.paidCredit.toLocaleString()} Credits</strong>
                  <p className="credit-plan-price-row">
                    <span className="credit-plan-compare-price">${product.compareAtPriceUsd.toFixed(2)}</span>
                    <span className="credit-plan-sale-price">${product.salePriceUsd.toFixed(2)}</span>
                  </p>
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
    </div>
  );
};

export default MyPageSection;
