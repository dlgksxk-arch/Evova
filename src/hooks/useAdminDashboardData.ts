import { useEffect, useState } from 'react';
import type { Firestore, Timestamp } from 'firebase/firestore';
import { auth } from '../firebase';
import type { AdminUserRecord, CreditLogRecord, GenerationRequestRecord } from '../types/hamdeva';

export type AdminSummary = {
  users: number;
  posts: number;
  generations: number;
  sharedResults: number;
  todayGenerations: number;
  todayEstimatedCost: number;
  totalEstimatedCost: number;
  recent7DaysEstimatedCost: number;
  totalVideoGenerations: number;
  todayVideoGenerations: number;
  estimatedVideoCost: number;
};

const EMPTY_SUMMARY: AdminSummary = {
  users: 0,
  posts: 0,
  generations: 0,
  sharedResults: 0,
  todayGenerations: 0,
  todayEstimatedCost: 0,
  totalEstimatedCost: 0,
  recent7DaysEstimatedCost: 0,
  totalVideoGenerations: 0,
  todayVideoGenerations: 0,
  estimatedVideoCost: 0,
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim().replace(/\/+$/, '') || '';
const ADMIN_DASHBOARD_ENDPOINT = `${API_BASE_URL}/api/admin/dashboard`;

const toTimestampLike = (value: unknown): Timestamp | null => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  return {
    toDate: () => new Date(value),
  } as Timestamp;
};

export const useAdminDashboardData = ({
  db: _db,
  enabled,
}: {
  db: Firestore | null;
  enabled: boolean;
}) => {
  const [adminSummary, setAdminSummary] = useState<AdminSummary>(EMPTY_SUMMARY);
  const [adminUsers, setAdminUsers] = useState<AdminUserRecord[]>([]);
  const [adminGenerationLogs, setAdminGenerationLogs] = useState<GenerationRequestRecord[]>([]);
  const [adminCreditLogs, setAdminCreditLogs] = useState<CreditLogRecord[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setAdminSummary(EMPTY_SUMMARY);
      setAdminUsers([]);
      setAdminGenerationLogs([]);
      setAdminCreditLogs([]);
      setAdminLoading(false);
      return;
    }

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const loadAdminData = async () => {
      const currentUser = auth?.currentUser;
      if (!currentUser) {
        if (!cancelled) {
          setAdminSummary(EMPTY_SUMMARY);
          setAdminUsers([]);
          setAdminGenerationLogs([]);
          setAdminCreditLogs([]);
          setAdminLoading(false);
        }
        return;
      }

      if (!cancelled) {
        setAdminLoading(true);
      }

      const token = await currentUser.getIdToken();
      const response = await fetch(ADMIN_DASHBOARD_ENDPOINT, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`ADMIN_DASHBOARD_FETCH_FAILED_${response.status}`);
      }

      const payload = await response.json() as {
        summary?: AdminSummary;
        users?: Array<Omit<AdminUserRecord, 'createdAt'> & { createdAt?: number | null }>;
        generationLogs?: Array<Omit<GenerationRequestRecord, 'createdAt' | 'completedAt' | 'updatedAt'> & {
          createdAt?: number | null;
          completedAt?: number | null;
          updatedAt?: number | null;
        }>;
        creditLogs?: Array<Omit<CreditLogRecord, 'createdAt'> & { createdAt?: number | null }>;
      };

      if (cancelled) {
        return;
      }

      setAdminSummary(payload.summary ?? EMPTY_SUMMARY);
      setAdminUsers((payload.users ?? []).map((item) => ({
        ...item,
        createdAt: toTimestampLike(item.createdAt),
      })));
      setAdminGenerationLogs((payload.generationLogs ?? []).map((item) => ({
        ...item,
        createdAt: toTimestampLike(item.createdAt),
        completedAt: toTimestampLike(item.completedAt),
        updatedAt: toTimestampLike(item.updatedAt),
      })));
      setAdminCreditLogs((payload.creditLogs ?? []).map((item) => ({
        ...item,
        createdAt: toTimestampLike(item.createdAt),
      })));
      setAdminLoading(false);
    };

    void loadAdminData().catch((error) => {
      if (!cancelled) {
        console.error('Failed to load admin data:', error);
        setAdminLoading(false);
      }
    });

    intervalId = setInterval(() => {
      void loadAdminData().catch((error) => {
        if (!cancelled) {
          console.error('Failed to refresh admin data:', error);
          setAdminLoading(false);
        }
      });
    }, 10_000);

    return () => {
      cancelled = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [enabled]);

  return {
    adminSummary,
    adminUsers,
    adminGenerationLogs,
    adminCreditLogs,
    adminLoading,
  };
};
