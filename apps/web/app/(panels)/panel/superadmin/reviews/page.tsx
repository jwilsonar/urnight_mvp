import { Info } from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@urnight/ui';
import { ReviewVerificationForm } from '@/components/superadmin/review-verification-form';

export const metadata: Metadata = { title: 'Revisiones' };

export default function SuperAdminReviewsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">Revisiones</h1>
        <p className="text-sm text-muted-foreground">
          Revisa verificaciones de local por su ID. No existe un listado de pendientes, por lo que
          se opera por ID directo.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Verificación de local</CardTitle>
          <CardDescription>
            Aprueba, observa o expira una verificación (POST /local-verifications/:id/review).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReviewVerificationForm />
        </CardContent>
      </Card>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Postulaciones a promotor</AlertTitle>
        <AlertDescription>
          La revisión de postulaciones a promotor (POST /promoter-applications/:id/review) está
          reservada al rol <code>admin_local</code> en el backend, por lo que se gestiona desde el
          panel de administración local y no aquí.
        </AlertDescription>
      </Alert>
    </div>
  );
}
