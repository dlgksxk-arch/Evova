import React from 'react';

interface ResultActionsPanelProps {
  imageSrc: string;
  link: string | null;
  disableDownload: boolean;
  shareStatus: string | null;
  copy: Record<string, any>;
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
}

const ResultActionsPanel: React.FC<ResultActionsPanelProps> = ({
  imageSrc,
  link,
  disableDownload,
  shareStatus,
  copy,
  onDownload,
  onShareLink,
  onCopyLink,
  onShareOnKakao,
  onShareOnLine,
  onShareOnX,
  onShareOnFacebook,
  onInstagramSave,
}) => (
  <>
    <div className="page-article share-section">
      <div className="share-section-copy">
        <h3>{copy.shareSectionTitle}</h3>
        <p>{copy.shareHelperText}</p>
      </div>
      <div className="result-action-grid share-grid-primary">
        <button aria-label={copy.share} className="outline-btn result-action-btn share-platform-btn utility" onClick={() => onShareLink(link)} type="button">
          <span aria-hidden="true" className="share-platform-icon">↗</span>
          <span>{copy.share}</span>
        </button>
        <button aria-label={copy.downloadImage} className="download-btn result-action-btn share-platform-btn utility" disabled={disableDownload} onClick={() => onDownload(imageSrc)} type="button">
          <span aria-hidden="true" className="share-platform-icon icon-download">↓</span>
          <span>{copy.downloadImage}</span>
        </button>
        <button aria-label={copy.shareXShort} className="outline-btn result-action-btn share-platform-btn share-x" onClick={() => onShareOnX(link)} type="button">
          <span aria-hidden="true" className="share-platform-icon">X</span>
          <span>{copy.shareXShort}</span>
        </button>
        <button aria-label={copy.shareFacebookShort} className="outline-btn result-action-btn share-platform-btn share-facebook" onClick={() => onShareOnFacebook(link)} type="button">
          <span aria-hidden="true" className="share-platform-icon">f</span>
          <span>{copy.shareFacebookShort}</span>
        </button>
        <button aria-label={copy.shareKakao} className="outline-btn result-action-btn share-platform-btn share-kakao" onClick={() => onShareOnKakao(link)} type="button">
          <span aria-hidden="true" className="share-platform-icon">K</span>
          <span>{copy.shareKakao}</span>
        </button>
        <button aria-label={copy.shareLine} className="outline-btn result-action-btn share-platform-btn share-line" onClick={() => onShareOnLine(link)} type="button">
          <span aria-hidden="true" className="share-platform-icon">L</span>
          <span>{copy.shareLine}</span>
        </button>
        <button aria-label={copy.saveForInstagram} className="outline-btn result-action-btn share-platform-btn share-instagram utility" disabled={disableDownload} onClick={() => onInstagramSave(imageSrc)} type="button">
          <span aria-hidden="true" className="share-platform-icon">◎</span>
          <span>{copy.saveForInstagram}</span>
        </button>
        <button aria-label={copy.copyLink} className="outline-btn result-action-btn share-platform-btn utility" onClick={() => onCopyLink(link)} type="button">
          <span aria-hidden="true" className="share-platform-icon">🔗</span>
          <span>{copy.copyLink}</span>
        </button>
      </div>
    </div>
    {shareStatus && <p className="result-status-text">{shareStatus}</p>}
  </>
);

export default ResultActionsPanel;
