import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import sharp from 'sharp';
import { Webhook } from 'standardwebhooks';

admin.initializeApp();
const db = admin.firestore();

const CORS_ORIGIN = [
  'https://hamdeva.com',
  'https://www.hamdeva.com',
  'https://hamdeva.web.app',
  'https://hamdeva.firebaseapp.com',
  'https://hamdeva.dlgksxk.workers.dev',
];
const PREVIEW_ORIGIN_SUFFIXES = ['.pages.dev', '.workers.dev'];
const OPENAI_CONFIG_ERROR = 'IMAGE_GENERATION_NOT_CONFIGURED';
const OPENAI_CONFIG_MESSAGE = 'OpenAI API key is missing. Set OPENAI_API_KEY or firebase functions:config:set openai.key="YOUR_OPENAI_API_KEY".';
const PAYMENT_CONFIG_ERROR = 'PAYMENT_NOT_CONFIGURED';
const PAYMENT_CONFIG_MESSAGE = '결제 설정이 아직 완료되지 않았습니다. 잠시 후 다시 시도해 주세요.';
const AUTH_REQUIRED_MESSAGE = '로그인이 필요합니다.';
const NOT_ENOUGH_CREDITS_ERROR = 'PAYMENT_REQUIRED';
const NOT_ENOUGH_CREDITS_MESSAGE = '크레딧이 부족합니다.';
const DUPLICATE_REQUEST_ERROR = 'DUPLICATE_REQUEST';
const DUPLICATE_REQUEST_MESSAGE = '이미 처리 중인 생성 요청입니다.';
const DUPLICATE_GENERATION_WINDOW_MS = 30_000;
const GENERATION_COST = 100;
const VIDEO_GENERATION_COST = 1500;
const DAILY_CREDIT_AMOUNT = 100;
const SIGNUP_BONUS_CREDIT_AMOUNT = 300;
const SEOUL_TIME_ZONE = 'Asia/Seoul';
const OPENAI_IMAGE_MODEL = process.env['OPENAI_IMAGE_MODEL'] ?? 'gpt-image-1';
const OPENAI_IMAGE_SIZE = '1024x1536';
const OPENAI_IMAGE_QUALITY = 'medium';
const SUBJECT_CLASSIFICATION_MODEL = process.env['OPENAI_CLASSIFICATION_MODEL'] ?? 'gpt-4.1-nano';
const VIDEO_MODEL = process.env['OPENAI_VIDEO_MODEL'] ?? 'sora-2';
const VIDEO_SECONDS = '4';
const VIDEO_SIZE = '1280x720';
const VIDEO_ESTIMATED_COST = 0.4;
const GENERATED_HISTORY_IMAGE_WIDTH = 960;
const GENERATED_RESPONSE_IMAGE_WIDTH = 1536;
const POLAR_PROVIDER = 'polar';
const PAYMENT_CURRENCY = 'usd';
const POLAR_API_BASE_URL = 'https://api.polar.sh/v1';
const SUBJECT_CLASSIFICATION_PROMPT = `Look at this uploaded subject image and determine whether the subject is a human, a dog, or a cat.
Return ONLY one word:

human
dog
cat`;
const ADMIN_EMAILS = new Set(['dlgksxk@gmail.com']);
const PAYMENT_PRODUCTS = {
  starter: {
    id: 'starter',
    amountCents: 399,
    amountUsd: 3.99,
    currency: PAYMENT_CURRENCY,
    paidCredit: 1000,
    name: 'HAMDEVA Starter Credits',
  },
  creator: {
    id: 'creator',
    amountCents: 1599,
    amountUsd: 15.99,
    currency: PAYMENT_CURRENCY,
    paidCredit: 5000,
    name: 'HAMDEVA Popular Credits',
  },
  pro: {
    id: 'pro',
    amountCents: 2999,
    amountUsd: 29.99,
    currency: PAYMENT_CURRENCY,
    paidCredit: 10000,
    name: 'HAMDEVA Pro Credits',
  },
  studio: {
    id: 'studio',
    amountCents: 5999,
    amountUsd: 59.99,
    currency: PAYMENT_CURRENCY,
    paidCredit: 25000,
    name: 'HAMDEVA Studio Credits',
  },
} as const;
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
const HUMAN_PROMPT = `Create a single full-body fashion photograph.

The first uploaded image is the face reference image.
The second uploaded image is the clothing reference image.

Identity preservation is the highest priority.
Use the exact same person from the face reference image.
Keep the exact same identity, face shape, eyes, nose, lips, skin tone, and hairstyle.
Do not change the person into a different model.
Do not beautify the face into a different face.
Do not alter facial structure.
Keep the face truly recognizable as the same person.

Dress that same person in the clothing from the clothing reference image.
Preserve the uploaded clothing exactly as shown in the clothing reference image.
Do not redesign the outfit.
Do not change the outfit's design, color, pattern, silhouette, or material appearance.
Do not invent a different outfit.
Do not ignore the uploaded clothing reference.

Natural attractive light makeup.
A gentle natural smile.
An elegant but slightly more active fashion pose that matches the outfit concept.
A fitting background that supports the outfit without distracting from it.
Balanced head-to-body ratio.

One model only.
One image only.
Full body visible from head to toe.
Show the entire head, full hair, full body, both hands, both feet, and the complete outfit inside the frame.
Show the complete hairstyle and all hair volume clearly inside the frame.
Use a slightly wider, zoomed-out camera framing so the subject is fully visible.
Use a wider full-body long shot instead of a close fashion crop.
Frame the shot with clear space above the head and below the feet.
Leave noticeable margin above the hair and below the shoes.
Use a tall portrait composition with generous headroom above the hairstyle.
Keep extra empty space above the head so the hairstyle never feels cramped.
Keep the full silhouette comfortably inside the image boundaries.
Do not crop the top of the head, any part of the hair, arms, hands, legs, or feet.
Leave comfortable space around the subject so the full body fits naturally in frame.
Avoid close-up or tight crop composition.
No face distortion.
No identity change.`;
const DOG_PROMPT = `Use the first input image as the animal identity reference and the second input image as the outfit reference.

Generate a single realistic full-body fashion image of the same dog wearing an adapted version of the referenced outfit.

Requirements:
- preserve the exact dog identity, breed appearance, fur pattern, and face
- preserve the clothing color, silhouette, and design as closely as possible
- adapt the outfit naturally to a dog body
- use a fashion pose and cinematic background that match the outfit concept
- keep balanced body proportions
- use professional lighting
- single subject only
- full body shot
- one image only
- no collage, no duplicate subject, no cartoon styling`;
const CAT_PROMPT = `Use the first input image as the animal identity reference and the second input image as the outfit reference.

Generate a single realistic full-body fashion image of the same cat wearing an adapted version of the referenced outfit.

Requirements:
- preserve the exact cat identity, fur markings, and face
- preserve the clothing color, silhouette, and design as closely as possible
- adapt the outfit naturally to a cat body
- use a fashion pose and cinematic background that match the outfit concept
- keep balanced body proportions
- use professional lighting
- single subject only
- full body shot
- one image only
- no collage, no duplicate subject, no cartoon styling`;
const VIDEO_PROMPT_TEMPLATE = `Use the generated outfit image as the identity and outfit reference.

Create a short cinematic fashion showcase video of the exact same subject wearing the exact same outfit.

Identity preservation is critical.
Keep the same subject, same face or same animal identity, same body proportions, and same outfit details across all frames.

The subject should make subtle, natural fashion-presentation movements such as a gentle turn, slight step, or pose shift.

Keep motion smooth and realistic.
Do not change the outfit design.
Do not change the subject identity.
Do not invent a different face, animal, or body shape.

Choose a realistic background that matches the mood and style of the outfit, with natural lighting and visually balanced composition.

Create a short fashion showcase clip, approximately 3 to 5 seconds long.`;

type SubscriptionPlan = 'free' | 'basic' | 'pro';
type AccountRole = 'user' | 'admin';
type SubjectType = 'human' | 'dog' | 'cat';
type GenerationRequestType = 'image_generation' | 'video_generation';
type CreditType = 'daily' | 'paid';
type CreditTransactionType =
  | 'daily_reset'
  | 'charge'
  | 'use_daily'
  | 'use_paid'
  | 'refund';
