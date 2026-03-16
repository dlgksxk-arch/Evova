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
  { value: 'es', label: 'Spanish', nativeLabel: 'Español', shortLabel: 'ES' },
  { value: 'zh', label: 'Chinese', nativeLabel: '中文', shortLabel: '中文' },
  { value: 'ja', label: 'Japanese', nativeLabel: '日本語', shortLabel: '日本語' },
  { value: 'ko', label: 'Korean', nativeLabel: '한국어', shortLabel: 'KO' },
  { value: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', shortLabel: 'HI' },
  { value: 'fr', label: 'French', nativeLabel: 'Français', shortLabel: 'FR' },
  { value: 'ar', label: 'Arabic', nativeLabel: 'العربية', shortLabel: 'AR' },
  { value: 'bn', label: 'Bengali', nativeLabel: 'বাংলা', shortLabel: 'BN' },
  { value: 'ru', label: 'Russian', nativeLabel: 'Русский', shortLabel: 'RU' },
  { value: 'pt', label: 'Portuguese', nativeLabel: 'Português', shortLabel: 'PT' },
  { value: 'ur', label: 'Urdu', nativeLabel: 'اردو', shortLabel: 'UR' },
  { value: 'id', label: 'Indonesian', nativeLabel: 'Bahasa Indonesia', shortLabel: 'ID' },
  { value: 'de', label: 'German', nativeLabel: 'Deutsch', shortLabel: 'DE' },
  { value: 'mr', label: 'Marathi', nativeLabel: 'मराठी', shortLabel: 'MR' },
  { value: 'te', label: 'Telugu', nativeLabel: 'తెలుగు', shortLabel: 'TE' },
  { value: 'tr', label: 'Turkish', nativeLabel: 'Türkçe', shortLabel: 'TR' },
  { value: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்', shortLabel: 'TA' },
  { value: 'vi', label: 'Vietnamese', nativeLabel: 'Tiếng Việt', shortLabel: 'VI' },
  { value: 'it', label: 'Italian', nativeLabel: 'Italiano', shortLabel: 'IT' },
];
