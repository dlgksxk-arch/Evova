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
const buildTryOnPrompt = (bodyProfile) => {
    const subjectType = bodyProfile?.gender === 'dog' || bodyProfile?.gender === 'cat' ? 'pet' : 'person';
    const bodyGuide = [
        bodyProfile?.heightCm ? `Use ${bodyProfile.heightCm} cm height as a body proportion hint.` : null,
        bodyProfile?.weightKg ? `Use ${bodyProfile.weightKg} kg weight as a body volume hint.` : null,
        'Keep the same person identity and face from the first image.',
        'Keep the same clothing design, color, silhouette, and material from the second image.',
        'Compose the final output as a realistic fashion-photo style 1x4 variation sheet.',
        'Use a simple background and maintain a photorealistic result.',
    ].filter(Boolean).join('\n');
    if (subjectType === 'pet') {
        return `You are a virtual try-on image compositor.

Two images are provided:
- FIRST IMAGE = the pet. Preserve the exact face, fur pattern, body shape, pose, and species-specific features completely unchanged.
- SECOND IMAGE = the pet clothing item only. This garment must be worn by the pet in the first image.

Your task: Composite the clothing from the SECOND IMAGE onto the pet in the FIRST IMAGE.

Critical rules:
1. The pet's face, fur, body proportions, and identity from the FIRST IMAGE must remain unchanged
2. Fit the clothing naturally to the pet's body and anatomy without turning it into a human garment
3. Preserve the original pose, background, and lighting from the FIRST IMAGE
4. The fabric texture, color, and design of the clothing must exactly match the SECOND IMAGE
5. Output must look like a single real photograph, not a collage or illustration

Additional direction:
${bodyGuide}

Output: One photorealistic image of the pet from the FIRST IMAGE wearing the clothing from the SECOND IMAGE.`;
    }
    return `You are a virtual try-on image compositor.

Two images are provided:
- FIRST IMAGE = the person. Preserve their exact face, skin tone, hair, body shape, and pose completely unchanged.
- SECOND IMAGE = the clothing item only (no person). This garment must be worn by the person in the first image.

Your task: Composite the clothing from the SECOND IMAGE onto the body of the person in the FIRST IMAGE.

Critical rules:
1. The person's face and identity from the FIRST IMAGE must be identical in the output
2. The clothing item from the SECOND IMAGE must appear naturally fitted on the person's body
3. Preserve the original pose, background, and lighting from the FIRST IMAGE
4. The fabric texture, color, and design of the clothing must exactly match the SECOND IMAGE
5. Output must look like a single real photograph, not a collage or illustration

Additional direction:
${bodyGuide}

Output: One photorealistic image of the person from the FIRST IMAGE wearing the clothing from the SECOND IMAGE.`;
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
        // Gemini 이미지 생성 API 호출
        const apiKey = process.env['NANOBANANA_API_KEY'] ?? '';
        if (!apiKey) {
            res.status(500).json({ error: 'API 키가 서버에 설정되어 있지 않습니다.' });
            return;
        }
        const toBase64 = (dataUrl) => dataUrl.split(',')[1];
        const toMime = (dataUrl) => dataUrl.split(';')[0].split(':')[1];
        const geminiBody = {
            contents: [{
                    parts: [
                        {
                            text: buildTryOnPrompt(bodyProfile),
                        },
                        { inline_data: { mime_type: toMime(personImage), data: toBase64(personImage) } },
                        { inline_data: { mime_type: toMime(garmentImage), data: toBase64(garmentImage) } },
                    ],
                }],
            generationConfig: {
                responseModalities: ['IMAGE', 'TEXT'],
                temperature: 1,
                topP: 0.95,
            },
        };
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(geminiBody) });
        functions.logger.info('api upstream response', { path, status: geminiRes.status });
        if (!geminiRes.ok) {
            const errBody = await geminiRes.json().catch(() => ({}));
            functions.logger.error('Gemini API error', errBody);
            res.status(502).json({ error: `Gemini API 오류: ${geminiRes.status}`, detail: errBody });
            return;
        }
        const data = await geminiRes.json();
        const parts = data.candidates?.[0]?.content?.parts ?? [];
        for (const part of parts) {
            if (part.inlineData) {
                const resultDataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                res.json({ success: true, image: resultDataUrl });
                return;
            }
        }
        res.status(502).json({ error: '응답에서 이미지를 찾을 수 없습니다.' });
        return;
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
    // Gemini API 키 확인
    const apiKey = process.env['NANOBANANA_API_KEY'] ?? '';
    if (!apiKey) {
        res.status(500).json({ error: 'API 키가 서버에 설정되어 있지 않습니다.' });
        return;
    }
    const toBase64 = (dataUrl) => dataUrl.split(',')[1];
    const toMime = (dataUrl) => dataUrl.split(';')[0].split(':')[1];
    const geminiBody = {
        contents: [{
                parts: [
                    {
                        text: buildTryOnPrompt(bodyProfile),
                    },
                    { inline_data: { mime_type: toMime(personImage), data: toBase64(personImage) } },
                    { inline_data: { mime_type: toMime(garmentImage), data: toBase64(garmentImage) } },
                ],
            }],
        generationConfig: {
            responseModalities: ['IMAGE', 'TEXT'],
            temperature: 1,
            topP: 0.95,
        },
    };
    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(geminiBody) });
    functions.logger.info('generateTryOn upstream response', { status: geminiRes.status });
    if (!geminiRes.ok) {
        const errBody = await geminiRes.json().catch(() => ({}));
        functions.logger.error('Gemini API error', errBody);
        res.status(502).json({ error: `Gemini API 오류: ${geminiRes.status}`, detail: errBody });
        return;
    }
    const data = await geminiRes.json();
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
        if (part.inlineData) {
            const resultDataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            res.json({ success: true, image: resultDataUrl });
            return;
        }
    }
    res.status(502).json({ error: '응답에서 이미지를 찾을 수 없습니다.' });
});
//# sourceMappingURL=index.js.map