type PaymentProductId = keyof typeof PAYMENT_PRODUCTS;
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'canceled';
type PaymentProvider = 'polar';
type OpenAIKeySource = 'env' | 'config' | 'missing';
type OpenAIKeyState = {
  key: string;
  source: OpenAIKeySource;
};
type BodyProfile = {
  gender?: 'female' | 'male' | 'dog' | 'cat';
  subjectType?: SubjectType;
  heightCm?: number;
  weightKg?: number;
};
type AuthenticatedUser = {
  uid: string;
  email: string;
};
type UserAccount = {
  email: string;
  dailyCredit: number;
  paidCredit: number;
  credits: number;
  totalGenerated: number;
  isSubscribed: boolean;
  subscriptionPlan: SubscriptionPlan;
  role: AccountRole;
  createdAt?: FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue | null;
  lastDailyResetAt?: FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue | null;
  lastLoginAt?: FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue | null;
  updatedAt?: FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue | null;
};
type BootstrapResult = {
  profile: {
    dailyCredit: number;
    paidCredit: number;
    credits: number;
    totalGenerated: number;
    isSubscribed: boolean;
    subscriptionPlan: SubscriptionPlan;
    role: AccountRole;
  };
  dailyRewardGranted: number;
  signupBonusGranted: number;
};
type ApiBonusFields = {
  dailyRewardGranted: number;
  signupBonusGranted: number;
  subscriptionBonusGranted: number;
};
type BootstrapResponse = BootstrapResult & ApiBonusFields & {
  success: true;
  generationCost: number;
  videoGenerationCost: number;
};
type TryOnSuccessResponse = ApiBonusFields & {
  success: true;
  image: string;
  mimeType: string;
  subjectType: SubjectType;
  usedCreditType: CreditType;
  watermarkApplied: boolean;
  dailyCredit: number;
  paidCredit: number;
  creditsRemaining: number;
  totalGenerated: number;
};
type ChargeResult = BootstrapResult & {
  requestId: string;
  dailyCreditAfterCharge: number;
  paidCreditAfterCharge: number;
  creditsAfterCharge: number;
  usedCreditType: CreditType;
  chargedAmount: number;
};
type RefundResult = {
  refunded: boolean;
  dailyCreditAfter: number | null;
  paidCreditAfter: number | null;
  balanceAfter: number | null;
};
type PaymentSessionStatusResult = {
  status: PaymentStatus | 'processing';
  paymentId: string | null;
  paidCredit: number;
  dailyCredit: number | null;
  paidCreditBalance: number | null;
  totalCreditBalance: number | null;
};
type GenerationUsageMetadata = {
  type?: GenerationRequestType;
  subjectType?: SubjectType;
  model: string;
  quality: string;
  size: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
  estimatedCost: number | null;
};
type CheckoutSessionRequest = {
  productId?: PaymentProductId;
};
type PolarCheckoutRecord = {
  id?: string;
  url?: string | null;
  status?: string;
  metadata?: Record<string, unknown>;
  productPriceId?: string | null;
};
type PolarWebhookEvent = {
  type?: string;
  data?: Record<string, unknown>;
};

interface OpenAIImageResponse {
  model?: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
  data?: {
    b64_json?: string;
    url?: string;
  }[];
  error?: {
    message?: string;
  };
}

interface OpenAIClassificationResponse {
  choices?: {
    message?: {
      content?: string;
    };
  }[];
  error?: {
    message?: string;
  };
}

interface OpenAIVideoCreateResponse {
  id?: string;
  status?: string;
  error?: {
    message?: string;
  };
}

interface OpenAIVideoStatusResponse {
  id?: string;
  status?: string;
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
  if (value === 'free' || value === 'basic' || value === 'pro') {
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

const normalizeSubjectType = (value: unknown): SubjectType => {
  if (value === 'dog' || value === 'cat') {
    return value;
  }

  return 'human';
};

const isPaymentProductId = (value: unknown): value is PaymentProductId =>
  typeof value === 'string' && value in PAYMENT_PRODUCTS;

const normalizeUserAccount = (email: string, data?: FirebaseFirestore.DocumentData): UserAccount => {
  const subscriptionPlan = normalizeSubscriptionPlan(data?.subscriptionPlan);
  const isSubscribed = data?.isSubscribed === true || subscriptionPlan !== 'free';
  const legacyCredits = typeof data?.credits === 'number' && Number.isFinite(data.credits) ? Math.max(0, data.credits) : 0;
  const dailyCredit = typeof data?.dailyCredit === 'number' && Number.isFinite(data.dailyCredit)
    ? Math.max(0, data.dailyCredit)
    : 0;
  const paidCredit = typeof data?.paidCredit === 'number' && Number.isFinite(data.paidCredit)
    ? Math.max(0, data.paidCredit)
    : Math.max(0, legacyCredits);
  const credits = dailyCredit + paidCredit;

  return {
    email: typeof data?.email === 'string' && data.email ? data.email : email,
    dailyCredit,
    paidCredit,
    credits,
    totalGenerated: typeof data?.totalGenerated === 'number' && Number.isFinite(data.totalGenerated)
      ? Math.max(0, data.totalGenerated)
      : 0,
    isSubscribed,
    subscriptionPlan: isSubscribed ? subscriptionPlan : 'free',
    role: normalizeAccountRole(data?.role, email),
    createdAt: data?.createdAt ?? null,
    lastDailyResetAt: data?.lastDailyResetAt ?? data?.lastDailyRewardAt ?? null,
    lastLoginAt: data?.lastLoginAt ?? null,
    updatedAt: data?.updatedAt ?? null,
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

const getPolarApiKey = (): string => {
  const envKey = process.env['POLAR_API_KEY'];
  if (typeof envKey === 'string' && envKey.trim()) {
    return envKey.trim();
  }

  const configKey = functions.config()?.polar?.api_key;
  return typeof configKey === 'string' ? configKey.trim() : '';
};

const getPolarWebhookSecret = (): string => {
  const envKey = process.env['POLAR_WEBHOOK_SECRET'];
  if (typeof envKey === 'string' && envKey.trim()) {
    return envKey.trim();
  }

  const configKey = functions.config()?.polar?.webhook_secret;
  return typeof configKey === 'string' ? configKey.trim() : '';
};

const getPolarProductExternalId = (productId: PaymentProductId): string => {
  const envKey = process.env[`POLAR_PRODUCT_ID_${productId.toUpperCase()}`];
  if (typeof envKey === 'string' && envKey.trim()) {
    return envKey.trim();
  }

  const configuredProducts = functions.config()?.polar?.products as Record<string, unknown> | undefined;
  const configuredProductId = configuredProducts?.[productId];
  return typeof configuredProductId === 'string' ? configuredProductId.trim() : '';
};

const requirePolarConfig = (): { apiKey: string } => {
  const apiKey = getPolarApiKey();
  if (!apiKey) {
    throw new Error(PAYMENT_CONFIG_ERROR);
  }

  return { apiKey };
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

const requestSubjectClassification = async (subjectImage: string): Promise<SubjectType> => {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    throw new Error(OPENAI_CONFIG_MESSAGE);
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: SUBJECT_CLASSIFICATION_MODEL,
      temperature: 0,
      max_tokens: 5,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: SUBJECT_CLASSIFICATION_PROMPT },
            { type: 'image_url', image_url: { url: subjectImage } },
          ],
        },
      ],
    }),
  });

  const responseBody = await response.json().catch(() => ({})) as OpenAIClassificationResponse;
  if (!response.ok) {
    throw new Error(responseBody.error?.message || `OpenAI classification error ${response.status}`);
  }

  return normalizeSubjectType(responseBody.choices?.[0]?.message?.content?.trim().toLowerCase());
};

const buildTryOnPrompt = (subjectType: SubjectType, bodyProfile?: BodyProfile): string => {
  const basePrompt = subjectType === 'dog'
    ? DOG_PROMPT
    : subjectType === 'cat'
      ? CAT_PROMPT
      : HUMAN_PROMPT;
  const bodyGuide = [
    bodyProfile?.heightCm ? `Reflect a natural body proportion using ${bodyProfile.heightCm} cm height as guidance.` : null,
    bodyProfile?.weightKg ? `Reflect a natural body volume using ${bodyProfile.weightKg} kg weight as guidance.` : null,
  ].filter(Boolean).join(' ');

  return [basePrompt, bodyGuide].filter(Boolean).join('\n\n');
};

const buildVideoPrompt = (subjectType: SubjectType): string =>
  `${VIDEO_PROMPT_TEMPLATE}\n\nSubject type: ${subjectType}.`;

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

