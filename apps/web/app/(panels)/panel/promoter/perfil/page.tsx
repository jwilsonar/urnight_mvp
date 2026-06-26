'use client';

import { PanelPageHeader } from '@/components/panels/panel-page-header';
import { PromoterGate } from '@/components/promoter/promoter-gate';
import { ReferralLinkCard } from '@/components/promoter/referral-link-card';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@urnight/ui';

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
                  <Badge variant="secondary">{promoter.status}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Desde</span>
                  <span className="font-medium">
                    {new Date(promoter.createdAt).toLocaleDateString('es-PE')}
                  </span>
                </div>
                {promoter.invitedEmail ? (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Correo de invitación</span>
                    <span className="font-medium">{promoter.invitedEmail}</span>
                  </div>
                ) : null}
              </CardContent>
            </Card>
            {promoter.referralLink ? <ReferralLinkCard link={promoter.referralLink} /> : null}
          </div>
        )}
      </PromoterGate>
    </div>
  );
}
