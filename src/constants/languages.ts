export const LANGUAGE_CODES = [
  'en',
  'es',
  'zh',
  'ja',
  'ko',
  'hi',
  'fr',
  'ar',
  'bn',
  'ru',
  'pt',
  'ur',
  'id',
  'de',
  'mr',
  'te',
  'tr',
  'ta',
  'vi',
  'it',
] as const;

export type LanguageCode = typeof LANGUAGE_CODES[number];

export interface LanguageOption {
  value: LanguageCode;
  label: string;
  nativeLabel: string;
  shortLabel: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: 'en', label: 'English', nativeLabel: 'English', shortLabel: 'EN' },
  { value: 'ko', label: 'Korean', nativeLabel: '한국어', shortLabel: 'KO' },
  { value: 'ja', label: 'Japanese', nativeLabel: '日本語', shortLabel: '日本語' },
  { value: 'zh', label: 'Chinese', nativeLabel: '中文', shortLabel: '中文' },
];
