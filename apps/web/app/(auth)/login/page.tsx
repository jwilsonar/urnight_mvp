import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Alert, AlertDescription } from '@urnight/ui';
import { AuthCard } from '@/components/auth/auth-card';
import { GoogleButton } from '@/components/auth/google-button';
import { LoginForm } from '@/components/auth/login-form';
import { getSession } from '@/lib/auth-helpers';
import { SESSION_EXPIRED } from '@/lib/constants';
import { isSafeInternalPath } from '@/lib/utils/paths';
import { roleHomePath } from '@/lib/utils/rbac';

export const metadata: Metadata = {
  title: 'Ingresar',
  description: 'Ingresa a tu cuenta de UrNight.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;
  const safeCallback = isSafeInternalPath(callbackUrl) ? callbackUrl : undefined;
  const sessionExpired = error === 'SessionExpired';

  // Si ya hay sesión, manda a cada rol a su panel (o respeta el deep-link).
  const session = await getSession();
  if (session?.user) {
    redirect(safeCallback && safeCallback !== '/' ? safeCallback : roleHomePath(session.user.roles));
  }

  // Tras autenticar, /post-login resuelve el destino por rol (server-side).
  const target = safeCallback ? `/post-login?callbackUrl=${encodeURIComponent(safeCallback)}` : '/post-login';
  const registerHref = safeCallback ? `/register?callbackUrl=${encodeURIComponent(safeCallback)}` : '/register';
  const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

  return (
    <AuthCard
      title="Bienvenido de vuelta"
      description="Ingresa para comprar entradas y guardar tus favoritos."
      footer={
        <>
          ¿No tienes cuenta?{' '}
          <Link className="font-medium text-primary hover:underline" href={registerHref}>
            Crear cuenta
          </Link>
        </>
      }
    >
      {sessionExpired ? (
        <Alert variant="destructive">
          <AlertDescription>{SESSION_EXPIRED}</AlertDescription>
        </Alert>
      ) : null}
      <LoginForm callbackUrl={target} />
      {googleEnabled ? (
        <>
          <div className="flex items-center gap-3 text-xs uppercase text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            o
            <span className="h-px flex-1 bg-border" />
          </div>
          <GoogleButton callbackUrl={target} />
        </>
      ) : null}
    </AuthCard>
  );
}
