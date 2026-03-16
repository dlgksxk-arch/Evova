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
        ? 'Use the second input image as the identity reference and preserve the subject’s face, fur pattern, body shape, and species traits consistently across all four panels.'
        : 'Use the second input image as the identity reference for the face, hairstyle, skin tone, and overall person, and keep that same identity in all four panels.';
    const bodyGuide = [
        bodyProfile?.heightCm ? `Reflect a natural body proportion using ${bodyProfile.heightCm} cm height as guidance.` : null,
        bodyProfile?.weightKg ? `Reflect a natural body volume using ${bodyProfile.weightKg} kg weight as guidance.` : null,
    ].filter(Boolean).join(' ');
    return [
        'Use the first input image as the clothing reference and reproduce the garment faithfully.',
        'Preserve the garment silhouette, color, fabric feel, embroidery, ribbon, accessories, length, sleeve shape, trim, and decorative details exactly.',
        'Do not invent a new outfit. Do not simplify the outfit. Do not redesign the clothing. Preserve traditional clothing details exactly.',
        identityGuide,
        'Generate one single wide 1x4 fashion try-on sheet in one image.',
        'The four panels must be ordered left to right as: front view, left 45-degree view, right 45-degree view, and back view.',
        'The same subject and the same garment must appear consistently in all four panels.',
        'The back view must still clearly match the exact same garment from the front views.',
        'Show full body in all four panels when possible, with enough space to see the full clothing silhouette and elegant fashion posture.',
        'Use realistic premium studio fashion photography, clean soft neutral background, and consistent catalog lighting across all four panels.',
        'Do not create separate files. Return one combined wide lookbook sheet only.',
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
    if (!image) {
        throw new Error('OpenAI response did not include an image.');
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
const writeCreditLog = (transaction, uid, type, amount, balanceAfter, note) => {
    transaction.set(createCreditLogRef(), {
        uid,
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
            writeCreditLog(transaction, user.uid, 'signup_bonus', SIGNUP_BONUS_CREDITS, nextCredits, 'signup bonus');
        }
        const lastDailyRewardKey = timestampToSeoulDateKey(currentProfile.lastDailyRewardAt);
        if (lastDailyRewardKey !== todayKey) {
            const reward = getDailyCreditReward(currentProfile.subscriptionPlan);
            nextCredits += reward.base;
            result.dailyRewardGranted = reward.base;
            writeCreditLog(transaction, user.uid, 'daily_reward', reward.base, nextCredits, `daily reward ${todayKey}`);
            if (reward.subscriptionBonus > 0) {
                nextCredits += reward.subscriptionBonus;
                result.subscriptionBonusGranted = reward.subscriptionBonus;
                writeCreditLog(transaction, user.uid, 'subscription_bonus', reward.subscriptionBonus, nextCredits, `subscription bonus ${currentProfile.subscriptionPlan} ${todayKey}`);
            }
        }
        const updatePayload = {
            email: user.email || currentProfile.email,
            credits: nextCredits,
            isSubscribed: currentProfile.isSubscribed,
            subscriptionPlan: currentProfile.subscriptionPlan,
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
        };
    });
    return result;
};
const buildGenerationRequestDocId = (uid, requestId) => `${uid}_${requestId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
const beginGenerationCharge = async (user, requestId) => {
    if (!requestId) {
        throw new Error(DUPLICATE_REQUEST_ERROR);
    }
    const userRef = db.collection('users').doc(user.uid);
    const requestRef = db.collection('generationRequests').doc(buildGenerationRequestDocId(user.uid, requestId));
    const todayKey = getTodayKeyInSeoul();
    const result = {
        profile: {
            credits: 0,
            isSubscribed: false,
            subscriptionPlan: 'free',
        },
        signupBonusGranted: 0,
        dailyRewardGranted: 0,
        subscriptionBonusGranted: 0,
        requestId,
        creditsAfterCharge: 0,
    };
    await db.runTransaction(async (transaction) => {
        const [userSnapshot, requestSnapshot] = await Promise.all([
            transaction.get(userRef),
            transaction.get(requestRef),
        ]);
        if (requestSnapshot.exists) {
            throw new Error(DUPLICATE_REQUEST_ERROR);
        }
        const currentProfile = normalizeUserAccount(user.email, userSnapshot.data());
        let nextCredits = currentProfile.credits;
        if (!userSnapshot.exists) {
            nextCredits += SIGNUP_BONUS_CREDITS;
            result.signupBonusGranted = SIGNUP_BONUS_CREDITS;
            writeCreditLog(transaction, user.uid, 'signup_bonus', SIGNUP_BONUS_CREDITS, nextCredits, 'signup bonus');
        }
        const lastDailyRewardKey = timestampToSeoulDateKey(currentProfile.lastDailyRewardAt);
        if (lastDailyRewardKey !== todayKey) {
            const reward = getDailyCreditReward(currentProfile.subscriptionPlan);
            nextCredits += reward.base;
            result.dailyRewardGranted = reward.base;
            writeCreditLog(transaction, user.uid, 'daily_reward', reward.base, nextCredits, `daily reward ${todayKey}`);
            if (reward.subscriptionBonus > 0) {
                nextCredits += reward.subscriptionBonus;
                result.subscriptionBonusGranted = reward.subscriptionBonus;
                writeCreditLog(transaction, user.uid, 'subscription_bonus', reward.subscriptionBonus, nextCredits, `subscription bonus ${currentProfile.subscriptionPlan} ${todayKey}`);
            }
        }
        if (nextCredits < GENERATION_COST) {
            throw new Error(NOT_ENOUGH_CREDITS_ERROR);
        }
        nextCredits -= GENERATION_COST;
        writeCreditLog(transaction, user.uid, 'generate_use', -GENERATION_COST, nextCredits, `generate request ${requestId}`);
        const updatePayload = {
            email: user.email || currentProfile.email,
            credits: nextCredits,
            isSubscribed: currentProfile.isSubscribed,
            subscriptionPlan: currentProfile.subscriptionPlan,
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
            requestId,
            cost: GENERATION_COST,
            status: 'charged',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        result.profile = {
            credits: nextCredits,
            isSubscribed: currentProfile.isSubscribed,
            subscriptionPlan: currentProfile.subscriptionPlan,
        };
        result.creditsAfterCharge = nextCredits;
    });
    return result;
};
const markGenerationCompleted = async (user, requestId) => {
    const requestRef = db.collection('generationRequests').doc(buildGenerationRequestDocId(user.uid, requestId));
    await requestRef.set({
        status: 'completed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
};
const refundGenerationCharge = async (user, requestId) => {
    const userRef = db.collection('users').doc(user.uid);
    const requestRef = db.collection('generationRequests').doc(buildGenerationRequestDocId(user.uid, requestId));
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
        const nextCredits = currentProfile.credits + GENERATION_COST;
        transaction.set(userRef, {
            credits: nextCredits,
            lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        transaction.set(requestRef, {
            status: 'refunded',
            refundedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        writeCreditLog(transaction, user.uid, 'generate_refund', GENERATION_COST, nextCredits, `refund request ${requestId}`);
        result.refunded = true;
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
        const refundResult = await refundGenerationCharge(user, requestId).catch((refundError) => {
            functions.logger.error('Failed to refund credits after generation error', refundError);
            return { refunded: false, balanceAfter: null };
        });
        const errorMessage = error instanceof Error ? error.message : 'OpenAI image generation failed';
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