const fetchOpenAIImageOutput = async (
  image: { b64_json?: string; url?: string } | undefined,
): Promise<{ mimeType: string; data: string }> => {
  if (image?.b64_json && image.b64_json.length > 1000) {
    return {
      mimeType: 'image/png',
      data: image.b64_json,
    };
  }

  if (image?.url) {
    const response = await fetch(image.url);
    if (!response.ok) {
      throw new Error(`OpenAI image download error ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const mimeType = response.headers.get('content-type')?.split(';')[0] || 'image/png';
    return {
      mimeType,
      data: buffer.toString('base64'),
    };
  }

  throw new Error('OpenAI response did not include a usable image.');
};

const requestOpenAIComposite = async (
  personImage: string,
  garmentImage: string,
  subjectType: SubjectType,
  bodyProfile?: BodyProfile,
): Promise<{ mimeType: string; data: string; metadata: GenerationUsageMetadata }> => {
  if (!personImage || !garmentImage) {
    throw new Error('Both face image and clothing image are required.');
  }

  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    throw new Error(OPENAI_CONFIG_MESSAGE);
  }

  const requestBody: Record<string, unknown> = {
    model: OPENAI_IMAGE_MODEL,
    prompt: buildTryOnPrompt(subjectType, bodyProfile),
    images: [
      { image_url: personImage },
      { image_url: garmentImage },
    ],
    size: OPENAI_IMAGE_SIZE,
    quality: OPENAI_IMAGE_QUALITY,
    output_format: 'png',
    background: 'opaque',
    n: 1,
  };
  if (OPENAI_IMAGE_MODEL === 'gpt-image-1') {
    requestBody['input_fidelity'] = 'high';
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
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
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

  const image = await fetchOpenAIImageOutput(responseBody.data?.[0]);

  const usage = {
    input_tokens: typeof responseBody.usage?.input_tokens === 'number' ? responseBody.usage.input_tokens : 0,
    output_tokens: typeof responseBody.usage?.output_tokens === 'number' ? responseBody.usage.output_tokens : 0,
  };

  return {
    mimeType: image.mimeType,
    data: image.data,
    metadata: {
      type: 'image_generation',
      subjectType,
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

const createOpenAIVideo = async (
  image: string,
  subjectType: SubjectType,
): Promise<{ id: string; status: string; estimatedCost: number }> => {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    throw new Error(OPENAI_CONFIG_MESSAGE);
  }

  const referenceFile = toImageBlob(image, 'video_reference');
  const formData = new FormData();
  formData.append('model', VIDEO_MODEL);
  formData.append('prompt', buildVideoPrompt(subjectType));
  formData.append('seconds', VIDEO_SECONDS);
  formData.append('size', VIDEO_SIZE);
  formData.append('input_reference', referenceFile.blob, referenceFile.filename);

  const response = await fetch('https://api.openai.com/v1/videos', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  const responseBody = await response.json().catch(() => ({})) as OpenAIVideoCreateResponse;
  if (!response.ok || !responseBody.id) {
    throw new Error(responseBody.error?.message || `OpenAI video creation error ${response.status}`);
  }

  return {
    id: responseBody.id,
    status: responseBody.status || 'processing',
    estimatedCost: VIDEO_ESTIMATED_COST,
  };
};

const fetchOpenAIVideoStatus = async (videoId: string): Promise<OpenAIVideoStatusResponse> => {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    throw new Error(OPENAI_CONFIG_MESSAGE);
  }

  const response = await fetch(`https://api.openai.com/v1/videos/${encodeURIComponent(videoId)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  const responseBody = await response.json().catch(() => ({})) as OpenAIVideoStatusResponse;
  if (!response.ok) {
    throw new Error(responseBody.error?.message || `OpenAI video status error ${response.status}`);
  }

  return responseBody;
};

const streamOpenAIVideoContent = async (videoId: string): Promise<Response> => {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    throw new Error(OPENAI_CONFIG_MESSAGE);
  }

  const response = await fetch(`https://api.openai.com/v1/videos/${encodeURIComponent(videoId)}/content`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(errorBody || `OpenAI video content error ${response.status}`);
  }

  return response;
};

const setCors = (req: functions.https.Request, res: functions.Response) => {
  const origin = req.headers.origin || '';
  const isPreviewOrigin = PREVIEW_ORIGIN_SUFFIXES.some((suffix) => origin.includes(suffix));
  if (CORS_ORIGIN.includes(origin) || isPreviewOrigin || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('cloudworkstations.dev')) {
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

const createCreditTransactionRef = () => db.collection('credit_transactions').doc();

const buildPaymentDocId = (provider: PaymentProvider, providerPaymentId: string): string =>
  `${provider}_${providerPaymentId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

const createGenerationDocRef = (uid: string, requestId: string) =>
  db.collection('generations').doc(buildGenerationRequestDocId(uid, requestId));

const buildUserAccountPayload = (
  account: UserAccount,
  email: string,
  options: {
    setCreatedAt?: boolean;
    setLastDailyResetAt?: boolean;
    touchLogin?: boolean;
  } = {},
): Record<string, unknown> => {
  const payload: Record<string, unknown> = {
    email: email || account.email,
    dailyCredit: account.dailyCredit,
    paidCredit: account.paidCredit,
    credits: account.dailyCredit + account.paidCredit,
    totalGenerated: account.totalGenerated,
    isSubscribed: account.isSubscribed,
    subscriptionPlan: account.subscriptionPlan,
    role: account.role,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (options.setCreatedAt) {
    payload['createdAt'] = admin.firestore.FieldValue.serverTimestamp();
  }
  if (options.setLastDailyResetAt) {
    payload['lastDailyResetAt'] = admin.firestore.FieldValue.serverTimestamp();
  }
  if (options.touchLogin) {
    payload['lastLoginAt'] = admin.firestore.FieldValue.serverTimestamp();
  }

  return payload;
};

const writeCreditTransaction = (
  transaction: FirebaseFirestore.Transaction,
  params: {
    uid: string;
    email: string;
    type: CreditTransactionType;
    amount: number;
    balanceDailyAfter: number;
    balancePaidAfter: number;
    relatedPaymentId?: string | null;
    relatedGenerationId?: string | null;
    memo?: string | null;
  },
) => {
  transaction.set(createCreditTransactionRef(), {
    uid: params.uid,
    email: params.email,
    type: params.type,
    amount: params.amount,
    balanceDailyAfter: params.balanceDailyAfter,
    balancePaidAfter: params.balancePaidAfter,
    relatedPaymentId: params.relatedPaymentId ?? null,
    relatedGenerationId: params.relatedGenerationId ?? null,
    memo: params.memo ?? null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
};

const applyDailyResetIfNeeded = (
  transaction: FirebaseFirestore.Transaction,
  user: AuthenticatedUser,
  account: UserAccount,
): { account: UserAccount; dailyRewardGranted: number; dailyResetApplied: boolean } => {
  const todayKey = getTodayKeyInSeoul();
  const lastDailyResetKey = timestampToSeoulDateKey(account.lastDailyResetAt);
  if (lastDailyResetKey === todayKey) {
    return {
      account,
      dailyRewardGranted: 0,
      dailyResetApplied: false,
    };
  }

  const nextAccount: UserAccount = {
    ...account,
    dailyCredit: DAILY_CREDIT_AMOUNT,
    credits: DAILY_CREDIT_AMOUNT + account.paidCredit,
  };

  writeCreditTransaction(transaction, {
    uid: user.uid,
    email: user.email || account.email,
    type: 'daily_reset',
    amount: DAILY_CREDIT_AMOUNT,
    balanceDailyAfter: nextAccount.dailyCredit,
    balancePaidAfter: nextAccount.paidCredit,
    memo: `daily credit reset ${todayKey}`,
  });

  return {
    account: nextAccount,
    dailyRewardGranted: DAILY_CREDIT_AMOUNT,
    dailyResetApplied: true,
  };
};

const applySignupBonusIfNeeded = (
  transaction: FirebaseFirestore.Transaction,
  user: AuthenticatedUser,
  account: UserAccount,
  shouldApply: boolean,
): { account: UserAccount; signupBonusGranted: number } => {
  if (!shouldApply) {
    return {
      account,
      signupBonusGranted: 0,
    };
  }

  const nextAccount: UserAccount = {
    ...account,
    dailyCredit: account.dailyCredit + SIGNUP_BONUS_CREDIT_AMOUNT,
    credits: account.dailyCredit + SIGNUP_BONUS_CREDIT_AMOUNT + account.paidCredit,
  };

  writeCreditTransaction(transaction, {
    uid: user.uid,
    email: user.email || account.email,
    type: 'charge',
    amount: SIGNUP_BONUS_CREDIT_AMOUNT,
    balanceDailyAfter: nextAccount.dailyCredit,
    balancePaidAfter: nextAccount.paidCredit,
    memo: 'signup bonus credit grant',
  });

  return {
    account: nextAccount,
    signupBonusGranted: SIGNUP_BONUS_CREDIT_AMOUNT,
  };
};

const buildBootstrapProfile = (account: UserAccount): BootstrapResult['profile'] => ({
  dailyCredit: account.dailyCredit,
  paidCredit: account.paidCredit,
  credits: account.dailyCredit + account.paidCredit,
  totalGenerated: account.totalGenerated,
  isSubscribed: account.isSubscribed,
  subscriptionPlan: account.subscriptionPlan,
  role: account.role,
});

const buildApiBonusFields = (dailyRewardGranted = 0, signupBonusGranted = 0): ApiBonusFields => ({
  dailyRewardGranted,
  signupBonusGranted,
  subscriptionBonusGranted: 0,
});

const bootstrapUserCredits = async (user: AuthenticatedUser): Promise<BootstrapResult> => {
  const userRef = db.collection('users').doc(user.uid);
  const result: BootstrapResult = {
    profile: {
      dailyCredit: 0,
      paidCredit: 0,
      credits: 0,
      totalGenerated: 0,
      isSubscribed: false,
      subscriptionPlan: 'free',
      role: 'user',
    },
    dailyRewardGranted: 0,
    signupBonusGranted: 0,
  };

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(userRef);
    let account = normalizeUserAccount(user.email, snapshot.data());
    const reset = applyDailyResetIfNeeded(transaction, user, account);
    account = reset.account;
    result.dailyRewardGranted = reset.dailyRewardGranted;
    const signupBonus = applySignupBonusIfNeeded(transaction, user, account, !snapshot.exists);
    account = signupBonus.account;
    result.signupBonusGranted = signupBonus.signupBonusGranted;

    transaction.set(
      userRef,
      buildUserAccountPayload(account, user.email || account.email, {
        setCreatedAt: !snapshot.exists,
        setLastDailyResetAt: reset.dailyResetApplied,
        touchLogin: true,
      }),
      { merge: true },
    );

    result.profile = buildBootstrapProfile(account);
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

const beginChargedRequest = async (
  user: AuthenticatedUser,
  requestId: string,
  options: {
    cost: number;
    requestType: GenerationRequestType;
    lockCollection: 'generationLocks' | 'videoGenerationLocks';
    insufficientErrorCode: string;
    metadata: Record<string, unknown>;
  },
): Promise<ChargeResult> => {
  if (!requestId) {
    throw new Error(DUPLICATE_REQUEST_ERROR);
  }

  const userRef = db.collection('users').doc(user.uid);
  const requestRef = db.collection('generationRequests').doc(buildGenerationRequestDocId(user.uid, requestId));
  const generationLockRef = db.collection(options.lockCollection).doc(user.uid);
  const result: ChargeResult = {
    profile: {
      dailyCredit: 0,
      paidCredit: 0,
      credits: 0,
      totalGenerated: 0,
      isSubscribed: false,
      subscriptionPlan: 'free',
      role: 'user',
    },
    dailyRewardGranted: 0,
    signupBonusGranted: 0,
    requestId,
    dailyCreditAfterCharge: 0,
    paidCreditAfterCharge: 0,
    creditsAfterCharge: 0,
    usedCreditType: 'daily',
    chargedAmount: options.cost,
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

    let account = normalizeUserAccount(user.email, userSnapshot.data());
    const reset = applyDailyResetIfNeeded(transaction, user, account);
    account = reset.account;
    result.dailyRewardGranted = reset.dailyRewardGranted;
    const signupBonus = applySignupBonusIfNeeded(transaction, user, account, !userSnapshot.exists);
    account = signupBonus.account;
    result.signupBonusGranted = signupBonus.signupBonusGranted;
    const generationCost = options.cost;

    let usedCreditType: CreditType | null = null;
    if (account.dailyCredit >= generationCost) {
      usedCreditType = 'daily';
      account = {
        ...account,
        dailyCredit: account.dailyCredit - generationCost,
      };
    } else if (account.paidCredit >= generationCost) {
      usedCreditType = 'paid';
      account = {
        ...account,
        paidCredit: account.paidCredit - generationCost,
      };
    }

    if (!usedCreditType) {
      throw new Error(options.insufficientErrorCode);
    }

    account = {
      ...account,
      credits: account.dailyCredit + account.paidCredit,
    };
    writeCreditTransaction(transaction, {
      uid: user.uid,
      email: user.email || account.email,
      type: usedCreditType === 'daily' ? 'use_daily' : 'use_paid',
      amount: -generationCost,
      balanceDailyAfter: account.dailyCredit,
      balancePaidAfter: account.paidCredit,
      relatedGenerationId: buildGenerationRequestDocId(user.uid, requestId),
      memo: `${options.requestType} request ${requestId}`,
    });

    transaction.set(
      userRef,
      buildUserAccountPayload(account, user.email || account.email, {
        setCreatedAt: !userSnapshot.exists,
        setLastDailyResetAt: reset.dailyResetApplied,
        touchLogin: true,
      }),
      { merge: true },
    );
    transaction.set(requestRef, {
      uid: user.uid,
      email: user.email || account.email,
      requestId,
      type: options.requestType,
      cost: generationCost,
      usedCreditType,
      usedCreditAmount: generationCost,
      ...options.metadata,
      status: 'charged',
      success: false,
      refunded: false,
      role: account.role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    transaction.set(generationLockRef, {
      uid: user.uid,
      email: user.email || account.email,
      requestId,
      type: options.requestType,
      status: 'charged',
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    result.profile = buildBootstrapProfile(account);
    result.dailyCreditAfterCharge = account.dailyCredit;
    result.paidCreditAfterCharge = account.paidCredit;
    result.creditsAfterCharge = account.credits;
    result.usedCreditType = usedCreditType;
  });

  return result;
};

const beginGenerationCharge = async (
  user: AuthenticatedUser,
  requestId: string,
  subjectType: SubjectType,
): Promise<ChargeResult> =>
  beginChargedRequest(user, requestId, {
    cost: GENERATION_COST,
    requestType: 'image_generation',
    lockCollection: 'generationLocks',
    insufficientErrorCode: NOT_ENOUGH_CREDITS_ERROR,
    metadata: {
      subjectType,
      watermarkApplied: false,
      model: OPENAI_IMAGE_MODEL,
      quality: OPENAI_IMAGE_QUALITY,
      size: OPENAI_IMAGE_SIZE,
      usage: {
        input_tokens: 0,
        output_tokens: 0,
      },
      estimatedCost: null,
    },
  });

const beginVideoGenerationCharge = async (
  user: AuthenticatedUser,
  requestId: string,
  subjectType: SubjectType,
  sourceResultId?: string,
): Promise<ChargeResult> =>
  beginChargedRequest(user, requestId, {
    cost: VIDEO_GENERATION_COST,
    requestType: 'video_generation',
    lockCollection: 'videoGenerationLocks',
    insufficientErrorCode: NOT_ENOUGH_CREDITS_ERROR,
    metadata: {
      subjectType,
      sourceResultId: sourceResultId || null,
      model: VIDEO_MODEL,
      quality: 'standard',
      size: VIDEO_SIZE,
      durationSeconds: Number(VIDEO_SECONDS),
      usage: {
        input_tokens: 0,
        output_tokens: 0,
      },
      estimatedCost: VIDEO_ESTIMATED_COST,
    },
  });

const markChargedRequestInProgress = async (
  user: AuthenticatedUser,
  requestId: string,
  lockCollection: 'generationLocks' | 'videoGenerationLocks',
  metadata: Record<string, unknown>,
): Promise<void> => {
  const requestRef = db.collection('generationRequests').doc(buildGenerationRequestDocId(user.uid, requestId));
  const generationLockRef = db.collection(lockCollection).doc(user.uid);
  await requestRef.set({
    ...metadata,
    status: 'processing',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  await generationLockRef.set({
    requestId,
    status: 'processing',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
};

const markGenerationCompleted = async (
  user: AuthenticatedUser,
  requestId: string,
  metadata: GenerationUsageMetadata,
  options: {
    imageUrl: string;
    usedCreditType: CreditType;
    usedCreditAmount: number;
    watermarkApplied: boolean;
  },
): Promise<void> => {
  const requestRef = db.collection('generationRequests').doc(buildGenerationRequestDocId(user.uid, requestId));
  const generationLockRef = db.collection('generationLocks').doc(user.uid);
  const generationRef = createGenerationDocRef(user.uid, requestId);
  const userRef = db.collection('users').doc(user.uid);

  await db.runTransaction(async (transaction) => {
    const userSnapshot = await transaction.get(userRef);
    const account = normalizeUserAccount(user.email, userSnapshot.data());
    const nextAccount: UserAccount = {
      ...account,
      totalGenerated: account.totalGenerated + 1,
      credits: account.dailyCredit + account.paidCredit,
    };

    transaction.set(generationRef, {
      uid: user.uid,
      email: user.email || account.email,
      requestId,
      subjectType: metadata.subjectType || 'human',
      usedCreditType: options.usedCreditType,
      usedCreditAmount: options.usedCreditAmount,
      watermarkApplied: options.watermarkApplied,
      status: 'completed',
      imageUrl: options.imageUrl,
      model: metadata.model,
      quality: metadata.quality,
      size: metadata.size,
      estimatedCost: metadata.estimatedCost,
      usage: metadata.usage,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    transaction.set(requestRef, {
      type: metadata.type || 'image_generation',
      subjectType: metadata.subjectType || 'human',
      model: metadata.model,
      quality: metadata.quality,
      size: metadata.size,
      usage: metadata.usage,
      estimatedCost: metadata.estimatedCost,
      watermarkApplied: options.watermarkApplied,
      imageUrl: options.imageUrl,
      status: 'completed',
      success: true,
      refunded: false,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    transaction.set(generationLockRef, {
      requestId,
      status: 'completed',
      releasedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    transaction.set(userRef, buildUserAccountPayload(nextAccount, user.email || account.email), { merge: true });
  });
};

const markVideoGenerationCompleted = async (
  user: AuthenticatedUser,
  requestId: string,
  metadata: Record<string, unknown>,
): Promise<void> => {
  const requestRef = db.collection('generationRequests').doc(buildGenerationRequestDocId(user.uid, requestId));
  const generationLockRef = db.collection('videoGenerationLocks').doc(user.uid);
  await requestRef.set({
    ...metadata,
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

const refundChargedRequest = async (
  user: AuthenticatedUser,
  requestId: string,
  errorMessage: string,
  lockCollection: 'generationLocks' | 'videoGenerationLocks',
): Promise<RefundResult> => {
  const userRef = db.collection('users').doc(user.uid);
  const requestRef = db.collection('generationRequests').doc(buildGenerationRequestDocId(user.uid, requestId));
  const generationLockRef = db.collection(lockCollection).doc(user.uid);
  const result: RefundResult = {
    refunded: false,
    dailyCreditAfter: null,
    paidCreditAfter: null,
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
    if (requestData?.status !== 'charged' && requestData?.status !== 'processing') {
      const currentProfile = normalizeUserAccount(user.email, userSnapshot.data());
      result.balanceAfter = currentProfile.credits;
      return;
    }

    const currentProfile = normalizeUserAccount(user.email, userSnapshot.data());
    const chargedCost = typeof requestData?.cost === 'number' && Number.isFinite(requestData.cost)
      ? Math.max(0, requestData.cost)
      : GENERATION_COST;
    const usedCreditType = requestData?.usedCreditType === 'paid' ? 'paid' : 'daily';
    const nextProfile: UserAccount = usedCreditType === 'paid'
      ? {
          ...currentProfile,
          paidCredit: currentProfile.paidCredit + chargedCost,
          credits: currentProfile.dailyCredit + currentProfile.paidCredit + chargedCost,
        }
      : {
          ...currentProfile,
          dailyCredit: currentProfile.dailyCredit + chargedCost,
          credits: currentProfile.dailyCredit + chargedCost + currentProfile.paidCredit,
        };

    transaction.set(userRef, buildUserAccountPayload(nextProfile, user.email || currentProfile.email, {
      touchLogin: true,
    }), { merge: true });
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
      writeCreditTransaction(transaction, {
        uid: user.uid,
        email: user.email || currentProfile.email,
        type: 'refund',
        amount: chargedCost,
        balanceDailyAfter: nextProfile.dailyCredit,
        balancePaidAfter: nextProfile.paidCredit,
        relatedGenerationId: buildGenerationRequestDocId(user.uid, requestId),
        memo: `refund request ${requestId}`,
      });
    }

    result.refunded = chargedCost > 0;
    result.dailyCreditAfter = nextProfile.dailyCredit;
    result.paidCreditAfter = nextProfile.paidCredit;
    result.balanceAfter = nextProfile.credits;
  });

  return result;
};

const refundGenerationCharge = async (user: AuthenticatedUser, requestId: string, errorMessage: string): Promise<RefundResult> =>
  refundChargedRequest(user, requestId, errorMessage, 'generationLocks');

const refundVideoGenerationCharge = async (user: AuthenticatedUser, requestId: string, errorMessage: string): Promise<RefundResult> =>
  refundChargedRequest(user, requestId, errorMessage, 'videoGenerationLocks');

const buildWatermarkSvg = (width: number, height: number): Buffer => Buffer.from(`
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="rgba(0,0,0,0.35)"/>
    </filter>
  </defs>
  <g filter="url(#shadow)">
    <rect x="${Math.max(16, width - 260)}" y="${Math.max(16, height - 84)}" rx="24" ry="24" width="220" height="52" fill="rgba(255,255,255,0.88)"/>
    <text
      x="${Math.max(16, width - 150)}"
      y="${Math.max(16, height - 50)}"
      font-size="24"
      font-family="Arial, Helvetica, sans-serif"
      font-weight="700"
      text-anchor="middle"
      fill="#8f361a"
    >HAMDEVA AI</text>
  </g>
</svg>`.trim());

const applyWatermarkToImageBuffer = async (imageBuffer: Buffer): Promise<Buffer> => {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const width = metadata.width ?? GENERATED_RESPONSE_IMAGE_WIDTH;
  const height = metadata.height ?? 1024;

  return image
    .composite([{ input: buildWatermarkSvg(width, height), top: 0, left: 0 }])
    .png()
    .toBuffer();
};

const createStoredImageDataUrl = async (imageBuffer: Buffer): Promise<string> => {
  const resized = await sharp(imageBuffer)
    .resize({ width: GENERATED_HISTORY_IMAGE_WIDTH, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 88 })
    .toBuffer();

  return `data:image/jpeg;base64,${resized.toString('base64')}`;
};

const buildGeneratedImageAssets = async (
  mimeType: string,
  imageData: string,
  watermarkApplied: boolean,
): Promise<{ responseDataUrl: string; responseMimeType: string; storedImageUrl: string }> => {
  const sourceBuffer = Buffer.from(imageData, 'base64');
  const responseBuffer = watermarkApplied ? await applyWatermarkToImageBuffer(sourceBuffer) : sourceBuffer;
  const responseMimeType = watermarkApplied ? 'image/png' : mimeType;

  return {
    responseDataUrl: `data:${responseMimeType};base64,${responseBuffer.toString('base64')}`,
    responseMimeType,
    storedImageUrl: await createStoredImageDataUrl(responseBuffer),
  };
};

const getAppBaseUrl = (req: functions.https.Request): string => {
  const configuredBaseUrl = process.env['APP_BASE_URL']?.trim() || functions.config()?.app?.base_url?.trim() || '';
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/+$/, '');
  }

  const origin = req.get('origin') ?? '';
  const isPreviewOrigin = PREVIEW_ORIGIN_SUFFIXES.some((suffix) => origin.includes(suffix));
  if (CORS_ORIGIN.includes(origin) || isPreviewOrigin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
    return origin.replace(/\/+$/, '');
  }

  return CORS_ORIGIN[0];
};

const getPaymentProduct = (productId: PaymentProductId) => PAYMENT_PRODUCTS[productId];

const getPolarWebhookHeaders = (req: functions.https.Request): Record<string, string> =>
  Object.entries(req.headers).reduce<Record<string, string>>((acc, [key, value]) => {
    if (typeof value === 'string') {
      acc[key] = value;
    } else if (Array.isArray(value) && typeof value[0] === 'string') {
      acc[key] = value[0];
    }
    return acc;
  }, {});

const upsertPendingPayment = async (params: {
  provider: PaymentProvider;
  providerPaymentId: string;
  uid: string;
  productId: PaymentProductId;
}): Promise<void> => {
  const product = getPaymentProduct(params.productId);
  await db.collection('payments').doc(buildPaymentDocId(params.provider, params.providerPaymentId)).set({
    uid: params.uid,
    provider: params.provider,
    providerPaymentId: params.providerPaymentId,
    productId: product.id,
    amount: product.amountUsd,
    amountCents: product.amountCents,
    currency: product.currency,
    paidCredit: product.paidCredit,
    status: 'pending',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
};

const markPaymentStatus = async (params: {
  provider: PaymentProvider;
  providerPaymentId: string;
  status: Exclude<PaymentStatus, 'paid'>;
}): Promise<void> => {
  const paymentRef = db.collection('payments').doc(buildPaymentDocId(params.provider, params.providerPaymentId));
  const paymentSnapshot = await paymentRef.get();
  const paymentData = paymentSnapshot.data() ?? {};

  await paymentRef.set({
    ...paymentData,
    provider: params.provider,
    providerPaymentId: params.providerPaymentId,
    status: params.status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: paymentSnapshot.exists
      ? paymentData.createdAt ?? admin.firestore.FieldValue.serverTimestamp()
      : admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
};

const fulfillCreditPurchase = async (params: {
  provider: PaymentProvider;
  providerPaymentId: string;
  uid: string;
  productId: PaymentProductId;
  amount?: number | null;
  currency?: string | null;
  paidAt?: string | number | Date | null;
  rawPayload?: unknown;
}): Promise<void> => {
  const paymentRef = db.collection('payments').doc(buildPaymentDocId(params.provider, params.providerPaymentId));
  const userRef = db.collection('users').doc(params.uid);
  const product = getPaymentProduct(params.productId);

  await db.runTransaction(async (transaction) => {
    const [paymentSnapshot, userSnapshot] = await Promise.all([
      transaction.get(paymentRef),
      transaction.get(userRef),
    ]);

    const existingPayment = paymentSnapshot.data();
    if (existingPayment?.status === 'paid') {
      return;
    }

    const email = typeof existingPayment?.email === 'string'
      ? existingPayment.email
      : typeof userSnapshot.data()?.email === 'string'
        ? userSnapshot.data()?.email
        : '';

    let account = normalizeUserAccount(email, userSnapshot.data());
    const reset = applyDailyResetIfNeeded(transaction, { uid: params.uid, email }, account);
    account = reset.account;
    const signupBonus = applySignupBonusIfNeeded(transaction, { uid: params.uid, email }, account, !userSnapshot.exists);
    account = signupBonus.account;
    account = {
      ...account,
      paidCredit: account.paidCredit + product.paidCredit,
      credits: account.dailyCredit + account.paidCredit + product.paidCredit,
    };

    transaction.set(
      userRef,
      buildUserAccountPayload(account, email || account.email, {
        setCreatedAt: !userSnapshot.exists,
        setLastDailyResetAt: reset.dailyResetApplied,
      }),
      { merge: true },
    );
    transaction.set(paymentRef, {
      uid: params.uid,
      provider: params.provider,
      providerPaymentId: params.providerPaymentId,
      productId: product.id,
      amount: typeof params.amount === 'number' && Number.isFinite(params.amount) ? params.amount : product.amountUsd,
      amountCents: product.amountCents,
      currency: typeof params.currency === 'string' && params.currency ? params.currency : product.currency,
      paidCredit: product.paidCredit,
      status: 'paid',
      createdAt: paymentSnapshot.exists ? existingPayment?.createdAt ?? admin.firestore.FieldValue.serverTimestamp() : admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    writeCreditTransaction(transaction, {
      uid: params.uid,
      email: email || account.email,
      type: 'charge',
      amount: product.paidCredit,
      balanceDailyAfter: account.dailyCredit,
      balancePaidAfter: account.paidCredit,
      relatedPaymentId: paymentRef.id,
      memo: `${product.id} checkout credit charge`,
    });
  });
};

const getCheckoutSessionStatus = async (
  user: AuthenticatedUser,
  sessionId?: string,
): Promise<PaymentSessionStatusResult> => {
  const userSnapshotPromise = db.collection('users').doc(user.uid).get();
  const paymentSnapshotPromise = sessionId
    ? db.collection('payments').doc(buildPaymentDocId(POLAR_PROVIDER, sessionId)).get()
    : db.collection('payments')
        .where('uid', '==', user.uid)
        .orderBy('updatedAt', 'desc')
        .limit(10)
        .get()
        .then((snapshot) => snapshot.docs.find((doc) => doc.data()?.provider === POLAR_PROVIDER) ?? null);

  const [paymentSnapshotLike, userSnapshot] = await Promise.all([
    paymentSnapshotPromise,
    userSnapshotPromise,
  ]);
  const account = normalizeUserAccount(user.email, userSnapshot.data());
  const paymentSnapshot = paymentSnapshotLike && 'exists' in paymentSnapshotLike
    ? paymentSnapshotLike
    : null;

  if (!paymentSnapshot?.exists) {
    return {
      status: 'pending',
      paymentId: null,
      paidCredit: 0,
      dailyCredit: account.dailyCredit,
      paidCreditBalance: account.paidCredit,
      totalCreditBalance: account.credits,
    };
  }

  const paymentData = paymentSnapshot.data() ?? {};
  if (paymentData.uid !== user.uid) {
    throw new Error('FORBIDDEN');
  }

  return {
    status: (paymentData.status as PaymentStatus | undefined) ?? 'pending',
    paymentId: paymentSnapshot.id,
    paidCredit: typeof paymentData.paidCredit === 'number' ? paymentData.paidCredit : 0,
    dailyCredit: account.dailyCredit,
    paidCreditBalance: account.paidCredit,
    totalCreditBalance: account.credits,
  };
};

const handleCreateCheckoutSessionRequest = async (req: functions.https.Request, res: functions.Response) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const user = await requireAuthenticatedUser(req);
  const { productId } = req.body as CheckoutSessionRequest;
  if (!isPaymentProductId(productId)) {
    res.status(400).json({ error: 'INVALID_PRODUCT', message: '유효하지 않은 상품입니다.' });
    return;
  }

  const { apiKey } = requirePolarConfig();
  const product = getPaymentProduct(productId);
  const polarProductId = getPolarProductExternalId(productId);
  if (!polarProductId) {
    throw new Error(PAYMENT_CONFIG_ERROR);
  }
  const baseUrl = getAppBaseUrl(req);
  const response = await fetch(`${POLAR_API_BASE_URL}/checkouts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      products: [polarProductId],
      successUrl: `${baseUrl}/payment-success`,
      metadata: {
        uid: user.uid,
        productId: product.id,
        paidCredit: String(product.paidCredit),
      },
      externalCustomerId: user.uid,
      customerEmail: user.email || undefined,
    }),
  });
  const session = await response.json().catch(() => ({})) as PolarCheckoutRecord;
  if (!response.ok || !session.id || !session.url) {
    throw new Error(PAYMENT_CONFIG_ERROR);
  }

  await upsertPendingPayment({
    provider: POLAR_PROVIDER,
    providerPaymentId: session.id,
    uid: user.uid,
    productId,
  });

  res.json({
    success: true,
    sessionId: session.id,
    url: session.url,
  });
};

