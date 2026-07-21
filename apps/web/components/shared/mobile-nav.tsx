"use client";

import { List } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  Button,
  Separator,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@urnight/ui";
import { signOutAction } from "@/lib/auth-actions";
import {
  ROLE_PANEL_LABEL,
  canAccessPanels,
  primaryRole,
  roleHomePath,
} from "@/lib/utils/rbac";
import { cn } from "@urnight/ui";
import { NAV_LINKS } from "./main-nav";

/** Navegación móvil en un Sheet lateral. */
export function MobileNav() {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label={t("openMenu")}
        >
          <List className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle className="text-left">RAVENUE</SheetTitle>
        </SheetHeader>
        <nav className="mt-6 flex flex-col gap-1" aria-label={t("mobileAria")}>
          {NAV_LINKS.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground",
                )}
              >
                {t(link.key)}
              </Link>
            );
          })}
        </nav>
        {/* Sin sesión no se repiten Ingresar/Crear cuenta: ya están en el header. */}
        {session?.user ? (
          <div className="flex flex-col gap-1">
            <Separator className="mb-4" />
            {canAccessPanels(session.user.roles) ? (
              <Link
                href={roleHomePath(session.user.roles)}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
              >
                {ROLE_PANEL_LABEL[primaryRole(session.user.roles)]}
              </Link>
            ) : null}
            <Link
              href="/account/tickets"
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm hover:bg-accent"
            >
              {t("myTickets")}
            </Link>
            <Button
              variant="ghost"
              className="justify-start px-3"
              onClick={() => {
                setOpen(false);
                void signOutAction();
              }}
            >
              {t("signOut")}
            </Button>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
