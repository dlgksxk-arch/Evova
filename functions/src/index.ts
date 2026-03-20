import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { createHmac, timingSafeEqual } from 'crypto';
import sharp from 'sharp';

admin.initializeApp();
const db = admin.firestore();
const bucket = admin.storage().bucket();

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
const VIDEO_NOT_ENOUGH_CREDITS_ERROR = 'VIDEO_NOT_ENOUGH_CREDITS';
const VIDEO_GENERATION_IN_PROGRESS_ERROR = 'VIDEO_GENERATION_IN_PROGRESS';
const VIDEO_GENERATION_IN_PROGRESS_MESSAGE = '이미 영상 생성이 진행 중입니다.';
const VIDEO_FAILURE_LIMIT_REACHED_ERROR = 'VIDEO_FAILURE_LIMIT_REACHED';
const VIDEO_FAILURE_LIMIT_REACHED_MESSAGE = '오늘 영상 생성 실패 횟수 제한에 도달했습니다. 잠시 후 다시 시도해주세요.';
const INVALID_VIDEO_DIALOGUE_ERROR = 'INVALID_VIDEO_DIALOGUE';
const INVALID_VIDEO_DIALOGUE_MESSAGE = 'Dialogue is required and can use any language, spaces, and ! ? , . only, up to 30 characters.';
const DUPLICATE_GENERATION_WINDOW_MS = 30_000;
const GENERATION_COST = 100;
const VIDEO_GENERATION_COST = 1500;
const VIDEO_NOT_ENOUGH_CREDITS_MESSAGE = `영상 생성에는 ${VIDEO_GENERATION_COST} 크레딧이 필요합니다.`;
const MAX_VIDEO_FAILURES_PER_DAY = 3;
const VIDEO_DIALOGUE_MAX_CHARACTERS = 30;
const VIDEO_DIALOGUE_ALLOWED_PUNCTUATION = '!?.,';
const SIGNUP_BONUS_CREDIT_AMOUNT = 300;
const SEOUL_TIME_ZONE = 'Asia/Seoul';
const OPENAI_IMAGE_MODEL = process.env['OPENAI_IMAGE_MODEL'] ?? 'gpt-image-1.5';
const OPENAI_IMAGE_SIZE = '1024x1536';
const OPENAI_IMAGE_QUALITY = 'medium';
const SUBJECT_CLASSIFICATION_MODEL = process.env['OPENAI_CLASSIFICATION_MODEL'] ?? 'gpt-4.1-nano';
const GOOGLE_VIDEO_CONFIG_ERROR = 'VIDEO_GENERATION_NOT_CONFIGURED';
const GOOGLE_VIDEO_CONFIG_MESSAGE = 'Google Video API key is missing. Set GOOGLE_VIDEO_API_KEY in functions/.env.';
const VIDEO_PROVIDER = 'google-veo';
const VIDEO_MODEL = process.env['GOOGLE_VIDEO_MODEL'] ?? 'veo-3.1-generate-preview';
const GOOGLE_VIDEO_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const VIDEO_SECONDS = '4';
const VIDEO_SIZE = '1280x720';
const VIDEO_ESTIMATED_COST = 0.4;
const GENERATED_HISTORY_IMAGE_WIDTH = 960;
const GENERATED_RESPONSE_IMAGE_WIDTH = 1536;
const HISTORY_RETENTION_DAYS = 15;
const ARCHIVED_HISTORY_RETENTION_DAYS = 30;
const MAX_ARCHIVED_CREATIONS = 5;
const LEMON_PROVIDER = 'lemon';
const PAYMENT_CURRENCY = 'usd';
const DEFAULT_ADMIN_GIFT_TITLE = '운영자의 선물이 도착했습니다';
const DEFAULT_ADMIN_GIFT_MESSAGE = '운영팀이 회원님께 특별 크레딧을 지급했습니다.';
const DEFAULT_ADMIN_GIFT_SENDER_NAME = 'EVOVA 운영팀';
const ADMIN_USER_LIST_DEFAULT_LIMIT = 20;
const ADMIN_USER_LIST_MAX_LIMIT = 50;
const ADMIN_LOG_LIST_DEFAULT_LIMIT = 20;
const ADMIN_LOG_LIST_MAX_LIMIT = 50;
const ADMIN_GIFT_MAX_AMOUNT = 1_000_000;
const SUBJECT_CLASSIFICATION_PROMPT = `Look at this uploaded subject image and determine whether the subject is a human, a dog, or a cat.
Return ONLY one word:

human
dog
cat`;
const ADMIN_EMAILS = new Set(['dlgksxk@gmail.com']);
const PAYMENT_PRODUCTS = {
  starter: {
    id: 'starter',
    amountCents: 699,
    amountUsd: 6.99,
    currency: PAYMENT_CURRENCY,
    paidCredit: 1000,
    name: 'HAMDEVA Starter Credits',
  },
  popular: {
    id: 'popular',
    amountCents: 1290,
    amountUsd: 12.9,
    currency: PAYMENT_CURRENCY,
    paidCredit: 5000,
    name: 'HAMDEVA Popular Credits',
  },
  pro: {
    id: 'pro',
    amountCents: 4990,
    amountUsd: 49.9,
    currency: PAYMENT_CURRENCY,
    paidCredit: 10000,
    name: 'HAMDEVA Pro Credits',
  },
  small_pack: {
    id: 'small_pack',
    amountCents: 1290,
    amountUsd: 12.9,
    currency: PAYMENT_CURRENCY,
    paidCredit: 1000,
    name: 'HAMDEVA Small Credit Pack',
  },
  medium_pack: {
    id: 'medium_pack',
    amountCents: 5900,
    amountUsd: 59,
    currency: PAYMENT_CURRENCY,
    paidCredit: 5000,
    name: 'HAMDEVA Medium Credit Pack',
  },
  large_pack: {
    id: 'large_pack',
    amountCents: 9990,
    amountUsd: 99.9,
    currency: PAYMENT_CURRENCY,
    paidCredit: 10000,
    name: 'HAMDEVA Large Credit Pack',
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

class UpstreamApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'UpstreamApiError';
    this.statusCode = statusCode;
  }
}
const HUMAN_PROMPT = `Create one realistic full-body studio photograph of the exact same real person from the first uploaded image wearing the exact same clothing from the second uploaded image.

Priority:
1) exact facial identity
2) exact clothing preservation
3) natural full-body framing

Use the first image as the identity reference and the second image as the clothing reference.
The result must be the same real person, not a similar person.
Treat this generation as a completely fresh standalone request.
Do not borrow, blend, average, or infer identity details from any previous generation.
Completely ignore any face, head, hair, skin, body, or identity cues that may appear in the clothing reference image.
Use only the first image for facial identity.
Match the first image as closely as possible and treat facial identity preservation as the most important requirement.
Preserve the same face shape, forehead, eyebrows, eyes, eye distance, nose, nostrils, lips, mouth width, jawline, chin, ears, skin tone, skin texture, hairstyle, hairline, and facial proportions.
Keep the same apparent age, ethnicity, bone structure, and overall facial geometry.
Do not beautify, idealize, rejuvenate, feminize, masculinize, stylize, retouch, or reinterpret the face.
Allow only soft polished Korean idol-style makeup: light skin-evening, subtle eyeliner, delicate lash definition, soft gradient lips, and natural blush.
Show a bright, open, joyful smile that feels lively and immediately readable while fully preserving the same identity.
The face must remain immediately recognizable as the same person.

Preserve the clothing exactly: same design, color, fabric feel, embroidery, print, silhouette, sleeve shape, neckline, hem, fit, and accessories if present.
Do not redesign, simplify, replace, restyle, or merge the outfit with another fashion style.

One person only. One image only. Full body from head to toe.
Keep the full head, full hair, both hands, both feet, and the entire outfit fully inside the frame.
Use realistic but flattering editorial body proportions with clean posture and balanced head-to-body ratio.
Make the overall silhouette look elegant and proportionate without changing the person's core build unrealistically.
Keep the face clearly visible and not smaller than necessary.

Use clean realistic lighting and a believable background that matches the garment mood, cultural context, and styling purpose.

Strict negatives: no identity change, no different model, no age change, no ethnicity change, no beautification, no face reshaping, no glamour retouching, no costume redesign, no cropped head, no missing hands or feet, no extra fingers, no distorted face.`;
const DOG_PROMPT = `Use the first input image as the animal identity reference and the second input image as the outfit reference.

Create one realistic, high-quality, full-body pet fashion portrait of the same dog wearing an adapted version of the referenced outfit.

Top priorities, in order:
1) exact same dog face and identity
2) exact same outfit look and visible design details
3) natural, believable full-body composition

Core identity rules:
- preserve the exact same dog identity, breed appearance, fur pattern, face shape, muzzle, ears, nose, eyes, and body proportions
- preserve the exact same facial impression at first glance; the dog face should be immediately recognizable as the same dog from the reference
- keep the same eye shape, muzzle length, nose shape, ear shape, forehead area, fur colors, fur markings, and overall head silhouette
- the result must stay fully canine from head to toe, never human or humanoid
- show only real dog facial anatomy and real dog limbs
- keep dog front paws and hind paws clearly dog-like and consistent with the same dog identity
- do not generate any human face, human skin, human lips, human nose, human teeth styling, human hands, human feet, fingers, toes, or mixed anatomy

Outfit rules:
- preserve the outfit color, silhouette, design language, trim, accessories, and overall styling concept as closely as possible
- preserve clearly visible design details from the outfit reference, including neckline, sleeves, hem, closures, bows, trim, embroidery, prints, and accessories when present
- keep the outfit visually as close as possible to the reference in one glance
- adapt the outfit naturally and believably to a dog body without changing the core design concept
- do not simplify the outfit into a generic pet costume
- do not replace the outfit with a different garment concept
- keep the full outfit readable in one glance

Action and mood rules:
- capture a cute, lively, cheerful dog action that feels like a single charming moment from a fashion shoot
- prefer actions such as a playful paw lift, tiny bounce, happy step forward, tail-up pose, curious head tilt, light trot start, or excited stance
- the action should feel adorable, bright, and full of personality, not static
- keep the expression alert, happy, lovable, and camera-friendly
- the pose should feel playful first, editorial second

Composition rules:
- single subject only
- one image only
- full-body shot
- keep the full head, full body, full outfit, and all paws inside the frame
- use balanced body proportions and professional lighting
- place the camera slightly farther back so the head reads a bit smaller inside the full-body composition and the outfit remains easy to read

Scene rules:
- use a clean, realistic, visually charming background that supports the outfit mood
- keep the scene bright, polished, and suitable for a premium pet fashion preview

Strict negatives:
- no identity drift
- no different dog face
- no wrong fur markings
- no costume redesign
- no generic pet clothes
- no human face
- no humanoid body
- no human hands or feet
- no fingers or toes
- no mixed anatomy
- no missing paws
- no duplicate subject
- no collage
- no cartoon styling
- no horror, aggression, or distorted anatomy`;
const CAT_PROMPT = `Use the first input image as the animal identity reference and the second input image as the outfit reference.

Create one realistic, high-quality, full-body pet fashion portrait of the same cat wearing an adapted version of the referenced outfit.

Top priorities, in order:
1) exact same cat face and identity
2) exact same outfit look and visible design details
3) natural, believable full-body composition

Core identity rules:
- preserve the exact same cat identity, fur markings, face shape, ears, nose, eyes, whisker area, and body proportions
- preserve the exact same facial impression at first glance; the cat face should be immediately recognizable as the same cat from the reference
- keep the same eye shape, nose shape, muzzle area, ear shape, whisker pad, fur colors, fur markings, and overall head silhouette
- the result must stay fully feline from head to toe, never human or humanoid
- show only real cat facial anatomy and real cat limbs
- keep cat front paws and hind paws clearly cat-like and consistent with the same cat identity
- do not generate any human face, human skin, human lips, human nose, human teeth styling, human hands, human feet, fingers, toes, or mixed anatomy

Outfit rules:
- preserve the outfit color, silhouette, design language, trim, accessories, and overall styling concept as closely as possible
- preserve clearly visible design details from the outfit reference, including neckline, sleeves, hem, closures, bows, trim, embroidery, prints, and accessories when present
- keep the outfit visually as close as possible to the reference in one glance
- adapt the outfit naturally and believably to a cat body without changing the core design concept
- do not simplify the outfit into a generic pet costume
- do not replace the outfit with a different garment concept
- keep the full outfit readable in one glance

Action and mood rules:
- capture a cute, lively, elegant cat action that feels like a single charming moment from a fashion shoot
- prefer actions such as a graceful paw step, playful stretch, tiny hop, tail-up stance, curious head tilt, light prance, or alert pose
- the action should feel adorable, bright, and full of personality, not static
- keep the expression alert, sweet, charming, and camera-friendly
- the pose should feel playful first, editorial second

Composition rules:
- single subject only
- one image only
- full-body shot
- keep the full head, full body, full outfit, and all paws inside the frame
- use balanced body proportions and professional lighting
- place the camera slightly farther back so the head reads a bit smaller inside the full-body composition and the outfit remains easy to read

Scene rules:
- use a clean, realistic, visually charming background that supports the outfit mood
- keep the scene bright, polished, and suitable for a premium pet fashion preview

Strict negatives:
- no identity drift
- no different cat face
- no wrong fur markings
- no costume redesign
- no generic pet clothes
- no human face
- no humanoid body
- no human hands or feet
- no fingers or toes
- no mixed anatomy
- no missing paws
- no duplicate subject
- no collage
- no cartoon styling
- no horror, aggression, or distorted anatomy`;
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
type CreationType = 'image' | 'video';
type CreditType = 'daily' | 'paid';
type CreditTransactionType =
  | 'daily_reset'
  | 'charge'
  | 'use_daily'
  | 'use_paid'
  | 'refund'
  | 'admin_gift';
