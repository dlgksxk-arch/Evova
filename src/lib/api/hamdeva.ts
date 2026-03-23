import type { User } from 'firebase/auth';
import type {
  ActivityLogRecord,
  AdminLogListResponse,
  AdminUserDetail,
  AdminUserListResponse,
  CheckoutProductId,
  CheckoutSessionResponse,
  CheckoutSessionStatusResponse,
  CreditBootstrapResponse,
  CreditLogRecord,
  PaymentLogRecord,
  SubjectType,
  TryOnResponse,
  UserCreationRecord,
  GenerationRequestRecord,
} from '../../types/hamdeva';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim().replace(/\/+$/, '') || '';
const apiUrl = (path: string): string => `${API_BASE_URL}${path}`;

const TRYON_ENDPOINT = apiUrl('/api/tryon');
const BOOTSTRAP_ENDPOINT = apiUrl('/api/bootstrap');
const CLASSIFY_SUBJECT_ENDPOINT = apiUrl('/api/classify-subject');
const POLAR_CHECKOUT_ENDPOINT = apiUrl('/api/polar/checkout');
const POLAR_SESSION_ENDPOINT = apiUrl('/api/polar/session');
const SHARE_IMAGE_ENDPOINT = apiUrl('/api/share-image');
const CREATIONS_ENDPOINT = apiUrl('/api/creations');
const ADMIN_USERS_ENDPOINT = apiUrl('/api/admin/users');
const ADMIN_USER_DETAIL_ENDPOINT = apiUrl('/api/admin/users/detail');
const ADMIN_USER_GIFT_ENDPOINT = apiUrl('/api/admin/users/gift');
const ADMIN_GENERATION_LOGS_ENDPOINT = apiUrl('/api/admin/logs/generations');
const ADMIN_CREDIT_LOGS_ENDPOINT = apiUrl('/api/admin/logs/credits');
const ADMIN_PAYMENT_LOGS_ENDPOINT = apiUrl('/api/admin/logs/payments');
const ADMIN_ACTIVITY_LOGS_ENDPOINT = apiUrl('/api/admin/logs/activities');

const normalizeGeneratedImage = (image: string, mimeType = 'image/png'): string =>
  image.startsWith('data:') ? image : `data:${mimeType};base64,${image}`;

const parseApiError = async (res: Response): Promise<Error> => {
  const errBody = await res.json().catch(() => ({})) as { error?: string; message?: string };
  if (errBody.error === 'PAYMENT_REQUIRED' || errBody.error === 'INSUFFICIENT_CREDITS') {
    return new Error('PAYMENT_REQUIRED');
  }
  if (errBody.error === 'VIDEO_NOT_ENOUGH_CREDITS') {
    return new Error(errBody.message || '영상 생성에는 1500 크레딧이 필요합니다.');
  }
  if (errBody.error === 'AUTH_REQUIRED') {
    return new Error('AUTH_REQUIRED');
  }
  if (errBody.error === 'DUPLICATE_REQUEST') {
    return new Error('DUPLICATE_REQUEST');
  }
  if (errBody.error === 'VIDEO_GENERATION_IN_PROGRESS' || errBody.error === 'VIDEO_FAILURE_LIMIT_REACHED') {
    return new Error(errBody.message || errBody.error);
  }
  if (errBody.error === 'PAYMENT_NOT_CONFIGURED') {
    return new Error('PAYMENT_NOT_CONFIGURED');
  }

  return new Error(errBody.message || errBody.error || `서버 오류 ${res.status}`);
};

export const callCreditBootstrap = async (user: User): Promise<CreditBootstrapResponse> => {
  const token = await user.getIdToken();
  const res = await fetch(BOOTSTRAP_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    throw await parseApiError(res);
  }

  return await res.json() as CreditBootstrapResponse;
};

export const callTryOn = async (payload: {
  authToken: string;
  personImage: string;
  garmentImage: string;
  personInputLabel?: string;
  garmentInputLabel?: string;
  personPreviewImage?: string;
  garmentPreviewImage?: string;
  requestId: string;
  subjectType: SubjectType;
  bodyProfile?: unknown;
}): Promise<TryOnResponse & { image: string }> => {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 60_000);

  try {
    console.info('[HAMDEVA] tryon request', {
      endpoint: TRYON_ENDPOINT,
      method: 'POST',
      requestId: payload.requestId,
    });

    const res = await fetch(TRYON_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${payload.authToken}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    console.info('[HAMDEVA] tryon response', {
      endpoint: res.url || TRYON_ENDPOINT,
      method: 'POST',
      status: res.status,
      requestId: payload.requestId,
    });

    if (!res.ok) {
      throw await parseApiError(res);
    }

    const data = await res.json() as TryOnResponse;

    if (!data.image) {
      throw new Error('응답에서 이미지를 찾을 수 없습니다.');
    }

    return {
      image: normalizeGeneratedImage(data.image, data.mimeType),
      success: data.success,
      shareImageUrl: typeof data.shareImageUrl === 'string' ? data.shareImageUrl : undefined,
      subjectType: data.subjectType,
      usedCreditType: data.usedCreditType,
      watermarkApplied: data.watermarkApplied,
      dailyCredit: data.dailyCredit,
      paidCredit: data.paidCredit,
      totalGenerated: data.totalGenerated,
      creditsRemaining: data.creditsRemaining,
      dailyRewardGranted: data.dailyRewardGranted,
      signupBonusGranted: data.signupBonusGranted,
      subscriptionBonusGranted: data.subscriptionBonusGranted,
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('GENERATION_TIMEOUT');
    }
    throw error;
  } finally {
    window.clearTimeout(timer);
  }
};

