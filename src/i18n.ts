import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { resources } from './i18n-resources';
import { isAppSupportedLanguageCode, type LanguageCode } from './constants/languages';

const detectLanguage = (): LanguageCode => {
  if (typeof window !== 'undefined') {
    const savedLanguage = window.localStorage.getItem('HAMDEVA-lang');
    if (isAppSupportedLanguageCode(savedLanguage)) {
      return savedLanguage as LanguageCode;
    }
  }

  if (typeof navigator !== 'undefined') {
    const browserLanguage = navigator.language.toLowerCase().split('-')[0];
    if (isAppSupportedLanguageCode(browserLanguage)) {
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
