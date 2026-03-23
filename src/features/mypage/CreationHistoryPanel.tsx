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
const DESKTOP_HISTORY_PAGE_SIZE = 21;
const MOBILE_HISTORY_PAGE_SIZE = 9;
const HISTORY_BASE_RETENTION_MS = 15 * 24 * 60 * 60 * 1000;

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
  const preservedAt = getTimestampMillis(item.preservedAt);
  if (typeof preservedAt === 'number') {
    return true;
  }
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

const renderSocialIcon = (kind: 'link' | 'download') => {
  const commonProps = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': true,
  } as const;

  switch (kind) {
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
  const [showUnarchiveWarning, setShowUnarchiveWarning] = useState(false);
  const loadingStartedAtRef = useRef(0);
  const historyCopy = getHistoryCopy(locale);
  const pagerCopy = getHistoryPagerCopy(locale);
  const historyPageSize = isMobile ? MOBILE_HISTORY_PAGE_SIZE : DESKTOP_HISTORY_PAGE_SIZE;
  const getPersonLabel = (item: GenerationRecord) => getResolvedPersonLabel(item, historyCopy);
  const getGarmentLabel = (item: GenerationRecord) => getResolvedGarmentLabel(item, historyCopy);
  const previewCardStyle: React.CSSProperties = {
    border: '1px solid var(--border)',
    borderRadius: 16,
    background: 'color-mix(in srgb, var(--surface) 94%, transparent)',
    padding: 8,
    display: 'grid',
    gap: 6,
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
  const pageCount = Math.max(1, Math.ceil(visibleItems.length / historyPageSize));
  const pagedItems = useMemo(
    () => visibleItems.slice(currentPage * historyPageSize, (currentPage + 1) * historyPageSize),
    [currentPage, historyPageSize, visibleItems],
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
    setShowUnarchiveWarning(false);
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

  const isPastBaseRetention = (item: GenerationRecord): boolean => {
    const createdAt = getTimestampMillis(item.createdAt);
    return typeof createdAt === 'number' && createdAt + HISTORY_BASE_RETENTION_MS <= Date.now();
  };

  const handleDownloadSelectedItem = () => {
    if (!selectedItem?.imageUrl) {
      setShareStatus(copy.historyDownloadFailed);
      return;
    }

    try {
      downloadFile(selectedItem.imageUrl, `hamdeva-image-${selectedItem.id}.${inferFileExtension(selectedItem)}`);
    } catch (error) {
      console.error('Failed to download selected history item:', error);
      setShareStatus(copy.historyDownloadFailed);
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

    setCurrentPage(Math.floor(preservedItemIndex / historyPageSize));
    setPendingArchiveSelectionId(null);
  }, [historyPageSize, pendingArchiveSelectionId, visibleItems]);

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
                <p>{copy.historyExpiresAt}: {isPreservedItem(selectedItem) ? copy.historyPreservedForever : formatDateTime(selectedItem.expiresAt, locale)}</p>
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
                        style={{ ...previewThumbStyle, maxWidth: '52%', margin: '0 auto' }}
                      />
                    ) : (
                      <div style={{ ...previewThumbStyle, maxWidth: '52%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-sub)', textAlign: 'center', padding: 12 }}>
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
                        style={{ ...previewThumbStyle, maxWidth: '52%', margin: '0 auto' }}
                      />
                    ) : (
                      <div style={{ ...previewThumbStyle, maxWidth: '52%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-sub)', textAlign: 'center', padding: 12 }}>
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
                        overflow: 'hidden',
                        border: '1px solid var(--border)',
                        borderRadius: 16,
                        padding: isMobile ? 8 : 10,
                        background: 'rgba(255,255,255,0.35)',
                        height: isMobile ? 'min(42vh, 340px)' : 'min(54vh, 520px)',
                        minHeight: isMobile ? 180 : 360,
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
                          width: '100%',
                          maxWidth: '100%',
                          maxHeight: '100%',
                          height: 'auto',
                          objectFit: 'contain',
                          userSelect: 'none',
                          visibility: isImageLoading ? 'hidden' : 'visible',
                          transform: `scale(${zoom})`,
                          transformOrigin: 'center center',
                          transition: 'transform 180ms ease',
                        }}
                      />
                    </div>
                    {!isMobile ? (
                      <aside className="history-selected-sidebar">
                        <button className="outline-btn auth-inline-btn history-action-btn" onClick={() => { void handleCopySelectedLink(); }} type="button">
                          {renderSocialIcon('link')}
                          Link
                        </button>
                        <button
                          className="download-btn auth-inline-btn history-action-btn"
                          disabled={!selectedItem.imageUrl}
                          onClick={handleDownloadSelectedItem}
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
                      <button className="outline-btn auth-inline-btn history-action-btn" onClick={() => { void handleCopySelectedLink(); }} type="button">
                        {renderSocialIcon('link')}
                        Link
                      </button>
                      <button
                        className="download-btn auth-inline-btn history-action-btn"
                        disabled={!selectedItem.imageUrl}
                        onClick={handleDownloadSelectedItem}
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
                  if (isSelectedItemPreserved && selectedItem && isPastBaseRetention(selectedItem)) {
                    setShowUnarchiveWarning(true);
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

      {selectedItem && showUnarchiveWarning ? (
        <div className="modal-backdrop" onClick={() => setShowUnarchiveWarning(false)}>
          <div
            className="history-warning-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={copy.historyUnarchiveWarningTitle}
          >
            <div className="history-warning-modal-copy">
              <strong>{copy.historyUnarchiveWarningTitle}</strong>
              <p>{copy.historyUnarchiveWarningBody}</p>
            </div>
            <div className="history-warning-modal-actions">
              <button className="download-btn auth-inline-btn" onClick={handleDownloadSelectedItem} type="button">
                {copy.historyDownload}
              </button>
              <button className="outline-btn auth-inline-btn" onClick={() => setShowUnarchiveWarning(false)} type="button">
                {copy.cancel}
              </button>
              <button
                className="outline-btn auth-inline-btn history-warning-unarchive-btn"
                onClick={() => {
                  setShowUnarchiveWarning(false);
                  void handleArchive();
                }}
                type="button"
              >
                {copy.historyUnarchiveConfirm}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
};

export default CreationHistoryPanel;
