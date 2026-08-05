'use client';

import type { PromoterStatusValue } from '@urnight/contracts';
import { PanelPageHeader } from '@/components/panels/panel-page-header';
import { PersonalizableReferralLinkCard } from '@/components/promoter/personalizable-referral-link-card';
import { PromoterGate } from '@/components/promoter/promoter-gate';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@urnight/ui';
import { formatDateOnly } from '@/lib/utils';

/** Etiquetas es-PE del estado de promotor (evita mostrar el enum crudo en inglés). */
const PROMOTER_STATUS_LABEL: Record<PromoterStatusValue, string> = {
  pending: 'Pendiente',
  active: 'Activo',
  inactive: 'Inactivo',
  suspended: 'Suspendido',
};

/** Perfil del promotor: datos básicos + enlace de referido. */
export default function PromoterProfilePage() {
  return (
    <div className="space-y-6">
      <PanelPageHeader title="Mi perfil" description="Tus datos como promotor." />
      <PromoterGate>
        {(promoter) => (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-xl">{promoter.name}</CardTitle>
                <CardDescription>Promotor</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Estado</span>
                  <Badge variant="secondary">
                    {PROMOTER_STATUS_LABEL[promoter.status] ?? promoter.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Desde</span>
                  <span className="font-medium">{formatDateOnly(promoter.createdAt)}</span>
                </div>
                {promoter.invitedEmail ? (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Correo de invitación</span>
                    <span className="font-medium">{promoter.invitedEmail}</span>
                  </div>
                ) : null}
              </CardContent>
            </Card>
            {promoter.referralLink ? (
              <PersonalizableReferralLinkCard
                promoterId={promoter.id}
                promoterName={promoter.name}
                link={promoter.referralLink}
                allowPersonalization
              />
            ) : null}
          </div>
        )}
      </PromoterGate>
    </div>
  );
}
