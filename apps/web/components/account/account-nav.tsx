"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@urnight/ui";

const LINKS = [
  { href: "/account", key: "profile" },
  { href: "/account/tickets", key: "tickets" },
  { href: "/account/guardados", key: "saved" },
  { href: "/account/reservas", key: "reservations" },
  { href: "/account/wallet", key: "wallet" },
  { href: "/account/niveles", key: "levels" },
  { href: "/account/puntos", key: "points" },
  { href: "/account/referidos", key: "referrals" },
  { href: "/account/notificaciones", key: "notifications" },
  { href: "/account/invitaciones", key: "invitations" },
  { href: "/account/amigos", key: "friends" },
  { href: "/account/apariencia", key: "appearance" },
] as const;

export function AccountNav() {
  const t = useTranslations("account.nav");
  const pathname = usePathname();
  return (
    /* flex-wrap (no scroll): evita tabs cortados al borde como "Notificacio…" */
    <nav
      className="grid grid-cols-4 gap-1 border-b sm:flex sm:flex-wrap sm:justify-center"
      aria-label={t("aria")}
    >
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              /* En móvil el texto puede envolver: con `whitespace-nowrap` la
                 etiqueta más larga ("Notificaciones") se sale de la celda de
                 ~75px a 360px y pisa las pestañas vecinas. Desde `sm` la
                 pestaña mide 144px y ahí sí cabe en una línea. */
              "-mb-px flex w-full min-w-0 items-center justify-center border-b-2 px-0.5 py-2 text-center text-[11px] font-medium leading-tight tracking-tight transition-colors sm:w-36 sm:shrink-0 sm:whitespace-nowrap sm:px-3 sm:text-sm sm:leading-normal sm:tracking-normal",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t(link.key)}
          </Link>
        );
      })}
    </nav>
  );
}
