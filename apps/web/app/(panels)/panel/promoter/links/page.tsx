'use client';

import { PanelPageHeader } from '@/components/panels/panel-page-header';
import { AssignedEventsTable } from '@/components/promoter/assigned-events-table';
import { LinkInvitadosCard } from '@/components/promoter/link-invitados-card';
import { PersonalizableReferralLinkCard } from '@/components/promoter/personalizable-referral-link-card';
import { PromoterGate } from '@/components/promoter/promoter-gate';

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
            {promoter.referralLink ? (
              <PersonalizableReferralLinkCard
                promoterId={promoter.id}
                promoterName={promoter.name}
                link={promoter.referralLink}
              />
            ) : null}
            <div className="[&_button]:text-foreground [&_button_svg]:text-foreground">
              <LinkInvitadosCard />
            </div>
            <AssignedEventsTable />
          </div>
        )}
      </PromoterGate>
    </div>
  );
}
