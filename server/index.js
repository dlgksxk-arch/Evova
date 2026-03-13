const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.options('*', cors());
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 8080;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';

const buildTryOnPrompt = (bodyProfile = {}) => {
  const subjectType = bodyProfile.gender === 'dog' || bodyProfile.gender === 'cat' ? 'pet' : 'person';
  const identityGuide = subjectType === 'pet'
    ? 'Use the second input image as the identity reference and preserve the subject’s face, fur pattern, body shape, and species traits consistently across all four panels.'
    : 'Use the second input image as the identity reference for the face, hairstyle, skin tone, and overall person, and keep that same identity in all four panels.';
  const bodyGuide = [
    bodyProfile.heightCm ? `Reflect a natural body proportion using ${bodyProfile.heightCm} cm height as guidance.` : null,
    bodyProfile.weightKg ? `Reflect a natural body volume using ${bodyProfile.weightKg} kg weight as guidance.` : null,
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
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set');
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

  console.info('[HAMDEVA-server] openai image edit request', {
    model: OPENAI_IMAGE_MODEL,
    endpoint: '/v1/images/edits',
    size: '1536x1024',
    hasGarmentImage: Boolean(garmentImage),
    hasPersonImage: Boolean(personImage),
  });

  const openAIRes = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: formData,
  });

  const responseBody = await openAIRes.json().catch(() => ({}));
  console.info('[HAMDEVA-server] openai image edit response', {
    model: OPENAI_IMAGE_MODEL,
    endpoint: '/v1/images/edits',
    status: openAIRes.status,
  });

  if (!openAIRes.ok) {
    console.error('OpenAI image edit error:', responseBody);
    throw new Error(responseBody?.error?.message || `OpenAI API error ${openAIRes.status}`);
  }

  const image = responseBody?.data?.[0]?.b64_json;
  if (!image) {
    throw new Error('OpenAI response did not include an image.');
  }

  return {
    mimeType: 'image/png',
    data: image,
  };
};

// Health check
app.get('/', (req, res) => res.json({ status: 'ok' }));
app.options(['/generate', '/tryon', '/generateTryOn', '/api/tryon'], (req, res) => {
  console.info('[HAMDEVA-server] preflight', { path: req.path, method: req.method });
  res.sendStatus(204);
});

app.post(['/generate', '/tryon', '/generateTryOn', '/api/tryon'], async (req, res) => {
  console.info('[HAMDEVA-server] incoming request', {
    path: req.path,
    method: req.method,
    contentType: req.headers['content-type'],
  });

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OPENAI_API_KEY is not set' });
  }

  const { personImage, garmentImage, bodyProfile } = req.body;
  if (!personImage || !garmentImage) {
    return res.status(400).json({ error: 'personImage and garmentImage are required' });
  }

  try {
    const generatedImage = await requestOpenAIComposite(personImage, garmentImage, bodyProfile);
    return res.json({
      image: `data:${generatedImage.mimeType};base64,${generatedImage.data}`,
      mimeType: generatedImage.mimeType,
      success: true,
    });
  } catch (err) {
    console.error('OpenAI image generation failed:', err);
    return res.status(502).json({ error: err instanceof Error ? err.message : 'Failed to reach OpenAI API' });
  }
});

app.all(['/generate', '/tryon', '/generateTryOn', '/api/tryon'], (req, res) => {
  res.status(405).json({ error: 'Method Not Allowed', method: req.method, path: req.path, allowed: 'POST, OPTIONS' });
});

app.listen(PORT, () => console.log(`HAMDEVA-server listening on port ${PORT}`));
