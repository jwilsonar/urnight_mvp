import { Armchair } from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge, Button, Card } from '@urnight/ui';
import { MIS_RESERVAS_DEMO } from '@/lib/mock/reservas';

export const metadata: Metadata = {
  title: 'Mis reservas',
  description: 'Tus mesas reservadas: códigos, estados y detalles.',
};

const ESTADO: Record<string, { label: string; variant: 'success' | 'warning' | 'outline' }> = {
  confirmada: { label: 'Confirmada', variant: 'success' },
  pendiente: { label: 'Pendiente de pago', variant: 'warning' },
  completada: { label: 'Completada', variant: 'outline' },
};

/** Pantalla R6 del prototipo (Mis reservas). Demo frontend-only. */
export default function MisReservasPage() {
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-heading text-xl font-extrabold tracking-tight">Mis reservas</h2>
          <p className="text-sm text-muted-foreground">
            Tus mesas reservadas: códigos, estados y detalles.
          </p>
        </div>
        <Badge variant="info">Demo — llega con el backend de reservas</Badge>
      </div>

      <div className="space-y-3.5">
        {MIS_RESERVAS_DEMO.map((reserva) => {
          const estado = ESTADO[reserva.estado] ?? { label: reserva.estado, variant: 'outline' as const };
          return (
            <Card key={reserva.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={estado.variant}>{estado.label}</Badge>
                    <span className="text-xs text-muted-foreground">{reserva.fecha}</span>
                  </div>
                  <p className="mt-2 font-heading text-lg font-extrabold">{reserva.evento}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Armchair className="size-3.5" weight="duotone" />
                    {reserva.mesa} · {reserva.pax} personas · {reserva.venue}
                  </p>
                </div>
                <div className="text-right">
                  <p className="rv-eyebrow !text-muted-foreground">Código</p>
                  <p className="font-mono text-lg font-bold tracking-widest text-rose">
                    {reserva.codigo}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Depósito S/ {reserva.deposito}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 text-center">
        <Button variant="outline" asChild>
          <Link href="/reserva">Reservar otra mesa</Link>
        </Button>
      </div>
    </div>
  );
}
