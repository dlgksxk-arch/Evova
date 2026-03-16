import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

admin.initializeApp();
const db = admin.firestore();

const CORS_ORIGIN = [
  'https://hamdeva.com',
  'https://www.hamdeva.com',
  'https://hamdeva.web.app',
  'https://hamdeva.firebaseapp.com',
  'https://hamdeva.dlgksxk.workers.dev',
];
const OPENAI_CONFIG_ERROR = 'IMAGE_GENERATION_NOT_CONFIGURED';
const OPENAI_CONFIG_MESSAGE = 'OpenAI API key is missing. Set OPENAI_API_KEY or firebase functions:config:set openai.key="YOUR_OPENAI_API_KEY".';
const AUTH_REQUIRED_MESSAGE = '로그인이 필요합니다.';
const NOT_ENOUGH_CREDITS_ERROR = 'INSUFFICIENT_CREDITS';
const NOT_ENOUGH_CREDITS_MESSAGE = '크레딧이 부족합니다.';
const DUPLICATE_REQUEST_ERROR = 'DUPLICATE_REQUEST';
const DUPLICATE_REQUEST_MESSAGE = '이미 처리 중인 생성 요청입니다.';
const DUPLICATE_GENERATION_WINDOW_MS = 30_000;
const GENERATION_COST = 100;
const SIGNUP_BONUS_CREDITS = 300;
const DAILY_BASE_CREDITS = 300;
const SEOUL_TIME_ZONE = 'Asia/Seoul';
const OPENAI_IMAGE_MODEL = process.env['OPENAI_IMAGE_MODEL'] ?? 'gpt-image-1';
const OPENAI_IMAGE_SIZE = '1536x1024';
const OPENAI_IMAGE_QUALITY = 'medium';
const SUBSCRIPTION_DAILY_BONUS = {
  free: 0,
  basic: 500,
  pro: 1500,
} as const;
const ADMIN_EMAILS = new Set(['dlgksxk@gmail.com']);
const OPENAI_IMAGE_TOKEN_PRICING = {
  'gpt-image-1': { inputPer1M: 10, outputPer1M: 40 },
  'gpt-image-1-mini': { inputPer1M: 2.5, outputPer1M: 8 },
  'gpt-image-1.5': { inputPer1M: 8, outputPer1M: 32 },
  'chatgpt-image-latest': { inputPer1M: 8, outputPer1M: 32 },
} as const;
const OPENAI_IMAGE_UNIT_PRICING = {
  'gpt-image-1': {
    low: { '1024x1024': 0.011, '1024x1536': 0.016, '1536x1024': 0.016 },
    medium: { '1024x1024': 0.042, '1024x1536': 0.063, '1536x1024': 0.063 },
    high: { '1024x1024': 0.167, '1024x1536': 0.25, '1536x1024': 0.25 },
  },
  'gpt-image-1-mini': {
    low: { '1024x1024': 0.005, '1024x1536': 0.006, '1536x1024': 0.006 },
    medium: { '1024x1024': 0.011, '1024x1536': 0.015, '1536x1024': 0.015 },
    high: { '1024x1024': 0.036, '1024x1536': 0.052, '1536x1024': 0.052 },
  },
  'gpt-image-1.5': {
    low: { '1024x1024': 0.009, '1024x1536': 0.013, '1536x1024': 0.013 },
    medium: { '1024x1024': 0.034, '1024x1536': 0.05, '1536x1024': 0.05 },
    high: { '1024x1024': 0.133, '1024x1536': 0.2, '1536x1024': 0.2 },
  },
  'chatgpt-image-latest': {
    low: { '1024x1024': 0.009, '1024x1536': 0.013, '1536x1024': 0.013 },
    medium: { '1024x1024': 0.034, '1024x1536': 0.05, '1536x1024': 0.05 },
    high: { '1024x1024': 0.133, '1024x1536': 0.2, '1536x1024': 0.2 },
  },
} as const;

type SubscriptionPlan = keyof typeof SUBSCRIPTION_DAILY_BONUS;
type AccountRole = 'user' | 'admin';
type CreditLogType =
  | 'signup_bonus'
  | 'daily_reward'
  | 'subscription_bonus'
  | 'generate_use'
  | 'generate_refund'
  | 'admin_adjust';
