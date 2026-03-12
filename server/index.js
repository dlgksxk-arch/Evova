const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));

const PORT = process.env.PORT || 8080;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Health check
app.get('/', (req, res) => res.json({ status: 'ok' }));

// POST /generate
app.post('/generate', async (req, res) => {
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not set' });
  }

  const { personImage, garmentImage } = req.body;
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

app.listen(PORT, () => console.log(`HAMDEVA-server listening on port ${PORT}`));
