import { Armchair } from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import { Badge, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@urnight/ui';
import { MESAS_PLANTA_DEMO, RESERVAS_DIA_DEMO } from '@/lib/mock/paneles';

export const metadata: Metadata = {
  title: 'Mesas y planta',
  description: 'Estado de mesas del local y reservas del día.',
};

/* Pantallas PL 100-101 del prototipo. Demo frontend-only (sin backend de mesas). */

const ESTADO_MESA: Record<string, { fill: string; stroke: string }> = {
  libre: { fill: 'rgba(34,197,94,0.3)', stroke: 'rgba(34,197,94,0.8)' },
  reservada: { fill: 'rgba(245,158,11,0.3)', stroke: 'rgba(245,158,11,0.8)' },
  ocupada: { fill: 'var(--accent-soft-strong)', stroke: 'var(--text-accent)' },
};

const ESTADO_RESERVA: Record<string, { label: string; variant: 'success' | 'warning' | 'info' }> = {
  llegó: { label: 'Llegó', variant: 'success' },
  confirmada: { label: 'Confirmada', variant: 'info' },
  pendiente: { label: 'Pendiente de pago', variant: 'warning' },
};

export default function PlMesasPage() {
  const libres = MESAS_PLANTA_DEMO.filter((m) => m.estado === 'libre').length;
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Mesas y planta</h1>
          <p className="text-muted-foreground">
            Estado en vivo de las mesas y las reservas de esta noche.
          </p>
        </div>
        <Badge variant="info">Demo — llega con el backend de reservas</Badge>
      </div>

      {/* Plano del local (mismo lenguaje visual que el flujo de reserva B2C) */}
      <Card className="p-5">
        <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-[3px] border border-success-border bg-success-soft" /> Libre ({libres})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-[3px] border border-warning-border bg-warning-soft" /> Reservada
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-[3px] bg-primary" /> Ocupada
          </span>
        </div>
        <svg viewBox="0 0 600 400" className="w-full rounded-md border bg-[#0e0e1a]" role="img" aria-label="Plano del local">
          <rect x="20" y="20" width="280" height="180" rx="8" fill="rgba(108,77,255,0.06)" stroke="rgba(108,77,255,0.2)" />
          <text x="32" y="42" fill="rgba(184,168,255,0.7)" fontSize="11" fontWeight="700" letterSpacing="2">PISTA</text>
          <rect x="320" y="20" width="260" height="180" rx="8" fill="rgba(245,158,11,0.06)" stroke="rgba(245,158,11,0.2)" />
          <text x="332" y="42" fill="rgba(252,211,77,0.8)" fontSize="11" fontWeight="700" letterSpacing="2">BOX VIP</text>
          <rect x="20" y="220" width="560" height="160" rx="8" fill="rgba(143,120,255,0.06)" stroke="rgba(143,120,255,0.2)" />
          <text x="32" y="242" fill="rgba(184,168,255,0.7)" fontSize="11" fontWeight="700" letterSpacing="2">LOUNGE</text>
          {MESAS_PLANTA_DEMO.map((m) => {
            const c = ESTADO_MESA[m.estado] ?? ESTADO_MESA.libre!;
            return (
              <g key={m.id}>
                <rect x={m.layout.x} y={m.layout.y} width={m.layout.w} height={m.layout.h} rx="6" fill={c.fill} stroke={c.stroke} strokeWidth="1.5" />
                <text
                  x={m.layout.x + m.layout.w / 2}
                  y={m.layout.y + m.layout.h / 2 + 4}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize="11"
                  fontWeight="700"
                >
                  {m.label.replace(/Mesa |Box /, '')}
                </text>
              </g>
            );
          })}
        </svg>
      </Card>

      {/* Reservas del día */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 font-heading text-lg font-bold">
          <Armchair className="size-5 text-lavender" weight="duotone" /> Reservas de hoy (
          {RESERVAS_DIA_DEMO.length})
        </h2>
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Llegada</TableHead>
                <TableHead>Mesa</TableHead>
                <TableHead>Anfitrión</TableHead>
                <TableHead>Personas</TableHead>
                <TableHead>Depósito</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {RESERVAS_DIA_DEMO.map((r) => {
                const estado = ESTADO_RESERVA[r.estado] ?? ESTADO_RESERVA.confirmada!;
                return (
                  <TableRow key={`${r.hora}-${r.mesa}`}>
                    <TableCell className="font-mono text-xs">{r.hora}</TableCell>
                    <TableCell className="font-semibold">{r.mesa}</TableCell>
                    <TableCell>
                      {r.nombre}
                      {r.nota ? <span className="ml-2 text-xs text-warning">{r.nota}</span> : null}
                    </TableCell>
                    <TableCell>{r.pax}</TableCell>
                    <TableCell>S/ {r.deposito}</TableCell>
                    <TableCell>
                      <Badge variant={estado.variant}>{estado.label}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </section>
    </div>
  );
}