type PaymentProductId = keyof typeof PAYMENT_PRODUCTS;
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'canceled';
type PaymentProvider = 'lemon';
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
  outfitName?: string;
  outfitMood?: string;
  poseHint?: string;
  backgroundHint?: string;
};
type AuthenticatedUser = {
  uid: string;
  email: string;
};
type AdminUserListItem = {
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
  role: AccountRole;
  createdAt: number | null;
  lastLoginAt: number | null;
};
type AdminUserDetail = AdminUserListItem & {
  updatedAt: number | null;
  giftReceivedCount?: number;
  giftedCreditTotal?: number;
  purchaseCount?: number;
  purchasedCreditTotal?: number;
  visitCount?: number | null;
  totalStaySeconds?: number | null;
  purchaseHistory?: Array<{
    id: string;
    provider?: string;
    productId?: string;
    status?: string;
    amount?: number;
    currency?: string;
    paidCredit?: number;
    paidAt?: number | null;
    createdAt?: number | null;
  }>;
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
type VideoRequestStartResult = BootstrapResult & {
  requestId: string;
  dailyCreditAvailable: number;
  paidCreditAvailable: number;
  creditsAvailable: number;
};
type RefundResult = {
  refunded: boolean;
  dailyCreditAfter: number | null;
  paidCreditAfter: number | null;
  balanceAfter: number | null;
};
type VideoCompletionResult = {
  dailyCredit: number;
  paidCredit: number;
  creditsRemaining: number;
};
type PaymentSessionStatusResult = {
  status: 'success' | 'pending' | 'failed';
  paymentId: string | null;
  paidCredit: number;
  dailyCredit: number | null;
  paidCreditBalance: number | null;
  totalCreditBalance: number | null;
};
type GenerationUsageMetadata = {
  type?: GenerationRequestType;
  subjectType?: SubjectType;
  personInputLabel?: string;
  garmentInputLabel?: string;
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
  uid?: string;
  productId?: PaymentProductId;
};
type LemonCheckoutRecord = {
  id?: string;
  attributes?: {
    url?: string;
  };
};
type LemonWebhookEvent = {
  meta?: {
    event_name?: string;
    custom_data?: Record<string, unknown>;
  };
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

interface GoogleVideoGenerateResponse {
  generatedVideos?: {
    video?: {
      uri?: string;
      mimeType?: string;
    };
  }[];
  generatedSamples?: {
    video?: {
      uri?: string;
      mimeType?: string;
    };
  }[];
}

interface GoogleVideoOperationResponse {
  name?: string;
  done?: boolean;
  response?: {
    generateVideoResponse?: GoogleVideoGenerateResponse;
  };
  error?: {
    code?: number;
    message?: string;
  };
}

interface OpenAIVideoStatusResponse {
  id?: string;
  status?: string;
  response?: {
    generateVideoResponse?: GoogleVideoGenerateResponse;
  };
  error?: {
    message?: string;
  };
}

type CreationRecordResponse = {
  id: string;
  type: CreationType;
  fileUrl: string;
  createdAt: number | null;
  expireAt: number | null;
  isArchived: boolean;
  isDeleted: boolean;
};

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

const normalizeSubscriptionPlan = (value: unknown): SubscriptionPlan => {
  if (value === 'free' || value === 'basic' || value === 'pro') {
    return value as SubscriptionPlan;
  }

  return 'free';
};

const normalizeAccountRole = (value: unknown, email: string): AccountRole => {
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

const getGoogleVideoApiKey = (): string => {
  const apiKey = process.env['GOOGLE_VIDEO_API_KEY'];
  return typeof apiKey === 'string' ? apiKey.trim() : '';
};

const LEMON_VARIANT_IDS: Record<PaymentProductId, string> = {
  starter: '1425119',
  popular: '1425108',
  pro: '1425124',
  small_pack: '1425127',
  medium_pack: '1425130',
  large_pack: '1425131',
};

const getLemonApiKey = (): string => {
  const envKey = process.env['LEMONSQUEEZY_API_KEY'] ?? process.env['LEMON_API_KEY'];
  if (typeof envKey === 'string' && envKey.trim()) {
    return envKey.trim();
  }

  const configKey = functions.config()?.lemon?.api_key;
  return typeof configKey === 'string' ? configKey.trim() : '';
};

const getLemonStoreId = (): string => {
  const envValue = process.env['LEMONSQUEEZY_STORE_ID'] ?? process.env['LEMON_STORE_ID'];
  if (typeof envValue === 'string' && envValue.trim()) {
    return envValue.trim();
  }

  const configValue = functions.config()?.lemon?.store_id;
  return typeof configValue === 'string' ? configValue.trim() : '';
};

const getLemonApiBaseUrl = (): string => 'https://api.lemonsqueezy.com/v1';

const getLemonWebhookSecret = (): string => {
  const envKey = process.env['LEMONSQUEEZY_WEBHOOK_SECRET'] ?? process.env['LEMON_WEBHOOK_SECRET'];
  if (typeof envKey === 'string' && envKey.trim()) {
    return envKey.trim();
  }

  const configKey = functions.config()?.lemon?.webhook_secret;
  return typeof configKey === 'string' ? configKey.trim() : '';
};

const getLemonEnvironment = (): 'production' | 'sandbox' => {
  const value = (process.env['LEMON_ENV'] ?? functions.config()?.lemon?.environment ?? 'production').toString().trim().toLowerCase();
  return value === 'sandbox' ? 'sandbox' : 'production';
};

const getLemonVariantId = (productId: PaymentProductId): string => (
  LEMON_VARIANT_IDS[productId] || ''
);

const requireLemonConfig = (): { apiKey: string; storeId: string } => {
  const apiKey = getLemonApiKey();
  const storeId = getLemonStoreId();
  if (!apiKey || !storeId) {
    throw new Error(PAYMENT_CONFIG_ERROR);
  }

  return { apiKey, storeId };
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
  const stylingGuide = [
    bodyProfile?.outfitName ? `The garment should read clearly as ${bodyProfile.outfitName}.` : null,
    bodyProfile?.outfitMood ? `Match the overall styling to a ${bodyProfile.outfitMood} mood.` : 'Choose a pose and scene that strongly match the garment mood and purpose rather than using a generic studio-only result.',
    subjectType === 'dog' || subjectType === 'cat' ? 'Face accuracy and outfit accuracy are the two most important goals. The pet face must match the reference animal as closely as possible, and the outfit must match the reference garment as closely as possible.' : null,
    subjectType === 'dog' || subjectType === 'cat' ? 'Do not invent a different pet face, different fur pattern, different ear shape, or a generic substitute outfit.' : null,
    'Make the pose readable at a glance so the outfit mood feels clear immediately, while still keeping anatomy believable and the garment undistorted.',
    subjectType === 'dog' || subjectType === 'cat' ? 'Prioritize a cute, lively pet action over a stiff fashion pose. The image should feel like a charming split-second moment with energy, joy, and personality while keeping the outfit clearly visible.' : null,
    bodyProfile?.poseHint ? bodyProfile.poseHint.charAt(0).toUpperCase() + bodyProfile.poseHint.slice(1) + '.' : 'Use a bold expressive pose that fits the outfit mood, formality, and silhouette while keeping the full garment readable.',
    bodyProfile?.backgroundHint ? `Use ${bodyProfile.backgroundHint} as the background direction.` : 'Use a realistic background that suits the outfit mood and cultural context.',
    subjectType === 'dog' ? 'The final result must show only a dog face and dog paws, with no human or humanoid facial or limb features anywhere in the image.' : null,
    subjectType === 'cat' ? 'The final result must show only a cat face and cat paws, with no human or humanoid facial or limb features anywhere in the image.' : null,
  ].filter(Boolean).join(' ');

  return [basePrompt, bodyGuide, stylingGuide].filter(Boolean).join('\n\n');
};

const countVideoDialogueCharacters = (value: string): number => Array.from(value).length;

const isAllowedVideoDialogueCharacter = (char: string): boolean => (
  /[\p{L}\p{M}\p{N}]/u.test(char)
  || /\s/u.test(char)
  || VIDEO_DIALOGUE_ALLOWED_PUNCTUATION.includes(char)
);

const normalizeVideoDialogue = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.normalize('NFC').replace(/\s+/gu, ' ').trim();
  if (!normalized) {
    return null;
  }

  for (const char of normalized) {
    if (/[\p{Cc}\p{Cs}]/u.test(char)) {
      return null;
    }
    if (!isAllowedVideoDialogueCharacter(char)) {
      return null;
    }
  }

  const characterCount = countVideoDialogueCharacters(normalized);
  if (characterCount < 1 || characterCount > VIDEO_DIALOGUE_MAX_CHARACTERS) {
    return null;
  }

  return normalized;
};

const buildTalkingVideoPrompt = (subjectType: SubjectType, dialogue: string): string => [
  VIDEO_PROMPT_TEMPLATE,
  `Subject type: ${subjectType}.`,
  'Create a single talking-shot video from the provided source image.',
  'Preserve the exact identity, outfit, face, and framing from the source image.',
  `The subject must clearly say this exact dialogue with natural lip sync and speaking motion: ${JSON.stringify(dialogue)}.`,
  'Use subtle natural head movement, blinking, and realistic facial expression while speaking.',
  'Keep the camera stable and the result realistic, clean, and cinematic.',
].join('\n\n');

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

const createVideoReferenceInlineData = async (input: string): Promise<{ mimeType: string; data: string }> => {
  const { data } = parseDataUrl(input);
  const sourceBuffer = Buffer.from(data, 'base64');
  const normalizedBuffer = await sharp(sourceBuffer)
    .resize(1280, 720, {
      fit: 'cover',
      position: 'centre',
      withoutEnlargement: false,
    })
    .png()
    .toBuffer();

  return {
    mimeType: 'image/png',
    data: normalizedBuffer.toString('base64'),
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
    input_fidelity: 'high',
  };

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
  dialogue: string,
): Promise<{ id: string; status: string; estimatedCost: number }> => {
  const apiKey = getGoogleVideoApiKey();
  if (!apiKey) {
    throw new Error(GOOGLE_VIDEO_CONFIG_ERROR);
  }

  const referenceImage = await createVideoReferenceInlineData(image);
  functions.logger.info(`[VIDEO_PROVIDER]=${VIDEO_PROVIDER}`, {
    phase: 'create',
          model: VIDEO_MODEL,
          requestSize: VIDEO_SIZE,
          requestSeconds: Number(VIDEO_SECONDS),
          subjectType,
          dialogue,
        });
  const response = await fetch(`${GOOGLE_VIDEO_API_BASE_URL}/models/${encodeURIComponent(VIDEO_MODEL)}:predictLongRunning`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      instances: [
        {
          prompt: buildTalkingVideoPrompt(subjectType, dialogue),
          image: {
            mimeType: referenceImage.mimeType,
            bytesBase64Encoded: referenceImage.data,
          },
        },
      ],
      parameters: {
        aspectRatio: '16:9',
        durationSeconds: Number(VIDEO_SECONDS),
        resolution: '720p',
        ...(subjectType === 'human' ? { personGeneration: 'allow_adult' } : {}),
      },
    }),
  });

  const responseBody = await response.json().catch(() => ({})) as GoogleVideoOperationResponse;
  if (!response.ok || !responseBody.name) {
    functions.logger.error(`[VIDEO_PROVIDER]=${VIDEO_PROVIDER}`, {
      phase: 'create',
      status: response.status,
      body: responseBody,
    });
    throw new UpstreamApiError(
      response.status || 502,
      responseBody.error?.message || `Google Veo video creation error ${response.status}`,
    );
  }

  return {
    id: responseBody.name,
    status: responseBody.done ? 'completed' : 'processing',
    estimatedCost: VIDEO_ESTIMATED_COST,
  };
};

