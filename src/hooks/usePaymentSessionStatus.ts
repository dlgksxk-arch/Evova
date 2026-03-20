import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { User } from 'firebase/auth';
import { callCheckoutSessionStatus, callCreditBootstrap } from '../lib/api/hamdeva';
import type { SitePage } from '../locales';
import { normalizeUserProfile } from '../lib/profile';
import type { UserProfile } from '../types/hamdeva';

const PAYMENT_PENDING_SESSION_STORAGE_KEY = 'HAMDEVA-pending-payment-session-id';

export const usePaymentSessionStatus = ({
  currentPage,
  currentUser,
  paymentSessionId,
  statusMessages,
  setPaymentStatusMessage,
  setUserProfile,
}: {
  currentPage: SitePage;
  currentUser: User | null;
  paymentSessionId: string | null;
  statusMessages: {
    verifying: string;
    success: string;
    failed: string;
    verifyFailed: string;
  };
  setPaymentStatusMessage: Dispatch<SetStateAction<string | null>>;
  setUserProfile: Dispatch<SetStateAction<UserProfile | null>>;
}) => {
  useEffect(() => {
    if (currentPage !== 'payment-success' || !currentUser) {
      return;
    }

    let cancelled = false;
    let timer: number | null = null;
    let reloadTimer: number | null = null;
    const reloadKey = `HAMDEVA-payment-refresh:${paymentSessionId || 'latest'}`;

    const scheduleOneTimeReload = () => {
      try {
        if (window.sessionStorage.getItem(reloadKey) === 'done') {
          return;
        }
      } catch {
        return;
      }

      if (reloadTimer !== null) {
        return;
      }

      reloadTimer = window.setTimeout(() => {
        try {
          window.sessionStorage.setItem(reloadKey, 'done');
        } catch {
          // Ignore sessionStorage failures and skip the forced reload guard.
        }
        window.location.reload();
      }, 4000);
    };

    const clearScheduledReload = () => {
      if (reloadTimer !== null) {
        window.clearTimeout(reloadTimer);
        reloadTimer = null;
      }
    };

    const clearPendingSessionId = () => {
      try {
        window.sessionStorage.removeItem(PAYMENT_PENDING_SESSION_STORAGE_KEY);
      } catch {
        // Ignore storage cleanup failures.
      }
    };

    const poll = async () => {
      try {
        const authToken = await currentUser.getIdToken();
        const response = await callCheckoutSessionStatus({
          authToken,
          sessionId: paymentSessionId,
        });

        if (cancelled) {
          return;
        }

        if (
          typeof response.dailyCredit === 'number'
          || typeof response.paidCreditBalance === 'number'
          || typeof response.totalCreditBalance === 'number'
          || typeof response.isSubscribed === 'boolean'
          || typeof response.subscriptionPlan === 'string'
        ) {
          setUserProfile((prev) => normalizeUserProfile(currentUser.email || '', {
            ...(prev ?? {}),
            dailyCredit: typeof response.dailyCredit === 'number' ? response.dailyCredit : prev?.dailyCredit,
            paidCredit: typeof response.paidCreditBalance === 'number' ? response.paidCreditBalance : prev?.paidCredit,
            credits: typeof response.totalCreditBalance === 'number' ? response.totalCreditBalance : prev?.credits,
            isSubscribed: typeof response.isSubscribed === 'boolean' ? response.isSubscribed : prev?.isSubscribed,
            subscriptionPlan: response.subscriptionPlan ?? prev?.subscriptionPlan,
          }));
        }

        if (response.status === 'success') {
          clearScheduledReload();
          clearPendingSessionId();
          try {
            const bootstrapResponse = await callCreditBootstrap(currentUser);

            if (!cancelled && bootstrapResponse.profile) {
              setUserProfile(normalizeUserProfile(currentUser.email || '', bootstrapResponse.profile));
            }
          } catch (bootstrapError) {
            if (!cancelled) {
              console.error('Failed to refresh credits after payment success:', bootstrapError);
            }
          }

          if (cancelled) {
            return;
          }

          setPaymentStatusMessage(statusMessages.success);
          return;
        }

        if (response.status === 'failed') {
          clearScheduledReload();
          clearPendingSessionId();
          setPaymentStatusMessage(statusMessages.failed);
          return;
        }

        setPaymentStatusMessage(statusMessages.verifying);
        scheduleOneTimeReload();
        timer = window.setTimeout(() => {
          void poll();
        }, 2500);
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to verify payment session:', error);
          setPaymentStatusMessage(statusMessages.verifyFailed);
        }
      }
    };

    setPaymentStatusMessage(statusMessages.verifying);
    void poll();

    return () => {
      cancelled = true;
      clearScheduledReload();
      if (timer !== null) {
        window.clearTimeout(timer);
      }
    };
  }, [
    currentPage,
    currentUser,
    paymentSessionId,
    setPaymentStatusMessage,
    setUserProfile,
    statusMessages.failed,
    statusMessages.success,
    statusMessages.verifying,
    statusMessages.verifyFailed,
  ]);
};
