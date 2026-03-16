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
const NOT_ENOUGH_VIDEO_CREDITS_ERROR = 'INSUFFICIENT_VIDEO_CREDITS';
const DUPLICATE_REQUEST_ERROR = 'DUPLICATE_REQUEST';
const DUPLICATE_REQUEST_MESSAGE = '이미 처리 중인 생성 요청입니다.';
const DUPLICATE_GENERATION_WINDOW_MS = 30_000;
const GENERATION_COST = 100;
const VIDEO_GENERATION_COST = 1000;
const SIGNUP_BONUS_CREDITS = 300;
const DAILY_BASE_CREDITS = 300;
const SEOUL_TIME_ZONE = 'Asia/Seoul';
const OPENAI_IMAGE_MODEL = process.env['OPENAI_IMAGE_MODEL'] ?? 'gpt-image-1';
const OPENAI_IMAGE_SIZE = '1536x1024';
const OPENAI_IMAGE_QUALITY = 'medium';
const SUBJECT_CLASSIFICATION_MODEL = process.env['OPENAI_CLASSIFICATION_MODEL'] ?? 'gpt-4.1-nano';
const VIDEO_MODEL = process.env['OPENAI_VIDEO_MODEL'] ?? 'sora-2';
const VIDEO_SECONDS = '4';
const VIDEO_SIZE = '1280x720';
const VIDEO_ESTIMATED_COST = 0.4;
const SUBJECT_CLASSIFICATION_PROMPT = `Look at this uploaded subject image and determine whether the subject is a human, a dog, or a cat.
Return ONLY one word:

human
dog
cat`;
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
const HUMAN_PROMPT = `Use the uploaded face photo as the identity anchor and the uploaded clothing image as the outfit reference.

Create a realistic virtual fitting image of the exact same person from the uploaded face photo.
Identity preservation is the highest priority.

Strict identity rules:
- keep the same person
- preserve the exact identity and facial resemblance of the uploaded face
- do not invent a new face
- do not change ethnicity
- do not change age
- do not beautify, idealize, or stylize the face
- do not make the person look like a different model
- keep the same eyes, nose, mouth, jawline, chin shape, cheek structure, face shape, skin tone, forehead ratio, eye spacing, lip shape, and hairline
- keep the same overall likeness and real-person appearance
- if there is any conflict between fashion styling and facial identity, preserve facial identity first

Garment transfer rules:
- transfer only the outfit from the uploaded clothing image
- preserve the garment color, silhouette, texture, visible ornament details, sleeve shape, skirt volume, top-to-bottom proportions, and overall design
- do not replace the outfit with a different design
- keep the clothing faithful to the reference image

Output requirements:
- generate one clean 1x4 fashion lookbook grid
- the same person must appear in all 4 panels
- keep the face consistent across all 4 panels
- keep the body proportions consistent across all 4 panels
- panel 1: front view
- panel 2: 3/4 front view
- panel 3: side or semi-back view
- panel 4: back view

Style requirements:
- realistic studio photo
- natural lighting
- clean simple background
- full-body fitting result
- realistic fabric appearance
- no illustration
- no cartoon
- no fantasy styling
- no extra accessories unless clearly visible in the clothing reference

Face consistency constraints:
The uploaded face photo must remain the identity source.
Do not reinterpret the face.
Do not optimize the face for beauty.
Do not change the person into a more glamorous or more generic fashion model.
Keep the facial geometry close to the uploaded face.
Same person in all 4 panels. No panel may show a different face.`;
const DOG_PROMPT = `Use the uploaded dog photo as the identity anchor and the uploaded clothing image as the outfit reference.

Create a realistic virtual fitting image of the exact same dog from the uploaded dog photo.
Animal identity preservation is the highest priority.

Strict identity rules:
- keep the same dog
- preserve the exact likeness of the uploaded dog
- do not invent a different dog
- do not change breed appearance
- do not change fur color
- do not change fur pattern
- do not stylize or cartoonize the dog
- keep the same muzzle shape, snout length, ear shape, ear position, eye shape, eye spacing, forehead shape, face width, body proportions, tail appearance if visible, and overall breed impression
- keep the same real-animal appearance and overall likeness
- if there is any conflict between outfit styling and animal identity, preserve animal identity first

Garment transfer rules:
- adapt the uploaded clothing image into a realistic dog fitting
- preserve the clothing color, silhouette, texture, visible ornament details, and overall design language as much as possible
- do not replace the outfit with a completely different design
- fit the outfit naturally to a dog body shape
- keep the outfit believable and species-appropriate

Output requirements:
- generate one clean multi-view fashion lookbook image
- if the current pipeline supports 1x4, keep a 1x4 layout of the same dog
- the same dog must appear consistently in all panels
- keep the face and body consistent across all views
- front, 3/4, side/semi-back, and back-style variation if supported by the current layout

Style requirements:
- realistic pet studio photo
- natural lighting
- clean simple background
- realistic fur detail
- no illustration
- no cartoon
- no fantasy creature styling
- no human face traits
- no extra accessories unless clearly justified by the clothing reference

Animal consistency constraints:
The uploaded dog photo must remain the identity source.
Do not reinterpret the dog into a different breed or different face.
Do not beautify the dog into a generic pet model.
Keep the same fur pattern, muzzle shape, ears, eye shape, and overall body silhouette.
The same dog must appear in every panel.`;
const CAT_PROMPT = `Use the uploaded cat photo as the identity anchor and the uploaded clothing image as the outfit reference.

Create a realistic virtual fitting image of the exact same cat from the uploaded cat photo.
Animal identity preservation is the highest priority.

Strict identity rules:
- keep the same cat
- preserve the exact likeness of the uploaded cat
- do not invent a different cat
- do not change fur color
- do not change fur pattern
- do not change face shape
- do not stylize or cartoonize the cat
- keep the same ears, eye shape, eye spacing, nose shape, muzzle area, whisker pad area, forehead shape, fur markings, body proportions, tail appearance if visible, and overall likeness
- keep the same real-animal appearance
- if there is any conflict between outfit styling and animal identity, preserve animal identity first

Garment transfer rules:
- adapt the uploaded clothing image into a realistic cat fitting
- preserve the clothing color, silhouette, texture, visible ornament details, and overall design language as much as possible
- do not replace the outfit with a completely different design
- fit the outfit naturally to a cat body shape
- keep the outfit believable and species-appropriate

Output requirements:
- generate one clean multi-view fashion lookbook image
- if the current pipeline supports 1x4, keep a 1x4 layout of the same cat
- the same cat must appear consistently in all panels
- keep the face and body consistent across all views
- front, 3/4, side/semi-back, and back-style variation if supported by the current layout

Style requirements:
- realistic pet studio photo
- natural lighting
- clean simple background
- realistic fur detail
- no illustration
- no cartoon
- no fantasy creature styling
- no human face traits
- no extra accessories unless clearly justified by the clothing reference

Animal consistency constraints:
The uploaded cat photo must remain the identity source.
Do not reinterpret the cat into a different face or different markings.
Do not beautify the cat into a generic pet model.
Keep the same fur markings, ears, eye shape, whisker area, and overall body silhouette.
The same cat must appear in every panel.`;
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

