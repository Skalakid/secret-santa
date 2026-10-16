import { createInstance } from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import en from "./locales/en/translation.json" with { type: "json" };
import pl from "./locales/pl/translation.json" with { type: "json" };

export const resources = {
  en: { translation: en },
  pl: { translation: pl },
};
export const supportedLanguages = Object.keys(resources);

// Create an isolated instance for each app root (also usable in tests).
// Bundled resources initialize synchronously, without network requests or a
// flash of translation keys. i18next owns language state and persistence.
export function createAppI18n() {
  const instance = createInstance();
  const detector = new LanguageDetector();
  // Storage can become unavailable after the detector's initial support check
  // (e.g. a browser privacy setting). Keep language switching usable then too.
  for (const method of ["lookup", "cacheUserLanguage"]) {
    const original = detector.detectors.localStorage[method];
    detector.detectors.localStorage[method] = (...args) => {
      try {
        return original(...args);
      } catch {
        return undefined;
      }
    };
  }
  instance.use(detector).use(initReactI18next).init({
    resources,
    supportedLngs: supportedLanguages,
    fallbackLng: "en",
    load: "languageOnly",
    cleanCode: true,
    initAsync: false,
    interpolation: { escapeValue: false }, // React escapes text nodes.
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "merry-language",
      caches: ["localStorage"],
    },
    react: {
      useSuspense: false,
      transKeepBasicHtmlNodesFor: ["br", "em"],
    },
  });
  return instance;
}
