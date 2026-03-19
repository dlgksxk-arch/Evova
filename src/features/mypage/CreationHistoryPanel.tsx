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
const HISTORY_LIST_VISIBLE_ROWS = 20;
const HISTORY_ROW_MIN_HEIGHT = 52;

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
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isImageReady, setIsImageReady] = useState(false);
  const [zoom, setZoom] = useState(0.5);
  const selectedPanelRef = useRef<HTMLDivElement | null>(null);
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
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!selectedItem || !selectedPanelRef.current) {
      return;
    }

    selectedPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedItem]);

  const visibleItems = useMemo(() => (
    [...items]
      .filter((item) => Boolean(item.imageUrl))
      .sort((a, b) => (getTimestampMillis(b.createdAt) ?? 0) - (getTimestampMillis(a.createdAt) ?? 0))
  ), [items]);

  const hasVisibleItems = visibleItems.length > 0;
  const canArchiveSelectedItem = Boolean(selectedItem && !isPreservedItem(selectedItem) && preservedCount < maxPreserved);

  const resetExpandedPanel = () => {
    setSelectedItem(null);
    setIsImageLoading(false);
    setIsImageReady(false);
    setZoom(0.5);
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
    if (!selectedItem || isPreservedItem(selectedItem)) {
      return;
    }

    if (preservedCount >= maxPreserved) {
      alert(copy.historyArchiveLimit(maxPreserved));
      return;
    }

    setSubmitting(true);
    try {
      await onTogglePreserve(selectedItem);
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
    startImageLoading();
  };

  return (
    <article className="page-article">
      <h3>{copy.historyTitle}</h3>
      <p className="history-guide-copy">{copy.historyGuide}</p>
      {!hasVisibleItems ? <p>{copy.historyEmpty}</p> : null}
      {hasVisibleItems ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 8,
            maxHeight: HISTORY_LIST_VISIBLE_ROWS * HISTORY_ROW_MIN_HEIGHT,
            overflowY: 'auto',
            paddingRight: 4,
          }}
        >
          {visibleItems.map((item) => {
            const isExpanded = selectedItem?.id === item.id;

            return (
              <div key={item.id} style={{ display: 'grid', gap: 8 }}>
                <button
                  className="outline-btn auth-inline-btn"
                  onClick={() => handleOpenItem(item)}
                  onMouseEnter={() => setHoveredItemId(item.id)}
                  onMouseLeave={() => setHoveredItemId((prev) => prev === item.id ? null : prev)}
                  style={{
                    width: '100%',
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    padding: '12px 16px',
                    minHeight: HISTORY_ROW_MIN_HEIGHT,
                    background: hoveredItemId === item.id ? 'var(--upload-hover-bg)' : 'transparent',
                    transition: 'background-color 0.2s ease, opacity 0.2s ease',
                    opacity: hoveredItemId === item.id ? 1 : 0.96,
                    borderColor: isExpanded ? 'var(--primary)' : undefined,
                    overflow: 'hidden',
                  }}
                  type="button"
                >
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: isMobile ? 8 : 14,
                      width: '100%',
                      minWidth: 0,
                      flexWrap: 'nowrap',
                    }}
                  >
                    <strong
                      style={{
                        flex: '0 0 auto',
                        maxWidth: isMobile ? 124 : 188,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      [{formatDateTime(item.createdAt, locale)}] IMAGE{isPreservedItem(item) ? ` (${copy.historyArchived})` : ''}
                    </strong>
                    <span
                      style={{
                        color: 'var(--text-sub)',
                        fontSize: 13,
                        minWidth: 0,
                        flex: '1 1 0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {historyCopy.personLabel}: {getPersonLabel(item)}
                    </span>
                    <span
                      style={{
                        color: 'var(--text-sub)',
                        fontSize: 13,
                        minWidth: 0,
                        flex: '1 1 0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {historyCopy.garmentLabel}: {getGarmentLabel(item)}
                    </span>
                    <span style={{ color: 'var(--text-sub)', fontSize: 13, flex: '0 0 auto', whiteSpace: 'nowrap' }}>
                      {isExpanded ? copy.historyPreviewClose : copy.historyPreviewOpen}
                    </span>
                  </span>
                </button>

                {isExpanded ? (
                  <div
                    ref={selectedPanelRef}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: 20,
                      background: 'color-mix(in srgb, var(--surface) 96%, transparent)',
                      boxShadow: 'var(--shadow-sm)',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
                      <div style={{ minWidth: 0 }}>
                        <strong style={{ display: 'block' }}>
                          [{formatDateTime(item.createdAt, locale)}] IMAGE{isPreservedItem(item) ? ` (${copy.historyArchived})` : ''}
                        </strong>
                        <p style={{ marginTop: 4, color: 'var(--text-sub)' }}>{copy.historyExpiresAt}: {formatDateTime(item.expiresAt, locale)}</p>
                        <p style={{ marginTop: 4, color: 'var(--text-sub)' }}>
                          {historyCopy.personLabel}: {getPersonLabel(item)}
                        </p>
                        <p style={{ marginTop: 4, color: 'var(--text-sub)' }}>
                          {historyCopy.garmentLabel}: {getGarmentLabel(item)}
                        </p>
                      </div>
                      <button className="outline-btn auth-inline-btn" disabled={submitting} onClick={resetExpandedPanel} type="button">{copy.close}</button>
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
                          gridTemplateColumns: isMobile ? '1fr' : 'minmax(240px, 320px) minmax(0, 1fr)',
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
                            {item.personPreviewUrl ? (
                              <img
                                src={item.personPreviewUrl}
                                alt={historyCopy.personLabel}
                                style={previewThumbStyle}
                              />
                            ) : (
                              <div style={{ ...previewThumbStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-sub)', textAlign: 'center', padding: 12 }}>
                                {getPersonLabel(item)}
                              </div>
                            )}
                            <span style={{ color: 'var(--text-sub)', fontSize: 13 }}>
                              {getPersonLabel(item)}
                            </span>
                          </div>
                          <div style={previewCardStyle}>
                            <strong>{historyCopy.garmentLabel}</strong>
                            {item.garmentPreviewUrl ? (
                              <img
                                src={item.garmentPreviewUrl}
                                alt={historyCopy.garmentLabel}
                                style={previewThumbStyle}
                              />
                            ) : (
                              <div style={{ ...previewThumbStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-sub)', textAlign: 'center', padding: 12 }}>
                                {getGarmentLabel(item)}
                              </div>
                            )}
                            <span style={{ color: 'var(--text-sub)', fontSize: 13 }}>
                              {getGarmentLabel(item)}
                            </span>
                          </div>
                        </div>
                        <div style={{ ...previewCardStyle, minHeight: isMobile ? undefined : '100%' }}>
                          <strong>{historyCopy.resultLabel}</strong>
                          <span style={{ color: 'var(--text-sub)', fontSize: 13 }}>
                            {historyCopy.resultPreview}
                          </span>
                          {isImageLoading || !isImageReady ? (
                            <div style={{ minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-sub)' }}>
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
                              minHeight: isMobile ? 280 : 520,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <img
                              alt={copy.resultPreviewAlt}
                              onLoad={finishImageLoading}
                              draggable={false}
                              src={item.imageUrl || ''}
                              style={{
                                display: 'block',
                                margin: '0 auto',
                                width: `${zoom * 100}%`,
                                maxWidth: '100%',
                                maxHeight: isMobile ? '60vh' : '72vh',
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
                          if (item.imageUrl) {
                            downloadFile(item.imageUrl, `hamdeva-image-${item.id}.${inferFileExtension(item)}`);
                          }
                        }}
                        style={{ flex: isMobile ? 1 : undefined }}
                        type="button"
                      >
                        {copy.historyDownload}
                      </button>
                      <button
                        className={isPreservedItem(item) ? 'outline-btn auth-inline-btn' : 'generate-btn auth-inline-btn'}
                        disabled={submitting || isPreservedItem(item)}
                        onClick={() => {
                          if (!canArchiveSelectedItem) {
                            alert(copy.historyArchiveLimit(maxPreserved));
                            return;
                          }
                          void handleArchive();
                        }}
                        style={{ flex: isMobile ? 1 : undefined }}
                        type="button"
                      >
                        {isPreservedItem(item) ? copy.historyArchived : copy.historyArchive}
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
              </div>
            );
          })}
        </div>
      ) : null}
    </article>
  );
};

export default CreationHistoryPanel;
