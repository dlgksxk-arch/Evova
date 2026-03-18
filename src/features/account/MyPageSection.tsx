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
  locale: string;
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
  userProfile: _userProfile,
  currentDailyCredit: _currentDailyCredit,
  currentPaidCredit: _currentPaidCredit,
  currentCredits: _currentCredits,
  locale,
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
  historyItems,
  preservedHistoryCount,
  historyPreserveLimit,
  onOpenHistoryItem: _onOpenHistoryItem,
  onToggleHistoryPreserve,
  onDownloadHistoryItem: _onDownloadHistoryItem,
  onDeleteHistoryItem,
}) => {
  return (
    <div className="mypage-layout">
      {!currentUser && (
        <article className="page-article">
          <h2>{copy.myPage}</h2>
          <div className="mypage-empty">
            <p>{firebaseDisabledMessage || copy.authRequired}</p>
            {isFirebaseConfigured && (
              <button className="generate-btn auth-inline-btn auth-disabled-btn" disabled onClick={onLogin} type="button">
                {copy.loginComingSoon ?? `${copy.login} (${copy.comingSoon})`}
              </button>
            )}
          </div>
        </article>
      )}
      {currentUser && (
        <CreationHistoryPanel
          items={historyItems}
          locale={locale}
          copy={copy}
          preservedCount={preservedHistoryCount}
          maxPreserved={historyPreserveLimit}
          onTogglePreserve={onToggleHistoryPreserve}
          onDelete={onDeleteHistoryItem}
        />
      )}
      {currentUser && (
        <article className="page-article">
          <h3>{copy.chargeCredits}</h3>
          <p>{copy.chargeDescription}</p>
          <div className="credit-product-grid">
            {products.map((product) => {
              const discountPercent = Math.round(((product.compareAtPriceUsd - product.salePriceUsd) / product.compareAtPriceUsd) * 100);
              const savingsAmount = product.compareAtPriceUsd - product.salePriceUsd;
              return (
                <article key={product.id} className="credit-product-card">
                  <div className="credit-plan-copy">
                    <div className="credit-plan-badges">
                      {product.badge ? <span className="credit-plan-badge">{product.badge}</span> : null}
                      {product.extraBadge ? <span className="credit-plan-badge accent">{product.extraBadge}</span> : null}
                    </div>
                    <strong>{product.label} - {product.paidCredit.toLocaleString()} {copy.credits}</strong>
                    <p className="credit-plan-price-row">
                      <span className="credit-plan-compare-price">${product.compareAtPriceUsd.toFixed(2)}</span>
                      <span className="credit-plan-sale-price">${product.salePriceUsd.toFixed(2)}</span>
                    </p>
                    <p className="credit-plan-savings">
                      <span className="credit-plan-save-pill">{copy.savePercent(discountPercent)}</span>
                      <span className="credit-plan-save-amount">{copy.saveAmountOff(`$${savingsAmount.toFixed(2)}`)}</span>
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
              );
            })}
          </div>
        </article>
      )}
    </div>
  );
};

export default MyPageSection;
