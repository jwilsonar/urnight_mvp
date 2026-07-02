'use client';

/* Pantalla del prototipo (11 · Recuperar contraseña). Vista demo: el envío
   real del enlace requiere backend de recuperación aún no implementado. */

import { ArrowLeft, EnvelopeSimple } from '@phosphor-icons/react';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { Badge, Button, Input, Label } from '@urnight/ui';
import { AuthShell } from '@/components/auth/auth-shell';

export default function RecoverPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (email.trim()) setSent(true);
  }

  return (
    <AuthShell
      heroLabel="Recover · Night"
      hero={
        <div>
          <p className="font-heading text-3xl font-extrabold leading-tight">
            Recupera tu acceso en 2 minutos.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Ingresa el correo con el que te registraste y te enviaremos las instrucciones.
          </p>
        </div>
      }
    >
      {sent ? (
        <div className="text-center">
          <div className="mx-auto mb-6 flex size-24 items-center justify-center rounded-2xl border border-accent-border bg-accent shadow-glow">
            <EnvelopeSimple className="size-10 text-lavender" weight="duotone" />
          </div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight">Revisa tu correo</h1>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Si <strong className="text-foreground">{email}</strong> está registrado, recibirás las
            instrucciones para reiniciar tu contraseña.
          </p>
          <div className="mt-4">
            <Badge variant="info">Demo — el envío real llega con el backend de recuperación</Badge>
          </div>
          <Button variant="outline" className="mt-7" asChild>
            <Link href="/login">
              <ArrowLeft className="size-4" /> Volver al inicio de sesión
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight">
            ¿Contraseña olvidada?
          </h1>
          <p className="mb-7 mt-1.5 text-muted-foreground">
            Te enviaremos instrucciones para reiniciarla a tu correo.
          </p>
          <form onSubmit={submit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="recover-email">Correo electrónico</Label>
              <Input
                id="recover-email"
                type="email"
                required
                placeholder="tu@correo.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <Button type="submit" size="lg">
              Enviar enlace
            </Button>
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 text-sm font-semibold text-lavender hover:underline"
            >
              <ArrowLeft className="size-4" /> Volver al inicio de sesión
            </Link>
          </form>
        </>
      )}
    </AuthShell>
  );
}
