import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../locales/en.json';
import tr from '../locales/tr.json';

const STORAGE_KEY = 'propex_lang';

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    tr: { translation: tr },
  },
  lng: typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) || 'en' : 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', (lng) => {
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, lng);
});

export default i18n;
