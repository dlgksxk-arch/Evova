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
const HISTORY_VISIBLE_ROWS = 7;

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

const createShareImageFile = async (url: string, item: GenerationRecord): Promise<File> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('SHARE_IMAGE_FETCH_FAILED');
  }

  const blob = await response.blob();
  if (!blob.type.startsWith('image/')) {
    throw new Error('SHARE_IMAGE_INVALID');
  }

  const extension = inferFileExtension(item);
  return new File([blob], `hamdeva-history-${item.id}.${extension}`, { type: blob.type });
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
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isImageReady, setIsImageReady] = useState(false);
  const [zoom, setZoom] = useState(0.5);
  const [pendingArchiveSelectionId, setPendingArchiveSelectionId] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [preparedShareFile, setPreparedShareFile] = useState<File | null>(null);
  const [isPreparingShareFile, setIsPreparingShareFile] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const selectedPanelRef = useRef<HTMLDivElement | null>(null);
  const rowRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const loadingStartedAtRef = useRef(0);
  const historyCopy = getHistoryCopy(locale);
  const getPersonLabel = (item: GenerationRecord) => getResolvedPersonLabel(item, historyCopy);
  const getGarmentLabel = (item: GenerationRecord) => getResolvedGarmentLabel(item, historyCopy);
  const previewCardStyle: React.CSSProperties = {
    border: '1px solid var(--border)',
    borderRadius: 18,
    background: 'color-mix(in srgb, var(--surface) 94%, transparent)',
    padding: 14,
    display: 'grid',
    gap: 10,
    boxShadow: 'var(--shadow-sm)',
  };
  const previewThumbStyle: React.CSSProperties = {
    width: '100%',
    aspectRatio: '1 / 1',
    objectFit: 'cover',
    borderRadius: 14,
    border: '1px solid var(--border)',
    background: 'rgba(255,255,255,0.7)',
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setViewportWidth(window.innerWidth);
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

  const columnCount = useMemo(() => {
    if (viewportWidth <= 520) {
      return 1;
    }
    if (viewportWidth <= 768) {
      return 2;
    }
    if (viewportWidth <= 980) {
      return 3;
    }
    if (viewportWidth <= 1200) {
      return 4;
    }
    if (viewportWidth <= 1400) {
      return 5;
    }
    return 6;
  }, [viewportWidth]);

  const visibleRows = useMemo(() => {
    const rows: GenerationRecord[][] = [];
    for (let index = 0; index < visibleItems.length; index += columnCount) {
      rows.push(visibleItems.slice(index, index + columnCount));
    }
    return rows;
  }, [visibleItems, columnCount]);

  useEffect(() => {
    if (!selectedItem || !selectedPanelRef.current || !scrollContainerRef.current) {
      return;
    }

    const selectedIndex = visibleItems.findIndex((item) => item.id === selectedItem.id);
    if (selectedIndex < 0) {
      return;
    }

    const rowIndex = Math.floor(selectedIndex / columnCount);
    const rowElement = rowRefs.current[rowIndex];
    if (rowElement) {
      scrollContainerRef.current.scrollTo({
        top: rowElement.offsetTop,
        behavior: 'smooth',
      });
    }
  }, [selectedItem, visibleItems, columnCount]);

  const hasVisibleItems = visibleItems.length > 0;
  const isSelectedItemPreserved = Boolean(selectedItem && isPreservedItem(selectedItem));
  const canArchiveSelectedItem = Boolean(selectedItem && (!isSelectedItemPreserved && preservedCount < maxPreserved));

  const resetExpandedPanel = () => {
    setSelectedItem(null);
    setIsImageLoading(false);
    setIsImageReady(false);
    setZoom(0.5);
    setShareStatus(null);
    setPreparedShareFile(null);
    setIsPreparingShareFile(false);
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
    setZoom(0.5);
    setShareStatus(null);
    startImageLoading();
  };

  const handleShareSelected = async () => {
    if (!selectedItem?.imageUrl) {
      setShareStatus(copy.imageNotReady);
      return;
    }

    try {
      if (navigator.share) {
        const sharePayload = {
          title: 'HAMDEVA | Pet Fitting Result',
          text: copy.shareDefaultText || copy.share,
          url: selectedItem.imageUrl,
        };

        if (preparedShareFile && (!navigator.canShare || navigator.canShare({ files: [preparedShareFile] }))) {
          await navigator.share({
            ...sharePayload,
            files: [preparedShareFile],
          });
          setShareStatus(null);
          return;
        }

        await navigator.share(sharePayload);
        setShareStatus(null);
        return;
      }

      await navigator.clipboard.writeText(selectedItem.imageUrl);
      setShareStatus(copy.linkCopied);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      console.error('Failed to share history image:', error);
      setShareStatus(copy.linkCopyFailed || copy.imageNotReady);
    }
  };

  useEffect(() => {
    let cancelled = false;

    if (!selectedItem?.imageUrl) {
      setPreparedShareFile(null);
      setIsPreparingShareFile(false);
      return;
    }

    setIsPreparingShareFile(true);
    setPreparedShareFile(null);

    createShareImageFile(selectedItem.imageUrl, selectedItem)
      .then((file) => {
        if (!cancelled) {
          setPreparedShareFile(file);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error('Failed to prepare history share file:', error);
          setPreparedShareFile(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsPreparingShareFile(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedItem]);

  useEffect(() => {
    if (!pendingArchiveSelectionId || !scrollContainerRef.current) {
      return;
    }

    const preservedItem = visibleItems.find((item) => item.id === pendingArchiveSelectionId);
    if (!preservedItem || !isPreservedItem(preservedItem)) {
      return;
    }

    scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    setPendingArchiveSelectionId(null);
  }, [pendingArchiveSelectionId, visibleItems]);

  const selectedRowIndex = selectedItem
    ? visibleRows.findIndex((row) => row.some((item) => item.id === selectedItem.id))
    : -1;

  return (
    <article className="page-article">
      <h3>{copy.historyTitle}</h3>
      <p className="history-guide-copy">{copy.historyGuide}</p>
      {!hasVisibleItems ? <p>{copy.historyEmpty}</p> : null}
      {hasVisibleItems ? (
        <div
          ref={scrollContainerRef}
          className="creation-history-scroll"
          style={{
            '--history-visible-rows': String(HISTORY_VISIBLE_ROWS),
            '--history-column-count': String(columnCount),
          } as React.CSSProperties}
        >
          {visibleRows.map((row, rowIndex) => (
            <React.Fragment key={`history-row-${rowIndex}`}>
              <div
                ref={(element) => {
                  rowRefs.current[rowIndex] = element;
                }}
                className="creation-history-grid"
              >
                {row.map((item) => {
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

              {selectedItem && selectedRowIndex === rowIndex ? (
                <div
                  ref={selectedPanelRef}
                  className="creation-history-selected-panel"
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 20,
                    background: 'color-mix(in srgb, var(--surface) 96%, transparent)',
                    boxShadow: 'var(--shadow-sm)',
                    overflow: 'hidden',
                    marginTop: 18,
                    marginBottom: 18,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ display: 'block' }}>
                        [{formatDateTime(selectedItem.createdAt, locale)}] IMAGE{isPreservedItem(selectedItem) ? ` (${copy.historyArchived})` : ''}
                      </strong>
                      <p style={{ marginTop: 4, color: 'var(--text-sub)' }}>{copy.historyExpiresAt}: {formatDateTime(selectedItem.expiresAt, locale)}</p>
                      <p style={{ marginTop: 4, color: 'var(--text-sub)' }}>
                        {historyCopy.personLabel}: {getPersonLabel(selectedItem)}
                      </p>
                      <p style={{ marginTop: 4, color: 'var(--text-sub)' }}>
                        {historyCopy.garmentLabel}: {getGarmentLabel(selectedItem)}
                      </p>
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

                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      justifyContent: 'flex-end',
                      padding: '12px 20px 0',
                      flexWrap: 'wrap',
                    }}
                  >
                    <button
                      className="outline-btn auth-inline-btn"
                      disabled={zoom <= 0.5}
                      onClick={() => setZoom((prev) => Math.max(0.5, Number((prev - 0.25).toFixed(2))))}
                      type="button"
                    >
                      {copy.historyZoomOut}
                    </button>
                    <button
                      className="outline-btn auth-inline-btn"
                      disabled={zoom === 0.5}
                      onClick={() => setZoom(0.5)}
                      type="button"
                    >
                      {copy.historyZoomReset}
                    </button>
                    <button
                      className="outline-btn auth-inline-btn"
                      disabled={zoom >= 1.5}
                      onClick={() => setZoom((prev) => Math.min(1.5, Number((prev + 0.25).toFixed(2))))}
                      type="button"
                    >
                      {copy.historyZoomIn}
                    </button>
                  </div>

                  <div
                    onWheel={(event) => {
                      if (event.ctrlKey) {
                        event.preventDefault();
                      }
                    }}
                    style={{
                      padding: isMobile ? 16 : 20,
                    }}
                  >
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr' : 'minmax(160px, 220px) minmax(0, 1fr)',
                        gap: 16,
                        marginBottom: 16,
                        alignItems: 'stretch',
                      }}
                    >
                      <div
                        style={{
                          display: 'grid',
                          gap: 16,
                          gridTemplateRows: isMobile ? 'repeat(2, minmax(0, 1fr))' : '1fr 1fr',
                        }}
                      >
                        <div style={previewCardStyle}>
                          <strong>{historyCopy.personLabel}</strong>
                          {selectedItem.personPreviewUrl ? (
                            <img
                              src={selectedItem.personPreviewUrl}
                              alt={historyCopy.personLabel}
                              style={{ ...previewThumbStyle, maxWidth: '50%', margin: '0 auto' }}
                            />
                          ) : (
                            <div style={{ ...previewThumbStyle, maxWidth: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-sub)', textAlign: 'center', padding: 12 }}>
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
                              style={{ ...previewThumbStyle, maxWidth: '50%', margin: '0 auto' }}
                            />
                          ) : (
                            <div style={{ ...previewThumbStyle, maxWidth: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-sub)', textAlign: 'center', padding: 12 }}>
                              {getGarmentLabel(selectedItem)}
                            </div>
                          )}
                          <span style={{ color: 'var(--text-sub)', fontSize: 13 }}>
                            {getGarmentLabel(selectedItem)}
                          </span>
                        </div>
                      </div>
                      <div style={{ ...previewCardStyle, minHeight: isMobile ? undefined : '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                          <strong>{historyCopy.resultLabel}</strong>
                          <button
                            className="outline-btn auth-inline-btn"
                            disabled={!selectedItem.imageUrl || isPreparingShareFile}
                            onClick={() => { void handleShareSelected(); }}
                            type="button"
                          >
                            {copy.share}
                          </button>
                        </div>
                        <span style={{ color: 'var(--text-sub)', fontSize: 13 }}>
                          {historyCopy.resultPreview}
                        </span>
                        {isImageLoading || !isImageReady ? (
                          <div style={{ minHeight: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-sub)' }}>
                            {copy.historyLoading}
                          </div>
                        ) : null}
                        <div
                          style={{
                            width: '100%',
                            overflowX: 'auto',
                            overflowY: 'visible',
                            border: '1px solid var(--border)',
                            borderRadius: 16,
                            padding: 16,
                            background: 'rgba(255,255,255,0.35)',
                            minHeight: isMobile ? 140 : 260,
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
                              width: `${zoom * 50}%`,
                              maxWidth: '100%',
                              maxHeight: isMobile ? '30vh' : '36vh',
                              height: 'auto',
                              objectFit: 'contain',
                              userSelect: 'none',
                              visibility: isImageLoading ? 'hidden' : 'visible',
                            }}
                          />
                        </div>
                        {!isImageLoading ? (
                          <div style={{ marginTop: 12, color: 'var(--text-sub)', fontSize: 13 }}>
                            {copy.historyZoomHint}
                          </div>
                        ) : null}
                        {shareStatus ? (
                          <div style={{ marginTop: 8, color: 'var(--text-sub)', fontSize: 13 }}>
                            {shareStatus}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: 12,
                      justifyContent: isMobile ? 'stretch' : 'flex-end',
                      padding: '16px 20px',
                      borderTop: '1px solid var(--border)',
                      flexWrap: 'wrap',
                    }}
                  >
                    <button
                      className="outline-btn auth-inline-btn"
                      disabled={submitting}
                      onClick={() => {
                        if (selectedItem.imageUrl) {
                          downloadFile(selectedItem.imageUrl, `hamdeva-image-${selectedItem.id}.${inferFileExtension(selectedItem)}`);
                        }
                      }}
                      style={{ flex: isMobile ? 1 : undefined }}
                      type="button"
                    >
                      {copy.historyDownload}
                    </button>
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
                      style={{ flex: isMobile ? 1 : undefined }}
                      type="button"
                    >
                      {isSelectedItemPreserved ? (copy.historyUnarchive ?? copy.historyArchive) : copy.historyArchive}
                    </button>
                    <button
                      className="outline-btn auth-inline-btn"
                      disabled={submitting}
                      onClick={() => { void handleDelete(); }}
                      style={{ color: '#ef4444', flex: isMobile ? 1 : undefined }}
                      type="button"
                    >
                      {submitting ? copy.historyProcessing : copy.historyDelete}
                    </button>
                  </div>
                </div>
              ) : null}
            </React.Fragment>
          ))}
        </div>
      ) : null}
    </article>
  );
};

export default CreationHistoryPanel;
