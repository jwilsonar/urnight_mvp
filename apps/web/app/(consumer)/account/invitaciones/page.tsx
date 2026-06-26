import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@urnight/ui';
import { PromoterInvitations } from '@/components/account/promoter-invitations';

export const metadata: Metadata = { title: 'Invitaciones de promotor' };

export default function AccountInvitationsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Invitaciones de promotor</CardTitle>
        <CardDescription>
          Solicitudes de empresas para que seas su promotor. Acéptalas para activar tu enlace de
          referido y tu panel de promotor.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PromoterInvitations />
      </CardContent>
    </Card>
  );
}
