import React from 'react';
import type { User } from 'firebase/auth';
import type { BbsPostRecord, CreditLogRecord, GenerationRequestRecord, UserProfile } from '../../types/hamdeva';
import type { AdminSummary } from '../../hooks/useAdminDashboardData';
import { estimateGenerationCost } from '../../lib/costs';

interface AdminDashboardProps {
  currentUser: User | null;
  userProfile: UserProfile | null;
  isAdminUser: boolean;
  adminSummary: AdminSummary;
  adminUsers: Array<{
    id: string;
    email: string;
    credits: number;
    subscriptionPlan: string;
    role: string;
    createdAt?: unknown;
  }>;
  adminGenerationLogs: GenerationRequestRecord[];
  adminCreditLogs: CreditLogRecord[];
  adminLoading: boolean;
  appVersion: string;
  isFirebaseConfigured: boolean;
  bbsPosts: BbsPostRecord[];
  bbsSubmitting: boolean;
  copy: Record<string, any>;
  adminVideoLabels: Record<string, string>;
  onOpenAuth: () => void;
  onGoHome: () => void;
  onDeletePost: (post: BbsPostRecord) => void;
  formatTimestampLabel: (value?: any) => string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  userProfile,
  isAdminUser,
  adminSummary,
  adminUsers,
  adminGenerationLogs,
  adminCreditLogs,
  adminLoading,
  appVersion,
  isFirebaseConfigured,
  bbsPosts,
  bbsSubmitting,
  copy,
  adminVideoLabels,
  onOpenAuth,
  onGoHome,
  onDeletePost,
  formatTimestampLabel,
}) => {
  if (!currentUser) {
    return (
      <article className="page-article">
        <h2>{copy.adminTitle}</h2>
        <p>{copy.authRequired}</p>
        <button className="generate-btn auth-inline-btn" onClick={onOpenAuth} type="button">
          {copy.login}
        </button>
      </article>
    );
  }

  if (!userProfile) {
    return (
      <article className="page-article">
        <h2>{copy.adminTitle}</h2>
        <p>{copy.loadingSharedResult}</p>
      </article>
    );
  }

  if (!isAdminUser) {
    return (
      <article className="page-article">
        <h2>{copy.adminTitle}</h2>
        <p>{copy.adminAccessDenied}</p>
        <button className="outline-btn auth-inline-btn" onClick={onGoHome} type="button">
          {copy.heroCta}
        </button>
      </article>
    );
  }

  const videoLogs = adminGenerationLogs.filter((item) => item.type === 'video_generation');

  return (
    <div className="admin-layout">
      <article className="page-article">
        <h2>{copy.adminTitle}</h2>
        <p>{currentUser.email}</p>
        <p>{copy.adminSubtitle}</p>
      </article>
      <div className="management-grid admin-summary-grid">
        <article className="page-article"><h3>{copy.adminTotalUsers}</h3><p>{adminSummary.users}</p></article>
        <article className="page-article"><h3>{copy.adminTotalPosts}</h3><p>{adminSummary.posts}</p></article>
        <article className="page-article"><h3>{copy.adminTotalGenerations}</h3><p>{adminSummary.generations}</p></article>
        <article className="page-article"><h3>{copy.adminTotalSharedResults}</h3><p>{adminSummary.sharedResults}</p></article>
        <article className="page-article"><h3>{copy.adminTodayGenerations}</h3><p>{adminSummary.todayGenerations}</p></article>
        <article className="page-article"><h3>{copy.adminTodayEstimatedCost}</h3><p>{copy.formatEstimatedCostLabel(adminSummary.todayEstimatedCost)}</p></article>
        <article className="page-article"><h3>{copy.adminTotalEstimatedCost}</h3><p>{copy.formatEstimatedCostLabel(adminSummary.totalEstimatedCost)}</p></article>
        <article className="page-article"><h3>{copy.adminRecent7DaysEstimatedCost}</h3><p>{copy.formatEstimatedCostLabel(adminSummary.recent7DaysEstimatedCost)}</p></article>
        <article className="page-article"><h3>{adminVideoLabels.totalVideoCount}</h3><p>{adminSummary.totalVideoGenerations}</p></article>
        <article className="page-article"><h3>{adminVideoLabels.todayVideoCount}</h3><p>{adminSummary.todayVideoGenerations}</p></article>
        <article className="page-article"><h3>{adminVideoLabels.estimatedVideoCost}</h3><p>{copy.formatEstimatedCostLabel(adminSummary.estimatedVideoCost)}</p></article>
      </div>
      <article className="page-article">
        <h3>{copy.adminSystemSection}</h3>
        <p>{copy.siteVersionLabel}: {appVersion}</p>
        <p>{copy.siteFirebaseLabel}: {isFirebaseConfigured ? copy.siteFirebaseReady : copy.siteFirebaseBlocked}</p>
        <p>{copy.siteCreditCostLabel}: {copy.generationCost}</p>
        {adminLoading && <p>{copy.loadingSharedResult}</p>}
      </article>
      <article className="page-article">
        <h3>{copy.adminUsersSection}</h3>
        <div className="admin-table">
          <div className="admin-table-head">
            <span>{copy.emailLabel}</span>
            <span>{copy.adminJoinedAt}</span>
            <span>{copy.adminCreditsColumn}</span>
            <span>{copy.subscriptionPlanLabel}</span>
            <span>{copy.adminRole}</span>
          </div>
          {adminUsers.length > 0 ? adminUsers.map((item) => (
            <div key={item.id} className="admin-table-row">
              <span>{item.email || '-'}</span>
              <span>{formatTimestampLabel(item.createdAt)}</span>
              <span>{item.credits ?? 0}</span>
              <span>{copy.subscriptionPlanValue(item.subscriptionPlan || 'free')}</span>
              <span>{item.role || 'user'}</span>
            </div>
          )) : <p>{copy.adminNoData}</p>}
        </div>
      </article>
      <article className="page-article">
        <h3>{copy.adminBoardSection}</h3>
        <div className="admin-table">
          <div className="admin-table-head admin-board-head">
            <span>{copy.boardNicknameLabel}</span>
            <span>{copy.boardContentLabel}</span>
            <span>{copy.adminCreatedAt}</span>
            <span>{copy.boardDelete}</span>
          </div>
          {bbsPosts.length > 0 ? bbsPosts.slice(0, 20).map((post) => (
            <div key={post.id} className="admin-table-row admin-board-row">
              <span>{post.nickname || copy.boardMetaAnonymous}</span>
              <span>{post.content}</span>
              <span>{formatTimestampLabel(post.createdAt)}</span>
              <button className="bbs-icon-btn danger" disabled={bbsSubmitting} onClick={() => onDeletePost(post)} title={copy.adminDeletePost} type="button">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v8h-2V9zm4 0h2v8h-2V9zM7 9h2v8H7V9z" fill="currentColor" />
                </svg>
              </button>
            </div>
          )) : <p>{copy.adminNoData}</p>}
        </div>
      </article>
      <article className="page-article">
        <h3>{copy.adminGenerationSection}</h3>
        <div className="admin-table">
          <div className="admin-table-head">
            <span>{copy.emailLabel}</span>
            <span>{copy.adminCreatedAt}</span>
            <span>{adminVideoLabels.requestType}</span>
            <span>{adminVideoLabels.subjectType}</span>
            <span>{copy.adminStatus}</span>
            <span>{copy.adminModel}</span>
            <span>{copy.adminEstimatedCost}</span>
            <span>{copy.adminResultId}</span>
          </div>
          {adminGenerationLogs.length > 0 ? adminGenerationLogs.map((item) => (
            <div key={item.id} className="admin-table-row">
              <span>{item.email || item.uid}</span>
              <span>{formatTimestampLabel(item.createdAt)}</span>
              <span>{item.type || 'image_generation'}</span>
              <span>{item.subjectType || '-'}</span>
              <span>{item.status || (item.success ? 'completed' : 'unknown')}{item.refunded ? ' / refunded' : ''}</span>
              <span>{item.model || '-'}</span>
              <span>{copy.formatEstimatedCostLabel(estimateGenerationCost(item))}</span>
              <span>{item.requestId}</span>
            </div>
          )) : <p>{copy.adminNoData}</p>}
        </div>
      </article>
      <article className="page-article">
        <h3>{adminVideoLabels.recentVideos}</h3>
        <div className="admin-table">
          <div className="admin-table-head">
            <span>{copy.emailLabel}</span>
            <span>{copy.adminCreatedAt}</span>
            <span>{adminVideoLabels.subjectType}</span>
            <span>{copy.adminStatus}</span>
            <span>{copy.adminEstimatedCost}</span>
            <span>{copy.adminResultId}</span>
          </div>
          {videoLogs.length > 0 ? videoLogs.map((item) => (
            <div key={item.id} className="admin-table-row">
              <span>{item.email || item.uid}</span>
              <span>{formatTimestampLabel(item.createdAt)}</span>
              <span>{item.subjectType || '-'}</span>
              <span>{item.status || (item.success ? 'completed' : 'unknown')}</span>
              <span>{copy.formatEstimatedCostLabel(estimateGenerationCost(item))}</span>
              <span>{item.requestId}</span>
            </div>
          )) : <p>{copy.adminNoData}</p>}
        </div>
      </article>
      <article className="page-article">
        <h3>{copy.adminCreditsSection}</h3>
        <div className="admin-table">
          <div className="admin-table-head">
            <span>{copy.emailLabel}</span>
            <span>{copy.adminStatus}</span>
            <span>{copy.adminCreditsColumn}</span>
            <span>{copy.adminCreatedAt}</span>
          </div>
          {adminCreditLogs.length > 0 ? adminCreditLogs.map((item) => (
            <div key={item.id} className="admin-table-row">
              <span>{item.email || item.uid}</span>
              <span>{item.type}</span>
              <span>{item.amount}</span>
              <span>{formatTimestampLabel(item.createdAt)}</span>
            </div>
          )) : <p>{copy.adminNoData}</p>}
        </div>
      </article>
    </div>
  );
};

export default AdminDashboard;
