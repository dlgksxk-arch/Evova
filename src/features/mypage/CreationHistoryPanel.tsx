import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { GenerationRecord } from '../../types/hamdeva';

interface CreationHistoryPanelProps {
  items: GenerationRecord[];
  preservedCount: number;
  maxPreserved: number;
  onTogglePreserve: (item: GenerationRecord) => Promise<void> | void;
  onDelete: (item: GenerationRecord) => Promise<void> | void;
}

const IMAGE_LOAD_MIN_MS = 400;

const getTimestampMillis = (value: unknown): number | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }
  if ('toMillis' in value && typeof (value as { toMillis?: unknown }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis();
  }
  return null;
};

const formatDateTime = (value: unknown): string => {
  const millis = getTimestampMillis(value);
  if (typeof millis !== 'number' || !Number.isFinite(millis)) {
    return '-';
  }

  return new Intl.DateTimeFormat('ko-KR', {
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

const CreationHistoryPanel: React.FC<CreationHistoryPanelProps> = ({
  items,
  preservedCount,
  maxPreserved,
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
      alert(`보관은 최대 ${maxPreserved}개까지 가능합니다`);
      return;
    }

    setSubmitting(true);
    try {
      await onTogglePreserve(selectedItem);
    } catch (archiveError) {
      console.error('Failed to archive creation:', archiveError);
      alert(archiveError instanceof Error ? archiveError.message : '보관 처리에 실패했습니다.');
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
      alert(deleteError instanceof Error ? deleteError.message : '삭제에 실패했습니다.');
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

  const selectedHeaderText = selectedItem ? `[${formatDateTime(selectedItem.createdAt)}] IMAGE${isPreservedItem(selectedItem) ? ' (보관)' : ''}` : '';

  return (
    <article className="page-article">
      <h3>생성 히스토리</h3>
      <p className="history-guide-copy">생성물은 기본 15일 보관되며, 최대 5개까지 30일 보관할 수 있습니다.</p>
      {!hasVisibleItems ? <p>생성 이력이 없습니다.</p> : null}
      {hasVisibleItems ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 8,
            maxHeight: 304,
            overflowY: 'auto',
            paddingRight: 4,
          }}
        >
          {visibleItems.map((item) => (
            <button
              key={item.id}
              className="outline-btn auth-inline-btn"
              onClick={() => handleOpenItem(item)}
              onMouseEnter={() => setHoveredItemId(item.id)}
              onMouseLeave={() => setHoveredItemId((prev) => prev === item.id ? null : prev)}
              style={{
                width: '100%',
                justifyContent: 'flex-start',
                textAlign: 'left',
                padding: '14px 16px',
                minHeight: 70,
                background: hoveredItemId === item.id ? 'var(--upload-hover-bg)' : 'transparent',
                transition: 'background-color 0.2s ease, opacity 0.2s ease',
                opacity: hoveredItemId === item.id ? 1 : 0.96,
                borderColor: selectedItem?.id === item.id ? 'var(--primary)' : undefined,
              }}
              type="button"
            >
              <span style={{ display: 'grid', gap: 4 }}>
                <strong>[{formatDateTime(item.createdAt)}] IMAGE{isPreservedItem(item) ? ' (보관)' : ''}</strong>
                <span style={{ color: 'var(--text-sub)', fontSize: 13 }}>
                  {selectedItem?.id === item.id ? '클릭하여 닫기' : '클릭하여 아래에서 보기'}
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {selectedItem ? (
        <div
          ref={selectedPanelRef}
          style={{
            marginTop: 16,
            border: '1px solid var(--border)',
            borderRadius: 20,
            background: 'color-mix(in srgb, var(--surface) 96%, transparent)',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0 }}>
              <strong style={{ display: 'block' }}>{selectedHeaderText}</strong>
              <p style={{ marginTop: 4, color: 'var(--text-sub)' }}>만료일: {formatDateTime(selectedItem.expiresAt)}</p>
            </div>
            <button className="outline-btn auth-inline-btn" disabled={submitting} onClick={resetExpandedPanel} type="button">닫기</button>
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
              -
            </button>
            <button
              className="outline-btn auth-inline-btn"
              disabled={zoom === 0.5}
              onClick={() => setZoom(0.5)}
              type="button"
            >
              기본 크기
            </button>
            <button
              className="outline-btn auth-inline-btn"
              disabled={zoom >= 1.5}
              onClick={() => setZoom((prev) => Math.min(1.5, Number((prev + 0.25).toFixed(2))))}
              type="button"
            >
              +
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
            {isImageLoading || !isImageReady ? (
              <div style={{ minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-sub)' }}>
                Loading...
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
              }}
            >
              <img
                alt="Creation preview"
                onLoad={finishImageLoading}
                draggable={false}
                src={selectedItem.imageUrl || ''}
                style={{
                  display: 'block',
                  margin: '0 auto',
                  width: `${zoom * 100}%`,
                  maxWidth: '100%',
                  height: 'auto',
                  userSelect: 'none',
                  visibility: isImageLoading ? 'hidden' : 'visible',
                }}
              />
            </div>

            {!isImageLoading ? (
              <div style={{ marginTop: 12, color: 'var(--text-sub)', fontSize: 13 }}>
                이미지 전체가 보이도록 기본 크기를 절반으로 줄였습니다. 필요하면 + / - 버튼으로만 조절할 수 있습니다.
              </div>
            ) : null}
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
              다운로드
            </button>
            <button
              className={isPreservedItem(selectedItem) ? 'outline-btn auth-inline-btn' : 'generate-btn auth-inline-btn'}
              disabled={submitting || isPreservedItem(selectedItem)}
              onClick={() => {
                if (!canArchiveSelectedItem) {
                  alert(`보관은 최대 ${maxPreserved}개까지 가능합니다`);
                  return;
                }
                void handleArchive();
              }}
              style={{ flex: isMobile ? 1 : undefined }}
              type="button"
            >
              {isPreservedItem(selectedItem) ? '보관됨' : '보관'}
            </button>
            <button
              className="outline-btn auth-inline-btn"
              disabled={submitting}
              onClick={() => { void handleDelete(); }}
              style={{ color: '#ef4444', flex: isMobile ? 1 : undefined }}
              type="button"
            >
              {submitting ? '처리 중...' : '삭제'}
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
};

export default CreationHistoryPanel;
