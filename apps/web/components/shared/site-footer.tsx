"use client";

import {
  FacebookLogo,
  InstagramLogo,
  TiktokLogo,
  XLogo,
  YoutubeLogo,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@urnight/ui";
import { ClearCookiesButton } from "./clear-cookies-button";
import { LocaleSwitcher } from "./locale-switcher";
import { Logo } from "./logo";

/* Redes aún sin perfiles publicados: iconos visibles pero sin navegación. */
const REDES = [
  { icon: FacebookLogo, label: "Facebook" },
  { icon: InstagramLogo, label: "Instagram" },
  { icon: XLogo, label: "X" },
  { icon: TiktokLogo, label: "TikTok" },
  { icon: YoutubeLogo, label: "YouTube" },
] as const;

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="rv-eyebrow mb-4">{title}</p>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Pie del sitio público — estructura del prototipo (Conócenos / Legales /
 * Síguenos / Ayuda).
 *
 * `variant`:
 * - `full` (default): en pantallas de descubrimiento (home, /events, /locals,
 *   detalle, FAQ, nosotros) donde el pie es navegación útil.
 * - `slim`: en flujos transaccionales (reserva, carta in-venue) donde el pie
 *   grande solo mete scroll; se conserva SOLO la barra legal obligatoria
 *   (Libro de Reclamaciones + copyright). Igual que Joinnus/Teleticket, que no
 *   repiten el pie completo dentro del flujo de compra.
 */
export function SiteFooter({
  variant = "full",
}: {
  variant?: "full" | "slim";
}) {
  const t = useTranslations("footer");
  const aboutLinks = [
    { href: "/nosotros", label: t("about.us") },
    { href: "/faq", label: t("about.faq") },
    { href: "/afiliar", label: t("about.affiliate") },
  ];
  const legalLinks = [
    { href: "/legal/terms", label: t("legal.terms") },
    { href: "/legal/privacy", label: t("legal.privacy") },
    { href: "/legal/cookies", label: t("legal.cookies") },
    { href: "/legal/beneficiario", label: t("legal.beneficiary") },
    { href: "/legal/clausulas", label: t("legal.additionalUses") },
  ];

  if (variant === "slim") {
    return (
      <footer className="border-t bg-deep">
        <FooterBottomBar />
      </footer>
    );
  }

  return (
    <footer className="border-t bg-deep">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_0.9fr_1.3fr] lg:px-8">
        {/* Marca + tagline */}
        <div className="space-y-4">
          <Logo ariaLabel={t("homeAria")} />
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            {t("tagline")}
          </p>
        </div>

        <FooterColumn title={t("about.title")} links={aboutLinks} />
        <FooterColumn title={t("legal.title")} links={legalLinks} />

        {/* Síguenos + Ayuda */}
        <div className="space-y-6">
          <div>
            <p className="rv-eyebrow mb-4">{t("follow")}</p>
            <div className="flex flex-wrap items-center gap-2">
              {REDES.map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  title={t("comingSoonTitle", { network: label })}
                  aria-label={t("comingSoonAria", { network: label })}
                  className="flex size-10 cursor-default items-center justify-center rounded-sm border bg-field text-muted-foreground transition-colors hover:border-accent-border hover:text-foreground"
                >
                  <Icon className="size-4.5" weight="fill" />
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="rv-eyebrow mb-4">{t("help")}</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" asChild>
                <Link href="/contacto">{t("contact")}</Link>
              </Button>
              <ClearCookiesButton />
            </div>
          </div>
        </div>
      </div>

      <FooterBottomBar />
    </footer>
  );
}

/** Barra inferior legal (obligatoria): Libro de Reclamaciones + copyright.
    Se muestra en ambas variantes del pie. */
function FooterBottomBar() {
  const t = useTranslations("footer");

  return (
    <div className="border-t">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-4 px-4 py-5 sm:px-6 md:grid-cols-[minmax(0,1fr)_10rem_minmax(0,1fr)] lg:px-8">
        <Link
          href="/reclamaciones"
          className="inline-flex items-center justify-self-center gap-2 rounded-sm bg-white px-4 py-2 text-sm font-bold text-neutral-900 transition-opacity hover:opacity-90 md:justify-self-start"
          data-footer-complaints
        >
          📖 {t("complaintsBook")}
        </Link>
        <div className="justify-self-center" data-footer-locale>
          <LocaleSwitcher id="footer-language" />
        </div>
        <p
          className="justify-self-center text-center text-xs text-muted-foreground md:justify-self-end md:text-right"
          data-footer-copyright
        >
          {t("copyright", { year: new Date().getFullYear() })}
        </p>
      </div>
    </div>
  );
}
