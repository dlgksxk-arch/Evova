import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import { archiveCreation, deleteCreation, getCreations } from '../../lib/api/hamdeva';
import type { UserCreationRecord } from '../../types/hamdeva';

type FilterType = 'all' | 'image' | 'video';

interface CreationHistoryPanelProps {
  currentUser: User | null;
}

const MODAL_OPEN_MIN_LOADING_MS = 400;
const MAX_ARCHIVED_CREATIONS = 5;

const formatDateTime = (value?: number | null): string => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '-';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value)).replace(/\.\s/g, '-').replace('.', '').trim();
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

const inferFileExtension = (item: UserCreationRecord): string => {
  if (item.type === 'video') {
    return 'mp4';
  }

  const match = item.fileUrl.match(/\.([a-z0-9]+)(?:\?|$)/i);
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
  width: isMobile ? '100%' : 'min(960px, 100%)',
  height: isMobile ? '100%' : 'min(90vh, 100%)',
  maxHeight: isMobile ? '100vh' : '90vh',
  overflow: 'hidden',
  background: 'var(--surface)',
  borderRadius: isMobile ? 0 : 20,
  border: isMobile ? 'none' : '1px solid var(--border)',
  boxShadow: isMobile ? 'none' : 'var(--shadow-lg)',
  display: 'flex',
  flexDirection: 'column',
});

