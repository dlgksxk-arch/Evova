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
  historyItems,
  preservedHistoryCount,
  historyPreserveLimit,
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
  onOpenHistoryItem,
  onToggleHistoryPreserve,
  onDownloadHistoryItem,
  onDeleteHistoryItem,
}) => {
  const imageHistoryCount = historyItems.filter((item) => item.resultType !== 'video_generation').length;
  const videoHistoryCount = historyItems.filter((item) => item.resultType === 'video_generation').length;

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
              <button className="generate-btn auth-inline-btn auth-disabled-btn" disabled onClick={onLogin} type="button">
                {copy.loginComingSoon ?? `${copy.login} (Coming Soon)`}
              </button>
            )}
          </div>
        )}
      </article>
      {currentUser && (
        <article className="page-article">
          <h3>결과물 히스토리</h3>
          <p className="history-guide-copy">
            생성된 이미지와 영상은 기본 15일 동안 보관됩니다. 최대 {historyPreserveLimit}개까지 선택해 30일 보관할 수 있습니다.
          </p>
          <p className="history-guide-copy muted">현재 보관 중: {preservedHistoryCount} / {historyPreserveLimit}</p>
          <p className="history-guide-copy muted">이미지 {imageHistoryCount}개 · 영상 {videoHistoryCount}개 · 총 {historyItems.length}개</p>
          {historyItems.length > 0 ? (
            <div className="history-grid">
              {historyItems.map((item) => {
                const isVideo = item.resultType === 'video_generation';
                const isPreserved = !!item.preservedUntil;
                return (
                  <article key={item.id} className={`history-card ${isVideo ? 'history-card-video' : ''}`}>
                    <button className="history-result-box" onClick={() => onOpenHistoryItem(item)} type="button">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={isVideo ? 'Generated video history' : 'Generated result history'} />
                      ) : (
                        <div className="history-video-placeholder">
                          <strong>VIDEO</strong>
                          <span>생성된 영상을 열어볼 수 있습니다.</span>
                        </div>
                      )}
                    </button>
                    <div className="history-meta">
                      <span>{isVideo ? '영상' : '이미지'}</span>
                      {!isVideo && <span>{item.usedCreditType === 'paid' ? copy.paidCreditLabel : copy.dailyCreditLabel}</span>}
                      {!isVideo && <span>{item.watermarkApplied ? copy.watermarkEnabled : copy.watermarkRemoved}</span>}
                      <span>{formatTimestampLabel(item.createdAt)}</span>
                      {isPreserved && <span>30일 보관</span>}
                    </div>
                    <div className="history-actions">
                      <button className="outline-btn history-action-btn" onClick={() => onOpenHistoryItem(item)} type="button">
                        {isVideo ? '영상 보기' : '이미지 보기'}
                      </button>
                      <button className="outline-btn history-action-btn" onClick={() => onDownloadHistoryItem(item)} type="button">
                        다운로드
                      </button>
                      <button className={`outline-btn history-action-btn ${isPreserved ? 'active' : ''}`} onClick={() => onToggleHistoryPreserve(item)} type="button">
                        {isPreserved ? '보관 해제' : '30일 보관'}
                      </button>
                      <button className="outline-btn history-action-btn danger" onClick={() => onDeleteHistoryItem(item)} type="button">
                        삭제
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p>{copy.noHistory}</p>
          )}
        </article>
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