const handleCheckoutSessionStatusRequest = async (req: functions.https.Request, res: functions.Response) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const user = await requireAuthenticatedUser(req);
  const sessionId = typeof req.query.sessionId === 'string' ? req.query.sessionId : undefined;
  const status = await getCheckoutSessionStatus(user, sessionId);
  res.json({
    success: true,
    ...status,
  });
};

const getStringValue = (...values: unknown[]): string =>
  values.find((value) => typeof value === 'string' && value.trim()) as string || '';

const getObjectValue = (...values: unknown[]): Record<string, unknown> =>
  (values.find((value) => value !== null && typeof value === 'object' && !Array.isArray(value)) as Record<string, unknown> | undefined) ?? {};

const getPolarPaymentContext = async (providerPaymentId: string): Promise<{ uid: string; productId: PaymentProductId } | null> => {
  const paymentSnapshot = await db.collection('payments').doc(buildPaymentDocId(POLAR_PROVIDER, providerPaymentId)).get();
  const data = paymentSnapshot.data();
  if (!data || typeof data.uid !== 'string' || !isPaymentProductId(data.productId)) {
    return null;
  }

  return {
    uid: data.uid,
    productId: data.productId,
  };
};

const handlePolarWebhookRequest = async (req: functions.https.Request, res: functions.Response) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const webhookSecret = getPolarWebhookSecret();
  if (!webhookSecret) {
    throw new Error(PAYMENT_CONFIG_ERROR);
  }

  const rawPayload = req.rawBody.toString('utf8');
  const headers = getPolarWebhookHeaders(req);
  if (!headers['webhook-signature']) {
    res.status(400).json({ error: 'MISSING_SIGNATURE' });
    return;
  }

  try {
    const wh = new Webhook(webhookSecret);
    wh.verify(rawPayload, headers);
  } catch (error) {
    functions.logger.error('Polar webhook signature verification failed', error);
    res.status(400).json({ error: 'INVALID_SIGNATURE' });
    return;
  }

  const event = JSON.parse(rawPayload) as PolarWebhookEvent;
  const data = getObjectValue(event.data);
  const metadata = getObjectValue(
    data.metadata,
    getObjectValue(data.checkout).metadata,
    getObjectValue(data.order).metadata,
  );
  const providerPaymentId = getStringValue(
    data.checkout_id,
    data.checkoutId,
    getObjectValue(data.checkout).id,
    data.id,
  );
  const contextFromPayment = providerPaymentId ? await getPolarPaymentContext(providerPaymentId) : null;
  const uid = getStringValue(metadata.uid, contextFromPayment?.uid);
  const rawProductId = getStringValue(metadata.productId, contextFromPayment?.productId);
  const eventType = getStringValue(event.type);
  const checkoutStatus = getStringValue(data.status, getObjectValue(data.checkout).status).toLowerCase();
  const isPaidEvent = eventType === 'order.paid' || (eventType === 'checkout.updated' && ['succeeded', 'confirmed', 'paid', 'completed'].includes(checkoutStatus));
  const isFailedEvent = eventType === 'order.failed' || (eventType === 'checkout.updated' && ['failed'].includes(checkoutStatus));
  const isCanceledEvent = eventType === 'checkout.expired' || (eventType === 'checkout.updated' && ['expired', 'canceled', 'cancelled'].includes(checkoutStatus));

  try {
    if (isPaidEvent) {
      if (!providerPaymentId || !uid || !isPaymentProductId(rawProductId)) {
        throw new Error('INVALID_POLAR_PAYMENT_CONTEXT');
      }

      await fulfillCreditPurchase({
        provider: POLAR_PROVIDER,
        providerPaymentId,
        uid,
        productId: rawProductId,
        amount: typeof data.amount === 'number' ? data.amount : null,
        currency: getStringValue(data.currency, getObjectValue(data.checkout).currency),
        paidAt: getStringValue(data.paid_at, data.paidAt),
        rawPayload: event,
      });
    } else if (isFailedEvent) {
      if (!providerPaymentId) {
        throw new Error('INVALID_POLAR_PAYMENT_CONTEXT');
      }
      await markPaymentStatus({ provider: POLAR_PROVIDER, providerPaymentId, status: 'failed' });
    } else if (isCanceledEvent) {
      if (!providerPaymentId) {
        throw new Error('INVALID_POLAR_PAYMENT_CONTEXT');
      }
      await markPaymentStatus({ provider: POLAR_PROVIDER, providerPaymentId, status: 'canceled' });
    }

    res.json({ received: true });
  } catch (error) {
    functions.logger.error('Polar webhook processing failed', {
      eventType,
      message: error instanceof Error ? error.message : 'unknown',
      error,
    });
    res.status(500).json({ error: 'WEBHOOK_PROCESSING_FAILED' });
  }
};

