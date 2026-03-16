import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { resources, type SupportedLanguage } from './i18n-resources';

const SUPPORTED_LANGUAGES = new Set<SupportedLanguage>(['en', 'ko', 'ja', 'zh']);

const detectLanguage = (): SupportedLanguage => {
  if (typeof window !== 'undefined') {
    const savedLanguage = window.localStorage.getItem('HAMDEVA-lang');
    if (savedLanguage && SUPPORTED_LANGUAGES.has(savedLanguage as SupportedLanguage)) {
      return savedLanguage as SupportedLanguage;
    }
  }

  if (typeof navigator !== 'undefined') {
    const browserLanguage = navigator.language.toLowerCase().split('-')[0];
    if (SUPPORTED_LANGUAGES.has(browserLanguage as SupportedLanguage)) {
      return browserLanguage as SupportedLanguage;
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
