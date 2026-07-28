import { ShieldWarning } from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import { Badge, Card } from '@urnight/ui';
import { ALERTAS_FRAUDE_DEMO } from '@/lib/mock/paneles';

export const metadata: Metadata = {
  title: 'Antifraude',
  description: 'Señales y alertas de fraude en la plataforma.',
};

/* Pantalla SA 124 del prototipo. Demo frontend-only (sin motor antifraude). */

const SEVERIDAD: Record<string, { label: string; variant: 'destructive' | 'warning' | 'secondary' }> = {
  alta: { label: 'Alta', variant: 'destructive' },
  media: { label: 'Media', variant: 'warning' },
  baja: { label: 'Baja', variant: 'secondary' },
};

export default function AntifraudePage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Antifraude</h1>
          <p className="text-muted-foreground">
            Señales de reventa, compras anómalas y abuso de códigos.
          </p>
        </div>
        <Badge variant="info">Demo — llega con el motor antifraude</Badge>
      </div>

      <div className="space-y-3.5">
        {ALERTAS_FRAUDE_DEMO.map((alerta) => {
          const sev = SEVERIDAD[alerta.severidad] ?? SEVERIDAD.baja!;
          return (
            <Card key={alerta.id} className="flex items-start gap-4 p-5">
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-md border ${
                  alerta.severidad === 'alta'
                    ? 'border-destructive/40 bg-destructive/10 text-destructive'
                    : alerta.severidad === 'media'
                      ? 'border-warning-border bg-warning-soft text-warning'
                      : 'border-border bg-muted text-muted-foreground'
                }`}
              >
                <ShieldWarning className="size-5" weight="duotone" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-heading text-[15px] font-bold">{alerta.titulo}</p>
                  <Badge variant={sev.variant}>{sev.label}</Badge>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {alerta.detalle}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{alerta.hace}</span>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
