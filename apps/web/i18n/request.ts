import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isAppLocale, regionalLocale } from "@/lib/i18n/config";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const requestedLocale = cookieStore.get("NEXT_LOCALE")?.value;
  const base = isAppLocale(requestedLocale) ? requestedLocale : defaultLocale;
  const messages =
    base === "en"
      ? (await import("../messages/en.json")).default
      : (await import("../messages/es.json")).default;

  return {
    // El idioma de la UI es `base` ('es'/'en'), pero next-intl formatea
    // moneda/fecha/número con este `locale`: usamos la variante regional
    // ('es-PE'/'en-US') para que PEN salga "S/ 25.00" y no "25,00 PEN".
    locale: regionalLocale[base],
    messages,
    timeZone: "America/Lima",
  };
});
