export const locales = ["es", "en"] as const;

export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "es";

export function isAppLocale(value: string | undefined): value is AppLocale {
  return locales.includes(value as AppLocale);
}

/**
 * Locale REGIONAL usado para formatear moneda (S/ PEN), fechas y números.
 * El idioma de la UI es 'es'/'en'; el formateo debe ser peruano/US, así que
 * next-intl recibe la variante regional (si no, PEN sale como "25,00 PEN"
 * en vez de "S/ 25.00").
 */
export const regionalLocale: Record<AppLocale, string> = {
  es: 'es-PE',
  en: 'en-US',
};

/** Deriva el idioma base ('es'/'en') desde un locale que puede venir regional. */
export function toBaseLocale(value: string | undefined): AppLocale {
  return value?.startsWith('en') ? 'en' : 'es';
}
