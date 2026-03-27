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
  onTryAnotherOutfit: () => void;
  onRandomOutfit: () => void;
}

const renderSocialIcon = (kind: 'download' | 'link' | 'share' | 'chat') => {
  const commonProps = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': true,
  } as const;

  switch (kind) {
    case 'download':
      return (
        <svg {...commonProps}>
          <path d="M12 4.5v9.3M8.6 10.9 12 14.3l3.4-3.4M5 18.5h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'link':
      return (
        <svg {...commonProps}>
          <path d="M10.6 13.4 13.4 10.6M8.4 15.6l-1.6 1.6a3.1 3.1 0 1 1-4.4-4.4L6 9.2a3.1 3.1 0 0 1 4.4 0M15.6 8.4l1.6-1.6a3.1 3.1 0 1 1 4.4 4.4L18 14.8a3.1 3.1 0 0 1-4.4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'share':
      return (
        <svg {...commonProps}>
          <path d="M8.2 12.2 15.8 7.8M8.2 11.8l7.6 4.4M6.5 13.8a2.3 2.3 0 1 0 0-4.6 2.3 2.3 0 0 0 0 4.6ZM17.5 8.1a2.3 2.3 0 1 0 0-4.6 2.3 2.3 0 0 0 0 4.6Zm0 12.4a2.3 2.3 0 1 0 0-4.6 2.3 2.3 0 0 0 0 4.6Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'chat':
      return (
        <svg {...commonProps}>
          <path d="M5 6.8A2.8 2.8 0 0 1 7.8 4h8.4A2.8 2.8 0 0 1 19 6.8v5.4a2.8 2.8 0 0 1-2.8 2.8H11l-3.7 3v-3H7.8A2.8 2.8 0 0 1 5 12.2V6.8Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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
}) => {
  const actionGrid = (
    <div className={`result-action-grid ${layout === 'sidebar' ? 'result-share-sidebar-grid' : layout === 'overlay' ? 'result-action-overlay-grid' : 'share-grid-primary'}`}>
        <button aria-label={copy.downloadImage} className="download-btn result-action-btn share-platform-btn utility" disabled={disableDownload} onClick={() => onDownload(imageSrc)} type="button">
          <span aria-hidden="true" className="share-platform-icon icon-download">{renderSocialIcon('download')}</span>
          <span>{copy.downloadImage}</span>
        </button>
        <button aria-label={copy.share} className="outline-btn result-action-btn share-platform-btn" onClick={() => onShareLink(link)} type="button">
          <span aria-hidden="true" className="share-platform-icon">{renderSocialIcon('share')}</span>
          <span>{copy.share}</span>
        </button>
        <button aria-label={copy.copyLink} className="outline-btn result-action-btn share-platform-btn utility" onClick={() => onCopyLink(link)} type="button">
          <span aria-hidden="true" className="share-platform-icon">{renderSocialIcon('link')}</span>
          <span>{copy.copyLink}</span>
        </button>
        <button aria-label="Kakao" className="outline-btn result-action-btn share-platform-btn utility" onClick={() => onShareOnKakao(link)} type="button">
          <span aria-hidden="true" className="share-platform-icon">{renderSocialIcon('chat')}</span>
          <span>Kakao</span>
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
