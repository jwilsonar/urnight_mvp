'use client';

/* Pantalla del prototipo (09 · Verifica email). Vista demo: la verificación
   real por enlace requiere backend de emails aún no implementado. */

import { ArrowsClockwise, Check, EnvelopeSimple } from '@phosphor-icons/react';
import Link from 'next/link';
import { useState } from 'react';
import { Badge, Button } from '@urnight/ui';
import { AuthShell } from '@/components/auth/auth-shell';

export default function VerifyEmailPage() {
  const [resent, setResent] = useState(false);

  return (
    <AuthShell>
      <div className="text-center">
        <div className="mx-auto mb-6 flex size-[110px] items-center justify-center rounded-[32px] border border-accent-border bg-accent shadow-glow-lg">
          <EnvelopeSimple className="size-12 text-lavender" weight="duotone" />
        </div>
        <h1 className="font-heading text-4xl font-extrabold tracking-tight">Verifica tu correo</h1>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          Te enviamos un enlace a tu correo.
          <br />
          Confírmalo para activar tu cuenta.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground">¿No te llegó el correo?</p>
          {resent ? (
            <span className="flex items-center gap-2 text-sm font-semibold text-success">
              <Check className="size-4" /> Enlace reenviado
            </span>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setResent(true)}>
              <ArrowsClockwise className="size-4" /> Reenviar enlace
            </Button>
          )}
          <Badge variant="info">Demo — la verificación real llega con el backend de emails</Badge>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Ir al inicio de sesión</Link>
          </Button>
        </div>
      </div>
    </AuthShell>
  );
}
