import React, { useState } from 'react';
import type { LanguageCode } from '../../constants/languages';
import type { ImageLoadState, SubjectType } from '../../types/hamdeva';
import ResultActionsPanel from './ResultActionsPanel';

const EmptyPreviewState: React.FC<{
  title: string;
  tips: string[];
  type: 'face' | 'cloth';
  badgeLabel: string;
  hint?: string;
}> = ({ title, tips, type, badgeLabel, hint }) => (
  <div className={`empty-preview empty-preview-${type}`}>
    <div className="empty-preview-badge">{badgeLabel}</div>
    <strong className="empty-preview-title">{title}</strong>
    <div className="empty-preview-tips">
      {tips.map((tip) => (
        <p key={tip} className="empty-preview-tip">
          {tip}
        </p>
      ))}
    </div>
    {hint ? <div className="empty-preview-hint">{hint}</div> : null}
  </div>
);

const extractImageSourceFromHtml = (html: string): string | null => {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1] ?? null;
};

const getDroppedImageSource = (dataTransfer: DataTransfer): File | string | null => {
  const imageFile = Array.from(dataTransfer.files).find((file) => file.type.startsWith('image/'));
  if (imageFile) {
    return imageFile;
  }

  const uriList = dataTransfer.getData('text/uri-list').trim();
  if (uriList) {
    const firstUrl = uriList.split('\n').find((line) => line && !line.startsWith('#'));
    if (firstUrl) {
      return firstUrl.trim();
    }
  }

  const html = dataTransfer.getData('text/html');
  if (html) {
    const imageSrc = extractImageSourceFromHtml(html);
    if (imageSrc) {
      return imageSrc;
    }
  }

  const plainText = dataTransfer.getData('text/plain').trim();
  if (/^(https?:|data:image\/)/i.test(plainText)) {
    return plainText;
  }

  return null;
};

type TryOnModalCopy = {
  notice: string;
  personCardTitle: string;
  personCardBody: string;
  garmentCardTitle: string;
  garmentCardBody: string;
  actionCardTitle: string;
  actionCardBody: string;
  actionFootnote: string;
  resultTitle: string;
};

interface TryOnStudioProps {
  layout?: 'page' | 'modal';
  currentUser: unknown;
  isGenerating: boolean;
  activePersonImage: string | null;
  activeClothImage: string | null;
  personImage: string | null;
  clothImage: string | null;
  selectedSampleUrl: string | null;
  selectedClothSampleUrl: string | null;
  personPreviewState: ImageLoadState;
  clothPreviewState: ImageLoadState;
  resultPreviewState: ImageLoadState;
  personUploadMessage: string | null;
  clothUploadMessage: string | null;
  subjectType: SubjectType;
  detectedSubjectType: SubjectType | null;
  subjectDetectionStatus: 'idle' | 'detecting' | 'ready' | 'error';
  finalImageSrc: string | null;
  creditNotice: string | null;
  currentCredits: number;
  currentDailyCredit: number;
  currentPaidCredit: number;
  canAffordGeneration: boolean;
  generationCost: number;
  resultWatermarkApplied: boolean;
  shareResultLink: string | null;
  shareStatus: string | null;
  subjectUi: {
    title: string;
    auto: string;
    autoDetecting: string;
    autoDetected: string;
    autoFailed: string;
  };
  lang: LanguageCode;
  subjectTypes: readonly SubjectType[];
  emptyFaceTips: string[];
  emptyClothTips: string[];
  emptyPreviewCopy: {
    faceBadge: string;
    styleBadge: string;
  };
  sampleBadgeLabel: string;
  copy: Record<string, any>;
  personInputRef: React.RefObject<HTMLInputElement | null>;
  clothInputRef: React.RefObject<HTMLInputElement | null>;
  onOpenPersonSampleModal: () => void;
  onOpenClothSampleModal: () => void;
  onPersonFileChange: (file: File) => void;
  onClothFileChange: (file: File) => void;
  onPersonExternalDrop: (source: File | string) => Promise<void> | void;
  onClothExternalDrop: (source: File | string) => Promise<void> | void;
  onClearPerson: () => void;
  onClearCloth: () => void;
  onAutoDetectSubject: () => void;
  onSubjectTypeChange: (value: SubjectType) => void;
  onGenerate: () => void;
  onNavigateToMyPage: () => void;
  onDownloadResult: (src: string) => void;
  onShareLink: (link: string | null) => void;
  onCopyLink: (link: string | null) => void;
  onShareOnKakao: (link: string | null) => void;
  onShareOnLine: (link: string | null) => void;
  onShareOnX: (link: string | null) => void;
  onShareOnFacebook: (link: string | null) => void;
  onInstagramSave: (src: string | null) => void;
  onShareOnTikTok: (src: string | null) => void;
  onTryAnotherOutfit: () => void;
  onRandomOutfit: () => void;
  onOpenResultPreview: (src: string) => void;
  getSubjectTypeLabel: (lang: LanguageCode, subjectType: SubjectType) => string;
  modalCopy?: TryOnModalCopy;
}

