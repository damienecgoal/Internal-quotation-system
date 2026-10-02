import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { en } from "./locales/en";
import { zhHant } from "./locales/zh-Hant";

const stored = localStorage.getItem("quotation-lang");
const language = stored === "zh-Hant" || stored === "en" ? stored : "en";

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    "zh-Hant": { translation: zhHant },
  },
  lng: language,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

function applyDocumentLanguage(value: string) {
  document.documentElement.lang = value === "zh-Hant" ? "zh-Hant" : "en";
  localStorage.setItem("quotation-lang", value);
}

applyDocumentLanguage(language);
i18n.on("languageChanged", applyDocumentLanguage);

export default i18n;
