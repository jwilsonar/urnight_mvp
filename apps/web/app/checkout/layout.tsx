import { Lock } from "@phosphor-icons/react/dist/ssr";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export default async function CheckoutLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [locale, messages, t] = await Promise.all([
    getLocale(),
    getMessages(),
    getTranslations("checkout"),
  ]);
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div
        lang={locale === "es" ? "es-PE" : "en"}
        className="flex min-h-dvh flex-col bg-muted/30"
      >
        {/* Mismo ancho que el header del home (max-w-7xl), para que el logo
            arranque a la izquierda en vez de flotar centrado, y con el
            selector de tema: había sitio de sobra y su ausencia obligaba a
            salir del checkout para cambiarlo. */}
        <header className="border-b bg-background">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Logo ariaLabel={t("homeAria")} />
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Lock className="h-4 w-4" /> {t("securePayment")}
              </span>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </NextIntlClientProvider>
  );
}
