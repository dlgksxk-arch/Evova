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
const OPENAI_IMAGE_MODEL = process.env['OPENAI_IMAGE_MODEL'] ?? 'gpt-image-1';
const buildTryOnPrompt = (bodyProfile) => {
    const subjectType = bodyProfile?.gender === 'dog' || bodyProfile?.gender === 'cat' ? 'pet' : 'person';
    const identityGuide = subjectType === 'pet'
        ? 'Preserve the subject’s face, fur pattern, body shape, and species traits from the first image.'
        : 'Preserve the person’s facial identity, hairstyle, skin tone, and overall appearance from the first image.';
    const bodyGuide = [
        bodyProfile?.heightCm ? `Reflect a natural body proportion using ${bodyProfile.heightCm} cm height as guidance.` : null,
        bodyProfile?.weightKg ? `Reflect a natural body volume using ${bodyProfile.weightKg} kg weight as guidance.` : null,
    ].filter(Boolean).join(' ');
    return [
        'Using the first input image as the identity reference and the second input image as the clothing reference, generate one single wide 1x4 fashion try-on sheet.',
        'Show the same subject wearing the same outfit in four consistent panels ordered left to right: front view, left 45-degree view, right 45-degree view, and back view.',
        identityGuide,
        'Preserve the outfit’s key design details, color, silhouette, styling, and material impression from the second image.',
        'Keep all four panels visually consistent as the same subject and the same garment.',
        'Use clean premium studio fashion photography, full-body framing, realistic lighting, and a simple background.',
        'Do not create four separate files or collage borders outside the single wide sheet.',
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
    const apiKey = process.env['OPENAI_API_KEY'] ?? '';
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY is not set');
    }
    const personFile = toImageBlob(personImage, 'person');
    const garmentFile = toImageBlob(garmentImage, 'garment');
    const formData = new FormData();
    formData.append('model', OPENAI_IMAGE_MODEL);
    formData.append('prompt', buildTryOnPrompt(bodyProfile));
    formData.append('image', personFile.blob, personFile.filename);
    formData.append('image', garmentFile.blob, garmentFile.filename);
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
        size: '1536x1024',
        inputCount: 2,
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
    const path = req.path;
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
                error: error instanceof Error ? error.message : 'OpenAI image generation failed',
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
            error: error instanceof Error ? error.message : 'OpenAI image generation failed',
        });
        return;
    }
});
//# sourceMappingURL=index.js.map