import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  callAdminActivityLogs,
  callAdminCreditLogs,
  callAdminGenerationLogs,
  callAdminPaymentLogs,
} from '../lib/api/hamdeva';
import type {
  ActivityLogRecord,
  AdminLogListResponse,
  CreditLogRecord,
  GenerationRequestRecord,
  PaymentLogRecord,
} from '../types/hamdeva';

const DEFAULT_LIMIT = 20;

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message ? error.message : fallback;

type AdminLogType = 'generations' | 'credits' | 'payments' | 'activities';

type LogRecordMap = {
  generations: GenerationRequestRecord;
  credits: CreditLogRecord;
  payments: PaymentLogRecord;
  activities: ActivityLogRecord;
};

const fetchers: {
  [K in AdminLogType]: (payload: {
    authToken: string;
    cursor?: string | null;
    limit?: number;
  }) => Promise<AdminLogListResponse<LogRecordMap[K]>>;
} = {
  generations: callAdminGenerationLogs,
  credits: callAdminCreditLogs,
  payments: callAdminPaymentLogs,
  activities: callAdminActivityLogs,
};

export const useAdminLogList = <T extends AdminLogType>({
  currentUser,
  enabled,
  isOpen,
  isActive,
  type,
}: {
  currentUser: User | null;
  enabled: boolean;
  isOpen: boolean;
  isActive: boolean;
  type: T;
}) => {
  const [items, setItems] = useState<LogRecordMap[T][]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      setLoading(false);
      setLoadingMore(false);
      setError(null);
      setNextCursor(null);
      setHasMore(false);
      setHasLoaded(false);
      return;
    }

    if (!currentUser || !isOpen || !isActive || hasLoaded) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const authToken = await currentUser.getIdToken();
        const response = await fetchers[type]({
          authToken,
          limit: DEFAULT_LIMIT,
        });

        if (cancelled) {
          return;
        }

        setItems(response.items as LogRecordMap[T][]);
        setNextCursor(response.nextCursor);
        setHasMore(response.hasMore);
        setHasLoaded(true);
        setLoading(false);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setLoading(false);
        setError(getErrorMessage(error, '로그 데이터를 불러오지 못했습니다.'));
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [currentUser, enabled, hasLoaded, isActive, isOpen, type]);

  const refresh = async () => {
    if (!currentUser || !enabled || !isOpen || !isActive) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const authToken = await currentUser.getIdToken();
      const response = await fetchers[type]({
        authToken,
        limit: DEFAULT_LIMIT,
      });
      setItems(response.items as LogRecordMap[T][]);
      setNextCursor(response.nextCursor);
      setHasMore(response.hasMore);
      setHasLoaded(true);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setError(getErrorMessage(error, '로그 데이터를 새로고침하지 못했습니다.'));
    }
  };

  const loadMore = async () => {
    if (!currentUser || !enabled || !isOpen || !isActive || !hasMore || !nextCursor) {
      return;
    }

    setLoadingMore(true);
    setError(null);

    try {
      const authToken = await currentUser.getIdToken();
      const response = await fetchers[type]({
        authToken,
        cursor: nextCursor,
        limit: DEFAULT_LIMIT,
      });
      setItems((prev) => [
        ...prev,
        ...response.items.filter((item) => !prev.some((prevItem) => prevItem.id === item.id)),
      ] as LogRecordMap[T][]);
      setNextCursor(response.nextCursor);
      setHasMore(response.hasMore);
      setLoadingMore(false);
    } catch (error) {
      setLoadingMore(false);
      setError(getErrorMessage(error, '로그 데이터를 더 불러오지 못했습니다.'));
    }
  };

  return {
    items,
    loading,
    loadingMore,
    error,
    hasMore,
    hasLoaded,
    refresh,
    loadMore,
  };
};

export type { AdminLogType };
