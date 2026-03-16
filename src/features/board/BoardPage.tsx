import React from 'react';
import type { BbsPostRecord } from '../../types/hamdeva';

interface BoardPageProps {
  pageTitle: string;
  pageDescription: string;
  posts: BbsPostRecord[];
  form: {
    nickname: string;
    content: string;
    tempPassword: string;
  };
  status: string | null;
  submitting: boolean;
  editingPostId: string | null;
  copy: Record<string, any>;
  onFormChange: (next: { nickname: string; content: string; tempPassword: string }) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onResetEdit: () => void;
  onEditStart: (post: BbsPostRecord) => void;
  onDelete: (post: BbsPostRecord) => void;
  formatTimestampLabel: (value?: BbsPostRecord['createdAt'] | null) => string;
}

const BoardPage: React.FC<BoardPageProps> = ({
  pageTitle,
  pageDescription,
  posts,
  form,
  status,
  submitting,
  editingPostId,
  copy,
  onFormChange,
  onSubmit,
  onResetEdit,
  onEditStart,
  onDelete,
  formatTimestampLabel,
}) => (
  <div className="bbs-layout">
    <article className="page-article">
      <h2>{pageTitle}</h2>
      <p>{pageDescription}</p>
      <form className="suggestion-form bbs-form" onSubmit={onSubmit}>
        <label>
          {copy.boardNicknameLabel}
          <input
            placeholder={copy.boardNicknamePlaceholder}
            type="text"
            value={form.nickname}
            onChange={(event) => onFormChange({ ...form, nickname: event.target.value })}
          />
        </label>
        <label>
          {copy.boardContentLabel}
          <textarea
            placeholder={copy.boardContentPlaceholder}
            rows={5}
            value={form.content}
            onChange={(event) => onFormChange({ ...form, content: event.target.value })}
          />
        </label>
        <label>
          {copy.boardTempPasswordLabel}
          <input
            placeholder={copy.boardTempPasswordPlaceholder}
            type="password"
            value={form.tempPassword}
            onChange={(event) => onFormChange({ ...form, tempPassword: event.target.value })}
          />
        </label>
        <div className="bbs-form-footer">
          <button className="generate-btn suggestion-submit-btn" disabled={submitting} type="submit">
            {submitting ? copy.boardSubmitting : editingPostId ? copy.boardUpdate : copy.boardSubmit}
          </button>
          {editingPostId && (
            <button className="outline-btn auth-inline-btn" onClick={onResetEdit} type="button">
              {copy.boardCancelEdit}
            </button>
          )}
          {status && <p className="suggestion-status">{status}</p>}
        </div>
      </form>
    </article>

    <div className="bbs-post-list">
      {posts.length > 0 ? posts.map((post) => (
        <article key={post.id} className="page-article bbs-post-card">
          <div className="bbs-post-header">
            <div className="bbs-post-meta">
              <strong>{post.nickname || copy.boardMetaAnonymous}</strong>
              {post.createdAt && <span>{formatTimestampLabel(post.updatedAt || post.createdAt)}</span>}
            </div>
            <div className="bbs-post-actions">
              <button className="bbs-icon-btn" onClick={() => onEditStart(post)} title={copy.boardEdit} type="button">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 20h4l10-10-4-4L4 16v4zm12.7-12.3 1.6-1.6a1 1 0 0 1 1.4 0l1.3 1.3a1 1 0 0 1 0 1.4L19.4 10l-2.7-2.3z" fill="currentColor" />
                </svg>
              </button>
              <button className="bbs-icon-btn danger" disabled={submitting} onClick={() => onDelete(post)} title={copy.boardDelete} type="button">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v8h-2V9zm4 0h2v8h-2V9zM7 9h2v8H7V9z" fill="currentColor" />
                </svg>
              </button>
            </div>
          </div>
          <p>{post.content}</p>
        </article>
      )) : (
        <article className="page-article">
          <p>{copy.boardEmpty}</p>
        </article>
      )}
    </div>
  </div>
);

export default BoardPage;
