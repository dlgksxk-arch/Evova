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
    kind: 'subscription' | 'extra_credit';
    label: string;
    salePriceUsd: number;
    paidCredit: number;
    description: string;
    badge?: string;
    bonusEligible?: boolean;
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
  locale,
  isFirebaseConfigured,
  firebaseDisabledMessage,
  isStartingCheckout,
  products,
  copy,
  onLogin,
  onNavigateSiteManagement,
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
  const isAdminUser = userProfile?.role === 'admin';

  return (
    <div className="mypage-layout">
      {!currentUser && (
        <article className="page-article">
          <h2>{copy.myPage}</h2>
          <div className="mypage-empty">
            <p>{firebaseDisabledMessage || copy.authRequired}</p>
            {isFirebaseConfigured && (
              <button className="generate-btn auth-inline-btn" onClick={onLogin} type="button">
                {copy.login}
              </button>
            )}
          </div>
        </article>
      )}
      {currentUser && (
        <article className="page-article">
          <div className="admin-section-header">
            <div>
              <h2>{copy.myPage}</h2>
              <p className="admin-section-helper">{copy.currentCredits(currentCredits)}</p>
            </div>
            {isAdminUser ? (
              <button className="outline-btn auth-inline-btn" onClick={onNavigateSiteManagement} type="button">
                {copy.adminTitle ?? copy.siteManagementTitle ?? '관리자 페이지'}
              </button>
            ) : null}
          </div>
          <div className="credit-balance-grid">
            <div className="credit-balance-card">
              <span>{copy.totalCreditLabel}</span>
              <strong>{currentCredits}</strong>
            </div>
            <div className="credit-balance-card">
              <span>{copy.dailyCreditLabel}</span>
              <strong>{currentDailyCredit}</strong>
            </div>
            <div className="credit-balance-card">
              <span>{copy.paidCreditLabel}</span>
              <strong>{currentPaidCredit}</strong>
            </div>
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
          <div className="pricing-section-stack">
            <section className="pricing-section-shell">
              <div className="pricing-section-header">
                <h4>{copy.pricingUi.subscriptionTitle}</h4>
                <p>{copy.pricingUi.firstPurchaseBonus}</p>
              </div>
              <div className="credit-product-grid">
                {products.filter((product) => product.kind === 'subscription').map((product) => (
                  <article key={product.id} className={`credit-product-card pricing-tier-card ${product.badge ? 'is-featured' : ''}`}>
                    <div className="credit-plan-copy">
                      {product.badge ? (
                        <div className="credit-plan-badges">
                          <span className="credit-plan-badge accent">{product.badge}</span>
                        </div>
                      ) : null}
                      <strong>{product.label}</strong>
                      <p className="pricing-card-credits">{product.paidCredit.toLocaleString()} {copy.credits}</p>
                      <p className="credit-plan-sale-price">${product.salePriceUsd.toFixed(2)}</p>
                      <p>{copy.pricingUi.descriptionById[product.id]}</p>
                    </div>
                    <button
                      className="generate-btn auth-inline-btn"
                      disabled={isStartingCheckout === product.id}
                      onClick={() => onStartCheckout(product.id)}
                      type="button"
                    >
                      {isStartingCheckout === product.id ? copy.paymentRedirecting : copy.pricingUi.subscribeCta}
                    </button>
                  </article>
                ))}
              </div>
            </section>
            <section className="pricing-section-shell">
              <div className="pricing-section-header">
                <h4>{copy.pricingUi.extraCreditsTitle}</h4>
                <p>{copy.pricingUi.extraCreditsSubtitle}</p>
              </div>
              <div className="credit-product-grid">
                {products.filter((product) => product.kind === 'extra_credit').map((product) => (
                  <article key={product.id} className="credit-product-card pricing-tier-card pricing-extra-card">
                    <div className="credit-plan-copy">
                      <strong>{product.label}</strong>
                      <p className="pricing-card-credits">{product.paidCredit.toLocaleString()} {copy.credits}</p>
                      <p className="credit-plan-sale-price">${product.salePriceUsd.toFixed(2)}</p>
                      <p>{copy.pricingUi.descriptionById[product.id]}</p>
                    </div>
                    <button
                      className="outline-btn auth-inline-btn pricing-extra-cta"
                      disabled={isStartingCheckout === product.id}
                      onClick={() => onStartCheckout(product.id)}
                      type="button"
                    >
                      {isStartingCheckout === product.id ? copy.paymentRedirecting : copy.pricingUi.buyCreditsCta}
                    </button>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </article>
      )}
    </div>
  );
};

export default MyPageSection;