const handleApiError = (res: functions.Response, error: unknown, fallbackStatus = 500) => {
  if (error instanceof Error && error.message === 'AUTH_REQUIRED') {
    res.status(401).json({ error: 'AUTH_REQUIRED', message: AUTH_REQUIRED_MESSAGE });
    return;
  }

  if (error instanceof Error && error.message === 'FORBIDDEN') {
    res.status(403).json({ error: 'FORBIDDEN', message: '접근 권한이 없습니다.' });
    return;
  }

  if (error instanceof Error && error.message === NOT_ENOUGH_CREDITS_ERROR) {
    res.status(402).json({ error: NOT_ENOUGH_CREDITS_ERROR, message: NOT_ENOUGH_CREDITS_MESSAGE, cost: GENERATION_COST });
    return;
  }

  if (error instanceof Error && error.message === PAYMENT_CONFIG_ERROR) {
    res.status(500).json({ error: PAYMENT_CONFIG_ERROR, message: PAYMENT_CONFIG_MESSAGE });
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

  const { personImage, garmentImage, bodyProfile, requestId, subjectType } = req.body as {
    personImage: string;
    garmentImage: string;
    bodyProfile?: BodyProfile;
    requestId?: string;
    subjectType?: SubjectType;
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
  const resolvedSubjectType = normalizeSubjectType(subjectType);
  try {
    chargeResult = await beginGenerationCharge(user, requestId, resolvedSubjectType);
  } catch (error) {
    handleApiError(res, error, 500);
    return;
  }

  try {
    const generatedImage = await requestOpenAIComposite(personImage, garmentImage, resolvedSubjectType, bodyProfile);
    const watermarkApplied = chargeResult.usedCreditType === 'daily';
    const imageAssets = await buildGeneratedImageAssets(generatedImage.mimeType, generatedImage.data, watermarkApplied);
    await markGenerationCompleted(user, requestId, generatedImage.metadata, {
      imageUrl: imageAssets.storedImageUrl,
      usedCreditType: chargeResult.usedCreditType,
      usedCreditAmount: chargeResult.chargedAmount,
      watermarkApplied,
    });
    const response: TryOnSuccessResponse = {
      success: true,
      image: imageAssets.responseDataUrl,
      mimeType: imageAssets.responseMimeType,
      subjectType: resolvedSubjectType,
      usedCreditType: chargeResult.usedCreditType,
      watermarkApplied,
      dailyCredit: chargeResult.dailyCreditAfterCharge,
      paidCredit: chargeResult.paidCreditAfterCharge,
      creditsRemaining: chargeResult.creditsAfterCharge,
      totalGenerated: chargeResult.profile.totalGenerated + 1,
      ...buildApiBonusFields(chargeResult.dailyRewardGranted, chargeResult.signupBonusGranted),
    };
    res.json(response);
    return;
  } catch (error) {
    functions.logger.error(`OpenAI ${label} request failed`, error);
    const errorMessage = error instanceof Error ? error.message : 'OpenAI image generation failed';
    const refundResult = await refundGenerationCharge(user, requestId, errorMessage).catch((refundError) => {
      functions.logger.error('Failed to refund credits after generation error', refundError);
      return { refunded: false, dailyCreditAfter: null, paidCreditAfter: null, balanceAfter: null } satisfies RefundResult;
    });
    const refundedMessage = refundResult.refunded ? ' 100 credits refunded due to generation failure.' : '';
    const errorCode = errorMessage === OPENAI_CONFIG_MESSAGE ? OPENAI_CONFIG_ERROR : errorMessage;
    res.status(errorMessage === OPENAI_CONFIG_MESSAGE ? 500 : 502).json({
      error: errorCode,
      message: `${errorMessage}${refundedMessage}`.trim(),
      refunded: refundResult.refunded,
      dailyCredit: refundResult.dailyCreditAfter ?? chargeResult.dailyCreditAfterCharge,
      paidCredit: refundResult.paidCreditAfter ?? chargeResult.paidCreditAfterCharge,
      creditsRemaining: refundResult.balanceAfter ?? chargeResult.creditsAfterCharge,
      ...buildApiBonusFields(chargeResult.dailyRewardGranted, chargeResult.signupBonusGranted),
    });
  }
};

const handleSubjectClassificationRequest = async (req: functions.https.Request, res: functions.Response) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { subjectImage } = req.body as { subjectImage?: string };
  if (!subjectImage) {
    res.status(400).json({ error: 'subjectImage is required.' });
    return;
  }

  try {
    const detectedSubjectType = await requestSubjectClassification(subjectImage);
    res.json({ success: true, subjectType: detectedSubjectType });
  } catch (error) {
    handleApiError(res, error, 500);
  }
};

const handleVideoGenerationRequest = async (req: functions.https.Request, res: functions.Response) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { image, requestId, subjectType, sourceResultId } = req.body as {
    image?: string;
    requestId?: string;
    subjectType?: SubjectType;
    sourceResultId?: string;
  };
  if (!image || !requestId) {
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

  const resolvedSubjectType = normalizeSubjectType(subjectType);
  let chargeResult: ChargeResult;
  try {
    chargeResult = await beginVideoGenerationCharge(user, requestId, resolvedSubjectType, sourceResultId);
  } catch (error) {
    handleApiError(res, error, 500);
    return;
  }

  try {
    const videoJob = await createOpenAIVideo(image, resolvedSubjectType);
    await markChargedRequestInProgress(user, requestId, 'videoGenerationLocks', {
      subjectType: resolvedSubjectType,
      openaiVideoId: videoJob.id,
      estimatedCost: videoJob.estimatedCost,
      model: VIDEO_MODEL,
      size: VIDEO_SIZE,
      durationSeconds: Number(VIDEO_SECONDS),
      type: 'video_generation',
    });
    res.json({
      success: true,
      requestId,
      openaiVideoId: videoJob.id,
      status: videoJob.status,
      dailyCredit: chargeResult.dailyCreditAfterCharge,
      paidCredit: chargeResult.paidCreditAfterCharge,
      creditsRemaining: chargeResult.creditsAfterCharge,
      estimatedCost: videoJob.estimatedCost,
      subjectType: resolvedSubjectType,
      ...buildApiBonusFields(chargeResult.dailyRewardGranted, chargeResult.signupBonusGranted),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'OpenAI video generation failed';
    const refundResult = await refundVideoGenerationCharge(user, requestId, errorMessage).catch((refundError) => {
      functions.logger.error('Failed to refund credits after video generation error', refundError);
      return { refunded: false, dailyCreditAfter: null, paidCreditAfter: null, balanceAfter: null } satisfies RefundResult;
    });
    res.status(errorMessage === OPENAI_CONFIG_MESSAGE ? 500 : 502).json({
      error: errorMessage === OPENAI_CONFIG_MESSAGE ? OPENAI_CONFIG_ERROR : errorMessage,
      message: errorMessage,
      refunded: refundResult.refunded,
      dailyCredit: refundResult.dailyCreditAfter ?? chargeResult.dailyCreditAfterCharge,
      paidCredit: refundResult.paidCreditAfter ?? chargeResult.paidCreditAfterCharge,
      creditsRemaining: refundResult.balanceAfter ?? chargeResult.creditsAfterCharge,
      ...buildApiBonusFields(chargeResult.dailyRewardGranted, chargeResult.signupBonusGranted),
    });
  }
};

const handleVideoStatusRequest = async (req: functions.https.Request, res: functions.Response) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const requestId = typeof req.query.requestId === 'string' ? req.query.requestId : '';
  if (!requestId) {
    res.status(400).json({ error: 'requestId is required.' });
    return;
  }

  let user: AuthenticatedUser;
  try {
    user = await requireAuthenticatedUser(req);
  } catch (error) {
    handleApiError(res, error, 401);
    return;
  }

  const requestRef = db.collection('generationRequests').doc(buildGenerationRequestDocId(user.uid, requestId));
  const snapshot = await requestRef.get();
  if (!snapshot.exists) {
    res.status(404).json({ error: 'Video request not found.' });
    return;
  }

  const requestData = snapshot.data() ?? {};
  const openaiVideoId = typeof requestData.openaiVideoId === 'string' ? requestData.openaiVideoId : '';
  const requestStatus = typeof requestData.status === 'string' ? requestData.status : 'processing';
  if (!openaiVideoId) {
    res.json({
      success: requestStatus === 'completed',
      status: requestStatus,
      estimatedCost: typeof requestData.estimatedCost === 'number' ? requestData.estimatedCost : VIDEO_ESTIMATED_COST,
    });
    return;
  }

  try {
    const videoStatus = await fetchOpenAIVideoStatus(openaiVideoId);
    const nextStatus = typeof videoStatus.status === 'string' ? videoStatus.status : requestStatus;

    if (nextStatus === 'completed') {
      await markVideoGenerationCompleted(user, requestId, {
        openaiVideoId,
        estimatedCost: typeof requestData.estimatedCost === 'number' ? requestData.estimatedCost : VIDEO_ESTIMATED_COST,
        type: 'video_generation',
        subjectType: normalizeSubjectType(requestData.subjectType),
      });
      res.json({
        success: true,
        status: 'completed',
        requestId,
        estimatedCost: typeof requestData.estimatedCost === 'number' ? requestData.estimatedCost : VIDEO_ESTIMATED_COST,
        contentUrl: `/api/video-content?requestId=${encodeURIComponent(requestId)}`,
      });
      return;
    }

    if (nextStatus === 'failed' || nextStatus === 'canceled') {
      const errorMessage = videoStatus.error?.message || `Video generation ${nextStatus}`;
      const refundResult = await refundVideoGenerationCharge(user, requestId, errorMessage);
      res.status(502).json({
        success: false,
        status: nextStatus,
        error: errorMessage,
        refunded: refundResult.refunded,
        creditsRemaining: refundResult.balanceAfter,
      });
      return;
    }

    await markChargedRequestInProgress(user, requestId, 'videoGenerationLocks', {
      openaiVideoId,
      type: 'video_generation',
      subjectType: normalizeSubjectType(requestData.subjectType),
    });
    res.json({
      success: false,
      status: nextStatus,
      requestId,
      estimatedCost: typeof requestData.estimatedCost === 'number' ? requestData.estimatedCost : VIDEO_ESTIMATED_COST,
    });
  } catch (error) {
    handleApiError(res, error, 500);
  }
};

const handleVideoContentRequest = async (req: functions.https.Request, res: functions.Response) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const requestId = typeof req.query.requestId === 'string' ? req.query.requestId : '';
  if (!requestId) {
    res.status(400).json({ error: 'requestId is required.' });
    return;
  }

  let user: AuthenticatedUser;
  try {
    user = await requireAuthenticatedUser(req);
  } catch (error) {
    handleApiError(res, error, 401);
    return;
  }

  const snapshot = await db.collection('generationRequests').doc(buildGenerationRequestDocId(user.uid, requestId)).get();
  if (!snapshot.exists) {
    res.status(404).json({ error: 'Video request not found.' });
    return;
  }

  const requestData = snapshot.data() ?? {};
  const openaiVideoId = typeof requestData.openaiVideoId === 'string' ? requestData.openaiVideoId : '';
  if (!openaiVideoId) {
    res.status(409).json({ error: 'Video not ready yet.' });
    return;
  }

  try {
    const contentResponse = await streamOpenAIVideoContent(openaiVideoId);
    res.set('Content-Type', contentResponse.headers.get('content-type') || 'video/mp4');
    res.set('Cache-Control', 'private, max-age=60');
    const buffer = Buffer.from(await contentResponse.arrayBuffer());
    res.status(200).send(buffer);
  } catch (error) {
    handleApiError(res, error, 500);
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
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    functions.logger.info('api request', {
      path: normalizedPath,
      method: req.method,
      contentType: req.get('content-type') ?? '',
    });

    if (req.method === 'POST' && normalizedPath === '/bootstrap') {
      try {
        const user = await requireAuthenticatedUser(req);
        const result = await bootstrapUserCredits(user);
        const response: BootstrapResponse = {
          success: true,
          ...result,
          ...buildApiBonusFields(result.dailyRewardGranted, result.signupBonusGranted),
          generationCost: GENERATION_COST,
          videoGenerationCost: VIDEO_GENERATION_COST,
        };
        res.json(response);
      } catch (error) {
        handleApiError(res, error, 500);
      }
      return;
    }

    if (req.method === 'GET' && normalizedPath === '/credits') {
      try {
        const user = await requireAuthenticatedUser(req);
        const snapshot = await db.collection('users').doc(user.uid).get();
        const profile = normalizeUserAccount(user.email, snapshot.data());
        res.json({
          dailyCredit: profile.dailyCredit,
          paidCredit: profile.paidCredit,
          credits: profile.credits,
          totalGenerated: profile.totalGenerated,
          isSubscribed: profile.isSubscribed,
          subscriptionPlan: profile.subscriptionPlan,
          role: profile.role,
          generationCost: GENERATION_COST,
          videoGenerationCost: VIDEO_GENERATION_COST,
        });
      } catch (error) {
        handleApiError(res, error, 500);
      }
      return;
    }

    if (req.method === 'POST' && normalizedPath === '/classify-subject') {
      await handleSubjectClassificationRequest(req, res);
      return;
    }

    if (normalizedPath === '/polar/webhook') {
      await handlePolarWebhookRequest(req, res);
      return;
    }

    if (normalizedPath === '/polar/checkout') {
      try {
        await handleCreateCheckoutSessionRequest(req, res);
      } catch (error) {
        handleApiError(res, error, 500);
      }
      return;
    }

    if (normalizedPath === '/polar/session') {
      try {
        await handleCheckoutSessionStatusRequest(req, res);
      } catch (error) {
        handleApiError(res, error, 500);
      }
      return;
    }

    if (req.method === 'POST' && normalizedPath === '/video') {
      await handleVideoGenerationRequest(req, res);
      return;
    }

    if (req.method === 'GET' && normalizedPath === '/video-status') {
      await handleVideoStatusRequest(req, res);
      return;
    }

    if (req.method === 'GET' && normalizedPath === '/video-content') {
      await handleVideoContentRequest(req, res);
      return;
    }

    if (normalizedPath === '/tryon' || normalizedPath === '/generate') {
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
