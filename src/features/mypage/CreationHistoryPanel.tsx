import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { GenerationRecord } from '../../types/hamdeva';

interface CreationHistoryPanelProps {
  items: GenerationRecord[];
  preservedCount: number;
  maxPreserved: number;
  onTogglePreserve: (item: GenerationRecord) => Promise<void> | void;
  onDelete: (item: GenerationRecord) => Promise<void> | void;
}

const MODAL_OPEN_MIN_LOADING_MS = 400;

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

const getModalShellStyle = (isMobile: boolean): React.CSSProperties => ({
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.6)',
  zIndex: 2000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: isMobile ? 0 : 24,
});

const getModalPanelStyle = (isMobile: boolean): React.CSSProperties => ({
  width: isMobile ? '100%' : 'min(1280px, calc((100vh - 48px) * 1.7778), calc(100vw - 48px))',
  height: isMobile ? '100%' : 'min(720px, calc((100vw - 48px) * 0.5625), calc(100vh - 48px))',
  maxHeight: isMobile ? '100vh' : 'calc(100vh - 48px)',
  overflow: 'hidden',
  background: 'var(--surface)',
  borderRadius: isMobile ? 0 : 20,
  border: isMobile ? 'none' : '1px solid var(--border)',
  boxShadow: isMobile ? 'none' : 'var(--shadow-lg)',
  display: 'flex',
  flexDirection: 'column',
});

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
  const [modalLoading, setModalLoading] = useState(false);
  const [isContentLoaded, setIsContentLoaded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const loadingStartRef = useRef(0);

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

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) {
        event.preventDefault();
        setSelectedItem(null);
        return;
      }

      if (event.key !== 'Tab' || !modalRef.current) {
        return;
      }

      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );

      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedItem, submitting]);

  const filteredItems = useMemo(() => (
    [...items]
      .filter((item) => Boolean(item.imageUrl))
      .sort((a, b) => (getTimestampMillis(b.createdAt) ?? 0) - (getTimestampMillis(a.createdAt) ?? 0))
  ), [items]);

  const hasVisibleItems = filteredItems.length > 0;
  const canArchiveSelectedItem = Boolean(selectedItem && !isPreservedItem(selectedItem) && preservedCount < maxPreserved);

  const closeModal = () => {
    if (submitting) {
      return;
    }

    setSelectedItem(null);
    setModalLoading(false);
    setIsContentLoaded(false);
    setZoom(1);
  };

  const startModalLoading = () => {
    loadingStartRef.current = Date.now();
    setModalLoading(true);
    setIsContentLoaded(false);
  };

  const finishModalLoading = () => {
    const elapsed = Date.now() - loadingStartRef.current;
    const remaining = Math.max(0, MODAL_OPEN_MIN_LOADING_MS - elapsed);

    window.setTimeout(() => {
      setIsContentLoaded(true);
      setModalLoading(false);
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
      closeModal();
    } catch (deleteError) {
      console.error('Failed to delete creation:', deleteError);
      alert(deleteError instanceof Error ? deleteError.message : '삭제에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenItem = (item: GenerationRecord) => {
    setSelectedItem(item);
    setZoom(1);
    startModalLoading();
  };

  const modalHeaderText = selectedItem ? `[${formatDateTime(selectedItem.createdAt)}] IMAGE${isPreservedItem(selectedItem) ? ' (보관)' : ''}` : '';

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
          {filteredItems.map((item) => (
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
              }}
              type="button"
            >
              <span style={{ display: 'grid', gap: 4 }}>
                <strong>[{formatDateTime(item.createdAt)}] IMAGE{isPreservedItem(item) ? ' (보관)' : ''}</strong>
                <span style={{ color: 'var(--text-sub)', fontSize: 13 }}>클릭하여 팝업으로 보기</span>
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {selectedItem ? (
        <div
          aria-modal="true"
          role="dialog"
          onClick={() => closeModal()}
          style={getModalShellStyle(isMobile)}
        >
          <div
            ref={modalRef}
            onClick={(event) => event.stopPropagation()}
            style={getModalPanelStyle(isMobile)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <div style={{ minWidth: 0 }}>
                <strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{modalHeaderText}</strong>
                <p style={{ marginTop: 4, color: 'var(--text-sub)' }}>만료일: {formatDateTime(selectedItem.expiresAt)}</p>
              </div>
              <button ref={closeButtonRef} className="outline-btn auth-inline-btn" disabled={submitting} onClick={closeModal} type="button">닫기</button>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 8,
                justifyContent: 'flex-end',
                padding: '12px 20px 0',
                flexShrink: 0,
              }}
            >
              <button
                className="outline-btn auth-inline-btn"
                disabled={zoom <= 0.75}
                onClick={() => setZoom((prev) => Math.max(0.75, Number((prev - 0.25).toFixed(2))))}
                type="button"
              >
                -
              </button>
              <button
                className="outline-btn auth-inline-btn"
                disabled={zoom === 1}
                onClick={() => setZoom(1)}
                type="button"
              >
                원본 맞춤
              </button>
              <button
                className="outline-btn auth-inline-btn"
                disabled={zoom >= 3}
                onClick={() => setZoom((prev) => Math.min(3, Number((prev + 0.25).toFixed(2))))}
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
                flex: 1,
                overflow: 'auto',
                padding: isMobile ? 16 : 20,
                position: 'relative',
                touchAction: 'pan-x pan-y pinch-zoom',
              }}
            >
              {modalLoading || !isContentLoaded ? (
                <div style={{ minHeight: isMobile ? '50vh' : '55vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-sub)' }}>
                  Loading...
                </div>
              ) : null}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: isMobile ? '50vh' : '55vh' }}>
                <div
                  style={{
                    overflow: 'auto',
                    width: '100%',
                    maxHeight: isMobile ? '62vh' : '68vh',
                    border: '1px solid var(--border)',
                    borderRadius: 16,
                    padding: 12,
                    background: 'rgba(255,255,255,0.35)',
                    visibility: modalLoading ? 'hidden' : 'visible',
                  }}
                >
                  <img
                    alt="Creation preview"
                    onLoad={finishModalLoading}
                    draggable={false}
                    src={selectedItem.imageUrl || ''}
                    style={{
                      display: 'block',
                      margin: '0 auto',
                      width: `${zoom * 100}%`,
                      maxWidth: 'none',
                      height: 'auto',
                      userSelect: 'none',
                    }}
                  />
                </div>
              </div>

              {!modalLoading ? (
                <div style={{ marginTop: 12, color: 'var(--text-sub)', fontSize: 13 }}>
                  확대 버튼으로 배율을 바꾸고, 화면은 일반 스크롤로 이동할 수 있습니다.
                </div>
              ) : null}
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: isMobile ? 'stretch' : 'flex-end', padding: '16px 20px', borderTop: '1px solid var(--border)', flexShrink: 0, position: 'sticky', bottom: 0, background: 'var(--surface)' }}>
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
                삭제
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
};

export default CreationHistoryPanel;