const fetchOpenAIVideoStatus = async (videoId: string): Promise<OpenAIVideoStatusResponse> => {
  const apiKey = getGoogleVideoApiKey();
  if (!apiKey) {
    throw new Error(GOOGLE_VIDEO_CONFIG_ERROR);
  }

  functions.logger.info(`[VIDEO_PROVIDER]=${VIDEO_PROVIDER}`, {
    phase: 'status',
    operationName: videoId,
  });
  const response = await fetch(`${GOOGLE_VIDEO_API_BASE_URL}/${videoId}`, {
    method: 'GET',
    headers: {
      'x-goog-api-key': apiKey,
    },
  });

  const responseBody = await response.json().catch(() => ({})) as GoogleVideoOperationResponse;
  if (!response.ok) {
    functions.logger.error(`[VIDEO_PROVIDER]=${VIDEO_PROVIDER}`, {
      phase: 'status',
      operationName: videoId,
      status: response.status,
      body: responseBody,
    });
    throw new Error(responseBody.error?.message || `Google Veo video status error ${response.status}`);
  }

  return {
    id: responseBody.name || videoId,
    status: responseBody.done
      ? (responseBody.error?.message ? 'failed' : 'completed')
      : 'processing',
    response: responseBody.response,
    error: responseBody.error?.message ? { message: responseBody.error.message } : undefined,
  };
};

