import { Money } from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import {
  Badge,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@urnight/ui';
import { PromoterRefreshButton } from '@/components/promoter/promoter-refresh-button';
import { LIQUIDACIONES_DEMO } from '@/lib/mock/paneles';

export const metadata: Metadata = {
  title: 'Liquidaciones',
  description: 'Historial de liquidaciones de comisiones del promotor.',
};

/* Pantalla RRPP 82 del prototipo. Demo frontend-only (sin backend de pagos). */

const ESTADO: Record<string, { label: string; variant: 'success' | 'warning' | 'info' }> = {
  pagada: { label: 'Pagada', variant: 'success' },
  'en proceso': { label: 'En proceso', variant: 'info' },
  'por liquidar': { label: 'Por liquidar', variant: 'warning' },
};

export default function LiquidacionesPage() {
  const proxima = LIQUIDACIONES_DEMO.find((l) => l.estado === 'por liquidar');
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Liquidaciones</h1>
          <p className="text-muted-foreground">
            Tus comisiones consolidadas por quincena y su estado de pago.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PromoterRefreshButton />
          <Badge variant="info">Demo — llega con el backend de pagos</Badge>
        </div>
      </div>

      {proxima ? (
        <Card className="border-warning-border bg-[linear-gradient(135deg,var(--warning-soft),var(--accent-soft))] p-6">
          <div className="flex flex-wrap items-center gap-5">
            <span className="flex size-12 items-center justify-center rounded-md border border-warning-border bg-warning-soft">
              <Money className="size-6 text-warning" weight="duotone" />
            </span>
            <div>
              <p className="rv-eyebrow text-warning">Próxima liquidación</p>
              <p className="font-heading text-3xl font-black tracking-tight">{proxima.comision}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {proxima.ventas} ventas del periodo {proxima.periodo} · pago estimado{' '}
                <strong className="text-foreground">{proxima.fechaPago}</strong>
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Periodo</TableHead>
              <TableHead>Ventas</TableHead>
              <TableHead>Comisión</TableHead>
              <TableHead>Fecha de pago</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {LIQUIDACIONES_DEMO.map((l) => {
              const estado = ESTADO[l.estado] ?? ESTADO.pagada!;
              return (
                <TableRow key={l.periodo}>
                  <TableCell className="font-semibold">{l.periodo}</TableCell>
                  <TableCell>{l.ventas}</TableCell>
                  <TableCell className="font-bold">{l.comision}</TableCell>
                  <TableCell className="text-muted-foreground">{l.fechaPago}</TableCell>
                  <TableCell>
                    <Badge variant={estado.variant}>{estado.label}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
