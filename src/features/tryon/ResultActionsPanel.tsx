import React from 'react';

interface ResultActionsPanelProps {
  imageSrc: string;
  link: string | null;
  disableDownload: boolean;
  showVideoControls: boolean;
  showVideoPrompt: boolean;
  isGeneratingVideo: boolean;
  canAffordVideo: boolean;
  generatedVideoUrl: string | null;
  videoStatusMessage: string | null;
  shareStatus: string | null;
  copy: Record<string, any>;
  subjectUi: {
    videoPrompt: string;
    videoButton: string;
    videoGenerating: string;
  };
  onDownload: (src: string) => void;
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
}

const ResultActionsPanel: React.FC<ResultActionsPanelProps> = ({
  imageSrc,
  link,
  disableDownload,
  showVideoControls,
  showVideoPrompt,
  isGeneratingVideo,
  canAffordVideo,
  generatedVideoUrl,
  videoStatusMessage,
  shareStatus,
  copy,
  subjectUi,
  onDownload,
  onShareLink,
  onCopyLink,
  onShareOnKakao,
  onShareOnLine,
  onShareOnX,
  onShareOnFacebook,
  onInstagramSave,
  onGenerateVideo,
}) => (
  <>
    <div className="page-article share-section">
      <div className="share-section-copy">
        <h3>{copy.shareSectionTitle}</h3>
        <p>{copy.shareHelperText}</p>
      </div>
      <div className="result-action-grid share-grid-primary">
        <button aria-label={copy.shareKakao} className="outline-btn result-action-btn share-platform-btn" onClick={() => onShareOnKakao(link)} type="button">
          <span aria-hidden="true" className="share-platform-icon">💬</span>
          <span>{copy.shareKakao}</span>
        </button>
        <button aria-label={copy.shareLine} className="outline-btn result-action-btn share-platform-btn" onClick={() => onShareOnLine(link)} type="button">
          <span aria-hidden="true" className="share-platform-icon">🟢</span>
          <span>{copy.shareLine}</span>
        </button>
        <button aria-label={copy.shareXShort} className="outline-btn result-action-btn share-platform-btn" onClick={() => onShareOnX(link)} type="button">
          <span aria-hidden="true" className="share-platform-icon">✕</span>
          <span>{copy.shareXShort}</span>
        </button>
        <button aria-label={copy.shareFacebookShort} className="outline-btn result-action-btn share-platform-btn" onClick={() => onShareOnFacebook(link)} type="button">
          <span aria-hidden="true" className="share-platform-icon">f</span>
          <span>{copy.shareFacebookShort}</span>
        </button>
      </div>
      <div className="result-action-grid share-grid-secondary">
        <button aria-label={copy.share} className="outline-btn result-action-btn share-platform-btn utility" onClick={() => onShareLink(link)} type="button">
          <span aria-hidden="true" className="share-platform-icon">↗</span>
          <span>{copy.share}</span>
        </button>
        <button aria-label={copy.copyLink} className="outline-btn result-action-btn share-platform-btn utility" onClick={() => onCopyLink(link)} type="button">
          <span aria-hidden="true" className="share-platform-icon">🔗</span>
          <span>{copy.copyLink}</span>
        </button>
        <button aria-label={copy.downloadImage} className="download-btn result-action-btn share-platform-btn utility" disabled={disableDownload} onClick={() => onDownload(imageSrc)} type="button">
          <span aria-hidden="true" className="share-platform-icon">⬇</span>
          <span>{copy.downloadImage}</span>
        </button>
        <button aria-label={copy.saveForInstagram} className="outline-btn result-action-btn share-platform-btn utility" disabled={disableDownload} onClick={() => onInstagramSave(imageSrc)} type="button">
          <span aria-hidden="true" className="share-platform-icon">📷</span>
          <span>{copy.saveForInstagram}</span>
        </button>
      </div>
    </div>
    {showVideoControls && (showVideoPrompt || isGeneratingVideo || generatedVideoUrl) && (
      <div className="page-article result-video-panel">
        <p>{subjectUi.videoPrompt}</p>
        <button
          className="generate-btn"
          disabled={disableDownload || isGeneratingVideo || !canAffordVideo}
          onClick={onGenerateVideo}
          type="button"
        >
          {isGeneratingVideo ? subjectUi.videoGenerating : subjectUi.videoButton}
        </button>
        {videoStatusMessage && <p className="result-status-text">{videoStatusMessage}</p>}
        {generatedVideoUrl && (
          <div className="composite-result result-video-shell">
            <video controls playsInline preload="metadata" className="is-visible">
              <source src={generatedVideoUrl} type="video/mp4" />
            </video>
          </div>
        )}
      </div>
    )}
    {shareStatus && <p className="result-status-text">{shareStatus}</p>}
  </>
);

export default ResultActionsPanel;
