'use client';

import { PanelPageHeader } from '@/components/panels/panel-page-header';
import { AssignedEventsTable } from '@/components/promoter/assigned-events-table';
import { PromoterGate } from '@/components/promoter/promoter-gate';
import { ReferralLinkCard } from '@/components/promoter/referral-link-card';

/** Links y códigos del promotor: enlace de referido + códigos por evento. */
export default function PromoterLinksPage() {
  return (
    <div className="space-y-6">
      <PanelPageHeader
        title="Mis links"
        description="Tu enlace de referido y los códigos de cada evento asignado."
      />
      <PromoterGate>
        {(promoter) => (
          <div className="space-y-6">
            {promoter.referralLink ? <ReferralLinkCard link={promoter.referralLink} /> : null}
            <AssignedEventsTable />
          </div>
        )}
      </PromoterGate>
    </div>
  );
}
