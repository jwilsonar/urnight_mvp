import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@urnight/ui';
import { AffiliateForm } from '@/components/affiliate/affiliate-form';

export const metadata: Metadata = {
  title: 'Afilia tu local',
  description: 'Suma tu discoteca o bar a UrNight y empieza a vender entradas.',
};

/** Solicitud pública de afiliación de un local a UrNight. */
export default function AfiliarPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Afilia tu local a UrNight</CardTitle>
          <CardDescription>
            Vende entradas, gestiona eventos y llega a más gente. Déjanos tus datos y te
            contactamos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AffiliateForm />
        </CardContent>
      </Card>
    </div>
  );
}