const streamOpenAIVideoContent = async (videoId: string): Promise<Response> => {
  const apiKey = getGoogleVideoApiKey();
  if (!apiKey) {
    throw new Error(GOOGLE_VIDEO_CONFIG_ERROR);
  }

  functions.logger.info(`[VIDEO_PROVIDER]=${VIDEO_PROVIDER}`, {
    phase: 'content',
    operationName: videoId,
  });
  const statusResponse = await fetch(`${GOOGLE_VIDEO_API_BASE_URL}/${videoId}`, {
    method: 'GET',
    headers: {
      'x-goog-api-key': apiKey,
    },
  });
  const statusBody = await statusResponse.json().catch(() => ({})) as GoogleVideoOperationResponse;
  if (!statusResponse.ok) {
    functions.logger.error(`[VIDEO_PROVIDER]=${VIDEO_PROVIDER}`, {
      phase: 'content-status',
      operationName: videoId,
      status: statusResponse.status,
      body: statusBody,
    });
    throw new Error(statusBody.error?.message || `Google Veo video content status error ${statusResponse.status}`);
  }

  const generatedVideo = statusBody.response?.generateVideoResponse?.generatedVideos?.[0]
    ?? statusBody.response?.generateVideoResponse?.generatedSamples?.[0]
    ?? null;
  const videoUri = generatedVideo?.video?.uri;
  if (!videoUri) {
    throw new Error(statusBody.error?.message || 'Google Veo video content URI not found');
  }

  const response = await fetch(videoUri, {
    method: 'GET',
    headers: {
      'x-goog-api-key': apiKey,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    functions.logger.error(`[VIDEO_PROVIDER]=${VIDEO_PROVIDER}`, {
      phase: 'content-download',
      operationName: videoId,
      status: response.status,
      body: errorBody,
    });
    throw new Error(errorBody || `Google Veo video content error ${response.status}`);
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

const requireAdminUser = async (user: AuthenticatedUser): Promise<UserAccount> => {
  const snapshot = await db.collection('users').doc(user.uid).get();
  const account = normalizeUserAccount(user.email, snapshot.data());
  if (account.role !== 'admin') {
    throw new Error('FORBIDDEN');
  }

  return account;
};

const createCreditTransactionRef = () => db.collection('credit_transactions').doc();

const buildPaymentDocId = (provider: PaymentProvider, providerPaymentId: string): string =>
  `${provider}_${providerPaymentId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

const createGenerationDocRef = (uid: string, requestId: string) =>
  db.collection('generations').doc(buildGenerationRequestDocId(uid, requestId));

const createUserCreationDocRef = (uid: string, creationId: string) =>
  db.collection('users').doc(uid).collection('creations').doc(creationId);

const buildCreationStoragePath = (uid: string, creationId: string, extension: string) =>
  `creations/${uid}/${creationId}.${extension.replace(/^\./, '')}`;

const buildHistoryRetentionTimestamps = (
  now = admin.firestore.Timestamp.now(),
): {
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  expiresAt: FirebaseFirestore.Timestamp;
} => ({
  createdAt: now,
  updatedAt: now,
  expiresAt: admin.firestore.Timestamp.fromMillis(
    now.toMillis() + HISTORY_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  ),
});

const buildCreationExpireAt = (
  now = admin.firestore.Timestamp.now(),
  days = HISTORY_RETENTION_DAYS,
): FirebaseFirestore.Timestamp =>
  admin.firestore.Timestamp.fromMillis(now.toMillis() + days * 24 * 60 * 60 * 1000);

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
  return {
    account,
    dailyRewardGranted: 0,
    dailyResetApplied: false,
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

const beginVideoGenerationRequest = async (
  user: AuthenticatedUser,
  requestId: string,
  subjectType: SubjectType,
  sourceResultId?: string,
  dialogue?: string,
): Promise<VideoRequestStartResult> => {
  if (!requestId) {
    throw new Error(DUPLICATE_REQUEST_ERROR);
  }

  const userRef = db.collection('users').doc(user.uid);
  const requestRef = db.collection('generationRequests').doc(buildGenerationRequestDocId(user.uid, requestId));
  const generationLockRef = db.collection('videoGenerationLocks').doc(user.uid);
  const result: VideoRequestStartResult = {
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
    dailyCreditAvailable: 0,
    paidCreditAvailable: 0,
    creditsAvailable: 0,
  };

  await db.runTransaction(async (transaction) => {
    const [userSnapshot, requestSnapshot] = await Promise.all([
      transaction.get(userRef),
      transaction.get(requestRef),
    ]);

    if (requestSnapshot.exists) {
      throw new Error(DUPLICATE_REQUEST_ERROR);
    }

    let account = normalizeUserAccount(user.email, userSnapshot.data());
    const reset = applyDailyResetIfNeeded(transaction, user, account);
    account = reset.account;
    result.dailyRewardGranted = reset.dailyRewardGranted;
    const signupBonus = applySignupBonusIfNeeded(transaction, user, account, !userSnapshot.exists);
    account = signupBonus.account;
    result.signupBonusGranted = signupBonus.signupBonusGranted;

    if (account.credits < VIDEO_GENERATION_COST) {
      throw new Error(VIDEO_NOT_ENOUGH_CREDITS_ERROR);
    }

    const userData = userSnapshot.data() ?? {};
    const todayKey = getTodayKeyInSeoul();
    const isPrivilegedVideoUser = account.role === 'admin';
    const storedFailureDateKey = typeof userData.videoGenerationFailureDateKey === 'string'
      ? userData.videoGenerationFailureDateKey
      : '';
    const currentFailureCount = storedFailureDateKey === todayKey && typeof userData.videoGenerationFailureCount === 'number'
      ? Math.max(0, Math.trunc(userData.videoGenerationFailureCount))
      : 0;

    if (!isPrivilegedVideoUser && currentFailureCount >= MAX_VIDEO_FAILURES_PER_DAY) {
      throw new Error(VIDEO_FAILURE_LIMIT_REACHED_ERROR);
    }

    if (!isPrivilegedVideoUser && userData.videoGenerationInProgress === true) {
      throw new Error(VIDEO_GENERATION_IN_PROGRESS_ERROR);
    }

    transaction.set(
      userRef,
      {
        ...buildUserAccountPayload(account, user.email || account.email, {
          setCreatedAt: !userSnapshot.exists,
          setLastDailyResetAt: reset.dailyResetApplied,
          touchLogin: true,
        }),
        videoGenerationInProgress: true,
        activeVideoGenerationRequestId: requestId,
        videoGenerationStartedAt: admin.firestore.FieldValue.serverTimestamp(),
        videoGenerationFailureDateKey: todayKey,
        videoGenerationFailureCount: currentFailureCount,
      },
      { merge: true },
    );
    transaction.set(requestRef, {
      uid: user.uid,
      email: user.email || account.email,
      requestId,
      type: 'video_generation',
      cost: VIDEO_GENERATION_COST,
      usedCreditType: null,
      usedCreditAmount: 0,
      subjectType,
      sourceResultId: sourceResultId || null,
      dialogue: dialogue || null,
      model: VIDEO_MODEL,
      quality: 'standard',
      size: VIDEO_SIZE,
      durationSeconds: Number(VIDEO_SECONDS),
      usage: {
        input_tokens: 0,
        output_tokens: 0,
      },
      estimatedCost: VIDEO_ESTIMATED_COST,
      status: 'pending',
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
      type: 'video_generation',
      status: 'pending',
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    result.profile = buildBootstrapProfile(account);
    result.dailyCreditAvailable = account.dailyCredit;
    result.paidCreditAvailable = account.paidCredit;
    result.creditsAvailable = account.credits;
  });

  return result;
};

const releaseVideoGenerationLock = (
  transaction: FirebaseFirestore.Transaction,
  userRef: FirebaseFirestore.DocumentReference,
  requestId: string,
) => {
  transaction.set(userRef, {
    videoGenerationInProgress: false,
    activeVideoGenerationRequestId: admin.firestore.FieldValue.delete(),
    videoGenerationStartedAt: admin.firestore.FieldValue.delete(),
    lastVideoGenerationRequestId: requestId,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
};

const completeVideoGenerationAndCharge = async (
  user: AuthenticatedUser,
  requestId: string,
  metadata: Record<string, unknown> & { fileUrl: string },
): Promise<VideoCompletionResult> => {
  const requestRef = db.collection('generationRequests').doc(buildGenerationRequestDocId(user.uid, requestId));
  const generationLockRef = db.collection('videoGenerationLocks').doc(user.uid);
  const generationRef = createGenerationDocRef(user.uid, requestId);
  const userRef = db.collection('users').doc(user.uid);
  const result: VideoCompletionResult = {
    dailyCredit: 0,
    paidCredit: 0,
    creditsRemaining: 0,
  };

  await db.runTransaction(async (transaction) => {
    const [userSnapshot, requestSnapshot] = await Promise.all([
      transaction.get(userRef),
      transaction.get(requestRef),
    ]);

    if (!requestSnapshot.exists) {
      throw new Error('Video request not found.');
    }

    const requestData = requestSnapshot.data() ?? {};
    const account = normalizeUserAccount(user.email, userSnapshot.data());
    if (requestData.status === 'completed' && requestData.success === true) {
      result.dailyCredit = account.dailyCredit;
      result.paidCredit = account.paidCredit;
      result.creditsRemaining = account.credits;
      return;
    }

    let remainingCharge = VIDEO_GENERATION_COST;
    const dailyDeduction = Math.min(account.dailyCredit, remainingCharge);
    remainingCharge -= dailyDeduction;
    const paidDeduction = Math.min(account.paidCredit, remainingCharge);
    remainingCharge -= paidDeduction;

    if (remainingCharge > 0) {
      throw new Error(VIDEO_NOT_ENOUGH_CREDITS_ERROR);
    }

    const nextAccount: UserAccount = {
      ...account,
      dailyCredit: account.dailyCredit - dailyDeduction,
      paidCredit: account.paidCredit - paidDeduction,
      credits: account.credits - VIDEO_GENERATION_COST,
    };
    const usedCreditType: CreditType = dailyDeduction > 0 ? 'daily' : 'paid';

    transaction.set(userRef, buildUserAccountPayload(nextAccount, user.email || account.email), { merge: true });
    releaseVideoGenerationLock(transaction, userRef, requestId);
    transaction.set(requestRef, {
      ...metadata,
      status: 'completed',
      success: true,
      refunded: false,
      usedCreditType,
      usedCreditAmount: VIDEO_GENERATION_COST,
      chargedAt: admin.firestore.FieldValue.serverTimestamp(),
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    transaction.set(generationRef, {
      uid: user.uid,
      email: user.email,
      requestId,
      videoRequestId: requestId,
      resultType: 'video_generation',
      subjectType: normalizeSubjectType(metadata.subjectType),
      fileUrl: metadata.fileUrl,
      status: 'completed',
      usedCreditType,
      usedCreditAmount: VIDEO_GENERATION_COST,
      watermarkApplied: false,
      imageUrl: null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    transaction.set(generationLockRef, {
      requestId,
      status: 'completed',
      releasedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    if (dailyDeduction > 0) {
      writeCreditTransaction(transaction, {
        uid: user.uid,
        email: user.email || account.email,
        type: 'use_daily',
        amount: -dailyDeduction,
        balanceDailyAfter: nextAccount.dailyCredit,
        balancePaidAfter: paidDeduction > 0 ? account.paidCredit : nextAccount.paidCredit,
        relatedGenerationId: buildGenerationRequestDocId(user.uid, requestId),
        memo: `video request ${requestId}`,
      });
    }
    if (paidDeduction > 0) {
      writeCreditTransaction(transaction, {
        uid: user.uid,
        email: user.email || account.email,
        type: 'use_paid',
        amount: -paidDeduction,
        balanceDailyAfter: nextAccount.dailyCredit,
        balancePaidAfter: nextAccount.paidCredit,
        relatedGenerationId: buildGenerationRequestDocId(user.uid, requestId),
        memo: `video request ${requestId}`,
      });
    }

    result.dailyCredit = nextAccount.dailyCredit;
    result.paidCredit = nextAccount.paidCredit;
    result.creditsRemaining = nextAccount.credits;
  });

  return result;
};

const markVideoGenerationFailed = async (
  user: AuthenticatedUser,
  requestId: string,
  status: 'failed' | 'canceled',
  errorMessage: string,
): Promise<VideoCompletionResult> => {
  const requestRef = db.collection('generationRequests').doc(buildGenerationRequestDocId(user.uid, requestId));
  const generationLockRef = db.collection('videoGenerationLocks').doc(user.uid);
  const userRef = db.collection('users').doc(user.uid);
  const result: VideoCompletionResult = {
    dailyCredit: 0,
    paidCredit: 0,
    creditsRemaining: 0,
  };

  await db.runTransaction(async (transaction) => {
    const [userSnapshot, requestSnapshot] = await Promise.all([
      transaction.get(userRef),
      transaction.get(requestRef),
    ]);

    if (!userSnapshot.exists || !requestSnapshot.exists) {
      return;
    }

    const requestData = requestSnapshot.data() ?? {};
    const account = normalizeUserAccount(user.email, userSnapshot.data());
    const todayKey = getTodayKeyInSeoul();
    const userData = userSnapshot.data() ?? {};
    const storedFailureDateKey = typeof userData.videoGenerationFailureDateKey === 'string'
      ? userData.videoGenerationFailureDateKey
      : '';
    const currentFailureCount = storedFailureDateKey === todayKey && typeof userData.videoGenerationFailureCount === 'number'
      ? Math.max(0, Math.trunc(userData.videoGenerationFailureCount))
      : 0;
    const alreadyTerminal = requestData.status === 'failed' || requestData.status === 'canceled' || requestData.status === 'completed';
    const nextFailureCount = alreadyTerminal ? currentFailureCount : currentFailureCount + 1;

    releaseVideoGenerationLock(transaction, userRef, requestId);
    transaction.set(userRef, {
      videoGenerationFailureDateKey: todayKey,
      videoGenerationFailureCount: nextFailureCount,
    }, { merge: true });
    transaction.set(requestRef, {
      status,
      success: false,
      refunded: false,
      errorMessage,
      failedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    transaction.set(generationLockRef, {
      requestId,
      status,
      errorMessage,
      releasedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    result.dailyCredit = account.dailyCredit;
    result.paidCredit = account.paidCredit;
    result.creditsRemaining = account.credits;
  });

  return result;
};

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
    personInputLabel?: string;
    garmentInputLabel?: string;
    personPreviewImage?: string;
    garmentPreviewImage?: string;
  },
): Promise<void> => {
  const requestRef = db.collection('generationRequests').doc(buildGenerationRequestDocId(user.uid, requestId));
  const generationLockRef = db.collection('generationLocks').doc(user.uid);
  const generationRef = createGenerationDocRef(user.uid, requestId);
  const userRef = db.collection('users').doc(user.uid);
  const historyTimestamps = buildHistoryRetentionTimestamps();

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
      resultType: 'image_generation',
      subjectType: metadata.subjectType || 'human',
      personInputLabel: options.personInputLabel || null,
      garmentInputLabel: options.garmentInputLabel || null,
      personPreviewUrl: options.personPreviewImage || null,
      garmentPreviewUrl: options.garmentPreviewImage || null,
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
      preservedAt: null,
      preservedUntil: null,
      expiresAt: historyTimestamps.expiresAt,
      createdAt: historyTimestamps.createdAt,
      updatedAt: historyTimestamps.updatedAt,
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

const buildWatermarkSvg = (width: number, height: number): Buffer => {
  const paddingX = 18;
  const paddingY = 12;
  const fontSize = Math.max(22, Math.round(width * 0.018));
  const label = 'hamdeva.com';
  const estimatedTextWidth = Math.round(label.length * fontSize * 0.58);
  const badgeWidth = estimatedTextWidth + paddingX * 2;
  const badgeHeight = fontSize + paddingY * 2;
  const radius = Math.round(badgeHeight / 2);
  const x = Math.max(20, width - badgeWidth - 28);
  const y = Math.max(20, height - badgeHeight - 28);
  const textX = x + badgeWidth / 2;
  const textY = y + badgeHeight / 2 + fontSize * 0.34;

  return Buffer.from(`
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="5" stdDeviation="8" flood-color="rgba(0,0,0,0.28)"/>
    </filter>
  </defs>
  <g filter="url(#shadow)">
    <rect
      x="${x}"
      y="${y}"
      width="${badgeWidth}"
      height="${badgeHeight}"
      rx="${radius}"
      ry="${radius}"
      fill="rgba(255,255,255,0.42)"
      stroke="rgba(255,255,255,0.62)"
      stroke-width="1.2"
    />
    <text
      x="${textX}"
      y="${textY}"
      font-size="${fontSize}"
      font-family="Arial, Helvetica, sans-serif"
      font-weight="700"
      letter-spacing="0.4"
      text-anchor="middle"
      fill="rgba(33,33,33,0.92)"
    >${label}</text>
  </g>
</svg>`.trim());
};

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
): Promise<{ responseDataUrl: string; responseMimeType: string; storedImageUrl: string; responseBuffer: Buffer }> => {
  const sourceBuffer = Buffer.from(imageData, 'base64');
  const responseBuffer = watermarkApplied ? await applyWatermarkToImageBuffer(sourceBuffer) : sourceBuffer;
  const responseMimeType = watermarkApplied ? 'image/png' : mimeType;

  return {
    responseDataUrl: `data:${responseMimeType};base64,${responseBuffer.toString('base64')}`,
    responseMimeType,
    storedImageUrl: await createStoredImageDataUrl(responseBuffer),
    responseBuffer,
  };
};

const storageExtensionForMimeType = (mimeType: string): string => {
  switch (mimeType) {
    case 'video/mp4':
      return 'mp4';
    case 'image/jpeg':
      return 'jpg';
    case 'image/webp':
      return 'webp';
    default:
      return 'png';
  }
};

const uploadCreationAsset = async (params: {
  uid: string;
  creationId: string;
  contentType: string;
  buffer: Buffer;
}): Promise<string> => {
  const storagePath = buildCreationStoragePath(
    params.uid,
    params.creationId,
    storageExtensionForMimeType(params.contentType),
  );

  await bucket.file(storagePath).save(params.buffer, {
    resumable: false,
    metadata: {
      contentType: params.contentType,
      cacheControl: 'private, max-age=31536000',
    },
  });

  return storagePath;
};

const getSignedCreationUrl = async (storagePath: string): Promise<string> => {
  const [url] = await bucket.file(storagePath).getSignedUrl({
    action: 'read',
    expires: '2500-01-01',
  });
  return url;
};

const deleteCreationAsset = async (storagePath: string): Promise<void> => {
  try {
    await bucket.file(storagePath).delete();
  } catch (error) {
    const code = typeof error === 'object' && error !== null && 'code' in error ? (error as { code?: number }).code : undefined;
    if (code !== 404) {
      throw error;
    }
  }
};

const upsertCreationRecord = async (params: {
  uid: string;
  creationId: string;
  type: CreationType;
  fileUrl: string;
}): Promise<void> => {
  const now = admin.firestore.Timestamp.now();
  await createUserCreationDocRef(params.uid, params.creationId).set({
    type: params.type,
    fileUrl: params.fileUrl,
    createdAt: now,
    expireAt: buildCreationExpireAt(now),
    isArchived: false,
    isDeleted: false,
  }, { merge: true });
};

const getPaymentProduct = (productId: PaymentProductId) => PAYMENT_PRODUCTS[productId];

const getRequestStringHeaders = (req: functions.https.Request): Record<string, string> =>
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
  const paidAtDate = params.paidAt ? new Date(params.paidAt) : null;
  const paidAtTimestamp = paidAtDate && !Number.isNaN(paidAtDate.getTime())
    ? admin.firestore.Timestamp.fromDate(paidAtDate)
    : null;

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
      // TODO: apply one-time +20% bonus credits for the first subscription purchase only.
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
      email: email || account.email,
      provider: params.provider,
      providerPaymentId: params.providerPaymentId,
      productId: product.id,
      amount: typeof params.amount === 'number' && Number.isFinite(params.amount) ? params.amount : product.amountUsd,
      amountCents: product.amountCents,
      currency: typeof params.currency === 'string' && params.currency ? params.currency : product.currency,
      paidCredit: product.paidCredit,
      status: 'paid',
      paidAt: paidAtTimestamp,
      rawPayload: params.rawPayload ?? null,
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

const normalizePaymentStatusForClient = (status: string | undefined): PaymentSessionStatusResult['status'] => {
  if (status === 'paid' || status === 'succeeded' || status === 'confirmed' || status === 'completed') {
    return 'success';
  }

  if (status === 'failed' || status === 'canceled' || status === 'cancelled' || status === 'expired' || status === 'past_due') {
    return 'failed';
  }

  return 'pending';
};

const toTimestampMillis = (value: unknown): number | null => {
  if (!value) {
    return null;
  }

  if (value instanceof admin.firestore.Timestamp) {
    return value.toMillis();
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.getTime();
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.getTime();
  }

  return null;
};

const getCheckoutSessionStatus = async (
  user: AuthenticatedUser,
  sessionId?: string,
): Promise<PaymentSessionStatusResult> => {
  const userSnapshotPromise = db.collection('users').doc(user.uid).get();
  const paymentSnapshotPromise = sessionId
    ? db.collection('payments').doc(buildPaymentDocId(LEMON_PROVIDER, sessionId)).get()
    : db.collection('payments')
        .where('uid', '==', user.uid)
        .orderBy('updatedAt', 'desc')
        .limit(10)
        .get()
        .then((snapshot) => snapshot.docs.find((doc) => doc.data()?.provider === LEMON_PROVIDER) ?? null);

  const [paymentSnapshotLike, userSnapshot] = await Promise.all([
    paymentSnapshotPromise,
    userSnapshotPromise,
  ]);
  let account = normalizeUserAccount(user.email, userSnapshot.data());
  let paymentSnapshot = paymentSnapshotLike && 'exists' in paymentSnapshotLike
    ? paymentSnapshotLike
    : null;
  let paymentData = paymentSnapshot?.data() ?? {};

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

  if (paymentData.uid !== user.uid) {
    throw new Error('FORBIDDEN');
  }

  const storedStatus = typeof paymentData.status === 'string' ? paymentData.status.toLowerCase() : undefined;
  let normalizedStatus = normalizePaymentStatusForClient(storedStatus || 'pending');

  if (normalizedStatus === 'pending') {
    const pendingCreatedAtMillis = toTimestampMillis(paymentData.createdAt) ?? 0;
    const latestPaidSnapshot = await db.collection('payments')
      .where('uid', '==', user.uid)
      .orderBy('updatedAt', 'desc')
      .limit(20)
      .get();

    const matchedPaidDoc = latestPaidSnapshot.docs.find((doc) => {
      const data = doc.data();
      if (data?.provider !== LEMON_PROVIDER || data?.status !== 'paid') {
        return false;
      }

      const candidateUpdatedAtMillis = toTimestampMillis(data.updatedAt) ?? 0;
      const candidateCreatedAtMillis = toTimestampMillis(data.createdAt) ?? 0;
      return candidateUpdatedAtMillis >= pendingCreatedAtMillis || candidateCreatedAtMillis >= pendingCreatedAtMillis;
    });

    if (matchedPaidDoc) {
      paymentSnapshot = matchedPaidDoc;
      paymentData = matchedPaidDoc.data() ?? {};
      normalizedStatus = 'success';
      account = normalizeUserAccount(user.email, userSnapshot.data());
    }
  }

  return {
    status: normalizedStatus,
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
  const { productId, uid } = req.body as CheckoutSessionRequest;
  if (!isPaymentProductId(productId)) {
    res.status(400).json({ error: 'INVALID_PRODUCT', message: '유효하지 않은 상품입니다.' });
    return;
  }
  if (typeof uid === 'string' && uid && uid !== user.uid) {
    res.status(403).json({ error: 'FORBIDDEN', message: '접근 권한이 없습니다.' });
    return;
  }

  const { apiKey, storeId } = requireLemonConfig();
  const product = getPaymentProduct(productId);
  const variantId = getLemonVariantId(productId);
  if (!variantId) {
    throw new Error(PAYMENT_CONFIG_ERROR);
  }
  const successUrl = `${process.env['APP_BASE_URL']?.trim() || 'https://hamdeva.com'}/payment-success`;
  const response = await fetch(`${getLemonApiBaseUrl()}/checkouts`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            email: user.email,
            custom: {
              uid: user.uid,
              productId: product.id,
              paidCredit: String(product.paidCredit),
            },
          },
          checkout_options: {
            embed: false,
            media: true,
            logo: true,
            desc: true,
          },
          product_options: {
            redirect_url: successUrl,
            receipt_button_text: 'Return to HAMDEVA',
            receipt_link_url: successUrl,
          },
          test_mode: getLemonEnvironment() === 'sandbox',
        },
        relationships: {
          store: {
            data: {
              type: 'stores',
              id: storeId,
            },
          },
          variant: {
            data: {
              type: 'variants',
              id: variantId,
            },
          },
        },
      },
    }),
  });
  const payload = await response.json().catch(() => ({})) as { data?: LemonCheckoutRecord };
  const checkoutData = getObjectValue(payload.data, payload);
  const checkout = checkoutData as LemonCheckoutRecord;
  const checkoutUrl = getStringValue(checkout.attributes?.url, getObjectValue(checkoutData.attributes).url);
  const checkoutId = getStringValue(checkout.id);
  if (!response.ok || !checkoutId || !checkoutUrl) {
    throw new Error(PAYMENT_CONFIG_ERROR);
  }

  await upsertPendingPayment({
    provider: LEMON_PROVIDER,
    providerPaymentId: checkoutId,
    uid: user.uid,
    productId,
  });

  res.json({
    success: true,
    sessionId: checkoutId,
    checkoutUrl,
  });
};

const handleCheckoutSessionStatusRequest = async (req: functions.https.Request, res: functions.Response) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const user = await requireAuthenticatedUser(req);
  const sessionId = typeof req.query.sessionId === 'string'
    ? req.query.sessionId
    : typeof req.query.checkout_id === 'string'
      ? req.query.checkout_id
      : undefined;
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

const getStoredPaymentContext = async (provider: PaymentProvider, providerPaymentId: string): Promise<{ uid: string; productId: PaymentProductId } | null> => {
  const paymentSnapshot = await db.collection('payments').doc(buildPaymentDocId(provider, providerPaymentId)).get();
  const data = paymentSnapshot.data();
  if (!data || typeof data.uid !== 'string' || !isPaymentProductId(data.productId)) {
    return null;
  }

  return {
    uid: data.uid,
    productId: data.productId,
  };
};

const verifyLemonWebhookSignature = (rawPayload: string, signatureHeader: string, webhookSecret: string): boolean => {
  try {
    const expected = createHmac('sha256', webhookSecret).update(rawPayload).digest('hex');
    const expectedBuffer = Buffer.from(expected, 'hex');
    const candidateBuffer = Buffer.from(signatureHeader, 'hex');
    return candidateBuffer.length === expectedBuffer.length && timingSafeEqual(candidateBuffer, expectedBuffer);
  } catch {
    return false;
  }
};

const handleLemonWebhookRequest = async (req: functions.https.Request, res: functions.Response) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const webhookSecret = getLemonWebhookSecret();
  if (!webhookSecret) {
    throw new Error(PAYMENT_CONFIG_ERROR);
  }

  const rawPayload = req.rawBody.toString('utf8');
  const headers = getRequestStringHeaders(req);
  const signatureHeader = headers['x-signature'];
  if (!signatureHeader) {
    res.status(400).json({ error: 'MISSING_SIGNATURE' });
    return;
  }

  if (!verifyLemonWebhookSignature(rawPayload, signatureHeader, webhookSecret)) {
    functions.logger.error('LemonSqueezy webhook signature verification failed');
    res.status(400).json({ error: 'INVALID_SIGNATURE' });
    return;
  }

  const event = JSON.parse(rawPayload) as LemonWebhookEvent;
  const data = getObjectValue(event.data);
  const attributes = getObjectValue(data.attributes);
  const customData = getObjectValue(event.meta?.custom_data);
  const providerPaymentId = getStringValue(data.id);
  const contextFromPayment = providerPaymentId ? await getStoredPaymentContext(LEMON_PROVIDER, providerPaymentId) : null;
  const uid = getStringValue(customData.uid, contextFromPayment?.uid);
  const rawProductId = getStringValue(customData.productId, contextFromPayment?.productId);
  const eventType = getStringValue(event.meta?.event_name);
  const isCompletedEvent = eventType === 'order_created';
  const isFailedEvent = eventType === 'subscription_payment_failed';
  const isCanceledEvent = eventType === 'subscription_cancelled' || eventType === 'subscription_expired';

  try {
    if (isCompletedEvent) {
      if (!providerPaymentId || !uid || !isPaymentProductId(rawProductId)) {
        throw new Error('INVALID_LEMON_PAYMENT_CONTEXT');
      }

      await fulfillCreditPurchase({
        provider: LEMON_PROVIDER,
        providerPaymentId,
        uid,
        productId: rawProductId,
        amount: (() => {
          const rawAmount = typeof attributes.total === 'number'
            ? attributes.total
            : typeof attributes.total === 'string'
              ? Number.parseFloat(attributes.total)
              : Number.NaN;
          return Number.isFinite(rawAmount) ? rawAmount / 100 : null;
        })(),
        currency: getStringValue(attributes.currency, attributes.currency_code),
        paidAt: getStringValue(attributes.created_at, attributes.updated_at),
        rawPayload: event,
      });
    } else if (isFailedEvent) {
      if (!providerPaymentId) {
        throw new Error('INVALID_LEMON_PAYMENT_CONTEXT');
      }
      await markPaymentStatus({ provider: LEMON_PROVIDER, providerPaymentId, status: 'failed' });
    } else if (isCanceledEvent) {
      if (!providerPaymentId) {
        throw new Error('INVALID_LEMON_PAYMENT_CONTEXT');
      }
      await markPaymentStatus({ provider: LEMON_PROVIDER, providerPaymentId, status: 'canceled' });
    }

    res.json({ received: true });
  } catch (error) {
    functions.logger.error('LemonSqueezy webhook processing failed', {
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

  if (error instanceof Error && error.message === VIDEO_NOT_ENOUGH_CREDITS_ERROR) {
    res.status(402).json({ error: VIDEO_NOT_ENOUGH_CREDITS_ERROR, message: VIDEO_NOT_ENOUGH_CREDITS_MESSAGE, cost: VIDEO_GENERATION_COST });
    return;
  }

  if (error instanceof Error && error.message === PAYMENT_CONFIG_ERROR) {
    res.status(500).json({ error: PAYMENT_CONFIG_ERROR, message: PAYMENT_CONFIG_MESSAGE });
    return;
  }

  if (error instanceof Error && error.message === GOOGLE_VIDEO_CONFIG_ERROR) {
    res.status(500).json({ error: GOOGLE_VIDEO_CONFIG_ERROR, message: GOOGLE_VIDEO_CONFIG_MESSAGE });
    return;
  }

  if (error instanceof Error && error.message === INVALID_VIDEO_DIALOGUE_ERROR) {
    res.status(400).json({ error: INVALID_VIDEO_DIALOGUE_ERROR, message: INVALID_VIDEO_DIALOGUE_MESSAGE });
    return;
  }

  if (error instanceof Error && error.message === DUPLICATE_REQUEST_ERROR) {
    res.status(409).json({ error: DUPLICATE_REQUEST_ERROR, message: DUPLICATE_REQUEST_MESSAGE });
    return;
  }

  if (error instanceof Error && error.message === VIDEO_GENERATION_IN_PROGRESS_ERROR) {
    res.status(409).json({ error: VIDEO_GENERATION_IN_PROGRESS_ERROR, message: VIDEO_GENERATION_IN_PROGRESS_MESSAGE });
    return;
  }

  if (error instanceof Error && error.message === VIDEO_FAILURE_LIMIT_REACHED_ERROR) {
    res.status(429).json({ error: VIDEO_FAILURE_LIMIT_REACHED_ERROR, message: VIDEO_FAILURE_LIMIT_REACHED_MESSAGE });
    return;
  }

  if (error instanceof Error && error.message === 'ARCHIVE_LIMIT_REACHED') {
    res.status(400).json({ error: 'ARCHIVE_LIMIT_REACHED', message: `보관은 최대 ${MAX_ARCHIVED_CREATIONS}개까지 가능합니다.` });
    return;
  }

  if (error instanceof Error && error.message === 'CREATION_NOT_FOUND') {
    res.status(404).json({ error: 'CREATION_NOT_FOUND', message: '생성 이력을 찾을 수 없습니다.' });
    return;
  }

  if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
    res.status(404).json({ error: 'USER_NOT_FOUND', message: '사용자를 찾을 수 없습니다.' });
    return;
  }

  res.status(fallbackStatus).json({
    error: error instanceof Error ? error.message : 'INTERNAL_ERROR',
    message: error instanceof Error ? error.message : 'Unexpected server error',
  });
};

const serializeTimestamp = (value: unknown): number | null => {
  if (value instanceof admin.firestore.Timestamp) {
    return value.toMillis();
  }

  return null;
};

const getTrimmedString = (value: unknown, maxLength: number): string => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().slice(0, maxLength);
};

const getDisplayNameValue = (data: FirebaseFirestore.DocumentData | undefined): string | null => {
  const displayName = getTrimmedString(data?.displayName, 120);
  if (displayName) {
    return displayName;
  }

  const nickname = getTrimmedString(data?.nickname, 120);
  return nickname || null;
};

const isRealAdminMemberEmail = (value: string): boolean => {
  const email = value.trim().toLowerCase();
  if (!email) {
    return false;
  }

  if (email.endsWith('@example.com')) {
    return false;
  }

  return !email.includes('smoke') && !email.includes('codex-sample');
};

const isRealAdminMemberItem = (item: AdminUserListItem): boolean => (
  isRealAdminMemberEmail(item.email)
);

const buildAdminUserListItem = (
  snapshot: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot,
): AdminUserListItem | null => {
  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data() ?? {};
  const account = normalizeUserAccount(typeof data.email === 'string' ? data.email : '', data);
  const displayName = getDisplayNameValue(data);
  const nickname = getTrimmedString(data.nickname, 120) || null;

  return {
    uid: snapshot.id,
    email: account.email,
    displayName,
    nickname,
    credits: account.credits,
    dailyCredit: account.dailyCredit,
    paidCredit: account.paidCredit,
    totalGenerated: account.totalGenerated,
    isSubscribed: account.isSubscribed,
    subscriptionPlan: account.subscriptionPlan,
    role: account.role,
    createdAt: serializeTimestamp(data.createdAt),
    lastLoginAt: serializeTimestamp(data.lastLoginAt),
  };
};

const buildAdminUserDetail = async (
  snapshot: FirebaseFirestore.DocumentSnapshot,
): Promise<AdminUserDetail | null> => {
  const summary = buildAdminUserListItem(snapshot);
  if (!summary) {
    return null;
  }

  const data = snapshot.data() ?? {};
  const [giftSnapshot, paymentSnapshot] = await Promise.all([
    db.collection('credit_transactions').where('uid', '==', snapshot.id).get(),
    db.collection('payments').where('uid', '==', snapshot.id).get(),
  ]);
  const giftRecords = giftSnapshot.docs
    .map((doc) => doc.data() ?? {})
    .filter((item) => item.type === 'admin_gift');
  const giftedCreditTotal = giftRecords.reduce((sum, item) => {
    const amount = typeof item.amount === 'number' && Number.isFinite(item.amount) ? item.amount : 0;
    return sum + amount;
  }, 0);
  const purchaseHistory = paymentSnapshot.docs
    .map((doc) => {
      const item = doc.data() ?? {};
      return {
        id: doc.id,
        provider: typeof item.provider === 'string' ? item.provider : '',
        productId: typeof item.productId === 'string' ? item.productId : '',
        status: typeof item.status === 'string' ? item.status : '',
        amount: typeof item.amount === 'number' && Number.isFinite(item.amount) ? item.amount : 0,
        currency: typeof item.currency === 'string' ? item.currency : '',
        paidCredit: typeof item.paidCredit === 'number' && Number.isFinite(item.paidCredit) ? item.paidCredit : 0,
        paidAt: serializeTimestamp(item.paidAt),
        createdAt: serializeTimestamp(item.createdAt),
      };
    })
    .sort((left, right) => {
      const leftTime = left.paidAt ?? left.createdAt ?? 0;
      const rightTime = right.paidAt ?? right.createdAt ?? 0;
      return rightTime - leftTime;
    });
  const paidPurchases = purchaseHistory.filter((item) => item.status === 'paid');
  const getNumberField = (...values: unknown[]): number | null => {
    for (const value of values) {
      if (typeof value === 'number' && Number.isFinite(value)) {
        return Math.max(0, Math.trunc(value));
      }
    }
    return null;
  };

  return {
    ...summary,
    updatedAt: serializeTimestamp(data.updatedAt),
    giftReceivedCount: giftRecords.length,
    giftedCreditTotal,
    purchaseCount: paidPurchases.length,
    purchasedCreditTotal: paidPurchases.reduce((sum, item) => sum + (item.paidCredit || 0), 0),
    visitCount: getNumberField(data.visitCount, data.totalVisitCount, data.totalVisits),
    totalStaySeconds: getNumberField(data.totalStaySeconds, data.totalStayDurationSeconds, data.totalUsageSeconds),
    purchaseHistory: purchaseHistory.slice(0, 10),
  };
};

const parseAdminListLimit = (value: unknown): number => {
  const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : Number.NaN;
  if (!Number.isFinite(parsed)) {
    return ADMIN_USER_LIST_DEFAULT_LIMIT;
  }

  return Math.min(ADMIN_USER_LIST_MAX_LIMIT, Math.max(1, Math.trunc(parsed)));
};

const parseAdminLogLimit = (value: unknown): number => {
  const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : Number.NaN;
  if (!Number.isFinite(parsed)) {
    return ADMIN_LOG_LIST_DEFAULT_LIMIT;
  }

  return Math.min(ADMIN_LOG_LIST_MAX_LIMIT, Math.max(1, Math.trunc(parsed)));
};

const getPaginatedQuerySnapshot = async (
  collectionName: string,
  orderField: string,
  limit: number,
  cursor: string,
): Promise<FirebaseFirestore.QuerySnapshot> => {
  let query: FirebaseFirestore.Query = db.collection(collectionName)
    .orderBy(orderField, 'desc')
    .limit(limit);

  if (cursor) {
    const cursorSnapshot = await db.collection(collectionName).doc(cursor).get();
    if (cursorSnapshot.exists) {
      query = query.startAfter(cursorSnapshot);
    }
  }

  return query.get();
};

const buildPaginatedResponse = <T extends { id: string }>(
  items: T[],
  limit: number,
): { items: T[]; nextCursor: string | null; hasMore: boolean } => {
  const nextCursor = items.length === limit ? items[items.length - 1]?.id ?? null : null;
  return {
    items,
    nextCursor,
    hasMore: Boolean(nextCursor),
  };
};

const buildAdminUserSearchResults = async (queryText: string, limit: number): Promise<AdminUserListItem[]> => {
  const trimmedQuery = queryText.trim();
  if (!trimmedQuery) {
    return [];
  }

  const prefixLimit = Math.min(limit, ADMIN_USER_LIST_DEFAULT_LIMIT);
  const deduped = new Map<string, AdminUserListItem>();
  const [uidSnapshot, emailSnapshot, displayNameSnapshot, nicknameSnapshot] = await Promise.all([
    db.collection('users')
      .orderBy(admin.firestore.FieldPath.documentId())
      .startAt(trimmedQuery)
      .endAt(`${trimmedQuery}\uf8ff`)
      .limit(prefixLimit)
      .get(),
    db.collection('users')
      .orderBy('email')
      .startAt(trimmedQuery)
      .endAt(`${trimmedQuery}\uf8ff`)
      .limit(prefixLimit)
      .get(),
    db.collection('users')
      .orderBy('displayName')
      .startAt(trimmedQuery)
      .endAt(`${trimmedQuery}\uf8ff`)
      .limit(prefixLimit)
      .get()
      .catch(() => null),
    db.collection('users')
      .orderBy('nickname')
      .startAt(trimmedQuery)
      .endAt(`${trimmedQuery}\uf8ff`)
      .limit(prefixLimit)
      .get()
      .catch(() => null),
  ]);

  [uidSnapshot, emailSnapshot, displayNameSnapshot, nicknameSnapshot].forEach((snapshot) => {
    snapshot?.docs.forEach((doc) => {
      const item = buildAdminUserListItem(doc);
      if (item && isRealAdminMemberItem(item) && !deduped.has(item.uid)) {
        deduped.set(item.uid, item);
      }
    });
  });

  return Array.from(deduped.values())
    .sort((left, right) => {
      const leftCreatedAt = left.createdAt ?? 0;
      const rightCreatedAt = right.createdAt ?? 0;
      if (leftCreatedAt !== rightCreatedAt) {
        return rightCreatedAt - leftCreatedAt;
      }

      return left.uid.localeCompare(right.uid);
    })
    .slice(0, limit);
};

const serializeCreationRecord = async (
  snapshot: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot,
): Promise<CreationRecordResponse | null> => {
  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data() ?? {};
  const fileUrl = typeof data.fileUrl === 'string' ? data.fileUrl : '';
  if (!fileUrl) {
    return null;
  }

  return {
    id: snapshot.id,
    type: data.type === 'video' ? 'video' : 'image',
    fileUrl: await getSignedCreationUrl(fileUrl),
    createdAt: serializeTimestamp(data.createdAt),
    expireAt: serializeTimestamp(data.expireAt),
    isArchived: data.isArchived === true,
    isDeleted: data.isDeleted === true,
  };
};

const handleGetCreationsRequest = async (req: functions.https.Request, res: functions.Response) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const user = await requireAuthenticatedUser(req);
  const snapshot = await db.collection('users').doc(user.uid).collection('creations').orderBy('createdAt', 'desc').get();
  const visibleDocs = snapshot.docs.filter((doc) => doc.data().isDeleted !== true);
  const items = await Promise.all(visibleDocs.map((doc) => serializeCreationRecord(doc)));
  res.json({
    success: true,
    creations: items.filter((item): item is CreationRecordResponse => Boolean(item)),
  });
};

const handleArchiveCreationRequest = async (req: functions.https.Request, res: functions.Response) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const user = await requireAuthenticatedUser(req);
  const creationId = typeof req.body?.creationId === 'string' ? req.body.creationId.trim() : '';
  if (!creationId) {
    res.status(400).json({ error: 'creationId is required.' });
    return;
  }

  const creationRef = createUserCreationDocRef(user.uid, creationId);

  await db.runTransaction(async (transaction) => {
    const creationSnapshot = await transaction.get(creationRef);
    if (!creationSnapshot.exists) {
      throw new Error('CREATION_NOT_FOUND');
    }

    const creationData = creationSnapshot.data() ?? {};
    if (creationData.isDeleted === true) {
      throw new Error('CREATION_NOT_FOUND');
    }

    if (creationData.isArchived === true) {
      return;
    }

    const archivedSnapshot = await transaction.get(
      db.collection('users').doc(user.uid).collection('creations').where('isArchived', '==', true),
    );
    const activeArchivedCount = archivedSnapshot.docs.filter((doc) => doc.id !== creationId && doc.data().isDeleted !== true).length;

    if (activeArchivedCount >= MAX_ARCHIVED_CREATIONS) {
      throw new Error('ARCHIVE_LIMIT_REACHED');
    }

    const now = admin.firestore.Timestamp.now();
    transaction.set(creationRef, {
      isArchived: true,
      expireAt: buildCreationExpireAt(now, ARCHIVED_HISTORY_RETENTION_DAYS),
    }, { merge: true });
  });

  res.json({ success: true });
};

const handleDeleteCreationRequest = async (req: functions.https.Request, res: functions.Response) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const user = await requireAuthenticatedUser(req);
  const creationId = typeof req.body?.creationId === 'string' ? req.body.creationId.trim() : '';
  if (!creationId) {
    res.status(400).json({ error: 'creationId is required.' });
    return;
  }

  const creationRef = createUserCreationDocRef(user.uid, creationId);
  const snapshot = await creationRef.get();
  if (!snapshot.exists || snapshot.data()?.isDeleted === true) {
    throw new Error('CREATION_NOT_FOUND');
  }

  await creationRef.set({
    isDeleted: true,
  }, { merge: true });

  res.json({ success: true });
};

const handleAdminUsersListRequest = async (req: functions.https.Request, res: functions.Response) => {
  const user = await requireAuthenticatedUser(req);
  await requireAdminUser(user);

  const queryText = getTrimmedString(req.query.query, 120);
  const limit = parseAdminListLimit(req.query.limit);

  if (queryText) {
    const users = await buildAdminUserSearchResults(queryText, limit);
    res.json({
      users,
      nextCursor: null,
      hasMore: false,
    });
    return;
  }

  let usersQuery: FirebaseFirestore.Query = db.collection('users')
    .orderBy('createdAt', 'desc')
    .limit(limit);

  const cursor = getTrimmedString(req.query.cursor, 200);
  if (cursor) {
    const cursorSnapshot = await db.collection('users').doc(cursor).get();
    if (cursorSnapshot.exists) {
      usersQuery = usersQuery.startAfter(cursorSnapshot);
    }
  }

  const snapshot = await usersQuery.get();
  const users = snapshot.docs
    .map((doc) => buildAdminUserListItem(doc))
    .filter((item): item is AdminUserListItem => item !== null)
    .filter(isRealAdminMemberItem);
  const nextCursor = snapshot.docs.length === limit ? snapshot.docs[snapshot.docs.length - 1]?.id ?? null : null;

  res.json({
    users,
    nextCursor,
    hasMore: Boolean(nextCursor),
  });
};

const handleAdminUserDetailRequest = async (req: functions.https.Request, res: functions.Response) => {
  const user = await requireAuthenticatedUser(req);
  await requireAdminUser(user);

  const targetUid = getTrimmedString(req.query.uid, 200);
  if (!targetUid) {
    res.status(400).json({ error: 'INVALID_USER_ID', message: 'uid is required.' });
    return;
  }

  const snapshot = await db.collection('users').doc(targetUid).get();
  const detail = await buildAdminUserDetail(snapshot);
  if (!detail) {
    res.status(404).json({ error: 'USER_NOT_FOUND', message: '사용자를 찾을 수 없습니다.' });
    return;
  }

  res.json({ user: detail });
};

const serializeGenerationRequestRecord = (snapshot: FirebaseFirestore.QueryDocumentSnapshot) => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    ...data,
    createdAt: serializeTimestamp(data.createdAt),
    completedAt: serializeTimestamp(data.completedAt),
    updatedAt: serializeTimestamp(data.updatedAt),
  };
};

const serializeCreditTransactionRecord = (snapshot: FirebaseFirestore.QueryDocumentSnapshot) => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    ...data,
    createdAt: serializeTimestamp(data.createdAt),
  };
};

const serializePaymentRecord = (snapshot: FirebaseFirestore.QueryDocumentSnapshot) => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    ...data,
    paidAt: serializeTimestamp(data.paidAt),
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt),
  };
};

const serializeActivityRecord = (snapshot: FirebaseFirestore.QueryDocumentSnapshot) => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    ...data,
    createdAt: serializeTimestamp(data.createdAt),
  };
};

const handleAdminGenerationLogsRequest = async (req: functions.https.Request, res: functions.Response) => {
  const user = await requireAuthenticatedUser(req);
  await requireAdminUser(user);

  const limit = parseAdminLogLimit(req.query.limit);
  const cursor = getTrimmedString(req.query.cursor, 200);
  const snapshot = await getPaginatedQuerySnapshot('generationRequests', 'createdAt', limit, cursor);
  const items = snapshot.docs.map((doc) => serializeGenerationRequestRecord(doc));
  res.json(buildPaginatedResponse(items, limit));
};

const handleAdminCreditLogsRequest = async (req: functions.https.Request, res: functions.Response) => {
  const user = await requireAuthenticatedUser(req);
  await requireAdminUser(user);

  const limit = parseAdminLogLimit(req.query.limit);
  const cursor = getTrimmedString(req.query.cursor, 200);
  const snapshot = await getPaginatedQuerySnapshot('credit_transactions', 'createdAt', limit, cursor);
  const items = snapshot.docs.map((doc) => serializeCreditTransactionRecord(doc));
  res.json(buildPaginatedResponse(items, limit));
};

const handleAdminPaymentLogsRequest = async (req: functions.https.Request, res: functions.Response) => {
  const user = await requireAuthenticatedUser(req);
  await requireAdminUser(user);

  const limit = parseAdminLogLimit(req.query.limit);
  const cursor = getTrimmedString(req.query.cursor, 200);
  const snapshot = await getPaginatedQuerySnapshot('payments', 'createdAt', limit, cursor);
  const items = snapshot.docs.map((doc) => serializePaymentRecord(doc));
  res.json(buildPaginatedResponse(items, limit));
};

const handleAdminActivityLogsRequest = async (req: functions.https.Request, res: functions.Response) => {
  const user = await requireAuthenticatedUser(req);
  await requireAdminUser(user);

  const limit = parseAdminLogLimit(req.query.limit);
  const cursor = getTrimmedString(req.query.cursor, 200);
  const snapshot = await getPaginatedQuerySnapshot('creditGifts', 'createdAt', limit, cursor);
  const items = snapshot.docs.map((doc) => serializeActivityRecord(doc));
  res.json(buildPaginatedResponse(items, limit));
};

const handleAdminGiftCreditRequest = async (req: functions.https.Request, res: functions.Response) => {
  const user = await requireAuthenticatedUser(req);
  const targetUid = getTrimmedString(req.body?.uid, 200);
  const amount = typeof req.body?.amount === 'number'
    ? Math.trunc(req.body.amount)
    : Number.parseInt(String(req.body?.amount ?? ''), 10);
  const title = getTrimmedString(req.body?.title, 160) || DEFAULT_ADMIN_GIFT_TITLE;
  const message = getTrimmedString(req.body?.message, 1000) || DEFAULT_ADMIN_GIFT_MESSAGE;
  const senderName = getTrimmedString(req.body?.senderName, 120) || DEFAULT_ADMIN_GIFT_SENDER_NAME;
  const adminMemo = getTrimmedString(req.body?.adminMemo, 1000) || '';

  if (!targetUid) {
    res.status(400).json({ error: 'INVALID_USER_ID', message: 'uid is required.' });
    return;
  }

  if (!Number.isFinite(amount) || amount <= 0 || amount > ADMIN_GIFT_MAX_AMOUNT) {
    res.status(400).json({ error: 'INVALID_AMOUNT', message: `amount must be between 1 and ${ADMIN_GIFT_MAX_AMOUNT}.` });
    return;
  }

  const targetUserRef = db.collection('users').doc(targetUid);
  const adminUserRef = db.collection('users').doc(user.uid);
  let updatedUser: AdminUserDetail | null = null;

  await db.runTransaction(async (transaction) => {
    const [adminSnapshot, targetSnapshot] = await Promise.all([
      transaction.get(adminUserRef),
      transaction.get(targetUserRef),
    ]);

    const adminAccount = normalizeUserAccount(user.email, adminSnapshot.data());
    if (adminAccount.role !== 'admin') {
      throw new Error('FORBIDDEN');
    }

    if (!targetSnapshot.exists) {
      throw new Error('USER_NOT_FOUND');
    }

    const targetData = targetSnapshot.data() ?? {};
    const targetAccount = normalizeUserAccount(
      typeof targetData.email === 'string' ? targetData.email : '',
      targetData,
    );
    const nextAccount: UserAccount = {
      ...targetAccount,
      paidCredit: targetAccount.paidCredit + amount,
      credits: targetAccount.credits + amount,
    };

    transaction.set(
      targetUserRef,
      buildUserAccountPayload(nextAccount, targetAccount.email || user.email, {
        setCreatedAt: !targetSnapshot.exists,
      }),
      { merge: true },
    );
    writeCreditTransaction(transaction, {
      uid: targetUid,
      email: targetAccount.email,
      type: 'admin_gift',
      amount,
      balanceDailyAfter: nextAccount.dailyCredit,
      balancePaidAfter: nextAccount.paidCredit,
      memo: title,
    });
    transaction.set(db.collection('creditGifts').doc(), {
      userId: targetUid,
      amount,
      title,
      message,
      senderName,
      adminMemo: adminMemo || null,
      grantedByAdminId: user.uid,
      grantedByAdminEmail: user.email || adminAccount.email,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const nextSummary = buildAdminUserListItem(targetSnapshot);
    updatedUser = nextSummary ? {
      ...nextSummary,
      credits: nextAccount.credits,
      dailyCredit: nextAccount.dailyCredit,
      paidCredit: nextAccount.paidCredit,
      updatedAt: null,
    } : null;
  });

  const latestSnapshot = await targetUserRef.get();
  const latestUser = await buildAdminUserDetail(latestSnapshot) ?? updatedUser;

  res.json({
    success: true,
    user: latestUser,
  });
};

const buildAdminDashboardPayload = async (user: AuthenticatedUser) => {
  await requireAdminUser(user);

  const [
    usersSnapshot,
    postsSnapshot,
    sharedResultsSnapshot,
    generationSnapshot,
  ] = await Promise.all([
    db.collection('users').get(),
    db.collection('bbsPosts').get(),
    db.collection('publicResults').get(),
    db.collection('generationRequests').orderBy('createdAt', 'desc').get(),
  ]);

  const now = Date.now();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
  const generationLogs: Array<Record<string, unknown>> = generationSnapshot.docs.map((snapshot) => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      ...data,
      createdAt: serializeTimestamp(data.createdAt),
      completedAt: serializeTimestamp(data.completedAt),
      updatedAt: serializeTimestamp(data.updatedAt),
    };
  });
  const imageGenerationLogs = generationLogs.filter((item) => (item.type || 'image_generation') === 'image_generation');
  const videoGenerationLogs = generationLogs.filter((item) => item.type === 'video_generation');
  const getCreatedAtMillis = (item: Record<string, unknown>): number =>
    typeof item.createdAt === 'number' && Number.isFinite(item.createdAt) ? item.createdAt : 0;
  const todayGenerations = imageGenerationLogs.filter((item) => getCreatedAtMillis(item) >= todayStart.getTime());
  const todayVideoGenerations = videoGenerationLogs.filter((item) => getCreatedAtMillis(item) >= todayStart.getTime());
  const recent7DayGenerations = generationLogs.filter((item) => getCreatedAtMillis(item) >= sevenDaysAgo);
  const getEstimatedCost = (item: any): number => typeof item.estimatedCost === 'number' && Number.isFinite(item.estimatedCost) ? item.estimatedCost : 0;

  return {
    summary: {
      users: usersSnapshot.size,
      posts: postsSnapshot.size,
      generations: generationLogs.length,
      sharedResults: sharedResultsSnapshot.docs.filter((snapshot) => snapshot.data().sharedAt).length,
      todayGenerations: todayGenerations.length,
      todayEstimatedCost: todayGenerations.reduce((sum, item) => sum + getEstimatedCost(item), 0),
      totalEstimatedCost: generationLogs.reduce((sum, item) => sum + getEstimatedCost(item), 0),
      recent7DaysEstimatedCost: recent7DayGenerations.reduce((sum, item) => sum + getEstimatedCost(item), 0),
      totalVideoGenerations: videoGenerationLogs.length,
      todayVideoGenerations: todayVideoGenerations.length,
      estimatedVideoCost: videoGenerationLogs.reduce((sum, item) => sum + getEstimatedCost(item), 0),
    },
  };
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

  const { personImage, garmentImage, personInputLabel, garmentInputLabel, personPreviewImage, garmentPreviewImage, bodyProfile, requestId, subjectType } = req.body as {
    personImage: string;
    garmentImage: string;
    personInputLabel?: string;
    garmentInputLabel?: string;
    personPreviewImage?: string;
    garmentPreviewImage?: string;
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
  if (resolvedSubjectType === 'human') {
    res.status(400).json({
      error: 'PET_ONLY_SUBJECT',
      message: 'Human photos are not supported. Please upload a dog or cat photo only.',
    });
    return;
  }
  try {
    chargeResult = await beginGenerationCharge(user, requestId, resolvedSubjectType);
  } catch (error) {
    handleApiError(res, error, 500);
    return;
  }

  try {
    const generatedImage = await requestOpenAIComposite(personImage, garmentImage, resolvedSubjectType, bodyProfile);
    const watermarkApplied = true;
    const imageAssets = await buildGeneratedImageAssets(generatedImage.mimeType, generatedImage.data, watermarkApplied);
    let creationFilePath: string | null = null;

    try {
      creationFilePath = await uploadCreationAsset({
        uid: user.uid,
        creationId: requestId,
        contentType: imageAssets.responseMimeType,
        buffer: imageAssets.responseBuffer,
      });
      await upsertCreationRecord({
        uid: user.uid,
        creationId: requestId,
        type: 'image',
        fileUrl: creationFilePath,
      });
    } catch (creationError) {
      functions.logger.error('Failed to persist image creation record', creationError);
    }

    await markGenerationCompleted(user, requestId, generatedImage.metadata, {
      imageUrl: imageAssets.storedImageUrl,
      usedCreditType: chargeResult.usedCreditType,
      usedCreditAmount: chargeResult.chargedAmount,
      watermarkApplied,
      personInputLabel,
      garmentInputLabel,
      personPreviewImage,
      garmentPreviewImage,
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

  const { image, requestId, subjectType, sourceResultId, dialogue } = req.body as {
    image?: string;
    requestId?: string;
    subjectType?: SubjectType;
    sourceResultId?: string;
    dialogue?: string;
  };
  if (!image || !requestId) {
    res.status(400).json({ error: '필수 파라미터가 누락되었습니다.' });
    return;
  }
  const normalizedDialogue = normalizeVideoDialogue(dialogue);
  if (!normalizedDialogue) {
    res.status(400).json({ error: INVALID_VIDEO_DIALOGUE_ERROR, message: INVALID_VIDEO_DIALOGUE_MESSAGE });
    return;
  }

  functions.logger.info('[VIDEO_REQUEST]', {
    requestId,
    subjectType: normalizeSubjectType(subjectType),
    sourceResultId: sourceResultId || null,
    dialogue: normalizedDialogue,
    imageLength: typeof image === 'string' ? image.length : 0,
    headers: {
      contentType: req.get('content-type') || '',
      userAgent: req.get('user-agent') || '',
    },
  });

  let user: AuthenticatedUser;
  try {
    user = await requireAuthenticatedUser(req);
  } catch (error) {
    handleApiError(res, error, 401);
    return;
  }

  const resolvedSubjectType = normalizeSubjectType(subjectType);
  let startResult: VideoRequestStartResult;
  try {
    startResult = await beginVideoGenerationRequest(user, requestId, resolvedSubjectType, sourceResultId, normalizedDialogue);
  } catch (error) {
    handleApiError(res, error, 500);
    return;
  }

  try {
    const videoJob = await createOpenAIVideo(image, resolvedSubjectType, normalizedDialogue);
    await markChargedRequestInProgress(user, requestId, 'videoGenerationLocks', {
      subjectType: resolvedSubjectType,
      dialogue: normalizedDialogue,
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
      dailyCredit: startResult.dailyCreditAvailable,
      paidCredit: startResult.paidCreditAvailable,
      creditsRemaining: startResult.creditsAvailable,
      estimatedCost: videoJob.estimatedCost,
      subjectType: resolvedSubjectType,
      ...buildApiBonusFields(startResult.dailyRewardGranted, startResult.signupBonusGranted),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'OpenAI video generation failed';
    const upstreamStatus = error instanceof UpstreamApiError ? error.statusCode : null;
    const isVideoConfigError = errorMessage === GOOGLE_VIDEO_CONFIG_ERROR;
    const responseMessage = isVideoConfigError ? GOOGLE_VIDEO_CONFIG_MESSAGE : errorMessage;
    const failureResult = await markVideoGenerationFailed(user, requestId, 'failed', errorMessage).catch((failureError) => {
      functions.logger.error('Failed to finalize video generation failure state', failureError);
      return { dailyCredit: startResult.dailyCreditAvailable, paidCredit: startResult.paidCreditAvailable, creditsRemaining: startResult.creditsAvailable } satisfies VideoCompletionResult;
    });
    functions.logger.error('[VIDEO_ERROR]', {
      phase: 'video-start',
      requestId,
      uid: user.uid,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
      body: {
        requestId,
        subjectType: resolvedSubjectType,
        sourceResultId: sourceResultId || null,
        dialogue: normalizedDialogue,
        imageLength: typeof image === 'string' ? image.length : 0,
      },
      headers: {
        contentType: req.get('content-type') || '',
        userAgent: req.get('user-agent') || '',
      },
    });
    res.status(
      isVideoConfigError
        ? 500
        : upstreamStatus && upstreamStatus >= 400 && upstreamStatus < 500
          ? upstreamStatus
          : 502,
    ).json({
      error: isVideoConfigError ? GOOGLE_VIDEO_CONFIG_ERROR : errorMessage,
      message: responseMessage,
      refunded: false,
      dailyCredit: failureResult.dailyCredit,
      paidCredit: failureResult.paidCredit,
      creditsRemaining: failureResult.creditsRemaining,
      ...buildApiBonusFields(startResult.dailyRewardGranted, startResult.signupBonusGranted),
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
  const storedVideoFileUrl = typeof requestData.fileUrl === 'string' ? requestData.fileUrl : '';
  if (!openaiVideoId) {
    res.json({
      success: requestStatus === 'completed',
      status: requestStatus,
      estimatedCost: typeof requestData.estimatedCost === 'number' ? requestData.estimatedCost : VIDEO_ESTIMATED_COST,
    });
    return;
  }

  if (requestStatus === 'completed' && storedVideoFileUrl) {
    res.json({
      success: true,
      status: 'completed',
      requestId,
      estimatedCost: typeof requestData.estimatedCost === 'number' ? requestData.estimatedCost : VIDEO_ESTIMATED_COST,
      contentUrl: `/api/video-content?requestId=${encodeURIComponent(requestId)}`,
    });
    return;
  }

  try {
    const videoStatus = await fetchOpenAIVideoStatus(openaiVideoId);
    const nextStatus = typeof videoStatus.status === 'string' ? videoStatus.status : requestStatus;

    if (nextStatus === 'completed') {
      let creationFilePath = storedVideoFileUrl;

      if (!creationFilePath) {
        const contentResponse = await streamOpenAIVideoContent(openaiVideoId);
        const contentType = contentResponse.headers.get('content-type') || 'video/mp4';
        const contentBuffer = Buffer.from(await contentResponse.arrayBuffer());
        creationFilePath = await uploadCreationAsset({
          uid: user.uid,
          creationId: requestId,
          contentType,
          buffer: contentBuffer,
        });
        await upsertCreationRecord({
          uid: user.uid,
          creationId: requestId,
          type: 'video',
          fileUrl: creationFilePath,
        });
      }

      const completionResult = await completeVideoGenerationAndCharge(user, requestId, {
        openaiVideoId,
        estimatedCost: typeof requestData.estimatedCost === 'number' ? requestData.estimatedCost : VIDEO_ESTIMATED_COST,
        type: 'video_generation',
        subjectType: normalizeSubjectType(requestData.subjectType),
        fileUrl: creationFilePath,
      });
      res.json({
        success: true,
        status: 'completed',
        requestId,
        dailyCredit: completionResult.dailyCredit,
        paidCredit: completionResult.paidCredit,
        creditsRemaining: completionResult.creditsRemaining,
        estimatedCost: typeof requestData.estimatedCost === 'number' ? requestData.estimatedCost : VIDEO_ESTIMATED_COST,
        contentUrl: `/api/video-content?requestId=${encodeURIComponent(requestId)}`,
      });
      return;
    }

    if (nextStatus === 'failed' || nextStatus === 'canceled') {
      const errorMessage = videoStatus.error?.message || `Video generation ${nextStatus}`;
      const failureResult = await markVideoGenerationFailed(user, requestId, nextStatus, errorMessage);
      res.status(502).json({
        success: false,
        status: nextStatus,
        error: errorMessage,
        refunded: false,
        dailyCredit: failureResult.dailyCredit,
        paidCredit: failureResult.paidCredit,
        creditsRemaining: failureResult.creditsRemaining,
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
    const errorMessage = error instanceof Error ? error.message : 'Video generation failed';
    try {
      const failureResult = await markVideoGenerationFailed(user, requestId, 'failed', errorMessage);
      functions.logger.error('[VIDEO_ERROR]', {
        phase: 'video-status',
        requestId,
        uid: user.uid,
        openaiVideoId,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : null,
        headers: {
          contentType: req.get('content-type') || '',
          userAgent: req.get('user-agent') || '',
        },
      });
      res.status(502).json({
        success: false,
        status: 'failed',
        error: errorMessage,
        message: errorMessage,
        refunded: false,
        dailyCredit: failureResult.dailyCredit,
        paidCredit: failureResult.paidCredit,
        creditsRemaining: failureResult.creditsRemaining,
      });
    } catch (failureError) {
      functions.logger.error('Failed to mark video generation request as failed', failureError);
      handleApiError(res, error, 500);
    }
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
  const storedVideoFileUrl = typeof requestData.fileUrl === 'string' ? requestData.fileUrl : '';

  if (storedVideoFileUrl) {
    try {
      const [buffer] = await bucket.file(storedVideoFileUrl).download();
      res.set('Content-Type', 'video/mp4');
      res.set('Cache-Control', 'private, max-age=60');
      res.status(200).send(buffer);
      return;
    } catch (error) {
      functions.logger.error('Failed to read stored video asset', error);
    }
  }

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

void handleVideoGenerationRequest;
void handleVideoStatusRequest;
void handleVideoContentRequest;

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

    if (req.method === 'GET' && normalizedPath === '/creations') {
      try {
        await handleGetCreationsRequest(req, res);
      } catch (error) {
        handleApiError(res, error, 500);
      }
      return;
    }

    if (req.method === 'POST' && normalizedPath === '/creations/archive') {
      try {
        await handleArchiveCreationRequest(req, res);
      } catch (error) {
        handleApiError(res, error, 500);
      }
      return;
    }

    if (req.method === 'POST' && normalizedPath === '/creations/delete') {
      try {
        await handleDeleteCreationRequest(req, res);
      } catch (error) {
        handleApiError(res, error, 500);
      }
      return;
    }

    if (req.method === 'GET' && normalizedPath === '/admin/dashboard') {
      try {
        const user = await requireAuthenticatedUser(req);
        const payload = await buildAdminDashboardPayload(user);
        res.json(payload);
      } catch (error) {
        handleApiError(res, error, 500);
      }
      return;
    }

    if (req.method === 'GET' && normalizedPath === '/admin/users') {
      try {
        await handleAdminUsersListRequest(req, res);
      } catch (error) {
        handleApiError(res, error, 500);
      }
      return;
    }

    if (req.method === 'GET' && normalizedPath === '/admin/users/detail') {
      try {
        await handleAdminUserDetailRequest(req, res);
      } catch (error) {
        handleApiError(res, error, 500);
      }
      return;
    }

    if (req.method === 'GET' && normalizedPath === '/admin/logs/generations') {
      try {
        await handleAdminGenerationLogsRequest(req, res);
      } catch (error) {
        handleApiError(res, error, 500);
      }
      return;
    }

    if (req.method === 'GET' && normalizedPath === '/admin/logs/credits') {
      try {
        await handleAdminCreditLogsRequest(req, res);
      } catch (error) {
        handleApiError(res, error, 500);
      }
      return;
    }

    if (req.method === 'GET' && normalizedPath === '/admin/logs/payments') {
      try {
        await handleAdminPaymentLogsRequest(req, res);
      } catch (error) {
        handleApiError(res, error, 500);
      }
      return;
    }

    if (req.method === 'GET' && normalizedPath === '/admin/logs/activities') {
      try {
        await handleAdminActivityLogsRequest(req, res);
      } catch (error) {
        handleApiError(res, error, 500);
      }
      return;
    }

    if (req.method === 'POST' && normalizedPath === '/admin/users/gift') {
      try {
        await handleAdminGiftCreditRequest(req, res);
      } catch (error) {
        handleApiError(res, error, 500);
      }
      return;
    }

    if (req.method === 'POST' && normalizedPath === '/classify-subject') {
      await handleSubjectClassificationRequest(req, res);
      return;
    }

    if (normalizedPath === '/lemon/webhook') {
      await handleLemonWebhookRequest(req, res);
      return;
    }

    if (normalizedPath === '/lemon/checkout') {
      try {
        await handleCreateCheckoutSessionRequest(req, res);
      } catch (error) {
        handleApiError(res, error, 500);
      }
      return;
    }

    if (normalizedPath === '/lemon/session') {
      try {
        await handleCheckoutSessionStatusRequest(req, res);
      } catch (error) {
        handleApiError(res, error, 500);
      }
      return;
    }

    if (
      normalizedPath === '/video'
      || normalizedPath === '/video-status'
      || normalizedPath === '/video-content'
    ) {
      res.status(410).json({ error: 'VIDEO_FEATURE_REMOVED', message: 'Video generation has been removed.' });
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

export const cleanupExpiredCreations = functions
  .region('asia-northeast3')
  .pubsub.schedule('every 24 hours')
  .timeZone(SEOUL_TIME_ZONE)
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now();
    const [expiredSnapshot, deletedSnapshot] = await Promise.all([
      db.collectionGroup('creations').where('expireAt', '<', now).get(),
      db.collectionGroup('creations').where('isDeleted', '==', true).get(),
    ]);

    const docs = new Map<string, FirebaseFirestore.QueryDocumentSnapshot>();
    for (const snapshot of [...expiredSnapshot.docs, ...deletedSnapshot.docs]) {
      docs.set(snapshot.ref.path, snapshot);
    }

    let batch = db.batch();
    let opCount = 0;

    for (const snapshot of docs.values()) {
      const data = snapshot.data();
      if (typeof data.fileUrl === 'string' && data.fileUrl) {
        await deleteCreationAsset(data.fileUrl);
      }

      batch.delete(snapshot.ref);
      opCount += 1;

      if (opCount >= 400) {
        await batch.commit();
        batch = db.batch();
        opCount = 0;
      }
    }

    if (opCount > 0) {
      await batch.commit();
    }

    functions.logger.info('cleanupExpiredCreations completed', { cleaned: docs.size });
    return null;
  });