type OpenAIKeySource = 'env' | 'config' | 'missing';
type OpenAIKeyState = {
  key: string;
  source: OpenAIKeySource;
};
type BodyProfile = {
  gender?: 'female' | 'male' | 'dog' | 'cat';
  heightCm?: number;
  weightKg?: number;
};
type AuthenticatedUser = {
  uid: string;
  email: string;
};
type UserAccount = {
  email: string;
  credits: number;
  isSubscribed: boolean;
  subscriptionPlan: SubscriptionPlan;
  role: AccountRole;
  createdAt?: FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue | null;
  lastDailyRewardAt?: FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue | null;
  lastLoginAt?: FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue | null;
};
type BootstrapResult = {
  profile: {
    credits: number;
    isSubscribed: boolean;
    subscriptionPlan: SubscriptionPlan;
    role: AccountRole;
  };
  signupBonusGranted: number;
  dailyRewardGranted: number;
  subscriptionBonusGranted: number;
};
type ChargeResult = BootstrapResult & {
  requestId: string;
  creditsAfterCharge: number;
};
type RefundResult = {
  refunded: boolean;
  balanceAfter: number | null;
};
type GenerationUsageMetadata = {
  model: string;
  quality: string;
  size: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
  estimatedCost: number | null;
};

interface OpenAIImageResponse {
  model?: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
  data?: {
    b64_json?: string;
  }[];
  error?: {
    message?: string;
  };
}

let lastLoggedOpenAIKeySource: OpenAIKeySource | null = null;

const formatSeoulDateKey = (date: Date): string => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: SEOUL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const partMap = parts.reduce<Record<string, string>>((acc, part) => {
    if (part.type !== 'literal') {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});

  return `${partMap.year}-${partMap.month}-${partMap.day}`;
};

const getTodayKeyInSeoul = (): string => formatSeoulDateKey(new Date());

const timestampToSeoulDateKey = (value: unknown): string | null => {
  if (value instanceof admin.firestore.Timestamp) {
    return formatSeoulDateKey(value.toDate());
  }

  return null;
};

const normalizeSubscriptionPlan = (value: unknown): SubscriptionPlan => {
  if (typeof value === 'string' && value in SUBSCRIPTION_DAILY_BONUS) {
    return value as SubscriptionPlan;
  }

  return 'free';
};

const normalizeAccountRole = (value: unknown, email: string): AccountRole => {
  if (value === 'admin') {
    return 'admin';
  }

  return ADMIN_EMAILS.has(email.toLowerCase()) ? 'admin' : 'user';
};

const getDailyCreditReward = (plan: SubscriptionPlan): { base: number; subscriptionBonus: number; total: number } => {
  const subscriptionBonus = SUBSCRIPTION_DAILY_BONUS[plan];
  return {
    base: DAILY_BASE_CREDITS,
    subscriptionBonus,
    total: DAILY_BASE_CREDITS + subscriptionBonus,
  };
};

const normalizeUserAccount = (email: string, data?: FirebaseFirestore.DocumentData): UserAccount => {
  const subscriptionPlan = normalizeSubscriptionPlan(data?.subscriptionPlan);
  const isSubscribed = data?.isSubscribed === true || subscriptionPlan !== 'free';

  return {
    email: typeof data?.email === 'string' && data.email ? data.email : email,
    credits: typeof data?.credits === 'number' && Number.isFinite(data.credits) ? data.credits : 0,
    isSubscribed,
    subscriptionPlan: isSubscribed ? subscriptionPlan : 'free',
    role: normalizeAccountRole(data?.role, email),
    createdAt: data?.createdAt ?? null,
    lastDailyRewardAt: data?.lastDailyRewardAt ?? null,
    lastLoginAt: data?.lastLoginAt ?? null,
  };
};

const getOpenAIApiKeyState = (): OpenAIKeyState => {
  const envKey = process.env['OPENAI_API_KEY'];
  if (typeof envKey === 'string' && envKey.trim()) {
    return { key: envKey.trim(), source: 'env' };
  }

  const configKey = functions.config()?.openai?.key;
  if (typeof configKey === 'string' && configKey.trim()) {
    return { key: configKey.trim(), source: 'config' };
  }

  return { key: '', source: 'missing' };
};

const logOpenAIApiKeySource = (source: OpenAIKeySource): void => {
  if (source === lastLoggedOpenAIKeySource) {
    return;
  }

  lastLoggedOpenAIKeySource = source;
  functions.logger.info('openai api key source resolved', { source });
};

const getOpenAIApiKey = (): string => {
  const state = getOpenAIApiKeyState();
  logOpenAIApiKeySource(state.source);
  return state.key;
};

