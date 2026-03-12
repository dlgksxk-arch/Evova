import cors from 'cors';
const corsHandler = cors({ origin: true });
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

admin.initializeApp();
const db = admin.firestore();

const FREE_LIMIT = 5;
const CORS_ORIGIN = ['https://fitall-ver1.web.app', 'https://fitall-ver1.firebaseapp.com'];

interface GeminiResponse {
  candidates?: { content?: { parts?: { inlineData?: { mimeType: string; data: string } }[] } }[];
}

// CORS 헤더 설정
const setCors = (req: functions.https.Request, res: functions.Response) => {
  const origin = req.headers.origin || '';
  if (CORS_ORIGIN.includes(origin) || origin.includes('localhost') || origin.includes('cloudworkstations.dev')) {
    res.set('Access-Control-Allow-Origin', origin);
  } else {
    res.set('Access-Control-Allow-Origin', 'https://fitall-ver1.web.app');
  }
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.set('Access-Control-Allow-Credentials', 'true');
};

// ─── /api/usage — 오늘 사용 횟수 조회 ────────────────────────
export const api = functions
  .region('asia-northeast3')  // 서울 리전
  .https.onRequest(async (req, res) => {
    setCors(req, res);
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }

    const path = req.path;

    // ── GET /api/usage?sessionId=xxx ──────────────────────────
    if (req.method === 'GET' && path === '/usage') {
      const sessionId = req.query['sessionId'] as string;
      if (!sessionId) { res.status(400).json({ error: 'sessionId required' }); return; }

      const today = new Date().toISOString().slice(0, 10);
      const docRef = db.collection('usage').doc(`${sessionId}_${today}`);
      const doc = await docRef.get();
      const count: number = doc.exists ? (doc.data()?.count as number ?? 0) : 0;

      res.json({ count, remaining: Math.max(0, FREE_LIMIT - count), limit: FREE_LIMIT });
      return;
    }

    // ── POST /api/tryon ───────────────────────────────────────
    if (req.method === 'POST' && path === '/tryon') {
      const { sessionId, personImage, garmentImage } = req.body as {
        sessionId: string;
        personImage: string;  // data URL
        garmentImage: string; // data URL
      };

      if (!sessionId || !personImage || !garmentImage) {
        res.status(400).json({ error: '필수 파라미터가 누락되었습니다.' }); return;
      }

      // 사용 횟수 확인 및 증가 (트랜잭션)
      const today = new Date().toISOString().slice(0, 10);
      const docRef = db.collection('usage').doc(`${sessionId}_${today}`);

      let allowed = false;
      await db.runTransaction(async (tx) => {
        const doc = await tx.get(docRef);
        const count: number = doc.exists ? (doc.data()?.count as number ?? 0) : 0;
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
        res.status(500).json({ error: 'API 키가 서버에 설정되어 있지 않습니다.' }); return;
      }

      const toBase64 = (dataUrl: string) => dataUrl.split(',')[1];
      const toMime   = (dataUrl: string) => dataUrl.split(';')[0].split(':')[1];

      const geminiBody = {
        contents: [{
          parts: [
            {
              text: `You are a virtual try-on image compositor.

Two images are provided:
- FIRST IMAGE = the person. This is the human subject. Preserve their exact face, skin tone, hair, body shape, and pose completely unchanged.
- SECOND IMAGE = the clothing item only (no person). This garment must be worn by the person in the first image.

Your task: Composite the clothing from the SECOND IMAGE onto the body of the person in the FIRST IMAGE.

Critical rules:
1. The person's face and identity from the FIRST IMAGE must be IDENTICAL in the output — do not alter or replace the face
2. The clothing item from the SECOND IMAGE must appear naturally fitted on the person's body
3. Preserve the original pose, background, and lighting from the FIRST IMAGE
4. The fabric texture, color, and design of the clothing must exactly match the SECOND IMAGE
5. Output must look like a single real photograph — not a collage, not an illustration

Output: One photorealistic image of the person from the FIRST IMAGE wearing the clothing from the SECOND IMAGE.`,
            },
            { inline_data: { mime_type: toMime(personImage),  data: toBase64(personImage)  } },
            { inline_data: { mime_type: toMime(garmentImage), data: toBase64(garmentImage) } },
          ],
        }],
        generationConfig: {
          responseModalities: ['IMAGE', 'TEXT'],
          temperature: 1,
          topP: 0.95,
        },
      };

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(geminiBody) }
      );

      if (!geminiRes.ok) {
        const errBody = await geminiRes.json().catch(() => ({}));
        functions.logger.error('Gemini API error', errBody);
        res.status(502).json({ error: `Gemini API 오류: ${geminiRes.status}`, detail: errBody });
        return;
      }

      const data = await geminiRes.json() as GeminiResponse;
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

    res.status(404).json({ error: 'Not found' });
  });

