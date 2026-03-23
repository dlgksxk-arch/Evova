import React from 'react';
import type { User } from 'firebase/auth';
import type { CheckoutProductId, GenerationRecord, UserProfile } from '../../types/hamdeva';
import CreationHistoryPanel from '../mypage/CreationHistoryPanel';

const ADMIN_EMAIL = 'dlgksxk@gmail.com';

const getSubscriptionProductRank = (productId: CheckoutProductId): number => {
  if (productId === 'starter') {
    return 0;
  }
  if (productId === 'popular') {
    return 1;
  }
  if (productId === 'pro') {
    return 2;
  }
  return -1;
};

const getCurrentSubscriptionRank = (plan?: UserProfile['subscriptionPlan']): number => {
  if (plan === 'starter') {
    return 0;
  }
  if (plan === 'popular') {
    return 1;
  }
  if (plan === 'pro') {
    return 2;
  }
  return -1;
};

const isCurrentSubscriptionProduct = (plan: UserProfile['subscriptionPlan'] | undefined, productId: CheckoutProductId): boolean =>
  productId === 'starter' || productId === 'popular' || productId === 'pro'
    ? plan === productId
    : false;

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
    code: string;
    label: string;
    salePriceUsd: number;
    comparePriceUsd?: number;
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
  const isAdminUser = (currentUser?.email || userProfile?.email || '').trim().toLowerCase() === ADMIN_EMAIL;
  const currentSubscriptionRank = getCurrentSubscriptionRank(userProfile?.subscriptionPlan);
  const formatProductPrice = (product: { salePriceUsd: number; kind: 'subscription' | 'extra_credit' }) =>
    `$${product.salePriceUsd.toFixed(2)}${product.kind === 'subscription' ? '/month' : ''}`;
  const getProductDiscountPercent = (product: { salePriceUsd: number; comparePriceUsd?: number }): number | null => {
    if (typeof product.comparePriceUsd !== 'number' || product.comparePriceUsd <= product.salePriceUsd) {
      return null;
    }

    return Math.round((1 - (product.salePriceUsd / product.comparePriceUsd)) * 100);
  };

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
                {products.filter((product) => product.kind === 'subscription').map((product) => {
                  const isLowerTierDisabled = currentSubscriptionRank > getSubscriptionProductRank(product.id);
                  const isCurrentPlan = isCurrentSubscriptionProduct(userProfile?.subscriptionPlan, product.id);
                  return (
                  <article key={product.id} className={`credit-product-card pricing-tier-card ${product.badge ? 'is-featured' : ''} ${typeof product.comparePriceUsd === 'number' ? 'has-discount-hook' : ''}`}>
                    <div className="credit-plan-copy">
                      <div className="credit-plan-badges">
                        <span className="credit-plan-code">{product.code}</span>
                        {product.badge ? (
                          <span className={`credit-plan-badge ${product.id === 'starter' ? 'deal' : 'accent'}`}>{product.badge}</span>
                        ) : null}
                        {typeof product.comparePriceUsd === 'number' && getProductDiscountPercent(product) ? (
                          <span className="credit-plan-badge flash">SAVE {getProductDiscountPercent(product)}%</span>
                        ) : null}
                      </div>
                      {typeof product.comparePriceUsd === 'number' ? (
                        <div className="pricing-hook-panel">
                          <span className="pricing-hook-kicker">INTRO PRICE</span>
                          <strong>{`$${product.comparePriceUsd.toFixed(2)} -> $${product.salePriceUsd.toFixed(2)}/month`}</strong>
                          <p>Starter access is discounted right now.</p>
                        </div>
                      ) : null}
                      <strong>{product.label}</strong>
                      <p className="pricing-card-credits">{product.paidCredit.toLocaleString()} {copy.credits}</p>
                      <div className="credit-plan-price-row">
                        {typeof product.comparePriceUsd === 'number' ? (
                          <span className="credit-plan-compare-price">${product.comparePriceUsd.toFixed(2)}/month</span>
                        ) : null}
                        <p className="credit-plan-sale-price">{formatProductPrice(product)}</p>
                      </div>
                      <p>{copy.pricingUi.descriptionById[product.id]}</p>
                    </div>
                    <button
                      className="generate-btn auth-inline-btn"
                      disabled={isStartingCheckout === product.id || isLowerTierDisabled || isCurrentPlan}
                      onClick={() => onStartCheckout(product.id)}
                      type="button"
                      title={isCurrentPlan ? copy.pricingUi.currentPlanCta : isLowerTierDisabled ? 'Current subscription is higher than this plan.' : undefined}
                    >
                      {isCurrentPlan ? copy.pricingUi.currentPlanCta : isStartingCheckout === product.id ? copy.paymentRedirecting : copy.pricingUi.subscribeCta}
                    </button>
                  </article>
                );
                })}
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
                      <div className="credit-plan-badges">
                        <span className="credit-plan-code">{product.code}</span>
                      </div>
                      <strong>{product.label}</strong>
                      <p className="pricing-card-credits">{product.paidCredit.toLocaleString()} {copy.credits}</p>
                      <p className="credit-plan-sale-price">{formatProductPrice(product)}</p>
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
