import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ConditionalFooter } from "@/components/shared/conditional-footer";
import { SiteHeader } from "@/components/shared/site-header";

/** Zona consumidor (público + autenticado): cabecera, contenido y pie. */
export default async function ConsumerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div
        lang={locale === "es" ? "es-PE" : "en"}
        className="flex min-h-dvh flex-col"
        data-area="consumer"
      >
        <SiteHeader />
        <main className="flex-1">{children}</main>
        {/* Pie completo en descubrimiento, slim en flujos transaccionales. */}
        <ConditionalFooter />
      </div>
    </NextIntlClientProvider>
  );
}
