import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { User } from 'firebase/auth';
import { callCreditBootstrap } from '../lib/api/hamdeva';
import { normalizeUserProfile } from '../lib/profile';
import type { UserProfile } from '../types/hamdeva';

export const useCreditBootstrap = ({
  currentUser,
  rewardMessage,
  signupBonusMessage,
  setCreditNotice,
  setUserProfile,
}: {
  currentUser: User | null;
  rewardMessage: string;
  signupBonusMessage: (amount: number) => string;
  setCreditNotice: Dispatch<SetStateAction<string | null>>;
  setUserProfile: Dispatch<SetStateAction<UserProfile | null>>;
}) => {
  useEffect(() => {
    if (!currentUser) {
      return;
    }

    let cancelled = false;

    callCreditBootstrap(currentUser)
      .then((response) => {
        if (cancelled) {
          return;
        }

        if (response.profile) {
          setUserProfile((prev) => ({
            ...normalizeUserProfile(currentUser.email || '', prev ?? {}),
            ...response.profile,
          }));
        }

        if (response.dailyRewardGranted) {
          setCreditNotice([
            response.signupBonusGranted ? signupBonusMessage(response.signupBonusGranted) : '',
            rewardMessage,
          ].filter(Boolean).join(' '));
          return;
        }

        if (response.signupBonusGranted) {
          setCreditNotice(signupBonusMessage(response.signupBonusGranted));
        }
      })
      .catch((error) => {
        console.error('Failed to bootstrap credits:', error);
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser, rewardMessage, setCreditNotice, setUserProfile, signupBonusMessage]);
};
