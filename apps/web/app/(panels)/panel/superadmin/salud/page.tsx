import { CheckCircle, Pulse, Warning } from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import { Badge, Card } from '@urnight/ui';
import { SALUD_DEMO, SERVICIOS_DEMO } from '@/lib/mock/paneles';

export const metadata: Metadata = {
  title: 'Salud del producto',
  description: 'Métricas operativas y estado de los servicios de la plataforma.',
};

/* Pantalla SA 126 del prototipo. Demo frontend-only (sin observabilidad conectada). */

export default function SaludPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Salud del producto</h1>
          <p className="text-muted-foreground">
            Métricas operativas y estado de los servicios de UrNight.
          </p>
        </div>
        <Badge variant="info">Demo — se conectará a la observabilidad real</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {SALUD_DEMO.map((m) => (
          <Card key={m.nombre} className="p-5">
            <p className="rv-eyebrow !text-muted-foreground">{m.nombre}</p>
            <p className="mt-1 font-heading text-3xl font-extrabold tracking-tight">{m.valor}</p>
            <p className={`mt-1 text-xs font-semibold ${m.ok ? 'text-success' : 'text-warning'}`}>
              {m.sub}
            </p>
          </Card>
        ))}
      </div>

      <section>
        <h2 className="mb-4 flex items-center gap-2 font-heading text-lg font-bold">
          <Pulse className="size-5 text-rose" weight="duotone" /> Servicios
        </h2>
        <Card className="overflow-hidden p-0">
          {SERVICIOS_DEMO.map((s) => (
            <div
              key={s.nombre}
              className="flex items-center gap-3.5 border-b px-4 py-3.5 last:border-b-0"
            >
              {s.estado === 'operativo' ? (
                <CheckCircle className="size-5 shrink-0 text-success" weight="fill" />
              ) : (
                <Warning className="size-5 shrink-0 text-warning" weight="fill" />
              )}
              <p className="flex-1 text-sm font-semibold">{s.nombre}</p>
              <Badge variant={s.estado === 'operativo' ? 'success' : 'warning'}>
                {s.estado === 'operativo' ? 'Operativo' : 'Degradado'}
              </Badge>
            </div>
          ))}
        </Card>
      </section>
    </div>
  );
}
