import type { ReactNode } from 'react';
import { ConditionalFooter } from '@/components/shared/conditional-footer';
import { SiteHeader } from '@/components/shared/site-header';

/** Zona consumidor (público + autenticado): cabecera, contenido y pie. */
export default function ConsumerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col" data-area="consumer">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      {/* Pie completo en descubrimiento, slim en flujos transaccionales. */}
      <ConditionalFooter />
    </div>
  );
}