export const callCreateCheckoutSession = async (payload: {
  authToken: string;
  productId: CheckoutProductId;
  uid?: string;
}): Promise<CheckoutSessionResponse> => {
  const res = await fetch(POLAR_CHECKOUT_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${payload.authToken}`,
    },
    body: JSON.stringify({ productId: payload.productId, uid: payload.uid }),
  });

  if (!res.ok) {
    throw await parseApiError(res);
  }

  return await res.json() as CheckoutSessionResponse;
};

export const callCheckoutSessionStatus = async (payload: {
  authToken: string;
  sessionId?: string | null;
}): Promise<CheckoutSessionStatusResponse> => {
  const query = payload.sessionId ? `?sessionId=${encodeURIComponent(payload.sessionId)}` : '';
  const res = await fetch(`${POLAR_SESSION_ENDPOINT}${query}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${payload.authToken}`,
    },
  });

  if (!res.ok) {
    throw await parseApiError(res);
  }

  return await res.json() as CheckoutSessionStatusResponse;
};

export const callUploadShareImage = async (payload: {
  authToken: string;
  image: string;
  requestId?: string;
}): Promise<{ success?: boolean; shareImageUrl?: string }> => {
  const res = await fetch(SHARE_IMAGE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${payload.authToken}`,
    },
    body: JSON.stringify({
      image: payload.image,
      requestId: payload.requestId,
    }),
  });

  if (!res.ok) {
    throw await parseApiError(res);
  }

  return await res.json() as { success?: boolean; shareImageUrl?: string };
};

export const callSubjectClassifier = async (subjectImage: string): Promise<SubjectType> => {
  const res = await fetch(CLASSIFY_SUBJECT_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ subjectImage }),
  });

  if (!res.ok) {
    throw await parseApiError(res);
  }

  const data = await res.json() as { subjectType?: SubjectType };
  return data.subjectType === 'dog' || data.subjectType === 'cat' ? data.subjectType : 'human';
};

export const getCreations = async (authToken: string): Promise<UserCreationRecord[]> => {
  const res = await fetch(CREATIONS_ENDPOINT, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!res.ok) {
    throw await parseApiError(res);
  }

  const data = await res.json() as { creations?: UserCreationRecord[] };
  return Array.isArray(data.creations) ? data.creations : [];
};

export const archiveCreation = async (authToken: string, creationId: string): Promise<void> => {
  const res = await fetch(`${CREATIONS_ENDPOINT}/archive`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ creationId }),
  });

  if (!res.ok) {
    throw await parseApiError(res);
  }
};

export const deleteCreation = async (authToken: string, creationId: string): Promise<void> => {
  const res = await fetch(`${CREATIONS_ENDPOINT}/delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ creationId }),
  });

  if (!res.ok) {
    throw await parseApiError(res);
  }
};

const toTimestampLike = (value: unknown) => (
  typeof value === 'number' && Number.isFinite(value)
    ? ({
        toDate: () => new Date(value),
      })
    : null
);

const normalizeAdminUser = <T extends {
  createdAt?: number | null;
  lastLoginAt?: number | null;
  updatedAt?: number | null;
  purchaseHistory?: Array<{
    paidAt?: number | null;
    createdAt?: number | null;
  }>;
}>(user: T) => ({
  ...user,
  createdAt: toTimestampLike(user.createdAt),
  lastLoginAt: toTimestampLike(user.lastLoginAt),
  updatedAt: toTimestampLike(user.updatedAt),
  purchaseHistory: Array.isArray(user.purchaseHistory)
    ? user.purchaseHistory.map((item) => ({
        ...item,
        paidAt: toTimestampLike(item.paidAt),
        createdAt: toTimestampLike(item.createdAt),
      }))
    : user.purchaseHistory,
});

const normalizeTimestampFields = <T extends Record<string, unknown>>(
  record: T,
  timestampFields: string[],
): T => {
  const nextRecord = { ...record };
  timestampFields.forEach((field) => {
    nextRecord[field] = toTimestampLike(record[field]);
  });
  return nextRecord;
};

const callAdminLogList = async <T extends Record<string, unknown>>(payload: {
  authToken: string;
  endpoint: string;
  cursor?: string | null;
  limit?: number;
  timestampFields: string[];
}): Promise<AdminLogListResponse<T>> => {
  const params = new URLSearchParams();
  if (payload.cursor) {
    params.set('cursor', payload.cursor);
  }
  params.set('limit', String(payload.limit ?? 20));

  const queryString = params.toString();
  const res = await fetch(queryString ? `${payload.endpoint}?${queryString}` : payload.endpoint, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${payload.authToken}`,
    },
  });

  if (!res.ok) {
    throw await parseApiError(res);
  }

  const data = await res.json() as {
    items?: T[];
    nextCursor?: string | null;
    hasMore?: boolean;
  };

  return {
    items: Array.isArray(data.items)
      ? data.items.map((item) => normalizeTimestampFields(item, payload.timestampFields))
      : [],
    nextCursor: data.nextCursor ?? null,
    hasMore: data.hasMore === true,
  };
};

