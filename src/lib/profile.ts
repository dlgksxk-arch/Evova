import type { UserProfile } from '../types/hamdeva';

const ADMIN_EMAILS = new Set(['dlgksxk@gmail.com']);

export const normalizeUserProfile = (email: string, data?: Partial<UserProfile>): UserProfile => ({
  email: data?.email || email,
  dailyCredit: typeof data?.dailyCredit === 'number' ? data.dailyCredit : 0,
  paidCredit: typeof data?.paidCredit === 'number' ? data.paidCredit : typeof data?.credits === 'number' ? data.credits : 0,
  credits: typeof data?.credits === 'number'
    ? data.credits
    : (typeof data?.dailyCredit === 'number' ? data.dailyCredit : 0) + (typeof data?.paidCredit === 'number' ? data.paidCredit : 0),
  totalGenerated: typeof data?.totalGenerated === 'number' ? data.totalGenerated : 0,
  isSubscribed: data?.isSubscribed === true,
  subscriptionPlan: data?.subscriptionPlan === 'starter'
    || data?.subscriptionPlan === 'popular'
    || data?.subscriptionPlan === 'pro'
    ? data.subscriptionPlan
    : data?.subscriptionPlan === 'basic'
      ? 'popular'
      : 'free',
  role: data?.role === 'admin' || ADMIN_EMAILS.has((data?.email || email).toLowerCase()) ? 'admin' : 'user',
  createdAt: data?.createdAt ?? null,
  lastDailyResetAt: data?.lastDailyResetAt ?? null,
  lastLoginAt: data?.lastLoginAt ?? null,
  updatedAt: data?.updatedAt ?? null,
});
