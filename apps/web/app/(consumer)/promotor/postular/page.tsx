import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@urnight/ui';
import { ApplyPromoterForm } from '@/components/promoter/apply-promoter-form';
import { requireAccessToken } from '@/lib/auth-helpers';

export const metadata: Metadata = { title: 'Postular a promotor' };

/** Postulación pública (autenticada) a promotor. Reusa ApplyPromoterForm. */
export default async function ApplyPromoterPage() {
  // Requiere sesión: la postulación se asocia al usuario actual.
  await requireAccessToken('/promotor/postular');

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Conviértete en promotor</CardTitle>
          <CardDescription>
            Postula para vender entradas y ganar comisiones por tus referidos. Un local revisará tu
            solicitud.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ApplyPromoterForm />
        </CardContent>
      </Card>
    </div>
  );
}
