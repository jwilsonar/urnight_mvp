import type { Metadata } from 'next';
import { Badge } from '@urnight/ui';
import { ReporteSemanal } from '@/components/admin/reporte-semanal';
import { PanelPageHeader } from '@/components/panels/panel-page-header';

export const metadata: Metadata = { title: 'Reporte semanal — Administración' };

export default function AdminReportePage() {
  return (
    <div className="space-y-6">
      <PanelPageHeader
        title="Reporte semanal"
        description="Resumen listo para la reunión con el equipo."
      >
        <Badge variant="info">Demo — datos simulados</Badge>
      </PanelPageHeader>

      <ReporteSemanal />
    </div>
  );
}
