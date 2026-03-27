import React from 'react';
import type { PublicResultRecord } from '../../types/hamdeva';

interface SharedResultSectionProps {
  loading: boolean;
  error: string | null;
  record: PublicResultRecord | null;
  link: string | null;
  copy: Record<string, any>;
  shareStatus: string | null;
  onTryAnotherOutfit: () => void;
  onDownloadResult: (src: string) => void;
  onShareLink: (link: string | null) => void;
  onCopyLink: (link: string | null) => void;
  onShareOnKakao: (link: string | null) => void;
  onShareOnLine: (link: string | null) => void;
  onShareOnX: (link: string | null) => void;
  onShareOnFacebook: (link: string | null) => void;
  onInstagramSave: (src: string | null) => void;
  onShareOnTikTok: (src: string | null) => void;
  onRandomOutfit: () => void;
  onViewOutfitIdeas: () => void;
}

const SharedResultSection: React.FC<SharedResultSectionProps> = ({
  loading,
  error,
  record,
  link,
  copy,
  shareStatus,
  onTryAnotherOutfit,
  onDownloadResult,
  onShareLink,
  onCopyLink,
  onShareOnKakao,
  onShareOnLine,
  onShareOnX,
  onShareOnFacebook,
  onInstagramSave,
  onShareOnTikTok,
  onRandomOutfit,
  onViewOutfitIdeas,
}) => (
  <main className="section page-shell">
    <div className="section-inner page-layout">
      <article className="page-article shared-result-shell">
        {loading ? (
          <p>{copy.loadingSharedResult}</p>
        ) : error || !record ? (
          <>
            <h2>{copy.sharedResultTitle}</h2>
            <p>{error || copy.resultNotFound}</p>
            <div className="result-action-grid single-row">
              <button className="outline-btn result-action-btn" onClick={onTryAnotherOutfit} type="button">
                {copy.tryAnotherOutfit}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="section-heading">{copy.resultTitle}</h2>
            <div className="composite-result">
              <img
                src={record.resultImageUrl}
                alt="Shared HAMDEVA fitting result"
                className="is-visible"
              />
            </div>
            <div className="result-action-grid">
              <button className="download-btn result-action-btn" onClick={() => onDownloadResult(record.resultImageUrl)} type="button">
                {copy.downloadImage}
              </button>
              <button className="outline-btn result-action-btn" onClick={() => onShareLink(link)} type="button">
                {copy.share}
              </button>
              <button className="outline-btn result-action-btn" onClick={() => onCopyLink(link)} type="button">
                {copy.copyLink}
              </button>
              <button className="outline-btn result-action-btn" onClick={() => onShareOnKakao(link)} type="button">
                Kakao
              </button>
              <button className="outline-btn result-action-btn" onClick={onTryAnotherOutfit} type="button">
                {copy.tryAnotherOutfit}
              </button>
              <button className="outline-btn result-action-btn" onClick={onViewOutfitIdeas} type="button">
                {copy.viewOutfitIdeas ?? 'View Outfit Ideas'}
              </button>
              <button className="outline-btn result-action-btn" onClick={onRandomOutfit} type="button">
                {copy.randomOutfit}
              </button>
            </div>
          </>
        )}
      </article>
    </div>
  </main>
);

export default SharedResultSection;
