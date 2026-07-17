import type { Metadata } from 'next';
import { Badge } from '@urnight/ui';
import { PoliticaLocalForm } from '@/components/admin/politica-local-form';
import { PanelPageHeader } from '@/components/panels/panel-page-header';

export const metadata: Metadata = {
  title: 'Política del local — Administración',
};

export default function AdminPoliticaPage() {
  return (
    <div className="space-y-6">
      <PanelPageHeader
        title="Política del local"
        description="Cómo trabaja tu local: reservas, puerta y promotores."
      >
        <Badge variant="info">Demo — configuración local</Badge>
      </PanelPageHeader>
      <PoliticaLocalForm localSlug="nocturna-club" />
    </div>
  );
}
