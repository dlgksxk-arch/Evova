import React from 'react';
import type { BbsPostRecord, BoardNoticeRecord } from '../../types/hamdeva';

interface BoardPageProps {
  pageTitle: string;
  pageDescription: string;
  notices: BoardNoticeRecord[];
  posts: BbsPostRecord[];
  form: {
    nickname: string;
    content: string;
    tempPassword: string;
  };
  noticeForm: {
    title: string;
    content: string;
  };
  status: string | null;
  noticeStatus: string | null;
  submitting: boolean;
  noticeSubmitting: boolean;
  editingPostId: string | null;
  isAdminUser: boolean;
  copy: Record<string, any>;
  onFormChange: (next: { nickname: string; content: string; tempPassword: string }) => void;
  onNoticeFormChange: (next: { title: string; content: string }) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onNoticeSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onResetEdit: () => void;
  onEditStart: (post: BbsPostRecord) => void;
  onDelete: (post: BbsPostRecord) => void;
  onDeleteNotice: (notice: BoardNoticeRecord) => void;
  formatTimestampLabel: (value?: BbsPostRecord['createdAt'] | null) => string;
}

const BoardPage: React.FC<BoardPageProps> = ({
  pageTitle,
  pageDescription,
  notices,
  posts,
  form,
  noticeForm,
  status,
  noticeStatus,
  submitting,
  noticeSubmitting,
  editingPostId,
  isAdminUser,
  copy,
  onFormChange,
  onNoticeFormChange,
  onSubmit,
  onNoticeSubmit,
  onResetEdit,
  onEditStart,
  onDelete,
  onDeleteNotice,
  formatTimestampLabel,
}) => (
  <div className="bbs-layout">
    <article className="page-article board-notice-section">
      <div className="board-notice-header">
        <div>
          <h2>{copy.boardNoticeTitle}</h2>
          <p>{copy.boardNoticeDescription}</p>
        </div>
        <span className="board-notice-count">{notices.length}</span>
      </div>

      {isAdminUser ? (
        <form className="suggestion-form bbs-form board-notice-form" onSubmit={onNoticeSubmit}>
          <label>
            {copy.boardNoticeFormTitle}
            <input
              placeholder={copy.boardNoticeTitlePlaceholder}
              type="text"
              value={noticeForm.title}
              onChange={(event) => onNoticeFormChange({ ...noticeForm, title: event.target.value })}
            />
          </label>
          <label>
            {copy.boardNoticeFormContent}
            <textarea
              placeholder={copy.boardNoticeContentPlaceholder}
              rows={4}
              value={noticeForm.content}
              onChange={(event) => onNoticeFormChange({ ...noticeForm, content: event.target.value })}
            />
          </label>
          <div className="bbs-form-footer">
            <button className="generate-btn suggestion-submit-btn" disabled={noticeSubmitting} type="submit">
              {noticeSubmitting ? copy.boardNoticeSubmitting : copy.boardNoticeSubmit}
            </button>
            {noticeStatus && <p className="suggestion-status">{noticeStatus}</p>}
          </div>
        </form>
      ) : null}

      <div className="board-notice-list">
        {notices.length > 0 ? notices.map((notice) => (
          <article key={notice.id} className="board-notice-card">
            <div className="bbs-post-header">
              <div className="bbs-post-meta">
                <strong>{notice.title}</strong>
                {notice.createdAt && <span>{formatTimestampLabel(notice.updatedAt || notice.createdAt)}</span>}
              </div>
              {isAdminUser ? (
                <div className="bbs-post-actions">
                  <button className="bbs-icon-btn danger" disabled={noticeSubmitting} onClick={() => onDeleteNotice(notice)} title={copy.boardDelete} type="button">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v8h-2V9zm4 0h2v8h-2V9zM7 9h2v8H7V9z" fill="currentColor" />
                    </svg>
                  </button>
                </div>
              ) : null}
            </div>
            <p>{notice.content}</p>
          </article>
        )) : (
          <article className="board-notice-card">
            <p>{copy.boardNoticeEmpty}</p>
          </article>
        )}
      </div>
    </article>

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
