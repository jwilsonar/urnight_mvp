"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@urnight/ui";

export const NAV_LINKS = [
  { href: "/", key: "home" },
  { href: "/events", key: "events" },
  { href: "/locals", key: "venues" },
  { href: "/categorias", key: "categories" },
] as const;

/** Navegación principal del sitio público (desktop). */
export function MainNav({ className }: { className?: string }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  return (
    <nav
      className={cn("flex items-center gap-1", className)}
      aria-label={t("mainAria")}
    >
      {NAV_LINKS.map((link) => {
        const active =
          pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-foreground",
              active ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {t(link.key)}
          </Link>
        );
      })}
    </nav>
  );
}
