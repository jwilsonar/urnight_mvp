import type { Metadata } from 'next';
import { Badge } from '@urnight/ui';
import { FidelizacionConfigurator } from '@/components/superadmin/fidelizacion-configurator';

export const metadata: Metadata = {
  title: 'Fidelización',
  description: 'Configuración del programa de niveles, puntos e insignias.',
};

/*
 * Demo frontend-only. El estado vive en los editores hasta que el backend de
 * fidelización implemente el contrato descrito en docs/fidelizacion-spec.md.
 */
export default function SuperAdminFidelizacionPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <header className="space-y-1">
          <h1 className="font-heading text-2xl font-bold tracking-tight">Fidelización</h1>
          <p className="text-sm text-muted-foreground">
            Configura las insignias, los puntos y los niveles del programa RAVENUE.
          </p>
        </header>
        <Badge variant="info">Demo · persistencia local de la vista</Badge>
      </div>

      <FidelizacionConfigurator />
    </div>
  );
}
