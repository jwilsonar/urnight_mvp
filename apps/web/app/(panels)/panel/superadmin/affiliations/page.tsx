import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@urnight/ui';
import { PanelPageHeader } from '@/components/panels/panel-page-header';
import { ReviewAffiliationForm } from '@/components/superadmin/review-affiliation-form';

export const metadata: Metadata = { title: 'Afiliaciones' };

export default function SuperAdminAffiliationsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <PanelPageHeader
        title="Afiliaciones"
        description="Revisa solicitudes por su ID. Aprobar crea la empresa y su local; no hay listado de pendientes."
      />

      <Card className="p-0">
        <CardHeader className="p-5 pb-3">
          <CardTitle>Solicitud de afiliación</CardTitle>
          <CardDescription>Aprueba o rechaza una solicitud (POST /affiliation-requests/:id/review).</CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <ReviewAffiliationForm />
        </CardContent>
      </Card>
    </div>
  );
}
