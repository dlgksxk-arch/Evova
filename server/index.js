const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));

const PORT = process.env.PORT || 8080;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const buildTryOnPrompt = (bodyProfile = {}) => {
  const subjectType = bodyProfile.gender === 'dog' || bodyProfile.gender === 'cat' ? 'pet' : 'person';
  const bodyGuide = [
    bodyProfile.heightCm ? `Use ${bodyProfile.heightCm} cm height as a body proportion hint.` : null,
    bodyProfile.weightKg ? `Use ${bodyProfile.weightKg} kg weight as a body volume hint.` : null,
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

// Health check
app.get('/', (req, res) => res.json({ status: 'ok' }));
app.options(['/generate', '/tryon'], (req, res) => {
  console.info('[HAMDEVA-server] preflight', { path: req.path, method: req.method });
  res.sendStatus(204);
});

app.post(['/generate', '/tryon'], async (req, res) => {
  console.info('[HAMDEVA-server] incoming request', {
    path: req.path,
    method: req.method,
    contentType: req.headers['content-type'],
  });

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not set' });
  }

  const { personImage, garmentImage, bodyProfile } = req.body;
  if (!personImage || !garmentImage) {
    return res.status(400).json({ error: 'personImage and garmentImage are required' });
  }

  // Strip data URL prefix if present; extract mime type
  const parseDataUrl = (input) => {
    if (input.startsWith('data:')) {
      const [header, data] = input.split(',');
      const mimeType = header.split(':')[1].split(';')[0];
      return { data, mimeType };
    }
    return { data: input, mimeType: 'image/jpeg' };
  };

  const person  = parseDataUrl(personImage);
  const garment = parseDataUrl(garmentImage);

  const body = {
    contents: [{
      parts: [
        {
          text: buildTryOnPrompt(bodyProfile),
        },
        { inline_data: { mime_type: person.mimeType,  data: person.data  } },
        { inline_data: { mime_type: garment.mimeType, data: garment.data } },
      ],
    }],
    generationConfig: {
      responseModalities: ['IMAGE', 'TEXT'],
      temperature: 1,
      topP: 0.95,
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`;

  let geminiRes;
  try {
    geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error('Network error calling Gemini:', err);
    return res.status(500).json({ error: 'Failed to reach Gemini API' });
  }

  console.info('[HAMDEVA-server] upstream response', { path: req.path, status: geminiRes.status });

  if (!geminiRes.ok) {
    const detail = await geminiRes.json().catch(() => ({}));
    console.error('Gemini error:', detail);
    return res.status(500).json({ error: `Gemini API error ${geminiRes.status}`, detail });
  }

  const data = await geminiRes.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];

  for (const part of parts) {
    if (part.inlineData) {
      return res.json({ image: part.inlineData.data });
    }
  }

  return res.status(500).json({ error: 'No image in Gemini response' });
});

app.all(['/generate', '/tryon'], (req, res) => {
  res.status(405).json({ error: 'Method Not Allowed', method: req.method, path: req.path, allowed: 'POST, OPTIONS' });
});

app.listen(PORT, () => console.log(`HAMDEVA-server listening on port ${PORT}`));
