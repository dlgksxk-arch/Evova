import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { User } from 'firebase/auth';
import { callCheckoutSessionStatus, callCreditBootstrap } from '../lib/api/hamdeva';
import type { SitePage } from '../locales';
import { normalizeUserProfile } from '../lib/profile';
import type { UserProfile } from '../types/hamdeva';

const PAYMENT_PENDING_SESSION_STORAGE_KEY = 'HAMDEVA-pending-payment-session-id';
const PAYMENT_PENDING_PLAN_STORAGE_KEY = 'HAMDEVA-pending-payment-plan';
const PAYMENT_PENDING_PRODUCT_STORAGE_KEY = 'HAMDEVA-pending-payment-product-id';

export type PaymentStatusDetails = {
  addedPaidCredit: number | null;
  previousSubscriptionPlan: UserProfile['subscriptionPlan'] | null;
  nextSubscriptionPlan: UserProfile['subscriptionPlan'] | null;
};

const getCreditAmountForProduct = (productId: string | null): number | null => {
  switch (productId) {
    case 'starter':
      return 1000;
    case 'popular':
      return 3500;
    case 'pro':
      return 7000;
    case 'small_pack':
      return 1000;
    case 'basic_pack':
      return 1500;
    case 'medium_pack':
      return 3000;
    case 'large_pack':
      return 6000;
    default:
      return null;
  }
};

const getSubscriptionPlanForProduct = (productId: string | null): UserProfile['subscriptionPlan'] | null => {
  if (productId === 'starter' || productId === 'popular' || productId === 'pro') {
    return productId;
  }
  return null;
};

export const usePaymentSessionStatus = ({
  currentPage,
  currentUser,
  currentUserProfile,
  paymentSessionId,
  statusMessages,
  setPaymentStatusMessage,
  setPaymentStatusDetails,
  setUserProfile,
}: {
  currentPage: SitePage;
  currentUser: User | null;
  currentUserProfile: UserProfile | null;
  paymentSessionId: string | null;
  statusMessages: {
    verifying: string;
    success: string;
    failed: string;
    verifyFailed: string;
  };
  setPaymentStatusMessage: Dispatch<SetStateAction<string | null>>;
  setPaymentStatusDetails: Dispatch<SetStateAction<PaymentStatusDetails | null>>;
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
        window.sessionStorage.removeItem(PAYMENT_PENDING_PLAN_STORAGE_KEY);
        window.sessionStorage.removeItem(PAYMENT_PENDING_PRODUCT_STORAGE_KEY);
      } catch {
        // Ignore storage cleanup failures.
      }
    };

    const getPendingSubscriptionPlan = (): UserProfile['subscriptionPlan'] | null => {
      try {
        const storedPlan = window.sessionStorage.getItem(PAYMENT_PENDING_PLAN_STORAGE_KEY);
        return storedPlan === 'starter' || storedPlan === 'popular' || storedPlan === 'pro' || storedPlan === 'free'
          ? storedPlan
          : null;
      } catch {
        return null;
      }
    };

    const getPendingProductId = (): string | null => {
      try {
        return window.sessionStorage.getItem(PAYMENT_PENDING_PRODUCT_STORAGE_KEY);
      } catch {
        return null;
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
          const pendingProductId = getPendingProductId();
          const previousSubscriptionPlan = getPendingSubscriptionPlan() ?? currentUserProfile?.subscriptionPlan ?? null;
          const nextSubscriptionPlan = response.subscriptionPlan
            ?? getSubscriptionPlanForProduct(pendingProductId)
            ?? currentUserProfile?.subscriptionPlan
            ?? null;
          setPaymentStatusDetails({
            addedPaidCredit: typeof response.paidCredit === 'number' && response.paidCredit > 0
              ? response.paidCredit
              : getCreditAmountForProduct(pendingProductId),
            previousSubscriptionPlan,
            nextSubscriptionPlan,
          });
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
          setPaymentStatusDetails(null);
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
          setPaymentStatusDetails(null);
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
    currentUserProfile?.subscriptionPlan,
    paymentSessionId,
    setPaymentStatusMessage,
    setPaymentStatusDetails,
    setUserProfile,
    statusMessages.failed,
    statusMessages.success,
    statusMessages.verifying,
    statusMessages.verifyFailed,
  ]);
};
