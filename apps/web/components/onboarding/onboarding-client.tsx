'use client';

import { Sparkle } from '@phosphor-icons/react';
import { signOut, useSession } from 'next-auth/react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api/client';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Label,
} from '@urnight/ui';
import { getErrorMessage } from '@/lib/api/error-messages';
import { completeOnboarding, updatePreferences } from '@/lib/api/identity';
import { SESSION_EXPIRED } from '@/lib/constants';

interface OnboardingClientProps {
  callbackUrl: string;
  userName?: string;
}

/**
 * Onboarding mínimo: fija preferencias iniciales y marca el onboarding como
 * completado. Tras el POST, `update()` re-sincroniza el snapshot de perfil del
 * JWT (el callback jwt() solo re-consulta /auth/me en trigger 'update', no en una
 * navegación normal) y luego se hace un full reload para que el gate del servidor
 * (que redirige a /onboarding cuando `onboardingCompleted === false`) lea ya el
 * JWT nuevo en vez de rebotar con el antiguo.
 */
export function OnboardingClient({ callbackUrl, userName }: OnboardingClientProps) {
  const { data: session, update } = useSession();
  const [pending, startTransition] = useTransition();
  const [acceptsMarketing, setAcceptsMarketing] = useState(false);
  const [acceptsReminders, setAcceptsReminders] = useState(true);

  /** Sesión vencida a mitad del onboarding: relogin limpio con retorno aquí.
      Sin esto el usuario quedaba atrapado (el gate rebota a /onboarding con el
      JWT viejo y el POST falla 401 en loop). */
  function reLogin() {
    toast.error(`${SESSION_EXPIRED} Te llevamos a ingresar de nuevo.`);
    void signOut({ callbackUrl: `/login?callbackUrl=${encodeURIComponent('/onboarding')}` });
  }

  function finish() {
    const token = session?.accessToken;
    if (!token) {
      reLogin();
      return;
    }
    startTransition(async () => {
      try {
        await updatePreferences(
          { acceptsMarketing, acceptsReminders, preferredLocale: 'es-PE' },
          token,
        );
        await completeOnboarding(token);
        // Refresca el snapshot de perfil del JWT (onboardingCompleted=true) ANTES
        // de navegar.
        await update();
        toast.success('¡Listo! Tu cuenta está configurada.');
        // Navegación DURA, no router.replace: una nav soft de Next sirve el RSC
        // del destino con la cookie de sesión aún sin propagar, así el gate del
        // servidor lee el JWT viejo (onboardingCompleted=false) y rebota a
        // /onboarding. El full reload garantiza una request fresca con la cookie
        // ya actualizada.
        window.location.assign(callbackUrl);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          reLogin();
          return;
        }
        toast.error(getErrorMessage(error));
      }
    });
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-10">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkle className="h-6 w-6 text-primary" weight="duotone" />
            <CardTitle className="font-heading text-2xl">
              {userName ? `¡Bienvenido, ${userName}!` : '¡Bienvenido a UrNight!'}
            </CardTitle>
          </div>
          <CardDescription>
            Configura tus preferencias para terminar. Podrás cambiarlas luego desde tu cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="reminders"
                checked={acceptsReminders}
                onCheckedChange={(value) => setAcceptsReminders(value === true)}
              />
              <div className="space-y-1">
                <Label htmlFor="reminders">Recordatorios de eventos</Label>
                <p className="text-sm text-muted-foreground">
                  Te avisamos antes de los eventos para los que tengas entradas.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="marketing"
                checked={acceptsMarketing}
                onCheckedChange={(value) => setAcceptsMarketing(value === true)}
              />
              <div className="space-y-1">
                <Label htmlFor="marketing">Novedades y promociones</Label>
                <p className="text-sm text-muted-foreground">
                  Recibe ofertas y recomendaciones de vida nocturna.
                </p>
              </div>
            </div>
          </div>

          <Button className="w-full" size="lg" onClick={finish} disabled={pending}>
            {pending ? 'Configurando…' : 'Empezar a explorar'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
