import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { User } from 'firebase/auth';
import { callCheckoutSessionStatus } from '../lib/api/hamdeva';
import type { SitePage } from '../locales';
import type { UserProfile } from '../types/hamdeva';

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
        ) {
          setUserProfile((prev) => prev ? {
            ...prev,
            dailyCredit: typeof response.dailyCredit === 'number' ? response.dailyCredit : prev.dailyCredit,
            paidCredit: typeof response.paidCreditBalance === 'number' ? response.paidCreditBalance : prev.paidCredit,
            credits: typeof response.totalCreditBalance === 'number' ? response.totalCreditBalance : prev.credits,
          } : prev);
        }

        if (response.status === 'paid') {
          setPaymentStatusMessage(statusMessages.success);
          return;
        }

        if (response.status === 'failed' || response.status === 'canceled') {
          setPaymentStatusMessage(statusMessages.failed);
          return;
        }

        setPaymentStatusMessage(statusMessages.verifying);
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