const roundEstimatedCost = (value: number): number =>
  Math.round(value * 1_000_000) / 1_000_000;

const estimateOpenAIImageCost = (
  model: string,
  quality: string,
  size: string,
  usage?: { input_tokens?: number; output_tokens?: number },
): number | null => {
  const normalizedModel = model.trim();
  const inputTokens = typeof usage?.input_tokens === 'number' && Number.isFinite(usage.input_tokens)
    ? Math.max(0, usage.input_tokens)
    : 0;
  const outputTokens = typeof usage?.output_tokens === 'number' && Number.isFinite(usage.output_tokens)
    ? Math.max(0, usage.output_tokens)
    : 0;
  const tokenPricing = OPENAI_IMAGE_TOKEN_PRICING[normalizedModel as keyof typeof OPENAI_IMAGE_TOKEN_PRICING];

  if (tokenPricing && (inputTokens > 0 || outputTokens > 0)) {
    return roundEstimatedCost(
      (inputTokens / 1_000_000) * tokenPricing.inputPer1M
      + (outputTokens / 1_000_000) * tokenPricing.outputPer1M,
    );
  }

  const qualityPricing = OPENAI_IMAGE_UNIT_PRICING[normalizedModel as keyof typeof OPENAI_IMAGE_UNIT_PRICING];
  const sizePricing = qualityPricing?.[quality as keyof typeof qualityPricing];
  const fallback = sizePricing?.[size as keyof typeof sizePricing];
  return typeof fallback === 'number' ? roundEstimatedCost(fallback) : null;
};

const buildTryOnPrompt = (bodyProfile?: BodyProfile): string => {
  const subjectType = bodyProfile?.gender === 'dog' || bodyProfile?.gender === 'cat' ? 'pet' : 'person';
  const identityGuide = subjectType === 'pet'
    ? [
        'Use the first input image as the identity anchor for the exact same pet.',
        'Preserve the same face, fur pattern, species traits, body shape, proportions, and overall identity.',
        'Do not invent a new animal, do not stylize, and do not change the identity in any panel.',
      ].join(' ')
    : [
        'Use the uploaded face photo as the identity anchor and the uploaded clothing image as the outfit reference.',
        'Create a realistic virtual fitting image of the exact same person from the uploaded face photo.',
        'Identity preservation is the highest priority.',
        'Strict identity rules: keep the same person.',
        'Preserve the exact identity and facial resemblance of the uploaded face.',
        'Do not invent a new face.',
        'Do not change ethnicity.',
        'Do not change age.',
        'Do not beautify, idealize, or stylize the face.',
        'Do not make the person look like a different model.',
        'Keep the same eyes, nose, mouth, jawline, chin shape, cheek structure, face shape, skin tone, forehead ratio, eye spacing, lip shape, and hairline.',
        'Keep the same overall likeness and real-person appearance.',
        'If there is any conflict between fashion styling and facial identity, preserve facial identity first.',
      ].join(' ');
  const bodyGuide = [
    bodyProfile?.heightCm ? `Reflect a natural body proportion using ${bodyProfile.heightCm} cm height as guidance.` : null,
    bodyProfile?.weightKg ? `Reflect a natural body volume using ${bodyProfile.weightKg} kg weight as guidance.` : null,
  ].filter(Boolean).join(' ');

  return [
    identityGuide,
    'Garment transfer rules: transfer only the outfit from the uploaded clothing image.',
    'Preserve the garment color, silhouette, texture, visible ornament details, sleeve shape, skirt volume, top-to-bottom proportions, and overall design.',
    'Do not replace the outfit with a different design.',
    'Keep the clothing faithful to the reference image.',
    'Output requirements: generate one clean 1x4 fashion lookbook grid.',
    'The same person must appear in all 4 panels.',
    'Keep the face consistent across all 4 panels.',
    'Keep the body proportions consistent across all 4 panels.',
    'Panel 1: front view.',
    'Panel 2: 3/4 front view.',
    'Panel 3: side or semi-back view.',
    'Panel 4: back view.',
    'Style requirements: realistic studio photo.',
    'Natural lighting.',
    'Clean simple background.',
    'Full-body fitting result.',
    'Realistic fabric appearance.',
    'No illustration.',
    'No cartoon.',
    'No fantasy styling.',
    'No extra accessories unless clearly visible in the clothing reference.',
    'Face consistency constraints: The uploaded face photo must remain the identity source.',
    'Do not reinterpret the face.',
    'Do not optimize the face for beauty.',
    'Do not change the person into a more glamorous or more generic fashion model.',
    'Keep the facial geometry close to the uploaded face.',
    'Same person in all 4 panels. No panel may show a different face.',
    bodyGuide,
  ].filter(Boolean).join(' ');
};

