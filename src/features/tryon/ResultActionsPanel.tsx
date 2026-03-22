import React from 'react';

interface ResultActionsPanelProps {
  imageSrc: string;
  link: string | null;
  disableDownload: boolean;
  shareStatus: string | null;
  copy: Record<string, any>;
  layout?: 'section' | 'sidebar' | 'overlay';
  showCopy?: boolean;
  onDownload: (src: string) => void;
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
}

const renderSocialIcon = (kind: 'share' | 'download' | 'x' | 'facebook' | 'kakao' | 'line' | 'instagram' | 'tiktok' | 'link') => {
  const commonProps = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': true,
  } as const;

  switch (kind) {
    case 'share':
      return (
        <svg {...commonProps}>
          <path d="M14 5h5v5M10 14 19 5M19 13v5H5V5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'download':
      return (
        <svg {...commonProps}>
          <path d="M12 4.5v9.3M8.6 10.9 12 14.3l3.4-3.4M5 18.5h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'x':
      return (
        <svg {...commonProps}>
          <path d="M5 4.5h3.2l4.1 5.5 4.8-5.5H20l-6.4 7.2L20 20h-3.2l-4.5-6-5.2 6H4l6.9-7.8L5 4.5Z" fill="currentColor" />
        </svg>
      );
    case 'facebook':
      return (
        <svg {...commonProps}>
          <path d="M13.3 20v-6.7h2.2l.4-2.6h-2.6V9.1c0-.75.2-1.27 1.28-1.27H16V5.5c-.24-.03-1.07-.1-2.02-.1-2 0-3.38 1.22-3.38 3.47v1.93H8.4v2.6h2.2V20h2.7Z" fill="currentColor" />
        </svg>
      );
    case 'kakao':
      return (
        <svg {...commonProps}>
          <path d="M12 4C7.03 4 3 7.13 3 11c0 2.45 1.62 4.61 4.07 5.86L6 20l3.83-2.1c.7.13 1.42.2 2.17.2 4.97 0 9-3.13 9-7s-4.03-7-9-7Z" fill="#FEE500" stroke="#3B1E1E" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M9 9.2v4.6M9 11.5l3.8-2.3M12.8 11.5 9 13.8M15.2 9.2v4.6" stroke="#3B1E1E" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'line':
      return (
        <svg {...commonProps}>
          <path d="M20.5 10.9c0-4-3.83-7.2-8.5-7.2s-8.5 3.2-8.5 7.2c0 3.58 3.04 6.58 7.15 7.13L9.8 21l3.2-2.9h.01c4.22-.45 7.49-3.49 7.49-7.2Z" fill="#06C755" />
          <path d="M8 12.2V9.4M9.9 12.2H8M12.1 12.2V9.4m0 2.8h1.9M16.1 12.2V9.4m0 2.8 1.9-2.8m0 2.8V9.4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'instagram':
      return (
        <svg {...commonProps}>
          <rect x="4" y="4" width="16" height="16" rx="5" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="3.6" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg {...commonProps}>
          <path d="M14.9 4c.5 1.6 1.8 3 3.5 3.8v2.4a6.76 6.76 0 0 1-3.4-1v5.5a4.7 4.7 0 1 1-4.7-4.7c.32 0 .63.03.93.1v2.5a2.16 2.16 0 1 0 1.54 2.07V4h2.23Z" fill="currentColor" />
          <path d="M12.4 4v10.67a2.16 2.16 0 1 1-1.54-2.07V10.1a4.7 4.7 0 1 0 4.7 4.57V9.17a6.76 6.76 0 0 0 3.4 1V7.8A5.92 5.92 0 0 1 15.5 4h-3.1Z" fill="#25F4EE" fillOpacity=".55" />
        </svg>
      );
    case 'link':
      return (
        <svg {...commonProps}>
          <path d="M10.6 13.4 13.4 10.6M8.4 15.6l-1.6 1.6a3.1 3.1 0 1 1-4.4-4.4L6 9.2a3.1 3.1 0 0 1 4.4 0M15.6 8.4l1.6-1.6a3.1 3.1 0 1 1 4.4 4.4L18 14.8a3.1 3.1 0 0 1-4.4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
};

const ResultActionsPanel: React.FC<ResultActionsPanelProps> = ({
  imageSrc,
  link,
  disableDownload,
  shareStatus,
  copy,
  layout = 'section',
  showCopy = true,
  onDownload,
  onShareLink,
  onCopyLink,
  onShareOnKakao,
  onShareOnLine,
  onShareOnX,
  onShareOnFacebook,
  onInstagramSave,
  onShareOnTikTok,
}) => {
  const actionGrid = (
    <div className={`result-action-grid ${layout === 'sidebar' ? 'result-share-sidebar-grid' : layout === 'overlay' ? 'result-action-overlay-grid' : 'share-grid-primary'}`}>
        <button aria-label={copy.share} className="outline-btn result-action-btn share-platform-btn utility" onClick={() => onShareLink(link)} type="button">
          <span aria-hidden="true" className="share-platform-icon">{renderSocialIcon('share')}</span>
          <span>{copy.share}</span>
        </button>
        <button aria-label={copy.downloadImage} className="download-btn result-action-btn share-platform-btn utility" disabled={disableDownload} onClick={() => onDownload(imageSrc)} type="button">
          <span aria-hidden="true" className="share-platform-icon icon-download">{renderSocialIcon('download')}</span>
          <span>{copy.downloadImage}</span>
        </button>
        <button aria-label={copy.shareXShort} className="outline-btn result-action-btn share-platform-btn share-x" onClick={() => onShareOnX(link)} type="button">
          <span aria-hidden="true" className="share-platform-icon">{renderSocialIcon('x')}</span>
          <span>{copy.shareXShort}</span>
        </button>
        <button aria-label={copy.shareFacebookShort} className="outline-btn result-action-btn share-platform-btn share-facebook" onClick={() => onShareOnFacebook(link)} type="button">
          <span aria-hidden="true" className="share-platform-icon">{renderSocialIcon('facebook')}</span>
          <span>{copy.shareFacebookShort}</span>
        </button>
        <button aria-label={copy.shareKakao} className="outline-btn result-action-btn share-platform-btn share-kakao" onClick={() => onShareOnKakao(link)} type="button">
          <span aria-hidden="true" className="share-platform-icon">{renderSocialIcon('kakao')}</span>
          <span>{copy.shareKakao}</span>
        </button>
        <button aria-label={copy.shareLine} className="outline-btn result-action-btn share-platform-btn share-line" onClick={() => onShareOnLine(link)} type="button">
          <span aria-hidden="true" className="share-platform-icon">{renderSocialIcon('line')}</span>
          <span>{copy.shareLine}</span>
        </button>
        <button aria-label="TikTok" className="outline-btn result-action-btn share-platform-btn utility" disabled={disableDownload} onClick={() => onShareOnTikTok(imageSrc)} type="button">
          <span aria-hidden="true" className="share-platform-icon">{renderSocialIcon('tiktok')}</span>
          <span>TikTok</span>
        </button>
        <button aria-label={copy.saveForInstagram} className="outline-btn result-action-btn share-platform-btn share-instagram utility" disabled={disableDownload} onClick={() => onInstagramSave(imageSrc)} type="button">
          <span aria-hidden="true" className="share-platform-icon">{renderSocialIcon('instagram')}</span>
          <span>{copy.saveForInstagram}</span>
        </button>
        <button aria-label={copy.copyLink} className="outline-btn result-action-btn share-platform-btn utility" onClick={() => onCopyLink(link)} type="button">
          <span aria-hidden="true" className="share-platform-icon">{renderSocialIcon('link')}</span>
          <span>{copy.copyLink}</span>
        </button>
    </div>
  );

  if (layout === 'sidebar') {
    return (
      <aside className="result-share-sidebar">
        {showCopy ? (
          <div className="share-section-copy result-share-sidebar-copy">
            <h3>{copy.shareSectionTitle}</h3>
            <p>{copy.shareHelperText}</p>
          </div>
        ) : null}
        {actionGrid}
        {shareStatus ? <p className="result-status-text result-status-text-sidebar">{shareStatus}</p> : null}
      </aside>
    );
  }

  if (layout === 'overlay') {
    return (
      <aside className="result-action-overlay">
        {actionGrid}
        {shareStatus ? <p className="result-status-text result-status-text-overlay">{shareStatus}</p> : null}
      </aside>
    );
  }

  return (
    <>
      <div className="page-article share-section">
        {showCopy ? (
          <div className="share-section-copy">
            <h3>{copy.shareSectionTitle}</h3>
            <p>{copy.shareHelperText}</p>
          </div>
        ) : null}
        {actionGrid}
      </div>
      {shareStatus ? <p className="result-status-text">{shareStatus}</p> : null}
    </>
  );
};

export default ResultActionsPanel;
