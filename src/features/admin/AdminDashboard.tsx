import React, { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { useAdminLogList, type AdminLogType } from '../../hooks/useAdminLogs';
import { useAdminGiftCredit, useAdminUserDetail, useAdminUserList } from '../../hooks/useAdminUserManagement';
import type {
  ActivityLogRecord,
  AdminUserDetail,
  AdminUserListItem,
  BbsPostRecord,
  BoardNoticeRecord,
  CreditLogRecord,
  GenerationRequestRecord,
  PaymentLogRecord,
  UserProfile,
} from '../../types/hamdeva';
import type { AdminSummary } from '../../hooks/useAdminDashboardData';
import { estimateGenerationCost } from '../../lib/costs';

interface AdminDashboardProps {
  currentUser: User | null;
  userProfile: UserProfile | null;
  isAdminUser: boolean;
  adminSummary: AdminSummary;
  adminLoading: boolean;
  adminError?: string | null;
  onRefreshSummary: () => void;
  appVersion: string;
  isFirebaseConfigured: boolean;
  boardNotices: BoardNoticeRecord[];
  bbsPosts: BbsPostRecord[];
  bbsSubmitting: boolean;
  copy: Record<string, any>;
  onOpenAuth: () => void;
  onGoHome: () => void;
  onDeletePost: (post: BbsPostRecord) => void;
  formatTimestampLabel: (value?: any) => string;
}

const AdminModalFrame: React.FC<{
  title: string;
  subtitle?: string;
  className?: string;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ title, subtitle, className = '', onClose, children }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`auth-modal account-modal admin-modal-shell ${className}`.trim()} onClick={(event) => event.stopPropagation()}>
        <div className="modal-header account-modal-header">
          <div>
            <h3>{title}</h3>
            {subtitle ? <p className="modal-subtitle">{subtitle}</p> : null}
          </div>
          <button className="close-btn" onClick={onClose} type="button">
            &times;
          </button>
        </div>
        <div className="account-modal-body">{children}</div>
      </div>
    </div>
  );
};

const getUserDisplayName = (user?: { displayName?: string | null; nickname?: string | null } | null): string =>
  user?.displayName?.trim() || user?.nickname?.trim() || '-';

const renderDetailValue = (
  label: string,
  value: React.ReactNode,
) => (
  <div className="admin-user-detail-item">
    <dt>{label}</dt>
    <dd>{value || '-'}</dd>
  </div>
);

interface AdminUserListTableProps {
  copy: Record<string, any>;
  query: string;
  onQueryChange: (value: string) => void;
  hint: string;
  error: string | null;
  loading: boolean;
  loadingMore: boolean;
  debouncedQuery: string;
  users: AdminUserListItem[];
  selectedUserId: string | null;
  hasMore: boolean;
  formatTimestampLabel: (value?: any) => string;
  onSelectUser: (uid: string) => void;
  onShowDetails: (uid: string) => void;
  onGiftUser: (user: AdminUserListItem) => void;
  onLoadMore: () => void;
}

