import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ruRes from './locales/ru.json';
import tkRes from './locales/tk.json';

i18n
  .use(LanguageDetector) // Автоматически определяет язык браузера
  .use(initReactI18next)
  .init({
    resources: {
      ru: { translation: ruRes },
      tk: { translation: tkRes }
    },
    fallbackLng: 'ru', // Если перевода нет, покажет русский
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;