const TryOnStudio: React.FC<TryOnStudioProps> = ({
  layout = 'page',
  currentUser,
  isGenerating,
  activePersonImage,
  activeClothImage,
  personImage,
  clothImage,
  selectedSampleUrl,
  selectedClothSampleUrl,
  personPreviewState,
  clothPreviewState,
  resultPreviewState,
  personUploadMessage,
  clothUploadMessage,
  finalImageSrc,
  creditNotice,
  currentCredits,
  currentDailyCredit,
  currentPaidCredit,
  canAffordGeneration,
  generationCost,
  resultWatermarkApplied,
  shareResultLink,
  shareStatus,
  lang,
  emptyFaceTips,
  emptyClothTips,
  emptyPreviewCopy,
  sampleBadgeLabel,
  copy,
  personInputRef,
  clothInputRef,
  onOpenPersonSampleModal,
  onOpenClothSampleModal,
  onPersonFileChange,
  onClothFileChange,
  onPersonExternalDrop,
  onClothExternalDrop,
  onClearPerson,
  onClearCloth,
  onGenerate,
  onNavigateToMyPage,
  onDownloadResult,
  onShareLink,
  onCopyLink,
  onShareOnKakao,
  onShareOnLine,
  onShareOnX,
  onShareOnFacebook,
  onInstagramSave,
  onShareOnTikTok,
  onTryAnotherOutfit,
  onRandomOutfit,
  onOpenResultPreview,
  modalCopy,
}) => {
  const [personDragActive, setPersonDragActive] = useState(false);
  const [clothDragActive, setClothDragActive] = useState(false);
  const isModalLayout = layout === 'modal';
  const isReadyToGenerate = Boolean(activePersonImage && activeClothImage && canAffordGeneration);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>, target: 'person' | 'cloth') => {
    event.preventDefault();
    setPersonDragActive(false);
    setClothDragActive(false);

    if (isGenerating) {
      return;
    }

    const droppedSource = getDroppedImageSource(event.dataTransfer);
    if (!droppedSource) {
      return;
    }

    if (target === 'person') {
      await onPersonExternalDrop(droppedSource);
      return;
    }

    await onClothExternalDrop(droppedSource);
  };

  const accountStatusNode = (
    <>
      {(!isModalLayout || !currentUser) && (
        <div className="usage-bar">
          {currentUser ? `${copy.dailyCreditLabel}: ${currentDailyCredit} / ${copy.paidCreditLabel}: ${currentPaidCredit}` : copy.loginForFree}
        </div>
      )}
      {(!isModalLayout || !currentUser) && creditNotice && <div className="credit-notice-banner">{creditNotice}</div>}
      {!currentUser && (
        <div className="credit-cta-panel">
          <p>{copy.authSignupCreditsHint}</p>
          <p>{copy.dailyLoginCredits}</p>
          <p>{copy.subscriptionCreditBonus}</p>
          <div className="credit-cta-actions">
            <button className="generate-btn auth-inline-btn" onClick={() => copy.openAuthModal('signup')} type="button">
              {copy.signUpGetCredits}
            </button>
            <button className="outline-btn auth-inline-btn auth-disabled-btn" disabled onClick={() => copy.openAuthModal('login')} type="button">
              {copy.loginComingSoon ?? `${copy.login} (${copy.comingSoon})`}
            </button>
          </div>
        </div>
      )}
    </>
  );

  const resultNode = finalImageSrc ? (
    <div id="result-area" className={`results-section ${isModalLayout ? 'results-section-modal' : ''}`}>
      <h2 className="section-heading">{isModalLayout ? modalCopy?.resultTitle ?? copy.resultTitle : copy.resultTitle}</h2>
      <div className={`result-showcase-layout ${isModalLayout ? 'is-modal' : ''}`}>
        <div className="composite-result">
          {resultPreviewState === 'loading' && (
            <div className="preview-overlay result-overlay">
              <span className="spinner"></span>
              <span>{copy.renderingResult}</span>
            </div>
          )}
          {resultPreviewState === 'error' ? (
            <div className="img-error-msg">{copy.resultDisplayError}</div>
          ) : (
            <img
              src={finalImageSrc}
              alt="Result"
              className={`result-preview-image ${resultPreviewState === 'ready' ? 'is-visible is-zoomable' : ''}`}
              onLoad={() => copy.setResultPreviewReady()}
              onError={() => copy.setResultPreviewError()}
              onClick={() => {
                if (resultPreviewState === 'ready') {
                  onOpenResultPreview(finalImageSrc);
                }
              }}
            />
          )}
        </div>
        <ResultActionsPanel
          imageSrc={finalImageSrc}
          link={shareResultLink}
          disableDownload={resultPreviewState !== 'ready'}
          shareStatus={shareStatus}
          copy={copy}
          layout="sidebar"
          showCopy={false}
          onDownload={onDownloadResult}
          onShareLink={onShareLink}
          onCopyLink={onCopyLink}
          onShareOnKakao={onShareOnKakao}
          onShareOnLine={onShareOnLine}
          onShareOnX={onShareOnX}
          onShareOnFacebook={onShareOnFacebook}
          onInstagramSave={onInstagramSave}
          onShareOnTikTok={onShareOnTikTok}
          onTryAnotherOutfit={onTryAnotherOutfit}
          onRandomOutfit={onRandomOutfit}
        />
      </div>
      <div className="page-article">
        <div className="result-action-grid single-row result-followup-actions">
          <button className="outline-btn result-action-btn" onClick={onTryAnotherOutfit} type="button">
            {copy.tryAnotherOutfit}
          </button>
          <button className="outline-btn result-action-btn" onClick={onRandomOutfit} type="button">
            {copy.randomOutfit}
          </button>
        </div>
      </div>
      {resultWatermarkApplied && (
        <div className="credit-result-notice page-article">
          <strong>{copy.freeResultNoticeTitle}</strong>
          <p>{copy.freeResultNoticeBody}</p>
        </div>
      )}
    </div>
  ) : null;

  const studioMainNode = (
    <>
      <div className={`try-layout ${isModalLayout ? 'try-layout-modal' : ''}`}>
        <div className="try-column">
          <div className="card-header">
            <span className="section-label">{copy.step1Label}</span>
            <h3 className="card-title">{isModalLayout ? modalCopy?.personCardTitle ?? copy.step1Title : copy.step1Title}</h3>
            {isModalLayout && modalCopy?.personCardBody ? <p className="modal-card-description">{modalCopy.personCardBody}</p> : null}
          </div>
          <div className={`try-actions ${isModalLayout ? 'try-actions-compact' : ''}`}>
            <button className="outline-btn primary" disabled={isGenerating} onClick={onOpenPersonSampleModal} type="button">
              {copy.chooseSample}
            </button>
            {!isModalLayout ? (
              <button className="outline-btn" disabled={isGenerating} onClick={() => personInputRef.current?.click()} type="button">
                {copy.uploadMyPhoto}
              </button>
            ) : null}
            <input
              id="p-up"
              ref={personInputRef}
              type="file"
              hidden
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onClick={(event) => { event.currentTarget.value = ''; }}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  onPersonFileChange(file);
                }
              }}
            />
          </div>
          <div
            className={`preview-box ${activePersonImage ? 'has-image' : 'is-clickable'} ${personDragActive ? 'drag-active' : ''}`}
            onClick={() => {
              if (!isGenerating && !activePersonImage) {
                personInputRef.current?.click();
              }
            }}
            onKeyDown={(event) => {
              if (!isGenerating && !activePersonImage && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault();
                personInputRef.current?.click();
              }
            }}
            onDragEnter={(event) => {
              handleDragOver(event);
              setPersonDragActive(true);
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setPersonDragActive(false);
              }
            }}
            onDragOver={handleDragOver}
            onDrop={(event) => { void handleDrop(event, 'person'); }}
            role={!activePersonImage ? 'button' : undefined}
            tabIndex={!activePersonImage ? 0 : -1}
          >
            {activePersonImage ? (
              <>
                {personPreviewState === 'loading' && (
                  <div className="preview-overlay">
                    <span className="spinner"></span>
                    <span>{personUploadMessage || copy.loadingImage}</span>
                  </div>
                )}
                {personPreviewState === 'error' && <div className="img-error-msg">{copy.imageLoadError}</div>}
                <img
                  src={activePersonImage}
                  alt="Face"
                  onLoad={() => copy.setPersonPreviewReady()}
                  onError={() => copy.setPersonPreviewError()}
                  className={`${selectedSampleUrl ? 'sample-img' : personImage ? 'user-uploaded' : 'sample-img'} ${personPreviewState === 'ready' ? 'is-visible' : ''}`}
                />
              </>
            ) : (
              <EmptyPreviewState
                title={copy.facePlaceholderTitle}
                tips={isModalLayout ? emptyFaceTips : emptyFaceTips.slice(0, 2)}
                type="face"
                badgeLabel={emptyPreviewCopy.faceBadge}
                hint={isModalLayout ? copy.uploadMyPhoto : undefined}
              />
            )}
            {selectedSampleUrl && activePersonImage && <div className="sample-badge">{sampleBadgeLabel}</div>}
            {(personImage || selectedSampleUrl) && (
              <button className="clear-img-btn" disabled={isGenerating} onClick={onClearPerson} type="button">&times;</button>
            )}
          </div>
          {copy.faceCopyrightNotice ? <p className="upload-guidance-text">{copy.faceCopyrightNotice}</p> : null}
        </div>

        <div className="try-column">
          <div className="card-header">
            <span className="section-label">{copy.step2Label}</span>
            <h3 className="card-title">{isModalLayout ? modalCopy?.garmentCardTitle ?? copy.step2Title : copy.step2Title}</h3>
            {isModalLayout && modalCopy?.garmentCardBody ? <p className="modal-card-description">{modalCopy.garmentCardBody}</p> : null}
          </div>
          <div className={`try-actions ${isModalLayout ? 'try-actions-compact' : ''}`}>
            <button className="outline-btn primary" disabled={isGenerating} onClick={onOpenClothSampleModal} type="button">
              {copy.chooseClothingSample}
            </button>
            {!isModalLayout ? (
              <button className="outline-btn" disabled={isGenerating} onClick={() => clothInputRef.current?.click()} type="button">
                {copy.uploadClothing}
              </button>
            ) : null}
            <input
              id="c-up"
              ref={clothInputRef}
              type="file"
              hidden
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onClick={(event) => { event.currentTarget.value = ''; }}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  onClothFileChange(file);
                }
              }}
            />
          </div>
          <div
            className={`preview-box ${activeClothImage ? 'has-image' : 'is-clickable'} ${clothDragActive ? 'drag-active' : ''}`}
            onClick={() => {
              if (!isGenerating && !activeClothImage) {
                clothInputRef.current?.click();
              }
            }}
            onKeyDown={(event) => {
              if (!isGenerating && !activeClothImage && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault();
                clothInputRef.current?.click();
              }
            }}
            onDragEnter={(event) => {
              handleDragOver(event);
              setClothDragActive(true);
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setClothDragActive(false);
              }
            }}
            onDragOver={handleDragOver}
            onDrop={(event) => { void handleDrop(event, 'cloth'); }}
            role={!activeClothImage ? 'button' : undefined}
            tabIndex={!activeClothImage ? 0 : -1}
          >
            {activeClothImage ? (
              <>
                {clothPreviewState === 'loading' && (
                  <div className="preview-overlay">
                    <span className="spinner"></span>
                    <span>{clothUploadMessage || copy.loadingImage}</span>
                  </div>
                )}
                {clothPreviewState === 'error' ? (
                  <div className="img-error-msg">{copy.imageLoadError}</div>
                ) : (
                  <img
                    src={activeClothImage}
                    alt="Cloth"
                    className={clothPreviewState === 'ready' ? 'is-visible' : ''}
                    onLoad={() => copy.setClothPreviewReady()}
                    onError={() => copy.setClothPreviewError()}
                  />
                )}
                {selectedClothSampleUrl && activeClothImage && <div className="sample-badge">{sampleBadgeLabel}</div>}
                {(clothImage || selectedClothSampleUrl) && (
                  <button className="clear-img-btn" disabled={isGenerating} onClick={onClearCloth} type="button">&times;</button>
                )}
              </>
            ) : (
              <EmptyPreviewState
                title={copy.clothingPlaceholderTitle}
                tips={isModalLayout ? emptyClothTips : emptyClothTips.slice(0, 2)}
                type="cloth"
                badgeLabel={emptyPreviewCopy.styleBadge}
                hint={isModalLayout ? copy.uploadClothing : undefined}
              />
            )}
          </div>
          {copy.clothingSafetyNotice ? <p className="upload-guidance-text">{copy.clothingSafetyNotice}</p> : null}
        </div>
      </div>

      <div className={`action-section ${isModalLayout ? 'action-section-card' : ''}`}>
        {isModalLayout ? (
          <div className="card-header modal-action-header">
            <span className="section-label">{copy.step3Label ?? 'Step 3'}</span>
            <h3 className="card-title">{modalCopy?.actionCardTitle}</h3>
            {modalCopy?.actionCardBody ? <p className="modal-card-description">{modalCopy.actionCardBody}</p> : null}
          </div>
        ) : null}
        {copy.realGenerationCta ? <p className="real-generation-label">{copy.realGenerationCta}</p> : null}
        {isModalLayout ? (
          <p className="credit-cost-text credit-cost-text-compact">
            {copy.generationCostDetailed(generationCost)} · {copy.currentCredits(currentCredits)}
          </p>
        ) : (
          <>
            <p className="credit-cost-text">{copy.generationCostDetailed(generationCost)}</p>
            <p className="credit-balance-text">{copy.dailyCreditLabel}: {currentDailyCredit} · {copy.paidCreditLabel}: {currentPaidCredit}</p>
          </>
        )}
        <button
          className={`generate-btn ${isGenerating ? 'is-generating' : ''}`}
          onClick={onGenerate}
          disabled={isGenerating || !currentUser || !activePersonImage || !activeClothImage || !canAffordGeneration}
          type="button"
        >
          {isGenerating ? (
            <span className="generate-btn-running">
              <span className="pet-runner-track" aria-hidden="true">
                <span className="pet-runner pet-runner-dog">🐶</span>
                <span className="pet-runner pet-runner-cat">🐱</span>
              </span>
              <span>{copy.generating}</span>
            </span>
          ) : copy.generate}
        </button>
        {!isModalLayout && currentUser ? <p className="credit-balance-text credit-balance-text-bottom">{copy.currentCredits(currentCredits)}</p> : null}
        {currentUser && !canAffordGeneration && (
          <>
            <p className="loading-subtext">{copy.notEnoughCredits}</p>
            <button className="outline-btn auth-inline-btn" onClick={onNavigateToMyPage} type="button">
              {copy.chargeCredits}
            </button>
          </>
        )}
        {isGenerating && !isModalLayout && (
          <>
            <p className="loading-subtext">{copy.loadingDetail}</p>
          </>
        )}
        <p className="generation-estimate-notice">{isModalLayout ? modalCopy?.actionFootnote ?? copy.generationEstimateNotice : copy.generationEstimateNotice}</p>
      </div>
      {resultNode}
    </>
  );

  if (isModalLayout) {
    return (
      <section className="section try-section try-section-modal">
        <div className="section-inner try-modal-inner">
          {accountStatusNode}
          <div className="try-modal-layout">
            <div className="try-modal-main">{studioMainNode}</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="try" className="section try-section">
      <div className="section-inner">
        {accountStatusNode}
        {studioMainNode}
      </div>
    </section>
  );
};

export default TryOnStudio;
