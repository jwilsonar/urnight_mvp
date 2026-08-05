'use client';

import { ShieldWarning } from '@phosphor-icons/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { type ReactNode, useState } from 'react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@urnight/ui';
import { PanelNavbar } from './panel-navbar';
import { PanelSidebar } from './panel-sidebar';
import { sectionFromPath } from './nav-config';

interface PanelShellUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  roles?: readonly string[];
  mfaPending?: boolean;
}

/**
 * Shell unificado de los paneles: navbar superior + sidebar lateral (fija en
 * desktop, en Sheet en móvil) + contenido. La sección del sidebar se deriva del
 * path, de modo que un super_admin que navega a /panel/admin ve el sidebar de
 * admin. En el selector raíz (/panel) no se muestra sidebar.
 */
export function PanelShell({ user, children }: { user: PanelShellUser; children: ReactNode }) {
  const t = useTranslations('panelMfaEnrollment');
  const pathname = usePathname();
  const section = sectionFromPath(pathname);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-dvh">
      <PanelNavbar user={user} showMenu={Boolean(section)} onMenuClick={() => setMobileOpen(true)} />

      <div className="mx-auto flex w-full max-w-screen-2xl">
        {section ? (
          <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-60 shrink-0 overflow-hidden border-r bg-sidebar p-4 lg:flex">
            <PanelSidebar section={section} />
          </aside>
        ) : null}

        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
            {user.mfaPending ? (
              <Alert className="mb-6 border-accent-border bg-accent/60">
                <ShieldWarning aria-hidden="true" className="size-5 text-rose" />
                <AlertTitle>{t('title')}</AlertTitle>
                <AlertDescription className="space-y-3">
                  <p>{t('description')}</p>
                  <Button size="sm" asChild>
                    <Link href="/account/seguridad">{t('action')}</Link>
                  </Button>
                </AlertDescription>
              </Alert>
            ) : null}
            {children}
          </div>
        </main>
      </div>

      {section ? (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="flex h-dvh max-h-dvh w-72 flex-col overflow-hidden">
            <SheetHeader>
              <SheetTitle className="text-left">RAVENUE</SheetTitle>
            </SheetHeader>
            <div className="mt-6 min-h-0 flex-1">
              <PanelSidebar section={section} onNavigate={() => setMobileOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      ) : null}
    </div>
  );
}
