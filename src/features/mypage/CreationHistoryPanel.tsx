import React, { useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import { archiveCreation, deleteCreation, getCreations } from '../../lib/api/hamdeva';
import type { UserCreationRecord } from '../../types/hamdeva';

type FilterType = 'all' | 'image' | 'video';

interface CreationHistoryPanelProps {
  currentUser: User | null;
}

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

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(16, 10, 6, 0.72)',
  zIndex: 1200,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
};

const panelStyle: React.CSSProperties = {
  width: 'min(960px, 100%)',
  maxHeight: '90vh',
  overflow: 'hidden',
  background: 'var(--surface)',
  borderRadius: '20px',
  border: '1px solid var(--border)',
  boxShadow: 'var(--shadow-lg)',
  display: 'flex',
  flexDirection: 'column',
};

const contentScrollStyle: React.CSSProperties = {
  overflow: 'auto',
  padding: '20px',
};

const CreationHistoryPanel: React.FC<CreationHistoryPanelProps> = ({ currentUser }) => {
  const [items, setItems] = useState<UserCreationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedItem, setSelectedItem] = useState<UserCreationRecord | null>(null);
  const [zoom, setZoom] = useState(1);

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

  const filteredItems = useMemo(() => (
    items.filter((item) => filter === 'all' || item.type === filter)
  ), [filter, items]);

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
      setSelectedItem(null);
      setZoom(1);
    } catch (deleteError) {
      console.error('Failed to delete creation:', deleteError);
      alert(deleteError instanceof Error ? deleteError.message : '삭제에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

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
              onClick={() => {
                setSelectedItem(item);
                setZoom(1);
              }}
              style={{ justifyContent: 'space-between', textAlign: 'left' }}
              type="button"
            >
              <span>[{formatDateTime(item.createdAt)}] {item.type.toUpperCase()}</span>
              <span>{item.isArchived ? '보관됨' : '일반'}</span>
            </button>
          ))}
        </div>
      ) : null}

      {selectedItem ? (
        <div
          onClick={() => {
            if (!submitting) {
              setSelectedItem(null);
              setZoom(1);
            }
          }}
          style={overlayStyle}
        >
          <div onClick={(event) => event.stopPropagation()} style={panelStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <strong>{selectedItem.type === 'video' ? 'VIDEO' : 'IMAGE'}</strong>
                <p style={{ marginTop: 4, color: 'var(--text-sub)' }}>{formatDateTime(selectedItem.createdAt)}</p>
              </div>
              <button className="outline-btn auth-inline-btn" disabled={submitting} onClick={() => { setSelectedItem(null); setZoom(1); }} type="button">닫기</button>
            </div>
            <div style={contentScrollStyle}>
              {selectedItem.type === 'video' ? (
                <video controls src={selectedItem.fileUrl} style={{ width: '100%', maxHeight: '68vh', background: '#000', borderRadius: 16 }} />
              ) : (
                <>
                  <div className="credit-cta-actions" style={{ marginBottom: 16 }}>
                    <button className="outline-btn auth-inline-btn" onClick={() => setZoom((prev) => Math.max(0.5, prev - 0.25))} type="button">축소</button>
                    <button className="outline-btn auth-inline-btn" onClick={() => setZoom((prev) => Math.min(3, prev + 0.25))} type="button">확대</button>
                  </div>
                  <div style={{ overflow: 'auto', maxHeight: '62vh', border: '1px solid var(--border)', borderRadius: 16, padding: 12 }}>
                    <img
                      alt="Creation preview"
                      src={selectedItem.fileUrl}
                      style={{
                        display: 'block',
                        margin: '0 auto',
                        maxWidth: '100%',
                        transform: `scale(${zoom})`,
                        transformOrigin: 'top center',
                      }}
                    />
                  </div>
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
              <button
                className="outline-btn auth-inline-btn"
                disabled={submitting}
                onClick={() => downloadFile(selectedItem.fileUrl, `hamdeva-${selectedItem.type}-${selectedItem.id}`)}
                type="button"
              >
                다운로드
              </button>
              <button className="outline-btn auth-inline-btn danger" disabled={submitting} onClick={() => { void handleDelete(); }} type="button">
                삭제
              </button>
              <button className="generate-btn auth-inline-btn" disabled={submitting || selectedItem.isArchived} onClick={() => { void handleArchive(); }} type="button">
                {selectedItem.isArchived ? '보관됨' : '보관'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
};

export default CreationHistoryPanel;
