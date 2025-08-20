// src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ar from './locales/ar.json';

i18n
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, ar: { translation: ar } },
    lng: 'en',            // start in English
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

i18n.on('languageChanged', (lng) => {
  const isAr = (lng || '').startsWith('ar');
  document.documentElement.dir = isAr ? 'rtl' : 'ltr';
  document.documentElement.lang = lng || 'en';
});

export default i18n;
