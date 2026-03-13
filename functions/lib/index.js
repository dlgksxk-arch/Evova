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
const FREE_LIMIT = 3;
const CORS_ORIGIN = ['https://fitall-ver1.web.app', 'https://fitall-ver1.firebaseapp.com'];
const OPENAI_CONFIG_ERROR = 'IMAGE_GENERATION_NOT_CONFIGURED';
const OPENAI_CONFIG_MESSAGE = '이미지 생성 설정이 아직 완료되지 않았습니다. 잠시 후 다시 시도해주세요.';
const OPENAI_IMAGE_MODEL = process.env['OPENAI_IMAGE_MODEL'] ?? 'gpt-image-1';
const getOpenAIApiKey = () => {
    const envCandidates = [
        process.env['OPENAI_API_KEY'],
        process.env['OPENAI_KEY'],
        process.env['OPENAI_SECRET'],
        process.env['OPENAI_SECRET_KEY'],
        process.env['OPEN_AI_API_KEY'],
        process.env['openai_api_key'],
    ];
    for (const candidate of envCandidates) {
        if (typeof candidate === 'string' && candidate.trim()) {
            return candidate.trim();
        }
    }
    try {
        const runtimeConfig = functions.config();
        const configCandidates = [
            runtimeConfig.openai?.api_key,
            runtimeConfig.openai?.key,
            runtimeConfig.openai?.apiKey,
            runtimeConfig.openai_api_key,
            runtimeConfig.openai_key,
        ];
        for (const candidate of configCandidates) {
            if (typeof candidate === 'string' && candidate.trim()) {
                return candidate.trim();
            }
        }
    }
    catch {
        // Ignore missing runtime config and fall through to empty value.
    }
    return '';
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
    const apiKey = getOpenAIApiKey();
    if (!apiKey) {
        throw new Error(OPENAI_CONFIG_MESSAGE);
    }
    const garmentFile = toImageBlob(garmentImage, 'garment');
    const personFile = toImageBlob(personImage, 'person');
    const formData = new FormData();
    formData.append('model', OPENAI_IMAGE_MODEL);
    formData.append('prompt', buildTryOnPrompt(bodyProfile));
    formData.append('image', garmentFile.blob, garmentFile.filename);
    formData.append('image', personFile.blob, personFile.filename);
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
// CORS 헤더 설정
const setCors = (req, res) => {
    const origin = req.headers.origin || '';
    if (origin.startsWith('http://') || origin.startsWith('https://')) {
        res.set('Access-Control-Allow-Origin', origin);
    }
    else if (CORS_ORIGIN.includes(origin) || origin.includes('localhost') || origin.includes('cloudworkstations.dev')) {
        res.set('Access-Control-Allow-Origin', origin);
    }
    else {
        res.set('Access-Control-Allow-Origin', 'https://fitall-ver1.web.app');
    }
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.set('Access-Control-Allow-Credentials', 'true');
};
// ─── /api/usage — 오늘 사용 횟수 조회 ────────────────────────
exports.api = functions
    .region('asia-northeast3') // 서울 리전
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
    // ── GET /api/usage?sessionId=xxx ──────────────────────────
    if (req.method === 'GET' && path === '/usage') {
        const sessionId = req.query['sessionId'];
        if (!sessionId) {
            res.status(400).json({ error: 'sessionId required' });
            return;
        }
        const today = new Date().toISOString().slice(0, 10);
        const docRef = db.collection('usage').doc(`${sessionId}_${today}`);
        const doc = await docRef.get();
        const count = doc.exists ? (doc.data()?.count ?? 0) : 0;
        res.json({ count, remaining: Math.max(0, FREE_LIMIT - count), limit: FREE_LIMIT });
        return;
    }
    // ── POST /api/tryon ───────────────────────────────────────
    if (req.method === 'POST' && (path === '/tryon' || path === '/generate')) {
        if (!getOpenAIApiKey()) {
            res.status(500).json({ error: OPENAI_CONFIG_ERROR, message: OPENAI_CONFIG_MESSAGE });
            return;
        }
        const { sessionId, personImage, garmentImage, bodyProfile } = req.body;
        if (!sessionId || !personImage || !garmentImage) {
            res.status(400).json({ error: '필수 파라미터가 누락되었습니다.' });
            return;
        }
        // 사용 횟수 확인 및 증가 (트랜잭션)
        const today = new Date().toISOString().slice(0, 10);
        const docRef = db.collection('usage').doc(`${sessionId}_${today}`);
        let allowed = false;
        await db.runTransaction(async (tx) => {
            const doc = await tx.get(docRef);
            const count = doc.exists ? (doc.data()?.count ?? 0) : 0;
            if (count < FREE_LIMIT) {
                tx.set(docRef, { sessionId, date: today, count: count + 1 }, { merge: true });
                allowed = true;
            }
        });
        if (!allowed) {
            res.status(402).json({ error: 'LIMIT_EXCEEDED', message: '오늘 무료 횟수를 모두 사용했습니다.' });
            return;
        }
        try {
            const generatedImage = await requestOpenAIComposite(personImage, garmentImage, bodyProfile);
            const resultDataUrl = `data:${generatedImage.mimeType};base64,${generatedImage.data}`;
            res.json({ success: true, image: resultDataUrl, mimeType: generatedImage.mimeType });
            return;
        }
        catch (error) {
            functions.logger.error('OpenAI try-on request failed', error);
            res.status(502).json({
                error: error instanceof Error && error.message === OPENAI_CONFIG_MESSAGE ? OPENAI_CONFIG_ERROR : (error instanceof Error ? error.message : 'OpenAI image generation failed'),
                message: error instanceof Error ? error.message : 'OpenAI image generation failed',
            });
            return;
        }
    }
    if (path === '/tryon' || path === '/generate') {
        res.status(405).json({ error: 'Method Not Allowed', method: req.method, path, allowed: 'POST, OPTIONS' });
        return;
    }
    res.status(404).json({ error: 'Not found' });
});
// ─── generateTryOn — 전용 가상 피팅 Function ─────────────────────
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
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }
    if (!getOpenAIApiKey()) {
        res.status(500).json({ error: OPENAI_CONFIG_ERROR, message: OPENAI_CONFIG_MESSAGE });
        return;
    }
    const { sessionId, personImage, garmentImage, bodyProfile } = req.body;
    if (!sessionId || !personImage || !garmentImage) {
        res.status(400).json({ error: '필수 파라미터가 누락되었습니다.' });
        return;
    }
    // 사용 횟수 확인 및 증가 (Firestore 트랜잭션)
    const today = new Date().toISOString().slice(0, 10);
    const docRef = db.collection('usage').doc(`${sessionId}_${today}`);
    let allowed = false;
    await db.runTransaction(async (tx) => {
        const doc = await tx.get(docRef);
        const count = doc.exists ? (doc.data()?.count ?? 0) : 0;
        if (count < FREE_LIMIT) {
            tx.set(docRef, { sessionId, date: today, count: count + 1 }, { merge: true });
            allowed = true;
        }
    });
    if (!allowed) {
        res.status(402).json({ error: 'LIMIT_EXCEEDED', message: '오늘 무료 횟수를 모두 사용했습니다.' });
        return;
    }
    try {
        const generatedImage = await requestOpenAIComposite(personImage, garmentImage, bodyProfile);
        const resultDataUrl = `data:${generatedImage.mimeType};base64,${generatedImage.data}`;
        res.json({ success: true, image: resultDataUrl, mimeType: generatedImage.mimeType });
        return;
    }
    catch (error) {
        functions.logger.error('OpenAI generateTryOn request failed', error);
        res.status(502).json({
            error: error instanceof Error && error.message === OPENAI_CONFIG_MESSAGE ? OPENAI_CONFIG_ERROR : (error instanceof Error ? error.message : 'OpenAI image generation failed'),
            message: error instanceof Error ? error.message : 'OpenAI image generation failed',
        });
        return;
    }
});
//# sourceMappingURL=index.js.map