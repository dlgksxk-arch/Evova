const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 8080;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';

const buildTryOnPrompt = (bodyProfile = {}) => {
  const subjectType = bodyProfile.gender === 'dog' || bodyProfile.gender === 'cat' ? 'pet' : 'person';
  const identityGuide = subjectType === 'pet'
    ? 'Preserve the subject’s face, fur pattern, body shape, and species traits from the first image.'
    : 'Preserve the person’s facial identity, hairstyle, skin tone, and overall appearance from the first image.';
  const bodyGuide = [
    bodyProfile.heightCm ? `Reflect a natural body proportion using ${bodyProfile.heightCm} cm height as guidance.` : null,
    bodyProfile.weightKg ? `Reflect a natural body volume using ${bodyProfile.weightKg} kg weight as guidance.` : null,
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
  if (!OPENAI_API_KEY) {
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

  console.info('[HAMDEVA-server] openai image edit request', {
    model: OPENAI_IMAGE_MODEL,
    size: '1536x1024',
    inputCount: 2,
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

app.all(['/generate', '/tryon'], (req, res) => {
  res.status(405).json({ error: 'Method Not Allowed', method: req.method, path: req.path, allowed: 'POST, OPTIONS' });
});

app.listen(PORT, () => console.log(`HAMDEVA-server listening on port ${PORT}`));