type SubscriptionPlan = keyof typeof SUBSCRIPTION_DAILY_BONUS;
type AccountRole = 'user' | 'admin';
type SubjectType = 'human' | 'dog' | 'cat';
type GenerationRequestType = 'image_generation' | 'video_generation';
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

const normalizeSubjectType = (value: unknown): SubjectType => {
  if (value === 'dog' || value === 'cat') {
    return value;
  }

  return 'human';
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

  const garmentFile = toImageBlob(garmentImage, 'garment');
  const personFile = toImageBlob(personImage, 'person');
  const formData = new FormData();

  formData.append('model', OPENAI_IMAGE_MODEL);
  formData.append('prompt', buildTryOnPrompt(subjectType, bodyProfile));
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
    const generationCost = options.cost;

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
      throw new Error(options.insufficientErrorCode);
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
      type: options.requestType,
      cost: generationCost,
      ...options.metadata,
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
      type: options.requestType,
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
    insufficientErrorCode: NOT_ENOUGH_VIDEO_CREDITS_ERROR,
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
): Promise<void> => {
  const requestRef = db.collection('generationRequests').doc(buildGenerationRequestDocId(user.uid, requestId));
  const generationLockRef = db.collection('generationLocks').doc(user.uid);
  await requestRef.set({
    type: metadata.type || 'image_generation',
    subjectType: metadata.subjectType || 'human',
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

const refundGenerationCharge = async (user: AuthenticatedUser, requestId: string, errorMessage: string): Promise<RefundResult> =>
  refundChargedRequest(user, requestId, errorMessage, 'generationLocks');

const refundVideoGenerationCharge = async (user: AuthenticatedUser, requestId: string, errorMessage: string): Promise<RefundResult> =>
  refundChargedRequest(user, requestId, errorMessage, 'videoGenerationLocks');

const handleApiError = (res: functions.Response, error: unknown, fallbackStatus = 500) => {
  if (error instanceof Error && error.message === 'AUTH_REQUIRED') {
    res.status(401).json({ error: 'AUTH_REQUIRED', message: AUTH_REQUIRED_MESSAGE });
    return;
  }

  if (error instanceof Error && error.message === NOT_ENOUGH_CREDITS_ERROR) {
    res.status(402).json({ error: NOT_ENOUGH_CREDITS_ERROR, message: NOT_ENOUGH_CREDITS_MESSAGE, cost: GENERATION_COST });
    return;
  }

  if (error instanceof Error && error.message === NOT_ENOUGH_VIDEO_CREDITS_ERROR) {
    res.status(402).json({ error: NOT_ENOUGH_VIDEO_CREDITS_ERROR, message: NOT_ENOUGH_CREDITS_MESSAGE, cost: VIDEO_GENERATION_COST });
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
    await markGenerationCompleted(user, requestId, generatedImage.metadata);
    const resultDataUrl = `data:${generatedImage.mimeType};base64,${generatedImage.data}`;
    res.json({
      success: true,
      image: resultDataUrl,
      mimeType: generatedImage.mimeType,
      subjectType: resolvedSubjectType,
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
      creditsRemaining: chargeResult.creditsAfterCharge,
      estimatedCost: videoJob.estimatedCost,
      subjectType: resolvedSubjectType,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'OpenAI video generation failed';
    const refundResult = await refundVideoGenerationCharge(user, requestId, errorMessage).catch((refundError) => {
      functions.logger.error('Failed to refund credits after video generation error', refundError);
      return { refunded: false, balanceAfter: null } satisfies RefundResult;
    });
    res.status(errorMessage === OPENAI_CONFIG_MESSAGE ? 500 : 502).json({
      error: errorMessage === OPENAI_CONFIG_MESSAGE ? OPENAI_CONFIG_ERROR : errorMessage,
      message: errorMessage,
      refunded: refundResult.refunded,
      creditsRemaining: refundResult.balanceAfter ?? chargeResult.creditsAfterCharge,
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
    functions.logger.info('api request', {
      path,
      method: req.method,
      contentType: req.get('content-type') ?? '',
    });

    if (req.method === 'POST' && path === '/bootstrap') {
      try {
        const user = await requireAuthenticatedUser(req);
        const result = await bootstrapUserCredits(user);
        res.json({ success: true, ...result, generationCost: GENERATION_COST, videoGenerationCost: VIDEO_GENERATION_COST });
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
          videoGenerationCost: VIDEO_GENERATION_COST,
        });
      } catch (error) {
        handleApiError(res, error, 500);
      }
      return;
    }

    if (req.method === 'POST' && path === '/classify-subject') {
      await handleSubjectClassificationRequest(req, res);
      return;
    }

    if (req.method === 'POST' && path === '/video') {
      await handleVideoGenerationRequest(req, res);
      return;
    }

    if (req.method === 'GET' && path === '/video-status') {
      await handleVideoStatusRequest(req, res);
      return;
    }

    if (req.method === 'GET' && path === '/video-content') {
      await handleVideoContentRequest(req, res);
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
