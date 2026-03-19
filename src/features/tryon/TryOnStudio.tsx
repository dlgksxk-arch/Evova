import React, { useState } from 'react';
import type { LanguageCode } from '../../constants/languages';
import type { ImageLoadState, SubjectType } from '../../types/hamdeva';
import ResultActionsPanel from './ResultActionsPanel';

const EmptyPreviewState: React.FC<{
  title: string;
  tips: string[];
  type: 'face' | 'cloth';
  badgeLabel: string;
  hint: string;
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
    <div className="empty-preview-hint">{hint}</div>
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
  tipsTitle: string;
  tips: string[];
  progressTitle: string;
  progressItems: string[];
  usageTitle: string;
  usageItems: string[];
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
  currentDailyCredit: number;
  currentPaidCredit: number;
  canAffordGeneration: boolean;
  generationCost: number;
  generationStatusLabel: string;
  generationRemainingMs: number;
  generationElapsedMs: number;
  generationEstimateMs: number;
  generationProgressPercent: number;
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
  onTryAnotherOutfit: () => void;
  onRandomOutfit: () => void;
  onOpenResultPreview: (src: string) => void;
  getSubjectTypeLabel: (lang: LanguageCode, subjectType: SubjectType) => string;
  formatSecondsLabel: (ms: number) => string;
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
  currentDailyCredit,
  currentPaidCredit,
  canAffordGeneration,
  generationCost,
  generationStatusLabel,
  generationRemainingMs,
  generationElapsedMs,
  generationEstimateMs,
  generationProgressPercent,
  resultWatermarkApplied,
  shareResultLink,
  shareStatus,
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
  onTryAnotherOutfit,
  onRandomOutfit,
  onOpenResultPreview,
  formatSecondsLabel,
  modalCopy,
}) => {
  const [personDragActive, setPersonDragActive] = useState(false);
  const [clothDragActive, setClothDragActive] = useState(false);
  const isModalLayout = layout === 'modal';
  const isReadyToGenerate = Boolean(activePersonImage && activeClothImage && canAffordGeneration);
  const progressIndex = finalImageSrc ? 3 : isGenerating ? 2 : isReadyToGenerate ? 1 : 0;

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
      <div className="usage-bar">
        {currentUser ? `${copy.dailyCreditLabel}: ${currentDailyCredit} / ${copy.paidCreditLabel}: ${currentPaidCredit}` : copy.loginForFree}
      </div>
      {creditNotice && <div className="credit-notice-banner">{creditNotice}</div>}
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
        onDownload={onDownloadResult}
        onShareLink={onShareLink}
        onCopyLink={onCopyLink}
        onShareOnKakao={onShareOnKakao}
        onShareOnLine={onShareOnLine}
        onShareOnX={onShareOnX}
        onShareOnFacebook={onShareOnFacebook}
        onInstagramSave={onInstagramSave}
        onTryAnotherOutfit={onTryAnotherOutfit}
        onRandomOutfit={onRandomOutfit}
      />
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
            {isModalLayout ? <p className="modal-card-description">{modalCopy?.personCardBody}</p> : null}
          </div>
          <div className="try-actions">
            <button className="outline-btn primary" disabled={isGenerating} onClick={onOpenPersonSampleModal} type="button">
              {copy.chooseSample}
            </button>
            <button className="outline-btn" disabled={isGenerating} onClick={() => personInputRef.current?.click()} type="button">
              {copy.uploadMyPhoto}
            </button>
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
                tips={emptyFaceTips}
                type="face"
                badgeLabel={emptyPreviewCopy.faceBadge}
                hint={copy.uploadMyPhoto}
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
            {isModalLayout ? <p className="modal-card-description">{modalCopy?.garmentCardBody}</p> : null}
          </div>
          <div className="try-actions">
            <button className="outline-btn primary" disabled={isGenerating} onClick={onOpenClothSampleModal} type="button">
              {copy.chooseClothingSample}
            </button>
            <button className="outline-btn" disabled={isGenerating} onClick={() => clothInputRef.current?.click()} type="button">
              {copy.uploadClothing}
            </button>
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
                tips={emptyClothTips}
                type="cloth"
                badgeLabel={emptyPreviewCopy.styleBadge}
                hint={copy.uploadClothing}
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
            <p className="modal-card-description">{modalCopy?.actionCardBody}</p>
          </div>
        ) : null}
        {copy.realGenerationCta ? <p className="real-generation-label">{copy.realGenerationCta}</p> : null}
        <p className="credit-cost-text">{copy.generationCostDetailed(generationCost)}</p>
        <p className="credit-balance-text">{copy.dailyCreditLabel}: {currentDailyCredit} · {copy.paidCreditLabel}: {currentPaidCredit}</p>
        <button
          className="generate-btn"
          onClick={onGenerate}
          disabled={isGenerating || !currentUser || !activePersonImage || !activeClothImage || !canAffordGeneration}
          type="button"
        >
          {isGenerating ? <><span className="spinner"></span>{copy.generating}</> : copy.generate}
        </button>
        {currentUser && !canAffordGeneration && (
          <>
            <p className="loading-subtext">{copy.notEnoughCredits}</p>
            <button className="outline-btn auth-inline-btn" onClick={onNavigateToMyPage} type="button">
              {copy.chargeCredits}
            </button>
          </>
        )}
        {isGenerating && (
          <>
            <p className="loading-subtext">{copy.loadingDetail}</p>
            <div className="generation-gauge" aria-live="polite">
              <div className="generation-gauge-head">
                <strong>{generationStatusLabel}</strong>
                <span>{formatSecondsLabel(generationRemainingMs)}</span>
              </div>
              <div
                className="generation-gauge-track"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={generationProgressPercent}
              >
                <div className="generation-gauge-fill" style={{ width: `${generationProgressPercent}%` }} />
                <div className="generation-gauge-ticks">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              </div>
              <div className="generation-gauge-meta">
                <span>0s</span>
                <span>{formatSecondsLabel(generationElapsedMs)}</span>
                <span>{formatSecondsLabel(generationEstimateMs)}</span>
              </div>
            </div>
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
          {modalCopy?.notice ? <div className="try-modal-notice">{modalCopy.notice}</div> : null}
          {accountStatusNode}
          <div className="try-modal-layout">
            <div className="try-modal-main">{studioMainNode}</div>
            <aside className="try-modal-side">
              <article className="try-modal-side-card">
                <h3>{modalCopy?.tipsTitle}</h3>
                <ul className="try-modal-list">
                  {modalCopy?.tips.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </article>
              <article className="try-modal-side-card">
                <h3>{modalCopy?.progressTitle}</h3>
                <ol className="try-modal-progress-list">
                  {modalCopy?.progressItems.map((item, index) => (
                    <li
                      key={item}
                      className={`try-modal-progress-item ${index < progressIndex ? 'completed' : ''} ${index === progressIndex ? 'active' : ''}`}
                    >
                      <span className="try-modal-progress-index">{index + 1}</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
              </article>
              <article className="try-modal-side-card">
                <h3>{modalCopy?.usageTitle}</h3>
                <ul className="try-modal-list">
                  {modalCopy?.usageItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            </aside>
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
