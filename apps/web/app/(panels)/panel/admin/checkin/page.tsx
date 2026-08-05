import { DeviceMobile } from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import { Badge, Card } from '@urnight/ui';
import { CheckinLive } from '@/components/admin/checkin-live';
import { AFORO_DEMO } from '@/lib/mock/paneles';

export const metadata: Metadata = {
  title: 'Check-in en vivo',
  description: 'Aforo del evento y últimas validaciones en puerta.',
};

/* Pantallas PL 107-108 del prototipo. Demo frontend-only: la validación real
   corre en la app de puerta (offline-first) y este panel la reflejará. */

export default function PlCheckinPage() {
  const pct = Math.round((AFORO_DEMO.dentro / AFORO_DEMO.capacidad) * 100);
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Check-in en vivo</h1>
          <p className="text-muted-foreground">
            Aforo de esta noche y últimas entradas validadas en puerta.
          </p>
        </div>
        <Badge variant="info">Demo — se alimentará de la app validadora</Badge>
      </div>

      {/* Aforo */}
      <Card className="p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="rv-eyebrow !text-muted-foreground">Personas dentro</p>
            <p className="font-heading text-5xl font-black tracking-tight">
              {AFORO_DEMO.dentro}
              <span className="text-xl font-bold text-muted-foreground">
                {' '}
                / {AFORO_DEMO.capacidad}
              </span>
            </p>
          </div>
          <Badge variant={pct >= 90 ? 'warning' : 'success'}>{pct}% del aforo</Badge>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-primary),var(--color-warning))]"
            style={{ width: `${pct}%` }}
          />
        </div>
      </Card>

      {/* Feed de validaciones */}
      <CheckinLive />

      <Card className="flex items-start gap-3.5 border-accent-border bg-accent-soft p-4">
        <DeviceMobile className="mt-0.5 size-5 shrink-0 text-rose" weight="duotone" />
        <p className="text-sm leading-relaxed text-muted-foreground">
          <strong className="text-foreground">El escaneo de QR vive en la app RAVENUE Validador</strong>{' '}
          del dispositivo de puerta (funciona sin conexión y sincroniza al recuperar señal). Este
          panel muestra el resultado en tiempo real.
        </p>
      </Card>
    </div>
  );
}
