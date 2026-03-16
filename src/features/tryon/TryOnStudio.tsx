import React from 'react';
import type { LanguageCode } from '../../constants/languages';
import type { ImageLoadState, SubjectType } from '../../types/hamdeva';
import ResultActionsPanel from './ResultActionsPanel';

const EmptyPreviewState: React.FC<{
  title: string;
  tips: string[];
  type: 'face' | 'cloth';
  badgeLabel: string;
}> = ({ title, tips, type, badgeLabel }) => (
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
  </div>
);

interface TryOnStudioProps {
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
  canAffordVideo: boolean;
  generationCost: number;
  generationStatusLabel: string;
  generationRemainingMs: number;
  generationElapsedMs: number;
  generationEstimateMs: number;
  generationProgressPercent: number;
  resultWatermarkApplied: boolean;
  shareResultLink: string | null;
  generatedVideoUrl: string | null;
  isGeneratingVideo: boolean;
  showVideoPrompt: boolean;
  videoStatusMessage: string | null;
  shareStatus: string | null;
  subjectUi: {
    title: string;
    auto: string;
    autoDetecting: string;
    autoDetected: string;
    autoFailed: string;
    videoPrompt: string;
    videoButton: string;
    videoGenerating: string;
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
  onGenerateVideo: () => void;
  getSubjectTypeLabel: (lang: LanguageCode, subjectType: SubjectType) => string;
  formatSecondsLabel: (ms: number) => string;
}

const TryOnStudio: React.FC<TryOnStudioProps> = ({
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
  subjectType,
  detectedSubjectType,
  subjectDetectionStatus,
  finalImageSrc,
  creditNotice,
  currentDailyCredit,
  currentPaidCredit,
  canAffordGeneration,
  canAffordVideo,
  generationCost,
  generationStatusLabel,
  generationRemainingMs,
  generationElapsedMs,
  generationEstimateMs,
  generationProgressPercent,
  resultWatermarkApplied,
  shareResultLink,
  generatedVideoUrl,
  isGeneratingVideo,
  showVideoPrompt,
  videoStatusMessage,
  shareStatus,
  subjectUi,
  lang,
  subjectTypes,
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
  onClearPerson,
  onClearCloth,
  onAutoDetectSubject,
  onSubjectTypeChange,
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
  onGenerateVideo,
  getSubjectTypeLabel,
  formatSecondsLabel,
}) => (
  <section id="try" className="section try-section">
    <div className="section-inner">
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
            <button className="outline-btn auth-inline-btn" onClick={() => copy.openAuthModal('login')} type="button">
              {copy.login}
            </button>
          </div>
        </div>
      )}

      <div className="try-layout">
        <div className="try-column">
          <div className="card-header">
            <span className="section-label">{copy.step1Label}</span>
            <h3 className="card-title">{copy.step1Title}</h3>
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

          <div className={`preview-box ${activePersonImage ? 'has-image' : ''}`}>
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
              />
            )}
            {selectedSampleUrl && activePersonImage && <div className="sample-badge">{sampleBadgeLabel}</div>}
            {(personImage || selectedSampleUrl) && (
              <button className="clear-img-btn" disabled={isGenerating} onClick={onClearPerson} type="button">&times;</button>
            )}
          </div>
          <p className="upload-guidance-text">{copy.faceCopyrightNotice}</p>
        </div>

        <div className="try-column">
          <div className="card-header">
            <span className="section-label">{copy.step2Label}</span>
            <h3 className="card-title">{copy.step2Title}</h3>
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
          <div className={`preview-box ${activeClothImage ? 'has-image' : ''}`}>
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
              />
            )}
          </div>
          <p className="upload-guidance-text">{copy.clothingSafetyNotice}</p>
        </div>
      </div>

      <div className="subject-type-panel page-article">
        <div className="subject-type-head">
          <strong>{subjectUi.title}</strong>
          <button className="outline-btn subject-detect-btn" disabled={isGenerating} onClick={onAutoDetectSubject} type="button">
            {subjectUi.auto}
          </button>
        </div>
        <div className="subject-type-controls">
          <select
            className="subject-type-select"
            disabled={isGenerating}
            value={subjectType}
            onChange={(event) => onSubjectTypeChange(event.target.value as SubjectType)}
          >
            {subjectTypes.map((item) => (
              <option key={item} value={item}>{getSubjectTypeLabel(lang, item)}</option>
            ))}
          </select>
          <span className="subject-type-status">
            {subjectDetectionStatus === 'detecting'
              ? subjectUi.autoDetecting
              : subjectDetectionStatus === 'ready' && detectedSubjectType
                ? `${subjectUi.autoDetected}: ${getSubjectTypeLabel(lang, detectedSubjectType)}`
                : subjectDetectionStatus === 'error'
                  ? subjectUi.autoFailed
                  : `${subjectUi.autoDetected}: ${getSubjectTypeLabel(lang, subjectType)}`}
          </span>
        </div>
      </div>

      <div className="action-section">
        <p className="real-generation-label">{copy.realGenerationCta}</p>
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
            <p className="generation-estimate-notice">{copy.generationEstimateNotice}</p>
          </>
        )}
      </div>

      {finalImageSrc && (
        <div id="result-area" className="results-section">
          <h2 className="section-heading">{copy.resultTitle}</h2>
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
                className={resultPreviewState === 'ready' ? 'is-visible' : ''}
                onLoad={() => copy.setResultPreviewReady()}
                onError={() => copy.setResultPreviewError()}
              />
            )}
          </div>
          <ResultActionsPanel
            imageSrc={finalImageSrc}
            link={shareResultLink}
            disableDownload={resultPreviewState !== 'ready'}
            showVideoControls={true}
            showVideoPrompt={showVideoPrompt}
            isGeneratingVideo={isGeneratingVideo}
            canAffordVideo={canAffordVideo}
            generatedVideoUrl={generatedVideoUrl}
            videoStatusMessage={videoStatusMessage}
            shareStatus={shareStatus}
            copy={copy}
            subjectUi={subjectUi}
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
            onGenerateVideo={onGenerateVideo}
          />
          {resultWatermarkApplied && (
            <div className="credit-result-notice page-article">
              <strong>{copy.freeResultNoticeTitle}</strong>
              <p>{copy.freeResultNoticeBody}</p>
              <button className="outline-btn auth-inline-btn" onClick={onNavigateToMyPage} type="button">
                {copy.chargeCredits}
              </button>
            </div>
          )}
          <p className="result-disclaimer-text">{copy.resultPrivacyNotice}</p>
        </div>
      )}
    </div>
  </section>
);

export default TryOnStudio;
