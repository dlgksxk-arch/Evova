import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { GenerationRecord } from '../../types/hamdeva';

interface CreationHistoryPanelProps {
  items: GenerationRecord[];
  preservedCount: number;
  maxPreserved: number;
  locale: string;
  copy: Record<string, any>;
  onTogglePreserve: (item: GenerationRecord) => Promise<void> | void;
  onDelete: (item: GenerationRecord) => Promise<void> | void;
}

const IMAGE_LOAD_MIN_MS = 400;
const HISTORY_PAGE_SIZE = 21;

const getHistoryPagerCopy = (locale: string) => {
  if (locale.startsWith('ko')) {
    return {
      previous: '이전',
      next: '다음',
      summary: (current: number, total: number) => `${current} / ${total} 페이지`,
    };
  }
  if (locale.startsWith('ja')) {
    return {
      previous: '前へ',
      next: '次へ',
      summary: (current: number, total: number) => `${current} / ${total} ページ`,
    };
  }
  if (locale.startsWith('zh')) {
    return {
      previous: '上一页',
      next: '下一页',
      summary: (current: number, total: number) => `第 ${current} / ${total} 页`,
    };
  }
  return {
    previous: 'Previous',
    next: 'Next',
    summary: (current: number, total: number) => `Page ${current} / ${total}`,
  };
};

const getTimestampMillis = (value: unknown): number | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }
  if ('toMillis' in value && typeof (value as { toMillis?: unknown }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis();
  }
  return null;
};

const formatDateTime = (value: unknown, locale: string): string => {
  const millis = getTimestampMillis(value);
  if (typeof millis !== 'number' || !Number.isFinite(millis)) {
    return '-';
  }

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(millis)).replace(/\.\s/g, '-').replace('.', '').trim();
};

const isPreservedItem = (item: GenerationRecord): boolean => {
  const preservedUntil = getTimestampMillis(item.preservedUntil);
  return typeof preservedUntil === 'number' && preservedUntil > Date.now();
};

