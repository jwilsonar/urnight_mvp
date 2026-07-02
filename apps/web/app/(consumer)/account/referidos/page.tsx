'use client';

/* Pantalla 36 del prototipo (Programa de referidos). Demo frontend-only:
   el código y los contadores llegan con el backend de referidos. Copiar
   link funciona en local (clipboard). */

import { Check, LinkSimple, WhatsappLogo } from '@phosphor-icons/react';
import { useState } from 'react';
import { Badge, Button, Card } from '@urnight/ui';
import { REFERIDOS_DEMO } from '@/lib/mock/fidelizacion';

export default function ReferidosPage() {
  const [copied, setCopied] = useState(false);
  const pct = Math.round((REFERIDOS_DEMO.invitados / REFERIDOS_DEMO.meta) * 100);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(
        `https://urnight.pe/r/${REFERIDOS_DEMO.codigo.toLowerCase()}`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard no disponible: el botón simplemente no confirma */
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-heading text-xl font-extrabold tracking-tight">
            Programa de referidos
          </h2>
          <p className="text-sm text-muted-foreground">
            Trae a tus amigos. Gana puntos. Vive una noche VIP gratis.
          </p>
        </div>
        <Badge variant="info">Demo — llega con el backend de referidos</Badge>
      </div>

      {/* Card del código con gradiente dorado→amatista del prototipo */}
      <div className="rounded-xl border border-warning-border bg-[linear-gradient(135deg,var(--warning-soft),var(--accent-soft))] p-6 text-center sm:p-7">
        <p className="un-eyebrow text-warning">Tu código de invitación</p>
        <p className="mt-3 font-mono text-3xl font-extrabold tracking-[0.16em] sm:text-4xl">
          {REFERIDOS_DEMO.codigo}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2.5">
          <Button onClick={copyLink}>
            {copied ? <Check className="size-4" /> : <LinkSimple className="size-4" />}
            {copied ? 'Copiado' : 'Copiar link'}
          </Button>
          <Button variant="secondary" disabled>
            <WhatsappLogo className="size-4" weight="duotone" /> WhatsApp
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <p className="un-eyebrow !text-muted-foreground">Amigos invitados</p>
          <p className="mt-1 font-heading text-3xl font-extrabold">
            {REFERIDOS_DEMO.invitados}{' '}
            <span className="text-sm font-medium text-muted-foreground">
              / {REFERIDOS_DEMO.meta} para premio
            </span>
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#f59e0b,var(--color-primary))]"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2.5 text-xs text-muted-foreground">
            Te faltan{' '}
            <strong className="text-foreground">
              {REFERIDOS_DEMO.meta - REFERIDOS_DEMO.invitados} amigos
            </strong>{' '}
            para tu <strong className="text-warning">noche VIP gratis</strong>.
          </p>
        </Card>
        <Card className="p-5">
          <p className="un-eyebrow !text-muted-foreground">Puntos UrNight ganados</p>
          <p className="mt-1 font-heading text-3xl font-extrabold">
            + {REFERIDOS_DEMO.puntos}{' '}
            <span className="text-sm font-medium text-muted-foreground">pts</span>
          </p>
          <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
            Cada amigo que se registre y compre su primera entrada te da{' '}
            <strong className="text-foreground">+30 pts</strong>.
          </p>
        </Card>
      </div>

      <h3 className="mb-3.5 mt-7 text-[15px] font-bold">Tus referidos</h3>
      <Card className="overflow-hidden p-0">
        {REFERIDOS_DEMO.lista.map((r) => (
          <div key={r.nombre} className="flex items-center gap-3.5 border-b px-4 py-3.5 last:border-b-0">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-accent-border bg-accent text-sm font-bold text-lavender">
              {r.nombre[0]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">{r.nombre}</p>
              <p className={`text-xs ${r.completado ? 'text-success' : 'text-muted-foreground'}`}>
                {r.estado}
              </p>
            </div>
            <span className="text-xs text-muted-foreground">{r.fecha}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
