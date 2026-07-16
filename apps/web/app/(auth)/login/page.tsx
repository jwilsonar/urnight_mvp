import { ArrowLeft } from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Alert, AlertDescription, Button } from '@urnight/ui';
import { AuthShell } from '@/components/auth/auth-shell';
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
    <AuthShell
      heroLabel="Auth · Night life"
      hero={
        <div>
          <p className="font-heading text-3xl font-extrabold leading-tight">
            Tu noche te está esperando.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-foreground/85">
            Entra y sigue donde lo dejaste: guardados, tickets y mucho más.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <span className="un-chip">🔥 320+ eventos</span>
            <span className="un-chip">⭐ 85 locales</span>
            <span className="un-chip">🎟️ Mesa + entrada</span>
          </div>
        </div>
      }
    >
      {/* Fila superior del prototipo: volver + CTA a registro */}
      <div className="mb-8 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:border-strong hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Volver
        </Link>
        <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
          <span className="hidden sm:inline">¿No tienes cuenta?</span>
          <Button size="sm" asChild>
            <Link href={registerHref}>Regístrate aquí</Link>
          </Button>
        </div>
      </div>

      <h1 className="font-heading text-3xl font-extrabold tracking-tight">
        ¡UrNight te da la bienvenida!
      </h1>
      <p className="mb-7 mt-1.5 text-muted-foreground">Ingresa a tu cuenta</p>

      <div className="space-y-4">
        {sessionExpired ? (
          <Alert variant="destructive">
            <AlertDescription>{SESSION_EXPIRED}</AlertDescription>
          </Alert>
        ) : null}
        <LoginForm callbackUrl={target} />
        <p className="text-right text-sm">
          <Link href="/recover" className="font-semibold text-lavender hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </p>
        {googleEnabled ? (
          <>
            <div className="flex items-center gap-3 text-xs uppercase text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              o continuar con
              <span className="h-px flex-1 bg-border" />
            </div>
            <GoogleButton callbackUrl={target} />
          </>
        ) : null}
      </div>
    </AuthShell>
  );
}
