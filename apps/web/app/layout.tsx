import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return {
    title: { default: t("title"), template: "%s · RAVENUE" },
    description: t("description"),
  };
}

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Locale y mensajes viven en la raíz para que auth, consumer, panels,
  // checkout y onboarding compartan la misma cookie NEXT_LOCALE.
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);
  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-dvh bg-root font-sans text-foreground antialiased">
        {/*
         * SessionProvider raíz SIN session: las páginas consumer (ISR,
         * revalidate) deben seguir siendo estáticas, así que la sesión se
         * resuelve en cliente. El subárbol de paneles re-hidrata con la sesión
         * del servidor en (panels)/layout.tsx para no depender de ese fetch.
         */}
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
