'use client';

import { PanelPageHeader } from '@/components/panels/panel-page-header';
import { PromoterGate } from './promoter-gate';
import { PromoterKpis } from './promoter-kpis';

export function PromoterOverview() {
  return (
    <div className="space-y-6">
      <PanelPageHeader
        title="Resumen de promotor"
        description="Tus indicadores principales sin repetir las acciones de las otras vistas."
      />
      <PromoterGate>
        {(promoter) => (
          <PromoterKpis promoterId={promoter.id} referralLink={promoter.referralLink} />
        )}
      </PromoterGate>
    </div>
  );
}