// ─── generateTryOn — 전용 가상 피팅 Function ─────────────────────
export const generateTryOn = functions
  .region('asia-northeast3')
  .runWith({ timeoutSeconds: 120, memory: '512MB' })
  .https.onRequest(async (req, res) => {
    setCors(req, res);
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method Not Allowed' }); return; }

    const { sessionId, personImage, garmentImage } = req.body as {
      sessionId: string;
      personImage: string;
      garmentImage: string;
    };

    if (!sessionId || !personImage || !garmentImage) {
      res.status(400).json({ error: '필수 파라미터가 누락되었습니다.' }); return;
    }

    // 사용 횟수 확인 및 증가 (Firestore 트랜잭션)
    const today = new Date().toISOString().slice(0, 10);
    const docRef = db.collection('usage').doc(`${sessionId}_${today}`);

    let allowed = false;
    await db.runTransaction(async (tx) => {
      const doc = await tx.get(docRef);
      const count: number = doc.exists ? (doc.data()?.count as number ?? 0) : 0;
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
      res.status(500).json({ error: 'API 키가 서버에 설정되어 있지 않습니다.' }); return;
    }

    const toBase64 = (dataUrl: string) => dataUrl.split(',')[1];
    const toMime   = (dataUrl: string) => dataUrl.split(';')[0].split(':')[1];

    const geminiBody = {
      contents: [{
        parts: [
          {
            text: `You are a virtual try-on image compositor.

Two images are provided:
- FIRST IMAGE = the person. This is the human subject. Preserve their exact face, skin tone, hair, body shape, and pose completely unchanged.
- SECOND IMAGE = the clothing item only (no person). This garment must be worn by the person in the first image.

Your task: Composite the clothing from the SECOND IMAGE onto the body of the person in the FIRST IMAGE.

Critical rules:
1. The person's face and identity from the FIRST IMAGE must be IDENTICAL in the output — do not alter or replace the face
2. The clothing item from the SECOND IMAGE must appear naturally fitted on the person's body
3. Preserve the original pose, background, and lighting from the FIRST IMAGE
4. The fabric texture, color, and design of the clothing must exactly match the SECOND IMAGE
5. Output must look like a single real photograph — not a collage, not an illustration

Output: One photorealistic image of the person from the FIRST IMAGE wearing the clothing from the SECOND IMAGE.`,
          },
          { inline_data: { mime_type: toMime(personImage),  data: toBase64(personImage)  } },
          { inline_data: { mime_type: toMime(garmentImage), data: toBase64(garmentImage) } },
        ],
      }],
      generationConfig: {
        responseModalities: ['IMAGE', 'TEXT'],
        temperature: 1,
        topP: 0.95,
      },
    };

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(geminiBody) }
    );

    if (!geminiRes.ok) {
      const errBody = await geminiRes.json().catch(() => ({}));
      functions.logger.error('Gemini API error', errBody);
      res.status(502).json({ error: `Gemini API 오류: ${geminiRes.status}`, detail: errBody });
      return;
    }

    const data = await geminiRes.json() as GeminiResponse;
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
