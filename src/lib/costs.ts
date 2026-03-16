import type { GenerationRequestRecord } from '../types/hamdeva';

export const OPENAI_IMAGE_TOKEN_PRICING = {
  'gpt-image-1': { inputPer1M: 10, outputPer1M: 40 },
  'gpt-image-1-mini': { inputPer1M: 2.5, outputPer1M: 8 },
  'gpt-image-1.5': { inputPer1M: 8, outputPer1M: 32 },
  'chatgpt-image-latest': { inputPer1M: 8, outputPer1M: 32 },
} as const;

export const OPENAI_IMAGE_UNIT_PRICING = {
  'gpt-image-1': {
    low: { '1024x1024': 0.011, '1024x1536': 0.016, '1536x1024': 0.016 },
    medium: { '1024x1024': 0.042, '1024x1536': 0.063, '1536x1024': 0.063 },
    high: { '1024x1024': 0.167, '1024x1536': 0.25, '1536x1024': 0.25 },
  },
  'gpt-image-1-mini': {
    low: { '1024x1024': 0.005, '1024x1536': 0.006, '1536x1024': 0.006 },
    medium: { '1024x1024': 0.011, '1024x1536': 0.015, '1536x1024': 0.015 },
    high: { '1024x1024': 0.036, '1024x1536': 0.052, '1536x1024': 0.052 },
  },
  'gpt-image-1.5': {
    low: { '1024x1024': 0.009, '1024x1536': 0.013, '1536x1024': 0.013 },
    medium: { '1024x1024': 0.034, '1024x1536': 0.05, '1536x1024': 0.05 },
    high: { '1024x1024': 0.133, '1024x1536': 0.2, '1536x1024': 0.2 },
  },
  'chatgpt-image-latest': {
    low: { '1024x1024': 0.009, '1024x1536': 0.013, '1536x1024': 0.013 },
    medium: { '1024x1024': 0.034, '1024x1536': 0.05, '1536x1024': 0.05 },
    high: { '1024x1024': 0.133, '1024x1536': 0.2, '1536x1024': 0.2 },
  },
} as const;

export const roundEstimatedCost = (value: number): number =>
  Math.round(value * 1_000_000) / 1_000_000;

export const estimateGenerationCost = (record: Partial<GenerationRequestRecord>): number | null => {
  if (typeof record.estimatedCost === 'number' && Number.isFinite(record.estimatedCost)) {
    return roundEstimatedCost(record.estimatedCost);
  }

  const model = typeof record.model === 'string' ? record.model : '';
  const quality = typeof record.quality === 'string' ? record.quality : '';
  const size = typeof record.size === 'string' ? record.size : '';
  const inputTokens = typeof record.usage?.input_tokens === 'number' ? Math.max(0, record.usage.input_tokens) : 0;
  const outputTokens = typeof record.usage?.output_tokens === 'number' ? Math.max(0, record.usage.output_tokens) : 0;
  const tokenPricing = OPENAI_IMAGE_TOKEN_PRICING[model as keyof typeof OPENAI_IMAGE_TOKEN_PRICING];

  if (tokenPricing && (inputTokens > 0 || outputTokens > 0)) {
    return roundEstimatedCost(
      (inputTokens / 1_000_000) * tokenPricing.inputPer1M
      + (outputTokens / 1_000_000) * tokenPricing.outputPer1M,
    );
  }

  const qualityPricing = OPENAI_IMAGE_UNIT_PRICING[model as keyof typeof OPENAI_IMAGE_UNIT_PRICING];
  const sizePricing = qualityPricing?.[quality as keyof typeof qualityPricing];
  const fallback = sizePricing?.[size as keyof typeof sizePricing];
  return typeof fallback === 'number' ? roundEstimatedCost(fallback) : null;
};