const parseDataUrl = (input: string): { mimeType: string; data: string } => {
  if (input.startsWith('data:')) {
    const [header, data = ''] = input.split(',', 2);
    return {
      mimeType: header.split(';')[0].replace('data:', ''),
      data,
    };
  }

  return { mimeType: 'image/png', data: input };
};

const mimeTypeToExtension = (mimeType: string): string => {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/webp':
      return 'webp';
    default:
      return 'png';
  }
};

const toImageBlob = (input: string, fallbackName: string): { blob: Blob; filename: string } => {
  const { mimeType, data } = parseDataUrl(input);
  const buffer = Buffer.from(data, 'base64');

  return {
    blob: new Blob([buffer], { type: mimeType }),
    filename: `${fallbackName}.${mimeTypeToExtension(mimeType)}`,
  };
};

const requestOpenAIComposite = async (
  personImage: string,
  garmentImage: string,
  bodyProfile?: BodyProfile,
): Promise<{ mimeType: string; data: string; metadata: GenerationUsageMetadata }> => {
  if (!personImage || !garmentImage) {
    throw new Error('Both face image and clothing image are required.');
  }

  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    throw new Error(OPENAI_CONFIG_MESSAGE);
  }

  const garmentFile = toImageBlob(garmentImage, 'garment');
  const personFile = toImageBlob(personImage, 'person');
  const formData = new FormData();

  formData.append('model', OPENAI_IMAGE_MODEL);
  formData.append('prompt', buildTryOnPrompt(bodyProfile));
  formData.append('image[]', personFile.blob, personFile.filename);
  formData.append('image[]', garmentFile.blob, garmentFile.filename);
  formData.append('size', OPENAI_IMAGE_SIZE);
  formData.append('quality', OPENAI_IMAGE_QUALITY);
  formData.append('output_format', 'png');
  formData.append('background', 'opaque');
  formData.append('n', '1');
  if (OPENAI_IMAGE_MODEL === 'gpt-image-1') {
    formData.append('input_fidelity', 'high');
  }

  functions.logger.info('openai image edit request', {
    model: OPENAI_IMAGE_MODEL,
    endpoint: '/v1/images/edits',
    size: OPENAI_IMAGE_SIZE,
    quality: OPENAI_IMAGE_QUALITY,
    hasGarmentImage: Boolean(garmentImage),
    hasPersonImage: Boolean(personImage),
  });

  const openAIRes = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  const responseBody = await openAIRes.json().catch(() => ({})) as OpenAIImageResponse;
  functions.logger.info('openai image edit response', {
    model: OPENAI_IMAGE_MODEL,
    endpoint: '/v1/images/edits',
    status: openAIRes.status,
    usage: responseBody.usage ?? null,
  });
  if (!openAIRes.ok) {
    functions.logger.error('OpenAI image edit error', responseBody);
    throw new Error(responseBody.error?.message || `OpenAI API error ${openAIRes.status}`);
  }

  const image = responseBody.data?.[0]?.b64_json;
  if (!image || image.length < 1000) {
    throw new Error('OpenAI response did not include a usable image.');
  }

  const usage = {
    input_tokens: typeof responseBody.usage?.input_tokens === 'number' ? responseBody.usage.input_tokens : 0,
    output_tokens: typeof responseBody.usage?.output_tokens === 'number' ? responseBody.usage.output_tokens : 0,
  };

  return {
    mimeType: 'image/png',
    data: image,
    metadata: {
      model: responseBody.model || OPENAI_IMAGE_MODEL,
      quality: OPENAI_IMAGE_QUALITY,
      size: OPENAI_IMAGE_SIZE,
      usage,
      estimatedCost: estimateOpenAIImageCost(
        responseBody.model || OPENAI_IMAGE_MODEL,
        OPENAI_IMAGE_QUALITY,
        OPENAI_IMAGE_SIZE,
        usage,
      ),
    },
  };
};

const setCors = (req: functions.https.Request, res: functions.Response) => {
  const origin = req.headers.origin || '';
  if (CORS_ORIGIN.includes(origin) || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('cloudworkstations.dev')) {
    res.set('Access-Control-Allow-Origin', origin);
  } else {
    res.set('Access-Control-Allow-Origin', CORS_ORIGIN[0]);
  }
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.set('Access-Control-Allow-Credentials', 'true');
};

