import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthCard } from '@/components/auth/auth-card';
import { GoogleButton } from '@/components/auth/google-button';
import { RegisterForm } from '@/components/auth/register-form';
import { getSession } from '@/lib/auth-helpers';
import { isSafeInternalPath } from '@/lib/utils/paths';
import { roleHomePath } from '@/lib/utils/rbac';

export const metadata: Metadata = {
  title: 'Crear cuenta',
  description: 'Crea tu cuenta en UrNight. Solo para mayores de 18 años.',
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const safeCallback = isSafeInternalPath(callbackUrl) ? callbackUrl : undefined;

  const session = await getSession();
  if (session?.user) {
    redirect(safeCallback && safeCallback !== '/' ? safeCallback : roleHomePath(session.user.roles));
  }

  // Tras registrarse, /post-login resuelve el destino por rol (server-side).
  const target = safeCallback ? `/post-login?callbackUrl=${encodeURIComponent(safeCallback)}` : '/post-login';
  const loginHref = safeCallback ? `/login?callbackUrl=${encodeURIComponent(safeCallback)}` : '/login';
  const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

  return (
    <AuthCard
      title="Crea tu cuenta"
      description="Descubre la mejor vida nocturna del Perú."
      footer={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link className="font-medium text-primary hover:underline" href={loginHref}>
            Ingresar
          </Link>
        </>
      }
    >
      <RegisterForm callbackUrl={target} />
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