export const callAdminUserList = async (payload: {
  authToken: string;
  query?: string;
  cursor?: string | null;
  limit?: number;
}): Promise<AdminUserListResponse> => {
  const params = new URLSearchParams();
  if (payload.query?.trim()) {
    params.set('query', payload.query.trim());
  }
  if (payload.cursor) {
    params.set('cursor', payload.cursor);
  }
  params.set('limit', String(payload.limit ?? 20));

  const res = await fetch(`${ADMIN_USERS_ENDPOINT}?${params.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${payload.authToken}`,
    },
  });

  if (!res.ok) {
    throw await parseApiError(res);
  }

  const data = await res.json() as {
    users?: Array<AdminUserListResponse['users'][number] & {
      createdAt?: number | null;
      lastLoginAt?: number | null;
    }>;
    nextCursor?: string | null;
    hasMore?: boolean;
  };

  return {
    users: Array.isArray(data.users) ? data.users.map((user) => normalizeAdminUser(user)) : [],
    nextCursor: data.nextCursor ?? null,
    hasMore: data.hasMore === true,
  };
};

export const callAdminUserDetail = async (payload: {
  authToken: string;
  uid: string;
}): Promise<AdminUserDetail> => {
  const params = new URLSearchParams({ uid: payload.uid });
  const res = await fetch(`${ADMIN_USER_DETAIL_ENDPOINT}?${params.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${payload.authToken}`,
    },
  });

  if (!res.ok) {
    throw await parseApiError(res);
  }

  const data = await res.json() as {
    user?: AdminUserDetail & {
      createdAt?: number | null;
      lastLoginAt?: number | null;
      updatedAt?: number | null;
    };
  };

  if (!data.user) {
    throw new Error('사용자 정보를 찾을 수 없습니다.');
  }

  return normalizeAdminUser(data.user) as AdminUserDetail;
};

export const callAdminGiftCredit = async (payload: {
  authToken: string;
  uid: string;
  amount: number;
  title: string;
  message: string;
  senderName: string;
  adminMemo: string;
}): Promise<AdminUserDetail> => {
  const res = await fetch(ADMIN_USER_GIFT_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${payload.authToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw await parseApiError(res);
  }

  const data = await res.json() as {
    user?: AdminUserDetail & {
      createdAt?: number | null;
      lastLoginAt?: number | null;
      updatedAt?: number | null;
    };
  };

  if (!data.user) {
    throw new Error('사용자 정보를 갱신하지 못했습니다.');
  }

  return normalizeAdminUser(data.user) as AdminUserDetail;
};

export const callAdminGenerationLogs = async (payload: {
  authToken: string;
  cursor?: string | null;
  limit?: number;
}): Promise<AdminLogListResponse<GenerationRequestRecord>> =>
  callAdminLogList<GenerationRequestRecord>({
    authToken: payload.authToken,
    endpoint: ADMIN_GENERATION_LOGS_ENDPOINT,
    cursor: payload.cursor,
    limit: payload.limit,
    timestampFields: ['createdAt', 'completedAt', 'updatedAt'],
  });

export const callAdminCreditLogs = async (payload: {
  authToken: string;
  cursor?: string | null;
  limit?: number;
}): Promise<AdminLogListResponse<CreditLogRecord>> =>
  callAdminLogList<CreditLogRecord>({
    authToken: payload.authToken,
    endpoint: ADMIN_CREDIT_LOGS_ENDPOINT,
    cursor: payload.cursor,
    limit: payload.limit,
    timestampFields: ['createdAt'],
  });

export const callAdminPaymentLogs = async (payload: {
  authToken: string;
  cursor?: string | null;
  limit?: number;
}): Promise<AdminLogListResponse<PaymentLogRecord>> =>
  callAdminLogList<PaymentLogRecord>({
    authToken: payload.authToken,
    endpoint: ADMIN_PAYMENT_LOGS_ENDPOINT,
    cursor: payload.cursor,
    limit: payload.limit,
    timestampFields: ['paidAt', 'createdAt', 'updatedAt'],
  });

export const callAdminActivityLogs = async (payload: {
  authToken: string;
  cursor?: string | null;
  limit?: number;
}): Promise<AdminLogListResponse<ActivityLogRecord>> =>
  callAdminLogList<ActivityLogRecord>({
    authToken: payload.authToken,
    endpoint: ADMIN_ACTIVITY_LOGS_ENDPOINT,
    cursor: payload.cursor,
    limit: payload.limit,
    timestampFields: ['createdAt'],
  });
