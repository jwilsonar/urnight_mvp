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
] as const;

export function AccountNav() {
  const t = useTranslations("account.nav");
  const pathname = usePathname();
  return (
    /* flex-wrap (no scroll): evita tabs cortados al borde como "Notificacio…" */
    <nav
      className="flex flex-wrap justify-center gap-1 border-b"
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
              "-mb-px shrink-0 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors",
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
