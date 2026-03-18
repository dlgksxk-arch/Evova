import type { Timestamp } from 'firebase/firestore';

export type ImageLoadState = 'idle' | 'loading' | 'ready' | 'error';
export type SubscriptionPlan = 'free' | 'basic' | 'pro';
export type UserRole = 'user' | 'admin';
export type CreditKind = 'daily' | 'paid';
export type SubjectType = 'human' | 'dog' | 'cat';
export type CheckoutProductId = 'starter' | 'creator' | 'pro' | 'studio';
export interface ApiBonusFields {
  dailyRewardGranted?: number;
  signupBonusGranted?: number;
  subscriptionBonusGranted?: number;
}

export interface UserProfileSummary {
  dailyCredit?: number;
  paidCredit?: number;
  credits?: number;
  totalGenerated?: number;
  isSubscribed?: boolean;
  subscriptionPlan?: SubscriptionPlan;
  role?: UserRole;
}

export interface UserProfile {
  email: string;
  dailyCredit: number;
  paidCredit: number;
  credits: number;
  totalGenerated: number;
  isSubscribed: boolean;
  subscriptionPlan: SubscriptionPlan;
  role: UserRole;
  createdAt?: Timestamp | null;
  lastDailyResetAt?: Timestamp | null;
  lastLoginAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface CreditBootstrapResponse extends ApiBonusFields {
  success?: boolean;
  profile?: UserProfileSummary;
  generationCost?: number;
  videoGenerationCost?: number;
}

export interface TryOnResponse extends ApiBonusFields {
  success?: boolean;
  image?: string;
  mimeType?: string;
  subjectType?: SubjectType;
  usedCreditType?: CreditKind;
  watermarkApplied?: boolean;
  dailyCredit?: number;
  paidCredit?: number;
  totalGenerated?: number;
  creditsRemaining?: number;
}

export interface AdminUserRecord {
  id: string;
  email: string;
  credits: number;
  subscriptionPlan: SubscriptionPlan;
  role: UserRole;
  createdAt?: Timestamp | null;
}

export interface AdminUserListItem {
  uid: string;
  email: string;
  displayName?: string | null;
  nickname?: string | null;
  credits: number;
  dailyCredit: number;
  paidCredit: number;
  totalGenerated: number;
  isSubscribed: boolean;
  subscriptionPlan: SubscriptionPlan;
  role: UserRole;
  createdAt?: Timestamp | null;
  lastLoginAt?: Timestamp | null;
}

export interface AdminUserDetail extends AdminUserListItem {
  updatedAt?: Timestamp | null;
}

export interface AdminUserListResponse {
  users: AdminUserListItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface CreditLogRecord {
  id: string;
  uid: string;
  type: string;
  amount: number;
  balanceDailyAfter?: number;
  balancePaidAfter?: number;
  note?: string;
  email?: string;
  createdAt?: Timestamp | null;
}

export interface GenerationRequestRecord {
  id: string;
  uid: string;
  email?: string;
  requestId: string;
  type?: 'image_generation' | 'video_generation';
  subjectType?: SubjectType;
  sourceResultId?: string | null;
  openaiVideoId?: string;
  model?: string;
  quality?: string;
  size?: string;
  durationSeconds?: number;
  estimatedCost?: number | null;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
  status?: string;
  success?: boolean;
  refunded?: boolean;
  errorMessage?: string;
  createdAt?: Timestamp | null;
  completedAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface PaymentLogRecord {
  id: string;
  uid?: string;
  email?: string;
  provider?: string;
  providerPaymentId?: string;
  productId?: string;
  amount?: number;
  amountCents?: number;
  currency?: string;
  paidCredit?: number;
  status?: string;
  paidAt?: Timestamp | null;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface ActivityLogRecord {
  id: string;
  userId?: string;
  amount?: number;
  title?: string;
  message?: string;
  senderName?: string;
  adminMemo?: string | null;
  grantedByAdminId?: string;
  grantedByAdminEmail?: string;
  createdAt?: Timestamp | null;
}

export interface AdminLogListResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface VideoGenerationResponse {
  success?: boolean;
  requestId?: string;
  openaiVideoId?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'canceled' | string;
  dailyCredit?: number;
  paidCredit?: number;
  creditsRemaining?: number;
  estimatedCost?: number;
  subjectType?: SubjectType;
  refunded?: boolean;
  message?: string;
  error?: string;
}

export interface GenerationRecord {
  id: string;
  uid: string;
  imageUrl?: string | null;
  requestId?: string;
  resultType?: 'image_generation' | 'video_generation';
  videoRequestId?: string | null;
  preservedUntil?: Timestamp | null;
  preservedAt?: Timestamp | null;
  expiresAt?: Timestamp | null;
  status?: string;
  usedCreditType?: CreditKind;
  usedCreditAmount?: number;
  watermarkApplied?: boolean;
  createdAt?: Timestamp | null;
}

export interface UserCreationRecord {
  id: string;
  type: 'image' | 'video';
  fileUrl: string;
  createdAt?: number | null;
  expireAt?: number | null;
  isArchived: boolean;
  isDeleted: boolean;
}

export interface CheckoutSessionResponse {
  success?: boolean;
  sessionId?: string;
  checkoutUrl?: string | null;
}

export interface CheckoutSessionStatusResponse {
  success?: boolean;
  status?: 'success' | 'pending' | 'failed';
  paymentId?: string | null;
  paidCredit?: number;
  dailyCredit?: number | null;
  paidCreditBalance?: number | null;
  totalCreditBalance?: number | null;
}

export interface PublicResultRecord {
  id: string;
  uid?: string | null;
  resultImageUrl: string;
  language?: string;
  createdAt?: Timestamp | null;
}

export interface BbsPostRecord {
  id: string;
  nickname: string;
  content: string;
  tempPassword?: string;
  uid?: string | null;
  deleted?: boolean;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface BoardNoticeRecord {
  id: string;
  title: string;
  content: string;
  authorUid?: string | null;
  authorEmail?: string | null;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}
