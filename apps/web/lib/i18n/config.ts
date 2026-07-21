export const locales = ["es", "en"] as const;

export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "es";

export function isAppLocale(value: string | undefined): value is AppLocale {
  return locales.includes(value as AppLocale);
}