const getAuthHeaderToken = (req: functions.https.Request): string => {
  const header = req.get('Authorization') ?? req.get('authorization') ?? '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? '';
};

const requireAuthenticatedUser = async (req: functions.https.Request): Promise<AuthenticatedUser> => {
  const idToken = getAuthHeaderToken(req);
  if (!idToken) {
    throw new Error('AUTH_REQUIRED');
  }

  const decoded = await admin.auth().verifyIdToken(idToken);
  return {
    uid: decoded.uid,
    email: decoded.email ?? '',
  };
};

const createCreditLogRef = () => db.collection('creditLogs').doc();

const writeCreditLog = (
  transaction: FirebaseFirestore.Transaction,
  uid: string,
  email: string,
  type: CreditLogType,
  amount: number,
  balanceAfter: number,
  note: string,
) => {
  transaction.set(createCreditLogRef(), {
    uid,
    email,
    type,
    amount,
    balanceAfter,
    note,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
};

const bootstrapUserCredits = async (user: AuthenticatedUser): Promise<BootstrapResult> => {
  const userRef = db.collection('users').doc(user.uid);
  const todayKey = getTodayKeyInSeoul();
  const result: BootstrapResult = {
    profile: {
      credits: 0,
      isSubscribed: false,
      subscriptionPlan: 'free',
      role: 'user',
    },
    signupBonusGranted: 0,
    dailyRewardGranted: 0,
    subscriptionBonusGranted: 0,
  };

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(userRef);
    const currentProfile = normalizeUserAccount(user.email, snapshot.data());
    let nextCredits = currentProfile.credits;

    if (!snapshot.exists) {
      nextCredits += SIGNUP_BONUS_CREDITS;
      result.signupBonusGranted = SIGNUP_BONUS_CREDITS;
      writeCreditLog(transaction, user.uid, user.email || currentProfile.email, 'signup_bonus', SIGNUP_BONUS_CREDITS, nextCredits, 'signup bonus');
    }

    const lastDailyRewardKey = timestampToSeoulDateKey(currentProfile.lastDailyRewardAt);
    if (lastDailyRewardKey !== todayKey) {
      const reward = getDailyCreditReward(currentProfile.subscriptionPlan);
      nextCredits += reward.base;
      result.dailyRewardGranted = reward.base;
      writeCreditLog(transaction, user.uid, user.email || currentProfile.email, 'daily_reward', reward.base, nextCredits, `daily reward ${todayKey}`);

      if (reward.subscriptionBonus > 0) {
        nextCredits += reward.subscriptionBonus;
        result.subscriptionBonusGranted = reward.subscriptionBonus;
        writeCreditLog(
          transaction,
          user.uid,
          user.email || currentProfile.email,
          'subscription_bonus',
          reward.subscriptionBonus,
          nextCredits,
          `subscription bonus ${currentProfile.subscriptionPlan} ${todayKey}`,
        );
      }
    }

    const updatePayload: Record<string, unknown> = {
      email: user.email || currentProfile.email,
      credits: nextCredits,
      isSubscribed: currentProfile.isSubscribed,
      subscriptionPlan: currentProfile.subscriptionPlan,
      role: currentProfile.role,
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (!snapshot.exists) {
      updatePayload['createdAt'] = admin.firestore.FieldValue.serverTimestamp();
    }
    if (result.dailyRewardGranted > 0 || result.subscriptionBonusGranted > 0) {
      updatePayload['lastDailyRewardAt'] = admin.firestore.FieldValue.serverTimestamp();
    }

    transaction.set(userRef, updatePayload, { merge: true });

    result.profile = {
      credits: nextCredits,
      isSubscribed: currentProfile.isSubscribed,
      subscriptionPlan: currentProfile.subscriptionPlan,
      role: currentProfile.role,
    };
  });

  return result;
};

const buildGenerationRequestDocId = (uid: string, requestId: string): string =>
  `${uid}_${requestId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

const isRecentTimestamp = (value: unknown, windowMs = DUPLICATE_GENERATION_WINDOW_MS): boolean => {
  if (!(value instanceof admin.firestore.Timestamp)) {
    return false;
  }

  return Date.now() - value.toDate().getTime() < windowMs;
};

const beginGenerationCharge = async (
  user: AuthenticatedUser,
  requestId: string,
): Promise<ChargeResult> => {
  if (!requestId) {
    throw new Error(DUPLICATE_REQUEST_ERROR);
  }

  const userRef = db.collection('users').doc(user.uid);
  const requestRef = db.collection('generationRequests').doc(buildGenerationRequestDocId(user.uid, requestId));
  const generationLockRef = db.collection('generationLocks').doc(user.uid);
  const todayKey = getTodayKeyInSeoul();
  const result: ChargeResult = {
    profile: {
      credits: 0,
      isSubscribed: false,
      subscriptionPlan: 'free',
      role: 'user',
    },
    signupBonusGranted: 0,
    dailyRewardGranted: 0,
    subscriptionBonusGranted: 0,
    requestId,
    creditsAfterCharge: 0,
  };

  await db.runTransaction(async (transaction) => {
    const [userSnapshot, requestSnapshot, generationLockSnapshot] = await Promise.all([
      transaction.get(userRef),
      transaction.get(requestRef),
      transaction.get(generationLockRef),
    ]);

    if (requestSnapshot.exists) {
      throw new Error(DUPLICATE_REQUEST_ERROR);
    }

    if (generationLockSnapshot.exists) {
      const lockData = generationLockSnapshot.data();
      const lastAttemptAt = lockData?.updatedAt ?? lockData?.startedAt;
      const lockStatus = typeof lockData?.status === 'string' ? lockData.status : 'charged';
      const shouldBlockDuplicate = lockStatus === 'charged' || lockStatus === 'processing';
      if (shouldBlockDuplicate && isRecentTimestamp(lastAttemptAt)) {
        throw new Error(DUPLICATE_REQUEST_ERROR);
      }
    }

    const currentProfile = normalizeUserAccount(user.email, userSnapshot.data());
    let nextCredits = currentProfile.credits;
    const generationCost = GENERATION_COST;

    if (!userSnapshot.exists) {
      nextCredits += SIGNUP_BONUS_CREDITS;
      result.signupBonusGranted = SIGNUP_BONUS_CREDITS;
      writeCreditLog(transaction, user.uid, user.email || currentProfile.email, 'signup_bonus', SIGNUP_BONUS_CREDITS, nextCredits, 'signup bonus');
    }

    const lastDailyRewardKey = timestampToSeoulDateKey(currentProfile.lastDailyRewardAt);
    if (lastDailyRewardKey !== todayKey) {
      const reward = getDailyCreditReward(currentProfile.subscriptionPlan);
      nextCredits += reward.base;
      result.dailyRewardGranted = reward.base;
      writeCreditLog(transaction, user.uid, user.email || currentProfile.email, 'daily_reward', reward.base, nextCredits, `daily reward ${todayKey}`);

      if (reward.subscriptionBonus > 0) {
        nextCredits += reward.subscriptionBonus;
        result.subscriptionBonusGranted = reward.subscriptionBonus;
        writeCreditLog(
          transaction,
          user.uid,
          user.email || currentProfile.email,
          'subscription_bonus',
          reward.subscriptionBonus,
          nextCredits,
          `subscription bonus ${currentProfile.subscriptionPlan} ${todayKey}`,
        );
      }
    }

    if (nextCredits < generationCost) {
      throw new Error(NOT_ENOUGH_CREDITS_ERROR);
    }

    nextCredits -= generationCost;
    if (generationCost > 0) {
      writeCreditLog(transaction, user.uid, user.email || currentProfile.email, 'generate_use', -generationCost, nextCredits, `generate request ${requestId}`);
    }

    const updatePayload: Record<string, unknown> = {
      email: user.email || currentProfile.email,
      credits: nextCredits,
      isSubscribed: currentProfile.isSubscribed,
      subscriptionPlan: currentProfile.subscriptionPlan,
      role: currentProfile.role,
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (!userSnapshot.exists) {
      updatePayload['createdAt'] = admin.firestore.FieldValue.serverTimestamp();
    }
    if (result.dailyRewardGranted > 0 || result.subscriptionBonusGranted > 0) {
      updatePayload['lastDailyRewardAt'] = admin.firestore.FieldValue.serverTimestamp();
    }

    transaction.set(userRef, updatePayload, { merge: true });
    transaction.set(requestRef, {
      uid: user.uid,
      email: user.email || currentProfile.email,
      requestId,
      cost: generationCost,
      model: OPENAI_IMAGE_MODEL,
      quality: OPENAI_IMAGE_QUALITY,
      size: OPENAI_IMAGE_SIZE,
      usage: {
        input_tokens: 0,
        output_tokens: 0,
      },
      estimatedCost: null,
      status: 'charged',
      success: false,
      refunded: false,
      role: currentProfile.role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    transaction.set(generationLockRef, {
      uid: user.uid,
      email: user.email || currentProfile.email,
      requestId,
      status: 'charged',
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    result.profile = {
      credits: nextCredits,
      isSubscribed: currentProfile.isSubscribed,
      subscriptionPlan: currentProfile.subscriptionPlan,
      role: currentProfile.role,
    };
    result.creditsAfterCharge = nextCredits;
  });

  return result;
};

const markGenerationCompleted = async (
  user: AuthenticatedUser,
  requestId: string,
  metadata: GenerationUsageMetadata,
): Promise<void> => {
  const requestRef = db.collection('generationRequests').doc(buildGenerationRequestDocId(user.uid, requestId));
  const generationLockRef = db.collection('generationLocks').doc(user.uid);
  await requestRef.set({
    model: metadata.model,
    quality: metadata.quality,
    size: metadata.size,
    usage: metadata.usage,
    estimatedCost: metadata.estimatedCost,
    status: 'completed',
    success: true,
    refunded: false,
    completedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  await generationLockRef.set({
    requestId,
    status: 'completed',
    releasedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
};

const refundGenerationCharge = async (user: AuthenticatedUser, requestId: string, errorMessage: string): Promise<RefundResult> => {
  const userRef = db.collection('users').doc(user.uid);
  const requestRef = db.collection('generationRequests').doc(buildGenerationRequestDocId(user.uid, requestId));
  const generationLockRef = db.collection('generationLocks').doc(user.uid);
  const result: RefundResult = {
    refunded: false,
    balanceAfter: null,
  };

  await db.runTransaction(async (transaction) => {
    const [userSnapshot, requestSnapshot] = await Promise.all([
      transaction.get(userRef),
      transaction.get(requestRef),
    ]);

    if (!userSnapshot.exists || !requestSnapshot.exists) {
      return;
    }

    const requestData = requestSnapshot.data();
    if (requestData?.status !== 'charged') {
      const currentProfile = normalizeUserAccount(user.email, userSnapshot.data());
      result.balanceAfter = currentProfile.credits;
      return;
    }

    const currentProfile = normalizeUserAccount(user.email, userSnapshot.data());
    const chargedCost = typeof requestData?.cost === 'number' && Number.isFinite(requestData.cost)
      ? Math.max(0, requestData.cost)
      : GENERATION_COST;
    const nextCredits = currentProfile.credits + chargedCost;

    transaction.set(userRef, {
      credits: nextCredits,
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    transaction.set(requestRef, {
      status: 'refunded',
      success: false,
      refunded: true,
      errorMessage,
      refundedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    transaction.set(generationLockRef, {
      requestId,
      status: 'refunded',
      releasedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    if (chargedCost > 0) {
      writeCreditLog(transaction, user.uid, user.email || currentProfile.email, 'generate_refund', chargedCost, nextCredits, `refund request ${requestId}`);
    }

    result.refunded = chargedCost > 0;
    result.balanceAfter = nextCredits;
  });

  return result;
};

const handleApiError = (res: functions.Response, error: unknown, fallbackStatus = 500) => {
  if (error instanceof Error && error.message === 'AUTH_REQUIRED') {
    res.status(401).json({ error: 'AUTH_REQUIRED', message: AUTH_REQUIRED_MESSAGE });
    return;
  }

  if (error instanceof Error && error.message === NOT_ENOUGH_CREDITS_ERROR) {
    res.status(402).json({ error: NOT_ENOUGH_CREDITS_ERROR, message: NOT_ENOUGH_CREDITS_MESSAGE, cost: GENERATION_COST });
    return;
  }

  if (error instanceof Error && error.message === DUPLICATE_REQUEST_ERROR) {
    res.status(409).json({ error: DUPLICATE_REQUEST_ERROR, message: DUPLICATE_REQUEST_MESSAGE });
    return;
  }

  res.status(fallbackStatus).json({
    error: error instanceof Error ? error.message : 'INTERNAL_ERROR',
    message: error instanceof Error ? error.message : 'Unexpected server error',
  });
};

const handleTryOnRequest = async (req: functions.https.Request, res: functions.Response, label: string) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  if (!getOpenAIApiKey()) {
    res.status(500).json({ error: OPENAI_CONFIG_ERROR, message: OPENAI_CONFIG_MESSAGE });
    return;
  }

  const { personImage, garmentImage, bodyProfile, requestId } = req.body as {
    personImage: string;
    garmentImage: string;
    bodyProfile?: BodyProfile;
    requestId?: string;
  };

  if (!personImage || !garmentImage || !requestId) {
    res.status(400).json({ error: '필수 파라미터가 누락되었습니다.' });
    return;
  }

  let user: AuthenticatedUser;
  try {
    user = await requireAuthenticatedUser(req);
  } catch (error) {
    handleApiError(res, error, 401);
    return;
  }

  let chargeResult: ChargeResult;
  try {
    chargeResult = await beginGenerationCharge(user, requestId);
  } catch (error) {
    handleApiError(res, error, 500);
    return;
  }

  try {
    const generatedImage = await requestOpenAIComposite(personImage, garmentImage, bodyProfile);
    await markGenerationCompleted(user, requestId, generatedImage.metadata);
    const resultDataUrl = `data:${generatedImage.mimeType};base64,${generatedImage.data}`;
    res.json({
      success: true,
      image: resultDataUrl,
      mimeType: generatedImage.mimeType,
      creditsRemaining: chargeResult.creditsAfterCharge,
      signupBonusGranted: chargeResult.signupBonusGranted,
      dailyRewardGranted: chargeResult.dailyRewardGranted,
      subscriptionBonusGranted: chargeResult.subscriptionBonusGranted,
    });
    return;
  } catch (error) {
    functions.logger.error(`OpenAI ${label} request failed`, error);
    const errorMessage = error instanceof Error ? error.message : 'OpenAI image generation failed';
    const refundResult = await refundGenerationCharge(user, requestId, errorMessage).catch((refundError) => {
      functions.logger.error('Failed to refund credits after generation error', refundError);
      return { refunded: false, balanceAfter: null } satisfies RefundResult;
    });
    const refundedMessage = refundResult.refunded ? ' 100 credits refunded due to generation failure.' : '';
    const errorCode = errorMessage === OPENAI_CONFIG_MESSAGE ? OPENAI_CONFIG_ERROR : errorMessage;
    res.status(errorMessage === OPENAI_CONFIG_MESSAGE ? 500 : 502).json({
      error: errorCode,
      message: `${errorMessage}${refundedMessage}`.trim(),
      refunded: refundResult.refunded,
      creditsRemaining: refundResult.balanceAfter ?? chargeResult.creditsAfterCharge,
    });
  }
};

export const api = functions
  .region('asia-northeast3')
  .runWith({ timeoutSeconds: 120, memory: '512MB' })
  .https.onRequest(async (req, res) => {
    setCors(req, res);
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    const path = req.path.replace(/^\/api/, '') || '/';
    functions.logger.info('api request', {
      path,
      method: req.method,
      contentType: req.get('content-type') ?? '',
    });

    if (req.method === 'POST' && path === '/bootstrap') {
      try {
        const user = await requireAuthenticatedUser(req);
        const result = await bootstrapUserCredits(user);
        res.json({ success: true, ...result, generationCost: GENERATION_COST });
      } catch (error) {
        handleApiError(res, error, 500);
      }
      return;
    }

    if (req.method === 'GET' && path === '/credits') {
      try {
        const user = await requireAuthenticatedUser(req);
        const snapshot = await db.collection('users').doc(user.uid).get();
        const profile = normalizeUserAccount(user.email, snapshot.data());
        res.json({
          credits: profile.credits,
          isSubscribed: profile.isSubscribed,
          subscriptionPlan: profile.subscriptionPlan,
          role: profile.role,
          generationCost: GENERATION_COST,
        });
      } catch (error) {
        handleApiError(res, error, 500);
      }
      return;
    }

    if (path === '/tryon' || path === '/generate') {
      await handleTryOnRequest(req, res, 'api');
      return;
    }

    res.status(404).json({ error: 'Not found' });
  });

export const generateTryOn = functions
  .region('asia-northeast3')
  .runWith({ timeoutSeconds: 120, memory: '512MB' })
  .https.onRequest(async (req, res) => {
    setCors(req, res);
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    functions.logger.info('generateTryOn request', {
      path: req.path,
      method: req.method,
      contentType: req.get('content-type') ?? '',
    });

    await handleTryOnRequest(req, res, 'generateTryOn');
  });
