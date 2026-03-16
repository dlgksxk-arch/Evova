import { useEffect, useState } from 'react';
import type { Firestore } from 'firebase/firestore';
import { doc, getDoc } from 'firebase/firestore';
import type { PublicResultRecord } from '../types/hamdeva';

export const useSharedResult = ({
  db,
  sharedResultRouteId,
  notFoundMessage,
}: {
  db: Firestore | null;
  sharedResultRouteId: string | null;
  notFoundMessage: string;
}) => {
  const [sharedResultRecord, setSharedResultRecord] = useState<PublicResultRecord | null>(null);
  const [sharedResultLoading, setSharedResultLoading] = useState(false);
  const [sharedResultError, setSharedResultError] = useState<string | null>(null);

  useEffect(() => {
    if (!sharedResultRouteId) {
      setSharedResultRecord(null);
      setSharedResultError(null);
      setSharedResultLoading(false);
      return;
    }

    if (!db) {
      setSharedResultRecord(null);
      setSharedResultError(notFoundMessage);
      setSharedResultLoading(false);
      return;
    }

    let cancelled = false;
    setSharedResultLoading(true);
    setSharedResultError(null);

    getDoc(doc(db, 'publicResults', sharedResultRouteId))
      .then((snapshot) => {
        if (cancelled) {
          return;
        }

        if (!snapshot.exists()) {
          setSharedResultRecord(null);
          setSharedResultError(notFoundMessage);
          return;
        }

        setSharedResultRecord({
          id: snapshot.id,
          ...(snapshot.data() as Omit<PublicResultRecord, 'id'>),
        });
      })
      .catch((error) => {
        if (!cancelled) {
          console.error('Failed to load shared result:', error);
          setSharedResultRecord(null);
          setSharedResultError(notFoundMessage);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setSharedResultLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [db, notFoundMessage, sharedResultRouteId]);

  return {
    sharedResultRecord,
    sharedResultLoading,
    sharedResultError,
  };
};