const CreationHistoryPanel: React.FC<CreationHistoryPanelProps> = ({ currentUser }) => {
  const [items, setItems] = useState<UserCreationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedItem, setSelectedItem] = useState<UserCreationRecord | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const [modalLoading, setModalLoading] = useState(false);
  const [isContentLoaded, setIsContentLoaded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const dragStateRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const loadingStartRef = useRef(0);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setItems([]);
      setSelectedItem(null);
      setError(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const authToken = await currentUser.getIdToken();
        const creations = await getCreations(authToken);
        if (!cancelled) {
          setItems(creations);
        }
      } catch (loadError) {
        if (!cancelled) {
          console.error('Failed to load creations:', loadError);
          setError(loadError instanceof Error ? loadError.message : '생성 이력을 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [currentUser]);

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

  useEffect(() => {
    if (!dragging) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState) {
        return;
      }

      setPosition({
        x: dragState.originX + (event.clientX - dragState.startX),
        y: dragState.originY + (event.clientY - dragState.startY),
      });
    };

    const handlePointerUp = () => {
      dragStateRef.current = null;
      setDragging(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragging]);

  const filteredItems = useMemo(() => (
    [...items]
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
      .filter((item) => filter === 'all' || item.type === filter)
  ), [filter, items]);

  const archivedCount = useMemo(() => (
    items.filter((item) => item.isArchived).length
  ), [items]);

  const canArchiveSelectedItem = Boolean(selectedItem && !selectedItem.isArchived && archivedCount < MAX_ARCHIVED_CREATIONS);

  const closeModal = () => {
    if (submitting) {
      return;
    }

    if (videoRef.current) {
      videoRef.current.pause();
    }

    setSelectedItem(null);
    setModalLoading(false);
    setIsContentLoaded(false);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setDragging(false);
    setIsVideoPlaying(false);
  };

  const startModalLoading = () => {
    loadingStartRef.current = Date.now();
    setModalLoading(true);
    setIsContentLoaded(false);
    setIsVideoPlaying(false);
  };

  const finishModalLoading = () => {
    const elapsed = Date.now() - loadingStartRef.current;
    const remaining = Math.max(0, MODAL_OPEN_MIN_LOADING_MS - elapsed);

    window.setTimeout(() => {
      setIsContentLoaded(true);
      setModalLoading(false);
    }, remaining);
  };

  const refreshItems = async () => {
    if (!currentUser) {
      return;
    }

    const authToken = await currentUser.getIdToken();
    const creations = await getCreations(authToken);
    setItems(creations);
    setSelectedItem((prev) => creations.find((item) => item.id === prev?.id) ?? null);
  };

  const handleArchive = async () => {
    if (!currentUser || !selectedItem || selectedItem.isArchived) {
      return;
    }

    if (archivedCount >= MAX_ARCHIVED_CREATIONS) {
      alert('보관은 최대 5개까지 가능합니다');
      return;
    }

    setSubmitting(true);
    try {
      const authToken = await currentUser.getIdToken();
      await archiveCreation(authToken, selectedItem.id);
      await refreshItems();
    } catch (archiveError) {
      console.error('Failed to archive creation:', archiveError);
      alert(archiveError instanceof Error ? archiveError.message : '보관 처리에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!currentUser || !selectedItem) {
      return;
    }

    setSubmitting(true);
    try {
      const authToken = await currentUser.getIdToken();
      await deleteCreation(authToken, selectedItem.id);
      await refreshItems();
      closeModal();
    } catch (deleteError) {
      console.error('Failed to delete creation:', deleteError);
      alert(deleteError instanceof Error ? deleteError.message : '삭제에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    setZoom((prev) => {
      const next = prev + (event.deltaY < 0 ? 0.15 : -0.15);
      return Math.min(4, Math.max(0.6, next));
    });
  };

  const handleImagePointerDown = (event: React.PointerEvent<HTMLImageElement>) => {
    if (selectedItem?.type !== 'image') {
      return;
    }

    dragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
    };
    setDragging(true);
  };

  const handleOpenItem = (item: UserCreationRecord) => {
    setSelectedItem(item);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    startModalLoading();
  };

  const modalHeaderText = selectedItem ? `[${formatDateTime(selectedItem.createdAt)}] ${selectedItem.type.toUpperCase()}${selectedItem.isArchived ? ' (보관)' : ''}` : '';

  return (
    <article className="page-article">
      <h3>생성 히스토리</h3>
      <p className="history-guide-copy">생성물은 기본 15일 보관되며, 최대 5개까지 30일 보관할 수 있습니다.</p>
      <div className="credit-cta-actions" style={{ marginTop: 12, marginBottom: 12 }}>
        <button className={`outline-btn auth-inline-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')} type="button">전체</button>
        <button className={`outline-btn auth-inline-btn ${filter === 'image' ? 'active' : ''}`} onClick={() => setFilter('image')} type="button">이미지</button>
        <button className={`outline-btn auth-inline-btn ${filter === 'video' ? 'active' : ''}`} onClick={() => setFilter('video')} type="button">영상</button>
      </div>
      {loading ? <p>생성 이력을 불러오는 중입니다.</p> : null}
      {error ? <p>{error}</p> : null}
      {!loading && !error && filteredItems.length === 0 ? <p>생성 이력이 없습니다.</p> : null}
      {!loading && !error && filteredItems.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
                background: hoveredItemId === item.id ? 'var(--upload-hover-bg)' : 'transparent',
                transition: 'background-color 0.2s ease, opacity 0.2s ease',
                opacity: hoveredItemId === item.id ? 1 : 0.96,
              }}
              type="button"
            >
              <span>[{formatDateTime(item.createdAt)}] {item.type.toUpperCase()}{item.isArchived ? ' (보관)' : ''}</span>
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
                <p style={{ marginTop: 4, color: 'var(--text-sub)' }}>만료일: {formatDateTime(selectedItem.expireAt)}</p>
              </div>
              <button ref={closeButtonRef} className="outline-btn auth-inline-btn" disabled={submitting} onClick={closeModal} type="button">닫기</button>
            </div>

            <div
              onWheel={selectedItem.type === 'image' ? handleImageWheel : undefined}
              style={{
                flex: 1,
                overflow: 'auto',
                padding: isMobile ? 16 : 20,
                position: 'relative',
                touchAction: selectedItem.type === 'image' ? 'pinch-zoom' : 'auto',
              }}
            >
              {modalLoading || !isContentLoaded ? (
                <div style={{ minHeight: isMobile ? '50vh' : '55vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-sub)' }}>
                  Loading...
                </div>
              ) : null}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: isMobile ? '50vh' : '55vh' }}>
                {selectedItem.type === 'video' ? (
                  <div style={{ position: 'relative', width: '100%', visibility: modalLoading ? 'hidden' : 'visible' }}>
                    <video
                      ref={videoRef}
                      controls
                      onLoadedData={finishModalLoading}
                      onPause={() => setIsVideoPlaying(false)}
                      onPlay={() => setIsVideoPlaying(true)}
                      preload="metadata"
                      src={selectedItem.fileUrl}
                      style={{ width: '100%', maxHeight: isMobile ? '62vh' : '68vh', background: '#000', borderRadius: 16 }}
                    />
                    {!isVideoPlaying ? (
                      <button
                        aria-label="Play video"
                        onClick={() => {
                          const video = videoRef.current;
                          if (!video) {
                            return;
                          }
                          void video.play();
                        }}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'transparent',
                          border: 'none',
                          color: '#fff',
                          fontSize: 54,
                        }}
                        type="button"
                      >
                        ▶
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <div style={{ overflow: 'auto', maxWidth: '100%', maxHeight: isMobile ? '62vh' : '68vh', border: '1px solid var(--border)', borderRadius: 16, padding: 12, cursor: dragging ? 'grabbing' : 'grab', visibility: modalLoading ? 'hidden' : 'visible' }}>
                    <img
                      alt="Creation preview"
                      onLoad={finishModalLoading}
                      onPointerDown={handleImagePointerDown}
                      draggable={false}
                      src={selectedItem.fileUrl}
                      style={{
                        display: 'block',
                        margin: '0 auto',
                        maxWidth: '100%',
                        maxHeight: isMobile ? '56vh' : '64vh',
                        transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                        transformOrigin: 'center center',
                        userSelect: 'none',
                      }}
                    />
                  </div>
                )}
              </div>

              {selectedItem.type === 'image' && !modalLoading ? (
                <div style={{ marginTop: 12, color: 'var(--text-sub)', fontSize: 13 }}>
                  마우스 휠로 확대/축소, 드래그로 이동할 수 있습니다.
                </div>
              ) : null}
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: isMobile ? 'stretch' : 'flex-end', padding: '16px 20px', borderTop: '1px solid var(--border)', flexShrink: 0, position: 'sticky', bottom: 0, background: 'var(--surface)' }}>
              <button
                className="outline-btn auth-inline-btn"
                disabled={submitting}
                onClick={() => downloadFile(selectedItem.fileUrl, `hamdeva-${selectedItem.type}-${selectedItem.id}.${inferFileExtension(selectedItem)}`)}
                style={{ flex: isMobile ? 1 : undefined }}
                type="button"
              >
                다운로드
              </button>
              <button
                className={selectedItem.isArchived ? 'outline-btn auth-inline-btn' : 'generate-btn auth-inline-btn'}
                disabled={submitting || selectedItem.isArchived}
                onClick={() => {
                  if (!canArchiveSelectedItem) {
                    alert('보관은 최대 5개까지 가능합니다');
                    return;
                  }
                  void handleArchive();
                }}
                style={{ flex: isMobile ? 1 : undefined }}
                type="button"
              >
                {selectedItem.isArchived ? '보관됨' : '보관'}
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
