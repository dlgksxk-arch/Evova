"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTryOn = exports.api = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
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
const DUPLICATE_GENERATION_WINDOW_MS = 30000;
const GENERATION_COST = 100;
const SIGNUP_BONUS_CREDITS = 300;
const DAILY_BASE_CREDITS = 300;
const SEOUL_TIME_ZONE = 'Asia/Seoul';
const OPENAI_IMAGE_MODEL = process.env['OPENAI_IMAGE_MODEL'] ?? 'gpt-image-1';
const SUBSCRIPTION_DAILY_BONUS = {
    free: 0,
    basic: 500,
    pro: 1500,
};
const ADMIN_EMAILS = new Set(['dlgksxk@gmail.com']);
let lastLoggedOpenAIKeySource = null;
const formatSeoulDateKey = (date) => {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: SEOUL_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(date);
    const partMap = parts.reduce((acc, part) => {
        if (part.type !== 'literal') {
            acc[part.type] = part.value;
        }
        return acc;
    }, {});
    return `${partMap.year}-${partMap.month}-${partMap.day}`;
};
const getTodayKeyInSeoul = () => formatSeoulDateKey(new Date());
const timestampToSeoulDateKey = (value) => {
    if (value instanceof admin.firestore.Timestamp) {
        return formatSeoulDateKey(value.toDate());
    }
    return null;
};
const normalizeSubscriptionPlan = (value) => {
    if (typeof value === 'string' && value in SUBSCRIPTION_DAILY_BONUS) {
        return value;
    }
    return 'free';
};
const normalizeAccountRole = (value, email) => {
    if (value === 'admin') {
        return 'admin';
    }
    return ADMIN_EMAILS.has(email.toLowerCase()) ? 'admin' : 'user';
};
const getDailyCreditReward = (plan) => {
    const subscriptionBonus = SUBSCRIPTION_DAILY_BONUS[plan];
    return {
        base: DAILY_BASE_CREDITS,
        subscriptionBonus,
        total: DAILY_BASE_CREDITS + subscriptionBonus,
    };
};
const normalizeUserAccount = (email, data) => {
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
const getOpenAIApiKeyState = () => {
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
const logOpenAIApiKeySource = (source) => {
    if (source === lastLoggedOpenAIKeySource) {
        return;
    }
    lastLoggedOpenAIKeySource = source;
    functions.logger.info('openai api key source resolved', { source });
};
const getOpenAIApiKey = () => {
    const state = getOpenAIApiKeyState();
    logOpenAIApiKeySource(state.source);
    return state.key;
};
const buildTryOnPrompt = (bodyProfile) => {
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
const parseDataUrl = (input) => {
    if (input.startsWith('data:')) {
        const [header, data = ''] = input.split(',', 2);
        return {
            mimeType: header.split(';')[0].replace('data:', ''),
            data,
        };
    }
    return { mimeType: 'image/png', data: input };
};
const mimeTypeToExtension = (mimeType) => {
    switch (mimeType) {
        case 'image/jpeg':
            return 'jpg';
        case 'image/webp':
            return 'webp';
        default:
            return 'png';
    }
};
const toImageBlob = (input, fallbackName) => {
    const { mimeType, data } = parseDataUrl(input);
    const buffer = Buffer.from(data, 'base64');
    return {
        blob: new Blob([buffer], { type: mimeType }),
        filename: `${fallbackName}.${mimeTypeToExtension(mimeType)}`,
    };
};
const requestOpenAIComposite = async (personImage, garmentImage, bodyProfile) => {
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
    formData.append('size', '1536x1024');
    formData.append('quality', 'medium');
    formData.append('output_format', 'png');
    formData.append('background', 'opaque');
    formData.append('n', '1');
    if (OPENAI_IMAGE_MODEL === 'gpt-image-1') {
        formData.append('input_fidelity', 'high');
    }
    functions.logger.info('openai image edit request', {
        model: OPENAI_IMAGE_MODEL,
        endpoint: '/v1/images/edits',
        size: '1536x1024',
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
    functions.logger.info('openai image edit response', {
        model: OPENAI_IMAGE_MODEL,
        endpoint: '/v1/images/edits',
        status: openAIRes.status,
    });
    const responseBody = await openAIRes.json().catch(() => ({}));
    if (!openAIRes.ok) {
        functions.logger.error('OpenAI image edit error', responseBody);
        throw new Error(responseBody.error?.message || `OpenAI API error ${openAIRes.status}`);
    }
    const image = responseBody.data?.[0]?.b64_json;
    if (!image || image.length < 1000) {
        throw new Error('OpenAI response did not include a usable image.');
    }
    return { mimeType: 'image/png', data: image };
};
const setCors = (req, res) => {
    const origin = req.headers.origin || '';
    if (CORS_ORIGIN.includes(origin) || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('cloudworkstations.dev')) {
        res.set('Access-Control-Allow-Origin', origin);
    }
    else {
        res.set('Access-Control-Allow-Origin', CORS_ORIGIN[0]);
    }
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.set('Access-Control-Allow-Credentials', 'true');
};
const getAuthHeaderToken = (req) => {
    const header = req.get('Authorization') ?? req.get('authorization') ?? '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    return match?.[1]?.trim() ?? '';
};
const requireAuthenticatedUser = async (req) => {
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
const writeCreditLog = (transaction, uid, email, type, amount, balanceAfter, note) => {
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
const bootstrapUserCredits = async (user) => {
    const userRef = db.collection('users').doc(user.uid);
    const todayKey = getTodayKeyInSeoul();
    const result = {
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
                writeCreditLog(transaction, user.uid, user.email || currentProfile.email, 'subscription_bonus', reward.subscriptionBonus, nextCredits, `subscription bonus ${currentProfile.subscriptionPlan} ${todayKey}`);
            }
        }
        const updatePayload = {
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
const buildGenerationRequestDocId = (uid, requestId) => `${uid}_${requestId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
const isRecentTimestamp = (value, windowMs = DUPLICATE_GENERATION_WINDOW_MS) => {
    if (!(value instanceof admin.firestore.Timestamp)) {
        return false;
    }
    return Date.now() - value.toDate().getTime() < windowMs;
};
const beginGenerationCharge = async (user, requestId) => {
    if (!requestId) {
        throw new Error(DUPLICATE_REQUEST_ERROR);
    }
    const userRef = db.collection('users').doc(user.uid);
    const requestRef = db.collection('generationRequests').doc(buildGenerationRequestDocId(user.uid, requestId));
    const generationLockRef = db.collection('generationLocks').doc(user.uid);
    const todayKey = getTodayKeyInSeoul();
    const result = {
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
                writeCreditLog(transaction, user.uid, user.email || currentProfile.email, 'subscription_bonus', reward.subscriptionBonus, nextCredits, `subscription bonus ${currentProfile.subscriptionPlan} ${todayKey}`);
            }
        }
        if (nextCredits < generationCost) {
            throw new Error(NOT_ENOUGH_CREDITS_ERROR);
        }
        nextCredits -= generationCost;
        if (generationCost > 0) {
            writeCreditLog(transaction, user.uid, user.email || currentProfile.email, 'generate_use', -generationCost, nextCredits, `generate request ${requestId}`);
        }
        const updatePayload = {
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
const markGenerationCompleted = async (user, requestId) => {
    const requestRef = db.collection('generationRequests').doc(buildGenerationRequestDocId(user.uid, requestId));
    const generationLockRef = db.collection('generationLocks').doc(user.uid);
    await requestRef.set({
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
const refundGenerationCharge = async (user, requestId, errorMessage) => {
    const userRef = db.collection('users').doc(user.uid);
    const requestRef = db.collection('generationRequests').doc(buildGenerationRequestDocId(user.uid, requestId));
    const generationLockRef = db.collection('generationLocks').doc(user.uid);
    const result = {
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
const handleApiError = (res, error, fallbackStatus = 500) => {
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
const handleTryOnRequest = async (req, res, label) => {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }
    if (!getOpenAIApiKey()) {
        res.status(500).json({ error: OPENAI_CONFIG_ERROR, message: OPENAI_CONFIG_MESSAGE });
        return;
    }
    const { personImage, garmentImage, bodyProfile, requestId } = req.body;
    if (!personImage || !garmentImage || !requestId) {
        res.status(400).json({ error: '필수 파라미터가 누락되었습니다.' });
        return;
    }
    let user;
    try {
        user = await requireAuthenticatedUser(req);
    }
    catch (error) {
        handleApiError(res, error, 401);
        return;
    }
    let chargeResult;
    try {
        chargeResult = await beginGenerationCharge(user, requestId);
    }
    catch (error) {
        handleApiError(res, error, 500);
        return;
    }
    try {
        const generatedImage = await requestOpenAIComposite(personImage, garmentImage, bodyProfile);
        await markGenerationCompleted(user, requestId);
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
    }
    catch (error) {
        functions.logger.error(`OpenAI ${label} request failed`, error);
        const errorMessage = error instanceof Error ? error.message : 'OpenAI image generation failed';
        const refundResult = await refundGenerationCharge(user, requestId, errorMessage).catch((refundError) => {
            functions.logger.error('Failed to refund credits after generation error', refundError);
            return { refunded: false, balanceAfter: null };
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
exports.api = functions
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
        }
        catch (error) {
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
        }
        catch (error) {
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
exports.generateTryOn = functions
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
//# sourceMappingURL=index.js.map