const AdminUserListTable: React.FC<AdminUserListTableProps> = ({
  copy,
  query,
  onQueryChange,
  hint,
  error,
  loading,
  loadingMore,
  debouncedQuery,
  users,
  selectedUserId,
  hasMore,
  formatTimestampLabel,
  onSelectUser,
  onShowDetails,
  onGiftUser,
  onLoadMore,
}) => (
  <>
    <div className="admin-user-search-sticky">
      <label className="admin-user-search-label">
        <span>{copy.adminUserSearchLabel ?? '사용자 검색'}</span>
        <input
          className="auth-input"
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={copy.adminUserSearchPlaceholder ?? 'uid / email / displayName'}
          type="text"
          value={query}
        />
      </label>
      <p className="admin-search-hint">{hint}</p>
    </div>

    {error ? <p className="admin-error-banner">{error}</p> : null}
    {loading ? <p className="admin-loading-banner">{copy.adminUserListLoading ?? '사용자 목록을 불러오는 중입니다...'}</p> : null}

    <div className="admin-user-list-table">
      <div className="admin-user-list-head">
        <span>uid</span>
        <span>{copy.emailLabel}</span>
        <span>{copy.adminDisplayName ?? '닉네임 / 이름'}</span>
        <span>{copy.adminJoinedAt}</span>
        <span>{copy.adminLastLoginAt ?? '최근 로그인'}</span>
        <span>{copy.adminCreditsColumn}</span>
        <span>{copy.adminDailyCredit ?? 'dailyCredit'}</span>
        <span>{copy.adminPaidCredit ?? 'paidCredit'}</span>
        <span>{copy.adminSubscribed ?? '구독'}</span>
        <span>{copy.subscriptionPlanLabel}</span>
        <span>{copy.adminTotalGenerated ?? '총 생성 수'}</span>
        <span>{copy.adminRole}</span>
        <span>{copy.adminActions ?? '작업'}</span>
      </div>

      {!loading && users.length === 0 ? (
        <p className="admin-empty-state">
          {debouncedQuery ? (copy.adminUserSearchEmpty ?? '검색 결과가 없습니다.') : (copy.adminNoData ?? '표시할 데이터가 없습니다.')}
        </p>
      ) : null}

      {users.map((item) => (
        <div
          key={item.uid}
          className={`admin-user-list-row ${selectedUserId === item.uid ? 'active' : ''}`}
          onClick={() => onSelectUser(item.uid)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onSelectUser(item.uid);
            }
          }}
          role="button"
          tabIndex={0}
        >
          <span>{item.uid}</span>
          <span>{item.email || '-'}</span>
          <span>{getUserDisplayName(item)}</span>
          <span>{formatTimestampLabel(item.createdAt)}</span>
          <span>{formatTimestampLabel(item.lastLoginAt)}</span>
          <span>{item.credits ?? 0}</span>
          <span>{item.dailyCredit ?? 0}</span>
          <span>{item.paidCredit ?? 0}</span>
          <span>{item.isSubscribed ? (copy.adminSubscribedYes ?? 'Y') : (copy.adminSubscribedNo ?? 'N')}</span>
          <span>{copy.subscriptionPlanValue(item.subscriptionPlan || 'free')}</span>
          <span>{item.totalGenerated ?? 0}</span>
          <span>{item.role || 'user'}</span>
          <span className="admin-user-actions">
            <button
              className="outline-btn admin-table-action-btn"
              onClick={(event) => {
                event.stopPropagation();
                onShowDetails(item.uid);
              }}
              type="button"
            >
              {copy.adminDetailButton ?? '상세보기'}
            </button>
            <button
              className="generate-btn admin-table-action-btn"
              onClick={(event) => {
                event.stopPropagation();
                onGiftUser(item);
              }}
              type="button"
            >
              {copy.adminGiftButton ?? '선물하기'}
            </button>
          </span>
        </div>
      ))}
    </div>

    {hasMore && !debouncedQuery ? (
      <div className="admin-user-list-footer">
        <button className="outline-btn auth-inline-btn" disabled={loadingMore} onClick={onLoadMore} type="button">
          {loadingMore ? (copy.adminUserListLoadingMore ?? '불러오는 중...') : (copy.adminLoadMore ?? '더 보기')}
        </button>
      </div>
    ) : null}
  </>
);

