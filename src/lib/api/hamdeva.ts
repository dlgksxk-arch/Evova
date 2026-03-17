import type { User } from 'firebase/auth';
import type {
  CheckoutProductId,
  CheckoutSessionResponse,
  CheckoutSessionStatusResponse,
  CreditBootstrapResponse,
  SubjectType,
  TryOnResponse,
  UserCreationRecord,
  VideoGenerationResponse,
} from '../../types/hamdeva';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim().replace(/\/+$/, '') || '';
const apiUrl = (path: string): string => `${API_BASE_URL}${path}`;

const TRYON_ENDPOINT = apiUrl('/api/tryon');
const BOOTSTRAP_ENDPOINT = apiUrl('/api/bootstrap');
const CLASSIFY_SUBJECT_ENDPOINT = apiUrl('/api/classify-subject');
const VIDEO_ENDPOINT = apiUrl('/api/video');
const VIDEO_STATUS_ENDPOINT = apiUrl('/api/video-status');
const VIDEO_CONTENT_ENDPOINT = apiUrl('/api/video-content');
const POLAR_CHECKOUT_ENDPOINT = apiUrl('/api/polar/checkout');
const POLAR_SESSION_ENDPOINT = apiUrl('/api/polar/session');
const CREATIONS_ENDPOINT = apiUrl('/api/creations');

const normalizeGeneratedImage = (image: string, mimeType = 'image/png'): string =>
  image.startsWith('data:') ? image : `data:${mimeType};base64,${image}`;

const parseApiError = async (res: Response): Promise<Error> => {
  const errBody = await res.json().catch(() => ({})) as { error?: string; message?: string };
  if (errBody.error === 'PAYMENT_REQUIRED' || errBody.error === 'INSUFFICIENT_CREDITS') {
    return new Error('PAYMENT_REQUIRED');
  }
  if (errBody.error === 'AUTH_REQUIRED') {
    return new Error('AUTH_REQUIRED');
  }
  if (errBody.error === 'DUPLICATE_REQUEST') {
    return new Error('DUPLICATE_REQUEST');
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

export const callVideoGeneration = async (payload: {
  authToken: string;
  image: string;
  requestId: string;
  subjectType: SubjectType;
  sourceResultId?: string | null;
}): Promise<VideoGenerationResponse> => {
  const res = await fetch(VIDEO_ENDPOINT, {
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

  return await res.json() as VideoGenerationResponse;
};

export const pollVideoGeneration = async (
  authToken: string,
  requestId: string,
): Promise<VideoGenerationResponse & { contentUrl?: string }> => {
  const res = await fetch(`${VIDEO_STATUS_ENDPOINT}?requestId=${encodeURIComponent(requestId)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!res.ok) {
    throw await parseApiError(res);
  }

  return await res.json() as VideoGenerationResponse & { contentUrl?: string };
};

export const fetchVideoBlobUrl = async (authToken: string, requestId: string): Promise<string> => {
  const res = await fetch(`${VIDEO_CONTENT_ENDPOINT}?requestId=${encodeURIComponent(requestId)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!res.ok) {
    throw await parseApiError(res);
  }

  return URL.createObjectURL(await res.blob());
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