const downloadFile = (url: string, filename: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const inferFileExtension = (item: GenerationRecord): string => {
  const match = item.imageUrl?.match(/\.([a-z0-9]+)(?:\?|$)/i);
  return match?.[1] || 'png';
};

const openShareWindow = (url: string) => {
  window.open(url, '_blank', 'noopener,noreferrer');
};

const renderSocialIcon = (kind: 'kakao' | 'x' | 'facebook' | 'line' | 'tiktok' | 'instagram' | 'link' | 'download') => {
  const commonProps = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': true,
  } as const;

  switch (kind) {
    case 'kakao':
      return (
        <svg {...commonProps}>
          <path d="M12 4C7.03 4 3 7.13 3 11c0 2.45 1.62 4.61 4.07 5.86L6 20l3.83-2.1c.7.13 1.42.2 2.17.2 4.97 0 9-3.13 9-7s-4.03-7-9-7Z" fill="#FEE500" stroke="#3B1E1E" strokeWidth="1.3" strokeLinejoin="round"/>
          <path d="M9 9.2v4.6M9 11.5l3.8-2.3M12.8 11.5 9 13.8M15.2 9.2v4.6" stroke="#3B1E1E" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case 'x':
      return (
        <svg {...commonProps}>
          <path d="M5 4.5h3.2l4.1 5.5 4.8-5.5H20l-6.4 7.2L20 20h-3.2l-4.5-6-5.2 6H4l6.9-7.8L5 4.5Z" fill="currentColor"/>
        </svg>
      );
    case 'facebook':
      return (
        <svg {...commonProps}>
          <path d="M13.3 20v-6.7h2.2l.4-2.6h-2.6V9.1c0-.75.2-1.27 1.28-1.27H16V5.5c-.24-.03-1.07-.1-2.02-.1-2 0-3.38 1.22-3.38 3.47v1.93H8.4v2.6h2.2V20h2.7Z" fill="currentColor"/>
        </svg>
      );
    case 'line':
      return (
        <svg {...commonProps}>
          <path d="M20.5 10.9c0-4-3.83-7.2-8.5-7.2s-8.5 3.2-8.5 7.2c0 3.58 3.04 6.58 7.15 7.13L9.8 21l3.2-2.9h.01c4.22-.45 7.49-3.49 7.49-7.2Z" fill="#06C755"/>
          <path d="M8 12.2V9.4M9.9 12.2H8M12.1 12.2V9.4m0 2.8h1.9M16.1 12.2V9.4m0 2.8 1.9-2.8m0 2.8V9.4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case 'tiktok':
      return (
        <svg {...commonProps}>
          <path d="M14.9 4c.5 1.6 1.8 3 3.5 3.8v2.4a6.76 6.76 0 0 1-3.4-1v5.5a4.7 4.7 0 1 1-4.7-4.7c.32 0 .63.03.93.1v2.5a2.16 2.16 0 1 0 1.54 2.07V4h2.23Z" fill="currentColor"/>
          <path d="M12.4 4v10.67a2.16 2.16 0 1 1-1.54-2.07V10.1a4.7 4.7 0 1 0 4.7 4.57V9.17a6.76 6.76 0 0 0 3.4 1V7.8A5.92 5.92 0 0 1 15.5 4h-3.1Z" fill="#25F4EE" fillOpacity=".55"/>
        </svg>
      );
    case 'instagram':
      return (
        <svg {...commonProps}>
          <rect x="4" y="4" width="16" height="16" rx="5" stroke="currentColor" strokeWidth="1.8"/>
          <circle cx="12" cy="12" r="3.6" stroke="currentColor" strokeWidth="1.8"/>
          <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor"/>
        </svg>
      );
    case 'link':
      return (
        <svg {...commonProps}>
          <path d="M10.6 13.4 13.4 10.6M8.4 15.6l-1.6 1.6a3.1 3.1 0 1 1-4.4-4.4L6 9.2a3.1 3.1 0 0 1 4.4 0M15.6 8.4l1.6-1.6a3.1 3.1 0 1 1 4.4 4.4L18 14.8a3.1 3.1 0 0 1-4.4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case 'download':
      return (
        <svg {...commonProps}>
          <path d="M12 4.5v9.3M8.6 10.9 12 14.3l3.4-3.4M5 18.5h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
  }
};

const getHistoryCopy = (locale: string) => {
  if (locale.startsWith('ko')) {
    return {
      personLabel: '사용 인물',
      garmentLabel: '사용 의상',
      resultLabel: '생성 결과',
      unknown: '기록 정보 없음',
      savedPerson: '저장된 인물 이미지',
      savedGarment: '저장된 의상 이미지',
      subjectHuman: '인물 기준 이미지',
      subjectDog: '강아지 기준 이미지',
      subjectCat: '고양이 기준 이미지',
      resultPreview: '생성 결과 미리보기',
    };
  }
  if (locale.startsWith('ja')) {
    return {
      personLabel: '人物入力',
      garmentLabel: '衣装入力',
      resultLabel: '生成結果',
      unknown: '記録情報なし',
      savedPerson: '保存された人物画像',
      savedGarment: '保存された衣装画像',
      subjectHuman: '人物参照画像',
      subjectDog: '犬の参照画像',
      subjectCat: '猫の参照画像',
      resultPreview: '生成結果プレビュー',
    };
  }
  if (locale.startsWith('zh')) {
    return {
      personLabel: '使用人物',
      garmentLabel: '使用服装',
      resultLabel: '生成结果',
      unknown: '无记录信息',
      savedPerson: '已保存的人物图片',
      savedGarment: '已保存的服装图片',
      subjectHuman: '人物参考图片',
      subjectDog: '狗参考图片',
      subjectCat: '猫参考图片',
      resultPreview: '生成结果预览',
    };
  }
  return {
    personLabel: 'Person used',
    garmentLabel: 'Outfit used',
    resultLabel: 'Result image',
    unknown: 'No saved input info',
    savedPerson: 'Saved person image',
    savedGarment: 'Saved outfit image',
    subjectHuman: 'Human reference image',
    subjectDog: 'Dog reference image',
    subjectCat: 'Cat reference image',
    resultPreview: 'Generated result preview',
  };
};

const getSubjectFallbackLabel = (item: GenerationRecord, historyCopy: ReturnType<typeof getHistoryCopy>) => {
  if (item.subjectType === 'dog') {
    return historyCopy.subjectDog;
  }
  if (item.subjectType === 'cat') {
    return historyCopy.subjectCat;
  }
  return historyCopy.subjectHuman;
};

const getResolvedPersonLabel = (item: GenerationRecord, historyCopy: ReturnType<typeof getHistoryCopy>): string =>
  item.personInputLabel?.trim()
    || (item.personPreviewUrl ? historyCopy.savedPerson : '')
    || getSubjectFallbackLabel(item, historyCopy);

const getResolvedGarmentLabel = (item: GenerationRecord, historyCopy: ReturnType<typeof getHistoryCopy>): string =>
  item.garmentInputLabel?.trim()
    || (item.garmentPreviewUrl ? historyCopy.savedGarment : '')
    || historyCopy.savedGarment;

const CreationHistoryPanel: React.FC<CreationHistoryPanelProps> = ({
  items,
  preservedCount,
  maxPreserved,
  locale,
  copy,
  onTogglePreserve,
  onDelete,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GenerationRecord | null>(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isImageReady, setIsImageReady] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [currentPage, setCurrentPage] = useState(0);
  const [pendingArchiveSelectionId, setPendingArchiveSelectionId] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const loadingStartedAtRef = useRef(0);
  const historyCopy = getHistoryCopy(locale);
  const pagerCopy = getHistoryPagerCopy(locale);
  const getPersonLabel = (item: GenerationRecord) => getResolvedPersonLabel(item, historyCopy);
  const getGarmentLabel = (item: GenerationRecord) => getResolvedGarmentLabel(item, historyCopy);
  const previewCardStyle: React.CSSProperties = {
    border: '1px solid var(--border)',
    borderRadius: 16,
    background: 'color-mix(in srgb, var(--surface) 94%, transparent)',
    padding: 10,
    display: 'grid',
    gap: 8,
    boxShadow: 'var(--shadow-sm)',
  };
  const previewThumbStyle: React.CSSProperties = {
    width: '100%',
    aspectRatio: '1 / 1',
    objectFit: 'cover',
    borderRadius: 12,
    border: '1px solid var(--border)',
    background: 'rgba(255,255,255,0.7)',
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!selectedItem) {
      return;
    }

    const nextSelectedItem = items.find((item) => item.id === selectedItem.id) ?? null;
    if (!nextSelectedItem) {
      resetExpandedPanel();
      return;
    }

    if (nextSelectedItem !== selectedItem) {
      setSelectedItem(nextSelectedItem);
    }
  }, [items, selectedItem]);

  const visibleItems = useMemo(() => (
    [...items]
      .filter((item) => Boolean(item.imageUrl))
      .sort((a, b) => {
        const preserveDiff = Number(isPreservedItem(b)) - Number(isPreservedItem(a));
        if (preserveDiff !== 0) {
          return preserveDiff;
        }

        return (getTimestampMillis(b.createdAt) ?? 0) - (getTimestampMillis(a.createdAt) ?? 0);
      })
  ), [items]);
  const pageCount = Math.max(1, Math.ceil(visibleItems.length / HISTORY_PAGE_SIZE));
  const pagedItems = useMemo(
    () => visibleItems.slice(currentPage * HISTORY_PAGE_SIZE, (currentPage + 1) * HISTORY_PAGE_SIZE),
    [currentPage, visibleItems],
  );

  const hasVisibleItems = visibleItems.length > 0;
  const isSelectedItemPreserved = Boolean(selectedItem && isPreservedItem(selectedItem));
  const canArchiveSelectedItem = Boolean(selectedItem && (!isSelectedItemPreserved && preservedCount < maxPreserved));

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, Math.max(0, pageCount - 1)));
  }, [pageCount]);

  const resetExpandedPanel = () => {
    setSelectedItem(null);
    setIsImageLoading(false);
    setIsImageReady(false);
    setZoom(1);
    setShareStatus(null);
  };

  const startImageLoading = () => {
    loadingStartedAtRef.current = Date.now();
    setIsImageLoading(true);
    setIsImageReady(false);
  };

  const finishImageLoading = () => {
    const elapsed = Date.now() - loadingStartedAtRef.current;
    const remaining = Math.max(0, IMAGE_LOAD_MIN_MS - elapsed);

    window.setTimeout(() => {
      setIsImageLoading(false);
      setIsImageReady(true);
    }, remaining);
  };

  const handleArchive = async () => {
    if (!selectedItem) {
      return;
    }

    const isCurrentlyPreserved = isPreservedItem(selectedItem);

    if (!isCurrentlyPreserved && preservedCount >= maxPreserved) {
      alert(copy.historyArchiveLimit(maxPreserved));
      return;
    }

    setSubmitting(true);
    try {
      await onTogglePreserve(selectedItem);
      if (!isCurrentlyPreserved) {
        setPendingArchiveSelectionId(selectedItem.id);
      } else {
        setPendingArchiveSelectionId(null);
      }
    } catch (archiveError) {
      console.error('Failed to archive creation:', archiveError);
      alert(archiveError instanceof Error ? archiveError.message : copy.historyArchiveFailed);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) {
      return;
    }

    setSubmitting(true);
    try {
      await onDelete(selectedItem);
      resetExpandedPanel();
    } catch (deleteError) {
      console.error('Failed to delete creation:', deleteError);
      alert(deleteError instanceof Error ? deleteError.message : copy.historyDeleteFailed);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenItem = (item: GenerationRecord) => {
    if (selectedItem?.id === item.id) {
      resetExpandedPanel();
      return;
    }

    setSelectedItem(item);
    setZoom(1);
    setShareStatus(null);
    startImageLoading();
  };

  const getSelectedShareUrl = (): string | null => selectedItem?.imageUrl || null;

  const openShareIntent = (url: string) => {
    openShareWindow(url);
    setShareStatus(copy.shareUploadOpened);
  };

  const handleShareOnKakao = () => {
    const shareUrl = getSelectedShareUrl();
    if (!shareUrl) {
      setShareStatus(copy.imageNotReady);
      return;
    }

    openShareIntent(`https://story.kakao.com/share?url=${encodeURIComponent(shareUrl)}`);
  };

  const handleShareOnX = () => {
    const shareUrl = getSelectedShareUrl();
    if (!shareUrl) {
      setShareStatus(copy.imageNotReady);
      return;
    }

    openShareIntent(`https://x.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent('HAMDEVA pet fitting result')}`);
  };

  const handleShareOnFacebook = () => {
    const shareUrl = getSelectedShareUrl();
    if (!shareUrl) {
      setShareStatus(copy.imageNotReady);
      return;
    }

    openShareIntent(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`);
  };

  const handleShareOnLine = () => {
    const shareUrl = getSelectedShareUrl();
    if (!shareUrl) {
      setShareStatus(copy.imageNotReady);
      return;
    }

    openShareIntent(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`);
  };

  const handleInstagramSave = () => {
    if (!selectedItem?.imageUrl) {
      setShareStatus(copy.imageNotReady);
      return;
    }

    try {
      downloadFile(selectedItem.imageUrl, `hamdeva-instagram-${selectedItem.id}.${inferFileExtension(selectedItem)}`);
      openShareWindow('https://www.instagram.com/');
      setShareStatus(copy.shareUploadOpened);
    } catch (error) {
      console.error('Failed to save history image for Instagram:', error);
      setShareStatus(copy.imageNotReady);
    }
  };

  const handleShareOnTikTok = () => {
    if (!selectedItem?.imageUrl) {
      setShareStatus(copy.imageNotReady);
      return;
    }

    try {
      downloadFile(selectedItem.imageUrl, `hamdeva-tiktok-${selectedItem.id}.${inferFileExtension(selectedItem)}`);
      openShareWindow('https://www.tiktok.com/upload');
      setShareStatus(copy.shareUploadOpened);
    } catch (error) {
      console.error('Failed to prepare history image for TikTok:', error);
      setShareStatus(copy.imageNotReady);
    }
  };

  const handleCopySelectedLink = async () => {
    const shareUrl = getSelectedShareUrl();
    if (!shareUrl) {
      setShareStatus(copy.imageNotReady);
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareStatus(copy.linkCopied);
    } catch (error) {
      console.error('Failed to copy history image link:', error);
      setShareStatus(copy.linkCopyFailed || copy.imageNotReady);
    }
  };

  useEffect(() => {
    if (!pendingArchiveSelectionId) {
      return;
    }

    const preservedItemIndex = visibleItems.findIndex((item) => item.id === pendingArchiveSelectionId && isPreservedItem(item));
    if (preservedItemIndex < 0) {
      return;
    }

    setCurrentPage(Math.floor(preservedItemIndex / HISTORY_PAGE_SIZE));
    setPendingArchiveSelectionId(null);
  }, [pendingArchiveSelectionId, visibleItems]);

  useEffect(() => {
    if (!selectedItem) {
      return undefined;
    }

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        resetExpandedPanel();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [selectedItem]);

  return (
    <article className="page-article">
      <h3>{copy.historyTitle}</h3>
      <p className="history-guide-copy">{copy.historyGuide}</p>
      {!hasVisibleItems ? <p>{copy.historyEmpty}</p> : null}
      {hasVisibleItems ? (
        <>
          <div className="creation-history-grid">
            {pagedItems.map((item) => {
              const isExpanded = selectedItem?.id === item.id;
              const itemLabel = `[${formatDateTime(item.createdAt, locale)}]`;

              return (
                <button
                  key={item.id}
                  className={`creation-history-card ${isExpanded ? 'is-selected' : ''}`}
                  onClick={() => handleOpenItem(item)}
                  type="button"
                >
                  <div className="creation-history-thumbnail">
                    <img
                      src={item.imageUrl || ''}
                      alt={`${itemLabel} ${historyCopy.resultLabel}`}
                      loading="lazy"
                    />
                    {isPreservedItem(item) ? (
                      <span className="creation-history-thumbnail-badge">{copy.historyArchived}</span>
                    ) : null}
                  </div>
                  <div className="creation-history-card-copy">
                    <strong>{itemLabel}</strong>
                    <span>{historyCopy.resultLabel}</span>
                    {isPreservedItem(item) ? (
                      <span className="creation-history-badge">{copy.historyArchived}</span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="creation-history-pagination">
            <button
              className="outline-btn auth-inline-btn creation-history-page-btn"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
              type="button"
            >
              {pagerCopy.previous}
            </button>
            <span className="creation-history-page-indicator">{pagerCopy.summary(currentPage + 1, pageCount)}</span>
            <button
              className="outline-btn auth-inline-btn creation-history-page-btn"
              disabled={currentPage >= pageCount - 1}
              onClick={() => setCurrentPage((prev) => Math.min(pageCount - 1, prev + 1))}
              type="button"
            >
              {pagerCopy.next}
            </button>
          </div>
        </>
      ) : null}

      {selectedItem ? (
        <div className="modal-backdrop" onClick={resetExpandedPanel}>
          <div
            className="history-modal-shell"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={copy.historyTitle}
          >
            <div className="history-modal-header">
              <div className="history-modal-header-copy">
                <strong>
                  [{formatDateTime(selectedItem.createdAt, locale)}] IMAGE{isPreservedItem(selectedItem) ? ` (${copy.historyArchived})` : ''}
                </strong>
                <p>{copy.historyExpiresAt}: {formatDateTime(selectedItem.expiresAt, locale)}</p>
                <p>{historyCopy.personLabel}: {getPersonLabel(selectedItem)}</p>
                <p>{historyCopy.garmentLabel}: {getGarmentLabel(selectedItem)}</p>
              </div>
              <button
                className="outline-btn auth-inline-btn"
                disabled={submitting}
                onClick={resetExpandedPanel}
                type="button"
              >
                {copy.close}
              </button>
            </div>

            <div className="history-modal-toolbar">
              <button
                className="outline-btn auth-inline-btn"
                disabled={zoom <= 0.75}
                onClick={() => setZoom((prev) => Math.max(0.75, Number((prev - 0.25).toFixed(2))))}
                type="button"
              >
                {copy.historyZoomOut}
              </button>
              <button
                className="outline-btn auth-inline-btn"
                disabled={zoom === 1}
                onClick={() => setZoom(1)}
                type="button"
              >
                {copy.historyZoomReset}
              </button>
              <button
                className="outline-btn auth-inline-btn"
                disabled={zoom >= 2}
                onClick={() => setZoom((prev) => Math.min(2, Number((prev + 0.25).toFixed(2))))}
                type="button"
              >
                {copy.historyZoomIn}
              </button>
            </div>

            <div
              className="history-modal-body"
              onWheel={(event) => {
                if (event.ctrlKey) {
                  event.preventDefault();
                }
              }}
            >
              <div className={`history-modal-grid ${isMobile ? 'is-mobile' : ''}`}>
                <div className="history-modal-inputs">
                  <div style={previewCardStyle}>
                    <strong>{historyCopy.personLabel}</strong>
                    {selectedItem.personPreviewUrl ? (
                      <img
                        src={selectedItem.personPreviewUrl}
                        alt={historyCopy.personLabel}
                        style={{ ...previewThumbStyle, maxWidth: '58%', margin: '0 auto' }}
                      />
                    ) : (
                      <div style={{ ...previewThumbStyle, maxWidth: '58%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-sub)', textAlign: 'center', padding: 12 }}>
                        {getPersonLabel(selectedItem)}
                      </div>
                    )}
                    <span style={{ color: 'var(--text-sub)', fontSize: 13 }}>
                      {getPersonLabel(selectedItem)}
                    </span>
                  </div>
                  <div style={previewCardStyle}>
                    <strong>{historyCopy.garmentLabel}</strong>
                    {selectedItem.garmentPreviewUrl ? (
                      <img
                        src={selectedItem.garmentPreviewUrl}
                        alt={historyCopy.garmentLabel}
                        style={{ ...previewThumbStyle, maxWidth: '58%', margin: '0 auto' }}
                      />
                    ) : (
                      <div style={{ ...previewThumbStyle, maxWidth: '58%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-sub)', textAlign: 'center', padding: 12 }}>
                        {getGarmentLabel(selectedItem)}
                      </div>
                    )}
                    <span style={{ color: 'var(--text-sub)', fontSize: 13 }}>
                      {getGarmentLabel(selectedItem)}
                    </span>
                  </div>
                </div>

                <div className="history-selected-result-card" style={{ ...previewCardStyle, minHeight: isMobile ? undefined : '100%' }}>
                  <strong>{historyCopy.resultLabel}</strong>
                  <span style={{ color: 'var(--text-sub)', fontSize: 13 }}>
                    {historyCopy.resultPreview}
                  </span>
                  {isImageLoading || !isImageReady ? (
                    <div style={{ minHeight: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-sub)' }}>
                      {copy.historyLoading}
                    </div>
                  ) : null}
                  <div className={`history-selected-result-layout ${isMobile ? 'is-mobile' : ''}`}>
                    <div
                      className="history-selected-image-shell"
                      style={{
                        width: '100%',
                        overflowX: 'auto',
                        overflowY: 'visible',
                        border: '1px solid var(--border)',
                        borderRadius: 16,
                        padding: 10,
                        background: 'rgba(255,255,255,0.35)',
                        minHeight: isMobile ? 160 : 320,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <img
                        alt={copy.resultPreviewAlt}
                        onLoad={finishImageLoading}
                        draggable={false}
                        src={selectedItem.imageUrl || ''}
                        style={{
                          display: 'block',
                          margin: '0 auto',
                          width: `${zoom * 100}%`,
                          maxWidth: '100%',
                          maxHeight: isMobile ? '52vh' : '68vh',
                          height: 'auto',
                          objectFit: 'contain',
                          userSelect: 'none',
                          visibility: isImageLoading ? 'hidden' : 'visible',
                        }}
                      />
                    </div>
                    {!isMobile ? (
                      <aside className="history-selected-sidebar">
                        <button className="outline-btn auth-inline-btn history-action-btn" onClick={handleShareOnKakao} type="button">
                          {renderSocialIcon('kakao')}
                          Kakao
                        </button>
                        <button className="outline-btn auth-inline-btn history-action-btn" onClick={handleShareOnX} type="button">
                          {renderSocialIcon('x')}
                          X
                        </button>
                        <button className="outline-btn auth-inline-btn history-action-btn" onClick={handleShareOnFacebook} type="button">
                          {renderSocialIcon('facebook')}
                          Facebook
                        </button>
                        <button className="outline-btn auth-inline-btn history-action-btn" onClick={handleShareOnLine} type="button">
                          {renderSocialIcon('line')}
                          LINE
                        </button>
                        <button className="outline-btn auth-inline-btn history-action-btn" onClick={handleInstagramSave} type="button">
                          {renderSocialIcon('instagram')}
                          Instagram
                        </button>
                        <button className="outline-btn auth-inline-btn history-action-btn" onClick={handleShareOnTikTok} type="button">
                          {renderSocialIcon('tiktok')}
                          TikTok
                        </button>
                        <button className="outline-btn auth-inline-btn history-action-btn" onClick={() => { void handleCopySelectedLink(); }} type="button">
                          {renderSocialIcon('link')}
                          Link
                        </button>
                        <button
                          className="download-btn auth-inline-btn history-action-btn"
                          disabled={!selectedItem.imageUrl}
                          onClick={() => {
                            if (selectedItem.imageUrl) {
                              downloadFile(selectedItem.imageUrl, `hamdeva-image-${selectedItem.id}.${inferFileExtension(selectedItem)}`);
                            }
                          }}
                          type="button"
                        >
                          {renderSocialIcon('download')}
                          {copy.historyDownload}
                        </button>
                        {shareStatus ? (
                          <div className="history-selected-share-status">
                            {shareStatus}
                          </div>
                        ) : null}
                      </aside>
                    ) : null}
                  </div>
                  {!isImageLoading ? (
                    <div className="history-selected-zoom-hint" style={{ marginTop: 8, color: 'var(--text-sub)', fontSize: 13 }}>
                      {copy.historyZoomHint}
                    </div>
                  ) : null}
                </div>

                {isMobile ? (
                  <div className="history-modal-mobile-actions">
                    <div className="history-actions" style={{ marginTop: 0 }}>
                      <button className="outline-btn auth-inline-btn history-action-btn" onClick={handleShareOnKakao} type="button">
                        {renderSocialIcon('kakao')}
                        Kakao
                      </button>
                      <button className="outline-btn auth-inline-btn history-action-btn" onClick={handleShareOnX} type="button">
                        {renderSocialIcon('x')}
                        X
                      </button>
                      <button className="outline-btn auth-inline-btn history-action-btn" onClick={handleShareOnFacebook} type="button">
                        {renderSocialIcon('facebook')}
                        Facebook
                      </button>
                      <button className="outline-btn auth-inline-btn history-action-btn" onClick={handleShareOnLine} type="button">
                        {renderSocialIcon('line')}
                        LINE
                      </button>
                      <button className="outline-btn auth-inline-btn history-action-btn" onClick={handleInstagramSave} type="button">
                        {renderSocialIcon('instagram')}
                        Instagram
                      </button>
                      <button className="outline-btn auth-inline-btn history-action-btn" onClick={handleShareOnTikTok} type="button">
                        {renderSocialIcon('tiktok')}
                        TikTok
                      </button>
                      <button className="outline-btn auth-inline-btn history-action-btn" onClick={() => { void handleCopySelectedLink(); }} type="button">
                        {renderSocialIcon('link')}
                        Link
                      </button>
                      <button
                        className="download-btn auth-inline-btn history-action-btn"
                        disabled={!selectedItem.imageUrl}
                        onClick={() => {
                          if (selectedItem.imageUrl) {
                            downloadFile(selectedItem.imageUrl, `hamdeva-image-${selectedItem.id}.${inferFileExtension(selectedItem)}`);
                          }
                        }}
                        type="button"
                      >
                        {renderSocialIcon('download')}
                        {copy.historyDownload}
                      </button>
                    </div>
                    {shareStatus ? (
                      <div className="history-selected-share-status history-selected-share-status-mobile">
                        {shareStatus}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="history-modal-footer">
              <button
                className={isSelectedItemPreserved ? 'outline-btn auth-inline-btn' : 'generate-btn auth-inline-btn'}
                disabled={submitting}
                onClick={() => {
                  if (!isSelectedItemPreserved && !canArchiveSelectedItem) {
                    alert(copy.historyArchiveLimit(maxPreserved));
                    return;
                  }
                  void handleArchive();
                }}
                type="button"
              >
                {isSelectedItemPreserved ? (copy.historyUnarchive ?? copy.historyArchive) : copy.historyArchive}
              </button>
              <button
                className="outline-btn auth-inline-btn history-modal-delete-btn"
                disabled={submitting}
                onClick={() => { void handleDelete(); }}
                type="button"
              >
                {submitting ? copy.historyProcessing : copy.historyDelete}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
};

export default CreationHistoryPanel;
