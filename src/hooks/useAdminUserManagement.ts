import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { callAdminGiftCredit, callAdminUserDetail, callAdminUserList } from '../lib/api/hamdeva';
import type { AdminUserDetail, AdminUserListItem } from '../types/hamdeva';

const DEFAULT_LIMIT = 20;
const DEFAULT_GIFT_FORM = {
  amount: 0,
  title: '운영자의 선물이 도착했습니다',
  message: '운영팀이 회원님께 특별 크레딧을 지급했습니다.',
  senderName: 'EVOVA 운영팀',
  adminMemo: '',
};

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message ? error.message : fallback;

const mergeUserSummary = (
  users: AdminUserListItem[],
  nextUser: AdminUserListItem | AdminUserDetail,
): AdminUserListItem[] => users.map((user) => (user.uid === nextUser.uid ? { ...user, ...nextUser } : user));

export const useAdminUserList = ({
  currentUser,
  enabled,
  isOpen,
}: {
  currentUser: User | null;
  enabled: boolean;
  isOpen: boolean;
}) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [query]);

  useEffect(() => {
    if (!enabled || !isOpen || !currentUser) {
      setUsers([]);
      setLoading(false);
      setLoadingMore(false);
      setError(null);
      setNextCursor(null);
      setHasMore(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const authToken = await currentUser.getIdToken();
        const response = await callAdminUserList({
          authToken,
          query: debouncedQuery,
          limit: DEFAULT_LIMIT,
        });

        if (cancelled) {
          return;
        }

        setUsers(response.users);
        setNextCursor(response.nextCursor);
        setHasMore(response.hasMore);
        setLoading(false);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setLoading(false);
        setError(getErrorMessage(error, '사용자 목록을 불러오지 못했습니다.'));
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [currentUser, debouncedQuery, enabled, isOpen]);

  const loadMore = async () => {
    if (!currentUser || !enabled || !isOpen || !hasMore || !nextCursor || debouncedQuery) {
      return;
    }

    setLoadingMore(true);
    setError(null);

    try {
      const authToken = await currentUser.getIdToken();
      const response = await callAdminUserList({
        authToken,
        cursor: nextCursor,
        limit: DEFAULT_LIMIT,
      });

      setUsers((prev) => [...prev, ...response.users.filter((user) => !prev.some((item) => item.uid === user.uid))]);
      setNextCursor(response.nextCursor);
      setHasMore(response.hasMore);
      setLoadingMore(false);
    } catch (error) {
      setLoadingMore(false);
      setError(getErrorMessage(error, '사용자 목록을 더 불러오지 못했습니다.'));
    }
  };

  const refresh = async () => {
    if (!currentUser || !enabled || !isOpen) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const authToken = await currentUser.getIdToken();
      const response = await callAdminUserList({
        authToken,
        query: debouncedQuery,
        limit: DEFAULT_LIMIT,
      });
      setUsers(response.users);
      setNextCursor(response.nextCursor);
      setHasMore(response.hasMore);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setError(getErrorMessage(error, '사용자 목록을 새로고침하지 못했습니다.'));
    }
  };

  const updateUser = (nextUser: AdminUserListItem | AdminUserDetail) => {
    setUsers((prev) => mergeUserSummary(prev, nextUser));
  };

  return {
    query,
    setQuery,
    users,
    loading,
    loadingMore,
    error,
    hasMore,
    debouncedQuery,
    loadMore,
    refresh,
    updateUser,
  };
};

export const useAdminUserDetail = ({
  currentUser,
  enabled,
  uid,
}: {
  currentUser: User | null;
  enabled: boolean;
  uid: string | null;
}) => {
  const [userDetail, setUserDetail] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !currentUser || !uid) {
      setUserDetail(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const authToken = await currentUser.getIdToken();
        const detail = await callAdminUserDetail({ authToken, uid });

        if (cancelled) {
          return;
        }

        setUserDetail(detail);
        setLoading(false);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setLoading(false);
        setError(getErrorMessage(error, '사용자 상세 정보를 불러오지 못했습니다.'));
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [currentUser, enabled, uid]);

  const refresh = async () => {
    if (!currentUser || !enabled || !uid) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const authToken = await currentUser.getIdToken();
      const detail = await callAdminUserDetail({ authToken, uid });
      setUserDetail(detail);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setError(getErrorMessage(error, '사용자 상세 정보를 새로고침하지 못했습니다.'));
    }
  };

  return {
    userDetail,
    setUserDetail,
    loading,
    error,
    refresh,
  };
};

export const useAdminGiftCredit = ({
  currentUser,
  enabled,
}: {
  currentUser: User | null;
  enabled: boolean;
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(DEFAULT_GIFT_FORM);

  const resetForm = () => {
    setForm(DEFAULT_GIFT_FORM);
    setError(null);
  };

  const submitGift = async (uid: string): Promise<AdminUserDetail> => {
    if (!currentUser || !enabled) {
      throw new Error('AUTH_REQUIRED');
    }

    if (!Number.isFinite(form.amount) || form.amount <= 0) {
      throw new Error('선물 크레딧 수량은 1 이상이어야 합니다.');
    }

    setSubmitting(true);
    setError(null);

    try {
      const authToken = await currentUser.getIdToken();
      const user = await callAdminGiftCredit({
        authToken,
        uid,
        amount: Math.trunc(form.amount),
        title: form.title.trim() || DEFAULT_GIFT_FORM.title,
        message: form.message.trim() || DEFAULT_GIFT_FORM.message,
        senderName: form.senderName.trim() || DEFAULT_GIFT_FORM.senderName,
        adminMemo: form.adminMemo.trim(),
      });

      setSubmitting(false);
      return user;
    } catch (error) {
      const message = getErrorMessage(error, '크레딧 선물 지급에 실패했습니다.');
      setSubmitting(false);
      setError(message);
      throw new Error(message);
    }
  };

  return {
    form,
    setForm,
    resetForm,
    submitGift,
    submitting,
    error,
    setError,
  };
};
