import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ar from './locales/ar.json';

i18n
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, ar: { translation: ar } },
    lng: localStorage.getItem('i18nextLng') || 'en', 
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

i18n.on('languageChanged', (lng) => {
  try {
    if (lng) localStorage.setItem('i18nextLng', lng);
  } catch (e) {
    
  }
  const isAr = (lng || '').startsWith('ar');
  document.documentElement.dir = isAr ? 'rtl' : 'ltr';
  document.documentElement.lang = lng || 'en';
});


{
  const initial = i18n.language || localStorage.getItem('i18nextLng') || 'en';
  document.documentElement.dir = initial.startsWith('ar') ? 'rtl' : 'ltr';
  document.documentElement.lang = initial;
}

export default i18n;
