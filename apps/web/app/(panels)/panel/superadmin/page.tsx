import {
  Gear,
  Lifebuoy,
  Scales,
  BellRinging,
  SealCheck,
  ClipboardText,
  Buildings,
  Tag,
} from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import Link from 'next/link';
import type { ComponentType } from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from '@urnight/ui';

export const metadata: Metadata = { title: 'Operaciones de plataforma' };

interface SectionEntry {
  href: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string; weight?: 'duotone' }>;
}

const SECTIONS: SectionEntry[] = [
  {
    href: '/panel/superadmin/settings',
    title: 'Configuración',
    description: 'Lee y actualiza ajustes de plataforma por clave.',
    icon: Gear,
  },
  {
    href: '/panel/superadmin/support',
    title: 'Soporte',
    description: 'Gestiona el estado de los tickets de soporte interno.',
    icon: Lifebuoy,
  },
  {
    href: '/panel/superadmin/legal',
    title: 'Legal',
    description: 'Publica versiones de términos, privacidad y reembolsos.',
    icon: Scales,
  },
  {
    href: '/panel/superadmin/notifications',
    title: 'Notificaciones',
    description: 'Revisa las notificaciones enviadas a tu cuenta.',
    icon: BellRinging,
  },
  {
    href: '/panel/superadmin/reviews',
    title: 'Revisiones',
    description: 'Aprueba u observa verificaciones de local por ID.',
    icon: SealCheck,
  },
  {
    href: '/panel/superadmin/audit',
    title: 'Auditoría y logs',
    description: 'Registro de acciones sensibles en la plataforma.',
    icon: ClipboardText,
  },
  {
    href: '/panel/superadmin/companies',
    title: 'Empresas',
    description: 'Lista, suspende y activa empresas de la plataforma.',
    icon: Buildings,
  },
  {
    href: '/panel/superadmin/taxonomy',
    title: 'Taxonomía',
    description: 'Administra zonas, géneros musicales y etiquetas.',
    icon: Tag,
  },
];

export default function SuperAdminHomePage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">Operaciones de plataforma</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Herramientas de super administrador para configurar la plataforma, atender soporte y
          mantener los documentos legales al día.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Card className="h-full transition-colors hover:border-primary">
                <CardHeader>
                  <Icon className="h-8 w-8 text-primary" weight="duotone" />
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
