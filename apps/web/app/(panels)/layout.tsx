import { SessionProvider } from 'next-auth/react';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import type { ReactNode } from 'react';
import { PanelShell } from '@/components/panels/panel-shell';
import { requireRole } from '@/lib/auth-helpers';
import { PANEL_ROLES } from '@/lib/utils/rbac';

/**
 * Paneles por rol (admin_local, promoter, validator, super_admin). Gate
 * server-side: exige sesión + rol de panel. El backend revalida permisos en cada
 * endpoint. El chrome (navbar + sidebar) lo aporta PanelShell; cada sub-layout
 * solo refina el gate de rol específico.
 *
 * SessionProvider re-hidrata el subárbol con la sesión ya resuelta en servidor:
 * los componentes cliente de panel (tablas, modales) leen `accessToken` en el
 * primer render, así las queries de TanStack se habilitan de inmediato en vez de
 * quedar en skeleton esperando el fetch cliente de `/api/auth/session`.
 */
export default async function PanelsLayout({ children }: { children: ReactNode }) {
  const [session, locale, messages] = await Promise.all([
    requireRole(PANEL_ROLES, '/panel'),
    getLocale(),
    getMessages(),
  ]);
  const { name, email, image, roles, mfaPending } = session.user;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SessionProvider session={session}>
        <div className="min-h-dvh bg-muted/20" data-area="panels">
          <PanelShell user={{ name, email, image, roles, mfaPending }}>
            {children}
          </PanelShell>
        </div>
      </SessionProvider>
    </NextIntlClientProvider>
  );
}
