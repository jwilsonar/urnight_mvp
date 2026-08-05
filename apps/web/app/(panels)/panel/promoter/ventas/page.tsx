'use client';

import { PanelPageHeader } from '@/components/panels/panel-page-header';
import { PromoterGate } from '@/components/promoter/promoter-gate';
import { PromoterSalesWithRefresh } from '@/components/promoter/promoter-sales-with-refresh';

/** Ventas y comisiones atribuidas al promotor. */
export default function PromoterSalesPage() {
  return (
    <div className="space-y-6">
      <PanelPageHeader
        title="Ventas y comisiones"
        description="Compras atribuidas a tu promotor."
      />
      <PromoterGate>
        {(promoter) => <PromoterSalesWithRefresh promoterId={promoter.id} />}
      </PromoterGate>
    </div>
  );
}
