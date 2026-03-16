import { useEffect, useState } from 'react';
import type { Firestore } from 'firebase/firestore';
import { collection, getCountFromServer, getDocs, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { estimateGenerationCost } from '../lib/costs';
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

const getTimestampMillis = (value: unknown): number => {
  if (!value || typeof value !== 'object') {
    return 0;
  }

  const candidate = value as { toDate?: () => Date };
  if (typeof candidate.toDate === 'function') {
    try {
      return candidate.toDate().getTime();
    } catch {
      return 0;
    }
  }

  return 0;
};

export const useAdminDashboardData = ({
  db,
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
    if (!enabled || !db) {
      setAdminSummary(EMPTY_SUMMARY);
      setAdminUsers([]);
      setAdminGenerationLogs([]);
      setAdminCreditLogs([]);
      setAdminLoading(false);
      return;
    }

    let cancelled = false;
    let reloadTimer: ReturnType<typeof setTimeout> | null = null;
    setAdminLoading(true);

    const loadAdminData = async () => {
      const [
        usersCountResult,
        postsCountResult,
        sharedResultsCountResult,
        usersResult,
        generationResult,
        creditResult,
      ] = await Promise.allSettled([
        getCountFromServer(collection(db, 'users')),
        getCountFromServer(collection(db, 'bbsPosts')),
        getCountFromServer(collection(db, 'publicResults')),
        getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(20))),
        getDocs(query(collection(db, 'generationRequests'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'credit_transactions'), orderBy('createdAt', 'desc'), limit(20))),
      ]);

      if (cancelled) {
        return;
      }

      const getCount = (result: PromiseSettledResult<Awaited<ReturnType<typeof getCountFromServer>>>) => {
        if (result.status === 'fulfilled') {
          return result.value.data().count;
        }
        console.error('Failed to load admin count:', result.reason);
        return 0;
      };
      const getSnapshots = <T,>(result: PromiseSettledResult<T[] | any>) => {
        if (result.status === 'fulfilled') {
          return result.value.docs ?? [];
        }
        console.error('Failed to load admin snapshot:', result.reason);
        return [];
      };

      const userDocs = getSnapshots(usersResult);
      const generationDocs = getSnapshots(generationResult);
      const creditDocs = getSnapshots(creditResult);
      const now = Date.now();
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
      const allGenerationLogs = generationDocs.map((snapshot: any) => ({
        id: snapshot.id,
        ...(snapshot.data() as Omit<GenerationRequestRecord, 'id'>),
      }));
      const imageGenerationLogs = allGenerationLogs.filter((item) => (item.type || 'image_generation') === 'image_generation');
      const videoGenerationLogs = allGenerationLogs.filter((item) => item.type === 'video_generation');
      const todayGenerations = imageGenerationLogs.filter((item) => getTimestampMillis(item.createdAt) >= todayStart.getTime());
      const todayVideoGenerations = videoGenerationLogs.filter((item) => getTimestampMillis(item.createdAt) >= todayStart.getTime());
      const recent7DayGenerations = allGenerationLogs.filter((item) => getTimestampMillis(item.createdAt) >= sevenDaysAgo);
      const totalEstimatedCost = allGenerationLogs.reduce((sum, item) => sum + (estimateGenerationCost(item) ?? 0), 0);
      const todayEstimatedCost = todayGenerations.reduce((sum, item) => sum + (estimateGenerationCost(item) ?? 0), 0);
      const recent7DaysEstimatedCost = recent7DayGenerations.reduce((sum, item) => sum + (estimateGenerationCost(item) ?? 0), 0);
      const estimatedVideoCost = videoGenerationLogs.reduce((sum, item) => sum + (estimateGenerationCost(item) ?? 0), 0);

      setAdminSummary({
        users: getCount(usersCountResult),
        posts: getCount(postsCountResult),
        generations: allGenerationLogs.length,
        sharedResults: getCount(sharedResultsCountResult),
        todayGenerations: todayGenerations.length,
        todayEstimatedCost,
        totalEstimatedCost,
        recent7DaysEstimatedCost,
        totalVideoGenerations: videoGenerationLogs.length,
        todayVideoGenerations: todayVideoGenerations.length,
        estimatedVideoCost,
      });
      setAdminUsers(userDocs.map((snapshot: any) => ({
        id: snapshot.id,
        ...(snapshot.data() as Omit<AdminUserRecord, 'id'>),
      })));
      setAdminGenerationLogs(allGenerationLogs.slice(0, 20));
      setAdminCreditLogs(creditDocs.map((snapshot: any) => ({
        id: snapshot.id,
        ...(snapshot.data() as Omit<CreditLogRecord, 'id'>),
      })));
      setAdminLoading(false);
    };

    const scheduleReload = () => {
      if (cancelled) {
        return;
      }
      if (reloadTimer) {
        clearTimeout(reloadTimer);
      }
      reloadTimer = setTimeout(() => {
        void loadAdminData().catch((error) => {
          if (!cancelled) {
            console.error('Failed to load admin data:', error);
            setAdminLoading(false);
          }
        });
      }, 150);
    };

    loadAdminData().catch((error) => {
      if (!cancelled) {
        console.error('Failed to load admin data:', error);
        setAdminLoading(false);
      }
    });

    const unsubscribers = [
      onSnapshot(collection(db, 'users'), scheduleReload, (error) => console.error('Failed to watch admin users:', error)),
      onSnapshot(collection(db, 'bbsPosts'), scheduleReload, (error) => console.error('Failed to watch admin posts:', error)),
      onSnapshot(collection(db, 'publicResults'), scheduleReload, (error) => console.error('Failed to watch admin shared results:', error)),
      onSnapshot(collection(db, 'generationRequests'), scheduleReload, (error) => console.error('Failed to watch admin generations:', error)),
      onSnapshot(query(collection(db, 'credit_transactions'), orderBy('createdAt', 'desc'), limit(1)), scheduleReload, (error) => console.error('Failed to watch admin credit logs:', error)),
    ];

    return () => {
      cancelled = true;
      if (reloadTimer) {
        clearTimeout(reloadTimer);
      }
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [db, enabled]);

  return {
    adminSummary,
    adminUsers,
    adminGenerationLogs,
    adminCreditLogs,
    adminLoading,
  };
};
