import React, { useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import { callUserPaymentHistory } from '../../lib/api/hamdeva';
import type { CheckoutProductId, PaymentLogRecord, UserProfile } from '../../types/hamdeva';

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
  currentCredits: number;
  locale: string;
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
  onNavigateHistory: () => void;
  onNavigateTerms: () => void;
  onStartCheckout: (productId: CheckoutProductId) => void;
  formatTimestampLabel: (value?: any) => string;
}

const MyPageModalFrame: React.FC<{
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ title, subtitle, onClose, children }) => {
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
      <div className="auth-modal account-modal mypage-modal-shell mypage-payment-history-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header account-modal-header">
          <div>
            <h3>{title}</h3>
            {subtitle ? <p className="modal-subtitle">{subtitle}</p> : null}
          </div>
          <button className="close-btn" onClick={onClose} type="button">
            &times;
          </button>
        </div>
        <div className="account-modal-body">{children}</div>
      </div>
    </div>
  );
};

const MyPageSection: React.FC<MyPageSectionProps> = ({
  currentUser,
  userProfile,
  currentCredits,
  isFirebaseConfigured,
  firebaseDisabledMessage,
  isStartingCheckout,
  products,
  copy,
  onLogin,
  onNavigateSiteManagement,
  onNavigateHistory,
  onNavigateTerms: _onNavigateTerms,
  onStartCheckout,
  formatTimestampLabel,
}) => {
  const [isPaymentHistoryOpen, setIsPaymentHistoryOpen] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<PaymentLogRecord[]>([]);
  const [paymentHistoryLoading, setPaymentHistoryLoading] = useState(false);
  const [paymentHistoryError, setPaymentHistoryError] = useState<string | null>(null);
  const [paymentHistoryLoaded, setPaymentHistoryLoaded] = useState(false);
  const isAdminUser = (currentUser?.email || userProfile?.email || '').trim().toLowerCase() === ADMIN_EMAIL;
  const currentSubscriptionRank = getCurrentSubscriptionRank(userProfile?.subscriptionPlan);
  const productLabelMap = useMemo(() => new Map(products.map((product) => [product.id, product.label])), [products]);
  const formatProductPrice = (product: { salePriceUsd: number; kind: 'subscription' | 'extra_credit' }) =>
    `$${product.salePriceUsd.toFixed(2)}${product.kind === 'subscription' ? '/month' : ''}`;
  const getProductDiscountPercent = (product: { salePriceUsd: number; comparePriceUsd?: number }): number | null => {
    if (typeof product.comparePriceUsd !== 'number' || product.comparePriceUsd <= product.salePriceUsd) {
      return null;
    }

    return Math.round((1 - (product.salePriceUsd / product.comparePriceUsd)) * 100);
  };
  const formatPaymentAmount = (item: PaymentLogRecord): string => {
    if (typeof item.amount === 'number' && Number.isFinite(item.amount)) {
      return `${item.amount.toFixed(2)} ${(item.currency || 'USD').toUpperCase()}`;
    }
    if (typeof item.amountCents === 'number' && Number.isFinite(item.amountCents)) {
      return `${(item.amountCents / 100).toFixed(2)} ${(item.currency || 'USD').toUpperCase()}`;
    }
    return '-';
  };
  const getPaymentProductLabel = (item: PaymentLogRecord): string => {
    const productId = typeof item.productId === 'string' ? item.productId : '';
    return (productLabelMap.get(productId as CheckoutProductId) || productId || '-').toString();
  };
  const loadPaymentHistory = async (force = false) => {
    if (!currentUser || (paymentHistoryLoaded && !force)) {
      return;
    }

    setPaymentHistoryLoading(true);
    setPaymentHistoryError(null);

    try {
      const authToken = await currentUser.getIdToken();
      const items = await callUserPaymentHistory({ authToken });
      setPaymentHistory(items);
      setPaymentHistoryLoaded(true);
      setPaymentHistoryLoading(false);
    } catch (error) {
      setPaymentHistoryLoading(false);
      setPaymentHistoryError(error instanceof Error ? error.message : copy.paymentHistoryLoadFailed);
    }
  };
  const openPaymentHistory = () => {
    setIsPaymentHistoryOpen(true);
    void loadPaymentHistory();
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
            <div className="credit-cta-actions">
              <button className="outline-btn auth-inline-btn" onClick={onNavigateHistory} type="button">
                {copy.historyTitle}
              </button>
              <button className="outline-btn auth-inline-btn" onClick={openPaymentHistory} type="button">
                {copy.paymentHistoryButton}
              </button>
              {isAdminUser ? (
                <button className="outline-btn auth-inline-btn" onClick={onNavigateSiteManagement} type="button">
                  {copy.adminTitle ?? copy.siteManagementTitle ?? '관리자 페이지'}
                </button>
              ) : null}
            </div>
          </div>
          <div className="credit-balance-grid">
            <div className="credit-balance-card">
              <span>{copy.totalCreditLabel}</span>
              <strong>{currentCredits}</strong>
            </div>
          </div>
        </article>
      )}
      {currentUser && isPaymentHistoryOpen ? (
        <MyPageModalFrame
          title={copy.paymentHistoryTitle}
          subtitle={copy.paymentHistorySubtitle}
          onClose={() => setIsPaymentHistoryOpen(false)}
        >
          <div className="mypage-payment-history-shell">
            <div className="admin-section-header compact">
              <div>
                <h4>{copy.paymentHistoryTitle}</h4>
                <p className="admin-section-helper">{copy.paymentHistoryHint}</p>
              </div>
              <button
                className="outline-btn auth-inline-btn"
                disabled={paymentHistoryLoading}
                onClick={() => { void loadPaymentHistory(true); }}
                type="button"
              >
                {copy.refresh}
              </button>
            </div>
            {paymentHistoryError ? <p className="admin-error-banner">{paymentHistoryError}</p> : null}
            {paymentHistoryLoading ? <p className="admin-loading-banner">{copy.paymentHistoryLoading}</p> : null}
            {!paymentHistoryLoading && paymentHistory.length > 0 ? (
              <div className="admin-user-history-table mypage-payment-history-table">
                <div className="admin-user-history-head">
                  <span>{copy.paymentHistoryDateLabel}</span>
                  <span>{copy.paymentHistoryProductLabel}</span>
                  <span>{copy.paymentHistoryAmountLabel}</span>
                  <span>{copy.paymentHistoryCreditsLabel}</span>
                  <span>{copy.paymentHistoryStatusLabel}</span>
                </div>
                {paymentHistory.map((item) => (
                  <div key={item.id} className="admin-user-history-row mypage-payment-history-row">
                    <span>{formatTimestampLabel(item.paidAt || item.createdAt)}</span>
                    <span>{getPaymentProductLabel(item)}</span>
                    <span>{formatPaymentAmount(item)}</span>
                    <span>{typeof item.paidCredit === 'number' ? item.paidCredit.toLocaleString() : '-'}</span>
                    <span>{item.status || '-'}</span>
                  </div>
                ))}
              </div>
            ) : null}
            {!paymentHistoryLoading && paymentHistory.length === 0 ? (
              <p className="admin-empty-state compact">{copy.paymentHistoryEmpty}</p>
            ) : null}
          </div>
        </MyPageModalFrame>
      ) : null}
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
