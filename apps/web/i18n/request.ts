import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isAppLocale } from "@/lib/i18n/config";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const requestedLocale = cookieStore.get("NEXT_LOCALE")?.value;
  const locale = isAppLocale(requestedLocale) ? requestedLocale : defaultLocale;
  const messages =
    locale === "en"
      ? (await import("../messages/en.json")).default
      : (await import("../messages/es.json")).default;

  return {
    locale,
    messages,
    timeZone: "America/Lima",
  };
});
