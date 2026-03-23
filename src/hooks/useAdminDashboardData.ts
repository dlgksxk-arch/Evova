import { useEffect, useState } from 'react';
import type { Firestore } from 'firebase/firestore';
import { auth } from '../firebase';

export type AdminSummary = {
  users: number;
  signupsToday: number;
  signups7Days: number;
  signups30Days: number;
  posts: number;
  generations: number;
  sharedResults: number;
  todayGenerations: number;
  todayEstimatedCost: number;
  recent30DaysEstimatedCost: number;
  totalEstimatedCost: number;
  recent7DaysEstimatedCost: number;
  totalVideoGenerations: number;
  todayVideoGenerations: number;
  estimatedVideoCost: number;
};

const EMPTY_SUMMARY: AdminSummary = {
  users: 0,
  signupsToday: 0,
  signups7Days: 0,
  signups30Days: 0,
  posts: 0,
  generations: 0,
  sharedResults: 0,
  todayGenerations: 0,
  todayEstimatedCost: 0,
  recent30DaysEstimatedCost: 0,
  totalEstimatedCost: 0,
  recent7DaysEstimatedCost: 0,
  totalVideoGenerations: 0,
  todayVideoGenerations: 0,
  estimatedVideoCost: 0,
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim().replace(/\/+$/, '') || '';
const ADMIN_DASHBOARD_ENDPOINT = `${API_BASE_URL}/api/admin/dashboard`;

export const useAdminDashboardData = ({
  db: _db,
  enabled,
}: {
  db: Firestore | null;
  enabled: boolean;
}) => {
  const [adminSummary, setAdminSummary] = useState<AdminSummary>(EMPTY_SUMMARY);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setAdminSummary(EMPTY_SUMMARY);
      setAdminLoading(false);
      setAdminError(null);
      return;
    }

    let cancelled = false;

    const loadAdminData = async () => {
      const currentUser = auth?.currentUser;
      if (!currentUser) {
        if (!cancelled) {
          setAdminSummary(EMPTY_SUMMARY);
          setAdminLoading(false);
          setAdminError(null);
        }
        return;
      }

      if (!cancelled) {
        setAdminLoading(true);
        setAdminError(null);
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
      };

      if (cancelled) {
        return;
      }

      setAdminSummary(payload.summary ?? EMPTY_SUMMARY);
      setAdminLoading(false);
      setAdminError(null);
    };

    void loadAdminData().catch((error) => {
      if (!cancelled) {
        console.error('Failed to load admin data:', error);
        setAdminLoading(false);
        setAdminError(error instanceof Error ? error.message : 'ADMIN_DASHBOARD_FETCH_FAILED');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, reloadKey]);

  return {
    adminSummary,
    adminLoading,
    adminError,
    refreshAdminSummary: () => setReloadKey((prev) => prev + 1),
  };
};
