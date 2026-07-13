import type { Metadata } from 'next';
import { Badge, Card } from '@urnight/ui';
import { ReclamacionesInbox } from '@/components/superadmin/reclamaciones-inbox';
import { RECLAMACIONES_DEMO } from '@/lib/mock/reclamaciones';

export const metadata: Metadata = {
  title: 'Reclamaciones',
  description: 'Bandeja del Libro de Reclamaciones digital.',
};

/*
 * Demo frontend-only: contraparte de gestión del formulario público
 * /reclamaciones. Con backend real (módulo trust/ops) la bandeja consume la
 * cola de reclamos con SLA y las acciones notifican al usuario y al local.
 */

export default function SuperAdminReclamacionesPage() {
  const nuevas = RECLAMACIONES_DEMO.filter((r) => r.estado === 'nueva').length;
  const enRevision = RECLAMACIONES_DEMO.filter((r) => r.estado === 'en_revision').length;
  const resueltas = RECLAMACIONES_DEMO.filter((r) => r.estado === 'resuelta').length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Reclamaciones</h1>
          <p className="text-muted-foreground">
            Bandeja del Libro de Reclamaciones: revisa y resuelve los reclamos de asistentes.
          </p>
        </div>
        <Badge variant="info">Demo — llega con el backend de trust/ops</Badge>
      </div>

      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Nuevas', value: nuevas },
          { label: 'En revisión', value: enRevision },
          { label: 'Resueltas', value: resueltas },
          { label: 'Tiempo medio de cierre', value: '3.2 días' },
        ].map((kpi) => (
          <Card key={kpi.label} className="p-4">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">{kpi.label}</dt>
            <dd className="mt-1 font-heading text-2xl font-bold tabular-nums">{kpi.value}</dd>
          </Card>
        ))}
      </dl>

      <ReclamacionesInbox />
    </div>
  );
}
