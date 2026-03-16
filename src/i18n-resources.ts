import en from './locales/en.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import zh from './locales/zh.json';

export const resources = {
  en: { translation: en },
  ko: { translation: ko },
  ja: { translation: ja },
  zh: { translation: zh },
} as const;

export type SupportedLanguage = keyof typeof resources;
export type AppTranslation = typeof resources.en.translation;
export type UiTranslation = AppTranslation['ui'];
export type EmptyPreviewTranslation = AppTranslation['emptyPreview'];
export type SampleModalTranslation = AppTranslation['sampleModal'];
export type ClothSampleModalTranslation = AppTranslation['clothSampleModal'];
