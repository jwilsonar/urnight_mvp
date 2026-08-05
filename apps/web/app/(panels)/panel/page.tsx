import { Buildings, Megaphone, QrCode, ShieldStar } from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ComponentType } from 'react';
import type { RoleCode } from '@urnight/contracts';
import { Card, CardDescription, CardHeader, CardTitle } from '@urnight/ui';
import { getSession } from '@/lib/auth-helpers';
import { hasRole } from '@/lib/utils/rbac';

export const metadata: Metadata = { title: 'Panel' };

interface PanelEntry {
  role: RoleCode;
  href: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string; weight?: 'duotone' }>;
}

const PANELS: PanelEntry[] = [
  { role: 'super_admin', href: '/panel/superadmin', title: 'Super administrador', description: 'Operaciones de la plataforma.', icon: ShieldStar },
  { role: 'admin_local', href: '/panel/admin', title: 'Administración local', description: 'Gestiona tu local, eventos y entradas.', icon: Buildings },
  { role: 'promoter', href: '/panel/promoter', title: 'Promotor', description: 'Tus enlaces, códigos y comisiones.', icon: Megaphone },
  { role: 'validator', href: '/panel/validator', title: 'Validador', description: 'Escaneo de entradas en puerta.', icon: QrCode },
];

export default async function PanelHomePage() {
  const session = await getSession();
  const roles = session?.user?.roles;
  const available = PANELS.filter((panel) => hasRole(roles, panel.role));

  // Con un único panel, no mostramos el selector: vamos directo a él.
  const only = available.length === 1 ? available[0] : undefined;
  if (only) {
    redirect(only.href);
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Tus paneles</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {available.map((panel) => {
          const Icon = panel.icon;
          return (
            <Link key={panel.href} href={panel.href} className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Card className="h-full transition-colors hover:border-[var(--accent-border-subtle)] hover:bg-[var(--accent-soft-faint)]">
                <CardHeader>
                  <Icon className="h-8 w-8 text-primary" weight="duotone" />
                  <CardTitle className="text-lg">{panel.title}</CardTitle>
                  <CardDescription>{panel.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