const LOG_TABS: Array<{ key: AdminLogType; label: string }> = [
  { key: 'generations', label: 'Generation Logs' },
  { key: 'credits', label: 'Credit Logs' },
  { key: 'payments', label: 'Payment Logs' },
  { key: 'activities', label: 'Activity Logs' },
];

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  userProfile,
  isAdminUser,
  adminSummary,
  adminLoading,
  adminError,
  onRefreshSummary,
  appVersion,
  isFirebaseConfigured,
  boardNotices,
  bbsPosts,
  bbsSubmitting,
  copy,
  onOpenAuth,
  onGoHome,
  onDeletePost,
  formatTimestampLabel,
}) => {
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [activeLogTab, setActiveLogTab] = useState<AdminLogType>('generations');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [giftTarget, setGiftTarget] = useState<AdminUserDetail | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<'success' | 'error' | null>(null);
  const {
    query,
    setQuery,
    users,
    loading: userListLoading,
    loadingMore,
    error: userListError,
    hasMore,
    debouncedQuery,
    loadMore,
    updateUser,
  } = useAdminUserList({
    currentUser,
    enabled: isAdminUser,
    isOpen: isUserModalOpen,
  });
  const {
    query: pageUserQuery,
    setQuery: setPageUserQuery,
    users: pageUsers,
    loading: pageUserListLoading,
    loadingMore: pageUserLoadingMore,
    error: pageUserListError,
    hasMore: pageUserHasMore,
    debouncedQuery: pageDebouncedQuery,
    loadMore: loadMorePageUsers,
    updateUser: updatePageUser,
  } = useAdminUserList({
    currentUser,
    enabled: isAdminUser,
    isOpen: isAdminUser,
  });
  const {
    userDetail,
    setUserDetail,
    loading: userDetailLoading,
    error: userDetailError,
  } = useAdminUserDetail({
    currentUser,
    enabled: isAdminUser && isUserModalOpen,
    uid: selectedUserId,
  });
  const {
    form: giftForm,
    setForm: setGiftForm,
    resetForm,
    submitGift,
    submitting: giftSubmitting,
    error: giftError,
    setError: setGiftError,
  } = useAdminGiftCredit({
    currentUser,
    enabled: isAdminUser,
  });
  const generationLogsState = useAdminLogList({
    currentUser,
    enabled: isAdminUser,
    isOpen: isLogModalOpen,
    isActive: activeLogTab === 'generations',
    type: 'generations',
  });
  const creditLogsState = useAdminLogList({
    currentUser,
    enabled: isAdminUser,
    isOpen: isLogModalOpen,
    isActive: activeLogTab === 'credits',
    type: 'credits',
  });
  const paymentLogsState = useAdminLogList({
    currentUser,
    enabled: isAdminUser,
    isOpen: isLogModalOpen,
    isActive: activeLogTab === 'payments',
    type: 'payments',
  });
  const activityLogsState = useAdminLogList({
    currentUser,
    enabled: isAdminUser,
    isOpen: isLogModalOpen,
    isActive: activeLogTab === 'activities',
    type: 'activities',
  });

  useEffect(() => {
    if (!statusMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setStatusMessage(null);
      setStatusTone(null);
    }, 4200);

    return () => window.clearTimeout(timeoutId);
  }, [statusMessage]);

  const selectedUserSummary = users.find((item) => item.uid === selectedUserId) ?? null;
  const activeDetailUser = userDetail ?? selectedUserSummary ?? giftTarget;
  const activeLogState = activeLogTab === 'generations'
    ? generationLogsState
    : activeLogTab === 'credits'
      ? creditLogsState
      : activeLogTab === 'payments'
        ? paymentLogsState
        : activityLogsState;

  const openUserModal = () => {
    setIsUserModalOpen(true);
    setStatusMessage(null);
    setStatusTone(null);
  };

  const openLogModal = (tab: AdminLogType) => {
    setActiveLogTab(tab);
    setIsLogModalOpen(true);
  };

  const closeUserModal = () => {
    setIsUserModalOpen(false);
    setSelectedUserId(null);
    setGiftTarget(null);
    setQuery('');
  };

  const closeLogModal = () => {
    setIsLogModalOpen(false);
  };

  const handleSelectUser = (uid: string) => {
    setSelectedUserId(uid);
  };

  const handleOpenUserDetailModal = (uid: string) => {
    setSelectedUserId(uid);
    openUserModal();
  };

  const handleOpenGift = (user: AdminUserDetail | null) => {
    if (!user) {
      return;
    }

    resetForm();
    setGiftError(null);
    setGiftTarget(user);
  };

  const handleGiftSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!giftTarget) {
      return;
    }

    if (!Number.isFinite(giftForm.amount) || giftForm.amount <= 0) {
      setGiftError(copy.adminGiftInvalidAmount ?? '선물 크레딧 수량은 1 이상이어야 합니다.');
      return;
    }

    try {
      const updatedUser = await submitGift(giftTarget.uid);
      updateUser(updatedUser);
      updatePageUser(updatedUser);
      if (selectedUserId === updatedUser.uid) {
        setUserDetail(updatedUser);
      }
      setGiftTarget(null);
      setStatusTone('success');
      setStatusMessage(copy.adminGiftSuccess ?? '크레딧 선물이 즉시 지급되었습니다.');
    } catch (error) {
      setStatusTone('error');
      setStatusMessage(error instanceof Error ? error.message : copy.adminGiftFailed ?? '크레딧 선물 지급에 실패했습니다.');
    }
  };

  const renderLogTableHead = () => {
    if (activeLogTab === 'generations') {
      return (
        <div className="admin-table-head">
          <span>{copy.emailLabel}</span>
          <span>{copy.adminCreatedAt}</span>
          <span>{copy.adminGenerationType}</span>
          <span>{copy.adminGenerationSubject}</span>
          <span>{copy.adminStatus}</span>
          <span>{copy.adminModel}</span>
          <span>{copy.adminEstimatedCost}</span>
          <span>{copy.adminResultId}</span>
        </div>
      );
    }

    if (activeLogTab === 'credits') {
      return (
        <div className="admin-table-head">
          <span>{copy.emailLabel}</span>
          <span>{copy.adminStatus}</span>
          <span>{copy.adminCreditsColumn}</span>
          <span>{copy.adminCreatedAt}</span>
        </div>
      );
    }

    if (activeLogTab === 'payments') {
      return (
        <div className="admin-table-head">
          <span>{copy.emailLabel}</span>
          <span>{copy.adminPaymentProvider}</span>
          <span>{copy.adminPaymentProduct}</span>
          <span>{copy.adminStatus}</span>
          <span>{copy.adminCreditsColumn}</span>
          <span>{copy.adminCreatedAt}</span>
        </div>
      );
    }

    return (
      <div className="admin-table-head">
        <span>{copy.adminActivityUserId}</span>
        <span>{copy.adminCreditsColumn}</span>
        <span>{copy.adminActivityTitle}</span>
        <span>{copy.adminActivitySender}</span>
        <span>{copy.adminCreatedAt}</span>
      </div>
    );
  };

  const renderLogRows = () => {
    if (activeLogTab === 'generations') {
      return (activeLogState.items as GenerationRequestRecord[]).map((item) => (
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
      ));
    }

    if (activeLogTab === 'credits') {
      return (activeLogState.items as CreditLogRecord[]).map((item) => (
        <div key={item.id} className="admin-table-row">
          <span>{item.email || item.uid}</span>
          <span>{item.type}</span>
          <span>{item.amount}</span>
          <span>{formatTimestampLabel(item.createdAt)}</span>
        </div>
      ));
    }

    if (activeLogTab === 'payments') {
      return (activeLogState.items as PaymentLogRecord[]).map((item) => (
        <div key={item.id} className="admin-table-row">
          <span>{item.email || item.uid || '-'}</span>
          <span>{item.provider || '-'}</span>
          <span>{item.productId || '-'}</span>
          <span>{item.status || '-'}</span>
          <span>{item.paidCredit ?? 0}</span>
          <span>{formatTimestampLabel(item.createdAt)}</span>
        </div>
      ));
    }

    return (activeLogState.items as ActivityLogRecord[]).map((item) => (
      <div key={item.id} className="admin-table-row">
        <span>{item.userId || '-'}</span>
        <span>{item.amount ?? 0}</span>
        <span>{item.title || '-'}</span>
        <span>{item.senderName || item.grantedByAdminEmail || '-'}</span>
        <span>{formatTimestampLabel(item.createdAt)}</span>
      </div>
    ));
  };

  if (!currentUser) {
    return (
      <article className="page-article">
        <h2>{copy.adminTitle}</h2>
        <p>{copy.authRequired}</p>
        <button className="generate-btn auth-inline-btn auth-disabled-btn" disabled onClick={onOpenAuth} type="button">
          {copy.loginComingSoon ?? `${copy.login} (${copy.comingSoon})`}
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

  return (
    <>
      <div className="admin-layout">
        <article className="page-article">
          <div className="admin-section-header">
            <div>
              <h2>{copy.adminTitle}</h2>
              <p>{currentUser.email}</p>
              <p>{copy.adminSubtitle}</p>
            </div>
            <button className="outline-btn auth-inline-btn" disabled={adminLoading} onClick={onRefreshSummary} type="button">
              {copy.refresh ?? 'Refresh'}
            </button>
          </div>
          {adminError ? <p className="admin-error-banner">{copy.adminSummaryLoadFailed} {adminError}</p> : null}
          {adminLoading ? <p className="admin-loading-banner">{copy.loadingSharedResult}</p> : null}
          {statusMessage ? (
            <p className={statusTone === 'success' ? 'admin-success-banner' : 'admin-error-banner'}>
              {statusMessage}
            </p>
          ) : null}
        </article>
        <div className="management-grid admin-summary-grid">
          <article className="page-article admin-stat-card"><h3>{copy.adminTotalUsers}</h3><p>{adminSummary.users}</p></article>
          <article className="page-article admin-stat-card"><h3>{copy.adminTotalPosts}</h3><p>{adminSummary.posts}</p></article>
          <article className="page-article admin-stat-card"><h3>{copy.adminTotalGenerations}</h3><p>{adminSummary.generations}</p></article>
          <article className="page-article admin-stat-card"><h3>{copy.adminTotalSharedResults}</h3><p>{adminSummary.sharedResults}</p></article>
          <article className="page-article admin-stat-card"><h3>{copy.adminTodayGenerations}</h3><p>{adminSummary.todayGenerations}</p></article>
          <article className="page-article admin-stat-card"><h3>{copy.adminTodayEstimatedCost}</h3><p>{copy.formatEstimatedCostLabel(adminSummary.todayEstimatedCost)}</p></article>
          <article className="page-article admin-stat-card"><h3>{copy.adminTotalEstimatedCost}</h3><p>{copy.formatEstimatedCostLabel(adminSummary.totalEstimatedCost)}</p></article>
          <article className="page-article admin-stat-card"><h3>{copy.adminRecent7DaysEstimatedCost}</h3><p>{copy.formatEstimatedCostLabel(adminSummary.recent7DaysEstimatedCost)}</p></article>
        </div>
        <article className="page-article">
          <h3>{copy.adminSystemSection}</h3>
          <p>{copy.siteVersionLabel}: {appVersion}</p>
          <p>{copy.siteFirebaseLabel}: {isFirebaseConfigured ? copy.siteFirebaseReady : copy.siteFirebaseBlocked}</p>
          <p>{copy.siteCreditCostLabel}: {copy.generationCost}</p>
        </article>
        <article className="page-article">
          <div className="admin-section-header">
            <div>
              <h3>{copy.adminUsersSection}</h3>
              <p className="admin-section-helper">{copy.adminUsersSectionHelper ?? '초기 진입에서는 사용자 로그를 불러오지 않고, 필요할 때만 별도 모달에서 조회합니다.'}</p>
            </div>
            <button className="outline-btn auth-inline-btn" onClick={openUserModal} type="button">
              {copy.adminOpenUserList ?? '사용자 검색 / 선물'}
            </button>
          </div>
          <div className="admin-inline-actions">
            <button className="outline-btn auth-inline-btn" onClick={() => openLogModal('generations')} type="button">
              {copy.adminGenerationSection}
            </button>
            <button className="outline-btn auth-inline-btn" onClick={() => openLogModal('credits')} type="button">
              {copy.adminCreditsSection}
            </button>
            <button className="outline-btn auth-inline-btn" onClick={() => openLogModal('payments')} type="button">
              {copy.adminPaymentsSection ?? '결제 로그'}
            </button>
            <button className="outline-btn auth-inline-btn" onClick={() => openLogModal('activities')} type="button">
              {copy.adminActivitiesSection ?? '활동 로그'}
            </button>
          </div>
        </article>
        <article className="page-article">
          <div className="admin-section-header">
            <div>
              <h3>{copy.adminMemberListSection ?? '회원 리스트'}</h3>
              <p className="admin-section-helper">{copy.adminMemberListHelper ?? '최근 사용자와 같은 형식으로 바로 조회할 수 있는 회원 리스트입니다.'}</p>
            </div>
            <button className="outline-btn auth-inline-btn" onClick={openUserModal} type="button">
              {copy.adminOpenUserList ?? '사용자 검색 / 선물'}
            </button>
          </div>
          <AdminUserListTable
            copy={copy}
            query={pageUserQuery}
            onQueryChange={setPageUserQuery}
            hint={copy.adminUserSearchHint ?? 'ID(uid), 이메일, 닉네임 또는 displayName prefix 검색을 지원합니다. 검색어가 없으면 최근 사용자 20명을 조회합니다.'}
            error={pageUserListError}
            loading={pageUserListLoading}
            loadingMore={pageUserLoadingMore}
            debouncedQuery={pageDebouncedQuery}
            users={pageUsers}
            selectedUserId={selectedUserId}
            hasMore={pageUserHasMore}
            formatTimestampLabel={formatTimestampLabel}
            onSelectUser={handleSelectUser}
            onShowDetails={handleOpenUserDetailModal}
            onGiftUser={(user) => handleOpenGift({
              ...user,
              updatedAt: null,
            } as AdminUserDetail)}
            onLoadMore={() => { void loadMorePageUsers(); }}
          />
        </article>
        <article className="page-article">
          <h3>{copy.adminBoardSection}</h3>
          <div className="admin-table">
            <div className="admin-table-head admin-board-head">
              <span>{copy.boardNoticeFormTitle}</span>
              <span>{copy.boardNoticeFormContent}</span>
              <span>{copy.adminCreatedAt}</span>
              <span>{copy.boardDelete}</span>
            </div>
            {boardNotices.length > 0 ? boardNotices.slice(0, 10).map((notice) => (
              <div key={notice.id} className="admin-table-row admin-board-row">
                <span>{notice.title}</span>
                <span>{notice.content}</span>
                <span>{formatTimestampLabel(notice.createdAt)}</span>
                <span>-</span>
              </div>
            )) : <p>{copy.boardNoticeEmpty}</p>}
          </div>
        </article>
        <article className="page-article">
          <h3>{copy.adminRecentPosts}</h3>
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
      </div>

      {isUserModalOpen ? (
        <AdminModalFrame
          title={copy.adminUserListTitle ?? '사용자 리스트'}
          subtitle={copy.adminUserListSubtitle ?? 'ID(uid), 이메일, 닉네임 또는 displayName 기준으로 필요할 때만 조회합니다.'}
          className="admin-user-modal-shell"
          onClose={closeUserModal}
        >
          <div className="admin-user-modal-layout">
            <section className="admin-user-list-panel">
              <AdminUserListTable
                copy={copy}
                query={query}
                onQueryChange={setQuery}
                hint={copy.adminUserSearchHint ?? 'ID(uid), 이메일, 닉네임 또는 displayName prefix 검색을 지원합니다. 검색어가 없으면 최근 사용자 20명을 조회합니다.'}
                error={userListError}
                loading={userListLoading}
                loadingMore={loadingMore}
                debouncedQuery={debouncedQuery}
                users={users}
                selectedUserId={selectedUserId}
                hasMore={hasMore}
                formatTimestampLabel={formatTimestampLabel}
                onSelectUser={handleSelectUser}
                onShowDetails={handleSelectUser}
                onGiftUser={(user) => handleOpenGift((userDetail && userDetail.uid === user.uid ? userDetail : {
                  ...user,
                  updatedAt: null,
                }) as AdminUserDetail)}
                onLoadMore={() => { void loadMore(); }}
              />
            </section>

            <aside className="admin-user-detail-panel">
              <div className="admin-user-detail-header">
                <div>
                  <h4>{copy.adminUserDetailTitle ?? '사용자 상세'}</h4>
                  <p>{copy.adminUserDetailHint ?? '목록 행 클릭 또는 상세보기 버튼으로 선택한 사용자 정보입니다.'}</p>
                </div>
                {activeDetailUser ? (
                  <button className="generate-btn auth-inline-btn" onClick={() => handleOpenGift(activeDetailUser as AdminUserDetail)} type="button">
                    {copy.adminGiftButton ?? '선물하기'}
                  </button>
                ) : null}
              </div>
              {userDetailError ? <p className="admin-error-banner">{userDetailError}</p> : null}
              {userDetailLoading ? <p className="admin-loading-banner">{copy.adminUserDetailLoading ?? '사용자 상세를 불러오는 중입니다...'}</p> : null}
              {!activeDetailUser && !userDetailLoading ? (
                <p className="admin-empty-state">{copy.adminUserDetailEmpty ?? '상세를 보려면 사용자를 선택하세요.'}</p>
              ) : null}
              {activeDetailUser ? (
                <dl className="admin-user-detail-grid">
                  {renderDetailValue('uid', activeDetailUser.uid)}
                  {renderDetailValue(copy.emailLabel, activeDetailUser.email || '-')}
                  {renderDetailValue(copy.adminDisplayName ?? '닉네임 / 이름', getUserDisplayName(activeDetailUser))}
                  {renderDetailValue(copy.adminRole, activeDetailUser.role || 'user')}
                  {renderDetailValue(copy.adminCreditsColumn, activeDetailUser.credits ?? 0)}
                  {renderDetailValue(copy.adminDailyCredit ?? 'dailyCredit', activeDetailUser.dailyCredit ?? 0)}
                  {renderDetailValue(copy.adminPaidCredit ?? 'paidCredit', activeDetailUser.paidCredit ?? 0)}
                  {renderDetailValue(copy.adminTotalGenerated ?? '총 생성 수', activeDetailUser.totalGenerated ?? 0)}
                  {renderDetailValue(copy.adminSubscribed ?? '구독 여부', activeDetailUser.isSubscribed ? (copy.adminSubscribedYesLabel ?? '구독 중') : (copy.adminSubscribedNoLabel ?? '미구독'))}
                  {renderDetailValue(copy.subscriptionPlanLabel, copy.subscriptionPlanValue(activeDetailUser.subscriptionPlan || 'free'))}
                  {renderDetailValue(copy.adminJoinedAt, formatTimestampLabel(activeDetailUser.createdAt))}
                  {renderDetailValue(copy.adminLastLoginAt ?? '최근 로그인', formatTimestampLabel(activeDetailUser.lastLoginAt))}
                  {renderDetailValue(copy.adminUpdatedAt ?? '수정일', formatTimestampLabel(activeDetailUser.updatedAt))}
                </dl>
              ) : null}
            </aside>
          </div>
        </AdminModalFrame>
      ) : null}

      {isLogModalOpen ? (
        <AdminModalFrame
          title={copy.adminLogsTitle ?? '관리자 로그'}
          subtitle={copy.adminLogsSubtitle ?? '로그는 탭을 열었을 때만 불러오며, 자동 새로고침하지 않습니다.'}
          className="admin-user-modal-shell"
          onClose={closeLogModal}
        >
          <div className="admin-section-header">
            <div className="admin-inline-actions">
              {LOG_TABS.map((tab) => (
                <button
                  key={tab.key}
                  className={activeLogTab === tab.key ? 'generate-btn auth-inline-btn' : 'outline-btn auth-inline-btn'}
                  onClick={() => setActiveLogTab(tab.key)}
                  type="button"
                >
                  {tab.key === 'generations'
                    ? copy.adminGenerationSection
                    : tab.key === 'credits'
                      ? copy.adminCreditsSection
                      : tab.key === 'payments'
                        ? (copy.adminPaymentsSection ?? '결제 로그')
                        : (copy.adminActivitiesSection ?? '활동 로그')}
                </button>
              ))}
            </div>
            <button className="outline-btn auth-inline-btn" disabled={activeLogState.loading} onClick={() => { void activeLogState.refresh(); }} type="button">
              {copy.refresh ?? 'Refresh'}
            </button>
          </div>

          {activeLogState.error ? <p className="admin-error-banner">{activeLogState.error}</p> : null}
          {activeLogState.loading ? <p className="admin-loading-banner">{copy.loadingSharedResult}</p> : null}

          <div className="admin-table">
            {renderLogTableHead()}
            {!activeLogState.loading && activeLogState.items.length > 0 ? renderLogRows() : null}
            {!activeLogState.loading && activeLogState.items.length === 0 ? <p>{copy.adminNoData}</p> : null}
          </div>

          {activeLogState.hasMore ? (
            <div className="admin-user-list-footer">
              <button className="outline-btn auth-inline-btn" disabled={activeLogState.loadingMore} onClick={() => { void activeLogState.loadMore(); }} type="button">
                {activeLogState.loadingMore ? (copy.adminUserListLoadingMore ?? '불러오는 중...') : (copy.adminLoadMore ?? '더 보기')}
              </button>
            </div>
          ) : null}
        </AdminModalFrame>
      ) : null}

      {giftTarget ? (
        <AdminModalFrame
          title={copy.adminGiftModalTitle ?? '크레딧 선물'}
          subtitle={copy.adminGiftModalSubtitle ?? '선물은 즉시 지급되며, 사용자 로그인 팝업/알림은 생성하지 않습니다.'}
          className="admin-gift-modal-shell"
          onClose={() => setGiftTarget(null)}
        >
          <form className="bbs-form admin-gift-form" onSubmit={handleGiftSubmit}>
            <label>
              <span>{copy.adminGiftTargetUid ?? '대상 사용자 uid'}</span>
              <input className="auth-input" readOnly type="text" value={giftTarget.uid} />
            </label>
            <label>
              <span>{copy.adminGiftAmount ?? '크레딧 수량 amount'}</span>
              <input
                className="auth-input"
                min={1}
                onChange={(event) => setGiftForm((prev) => ({
                  ...prev,
                  amount: Number.parseInt(event.target.value || '0', 10) || 0,
                }))}
                required
                type="number"
                value={giftForm.amount || ''}
              />
            </label>
            <label>
              <span>{copy.adminGiftTitleLabel ?? '선물 제목 title'}</span>
              <input
                className="auth-input"
                onChange={(event) => setGiftForm((prev) => ({ ...prev, title: event.target.value }))}
                type="text"
                value={giftForm.title}
              />
            </label>
            <label>
              <span>{copy.adminGiftMessageLabel ?? '선물 메시지 message'}</span>
              <textarea
                className="auth-textarea"
                onChange={(event) => setGiftForm((prev) => ({ ...prev, message: event.target.value }))}
                rows={4}
                value={giftForm.message}
              />
            </label>
            <label>
              <span>{copy.adminGiftSenderLabel ?? '발송자 표시명 senderName'}</span>
              <input
                className="auth-input"
                onChange={(event) => setGiftForm((prev) => ({ ...prev, senderName: event.target.value }))}
                type="text"
                value={giftForm.senderName}
              />
            </label>
            <label>
              <span>{copy.adminGiftAdminMemoLabel ?? '내부 관리자 메모 adminMemo'}</span>
              <textarea
                className="auth-textarea"
                onChange={(event) => setGiftForm((prev) => ({ ...prev, adminMemo: event.target.value }))}
                rows={3}
                value={giftForm.adminMemo}
              />
            </label>
            {giftError ? <p className="admin-error-banner">{giftError}</p> : null}
            <div className="confirm-modal-actions admin-gift-actions">
              <button className="outline-btn auth-inline-btn" disabled={giftSubmitting} onClick={() => setGiftTarget(null)} type="button">
                {copy.cancel}
              </button>
              <button className="generate-btn auth-inline-btn" disabled={giftSubmitting} type="submit">
                {giftSubmitting ? (copy.adminGiftSubmitting ?? '지급 중...') : (copy.adminGiftSubmit ?? '즉시 지급')}
              </button>
            </div>
          </form>
        </AdminModalFrame>
      ) : null}
    </>
  );
};

export default AdminDashboard;
