import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";

import { DEFAULT_LOCALE } from "@/src/i18n/config";
import budget from "@/src/i18n/resources/es-AR/budget";
import common from "@/src/i18n/resources/es-AR/common";
import home from "@/src/i18n/resources/es-AR/home";
import settings from "@/src/i18n/resources/es-AR/settings";
import transactions from "@/src/i18n/resources/es-AR/transactions";
import wallets from "@/src/i18n/resources/es-AR/wallets";

const resources = {
  "es-AR": {
    budget,
    common,
    home,
    settings,
    transactions,
    wallets,
  },
} as const;

const i18n = createInstance();

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    lng: DEFAULT_LOCALE,
    fallbackLng: DEFAULT_LOCALE,
    defaultNS: "common",
    ns: ["common", "home", "wallets", "transactions", "settings", "budget"],
    resources,
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
  });
}

export default i18n;
