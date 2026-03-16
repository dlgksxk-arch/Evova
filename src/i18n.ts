import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { LANGUAGE_CODES, type LanguageCode } from './constants/languages';
import { resources } from './i18n-resources';

const SUPPORTED_LANGUAGES = new Set<LanguageCode>(LANGUAGE_CODES);

const detectLanguage = (): LanguageCode => {
  if (typeof window !== 'undefined') {
    const savedLanguage = window.localStorage.getItem('HAMDEVA-lang');
    if (savedLanguage && SUPPORTED_LANGUAGES.has(savedLanguage as LanguageCode)) {
      return savedLanguage as LanguageCode;
    }
  }

  if (typeof navigator !== 'undefined') {
    const browserLanguage = navigator.language.toLowerCase().split('-')[0];
    if (SUPPORTED_LANGUAGES.has(browserLanguage as LanguageCode)) {
      return browserLanguage as LanguageCode;
    }
  }

  return 'en';
};

void i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: detectLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
