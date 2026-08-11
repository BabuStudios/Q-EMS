export const locales = ["sv", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "sv"; // Swedish is the default (§4.6).

export const localeNames: Record<Locale, string> = {
  sv: "Svenska",
  en: "English",
};

export const LOCALE_COOKIE = "QEMS_LOCALE";
