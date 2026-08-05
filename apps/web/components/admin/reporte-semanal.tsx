'use client';

import {
  CalendarCheck,
  ClipboardText,
  CurrencyCircleDollar,
  Printer,
  Receipt,
  UsersThree,
} from '@phosphor-icons/react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@urnight/ui';
import { EmptyState } from '@/components/shared/empty-state';
import { StatCard } from '@/components/shared/stat-card';
import { REPORTE_SEMANAL_DEMO } from '@/lib/mock/reporte';
import { formatPEN } from '@/lib/utils';

const INCIDENCIA_BADGE = {
  puerta: { label: 'Puerta', variant: 'warning' },
  reserva: { label: 'Reserva', variant: 'destructive' },
  sistema: { label: 'Sistema', variant: 'secondary' },
} as const;

const PRINT_CARD =
  'print:border-slate-300 print:bg-white print:text-black print:shadow-none print:[&_td]:text-black print:[&_th]:text-black print:[&_tr]:border-slate-300';

export function ReporteSemanal() {
  const reporte = REPORTE_SEMANAL_DEMO;

  return (
    <div className="space-y-6 print:bg-white print:text-black">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-muted-foreground print:text-black">
          Semana del {reporte.semana}
        </p>
        <Button
          type="button"
          variant="outline"
          className="print:hidden"
          onClick={() => window.print()}
        >
          <Printer className="size-4" weight="duotone" /> Imprimir
        </Button>
      </div>

      <section
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Indicadores semanales"
      >
        <StatCard
          label="Ingresos de la semana"
          value={formatPEN(reporte.totales.ingresosSoles)}
          hint={reporte.semana}
          tone="accent"
          icon={<CurrencyCircleDollar weight="duotone" />}
          className={PRINT_CARD}
        />
        <StatCard
          label="Asistentes"
          value={reporte.totales.asistentes.toLocaleString('es-PE')}
          hint="Total semanal"
          tone="muted"
          icon={<UsersThree weight="duotone" />}
          className={PRINT_CARD}
        />
        <StatCard
          label="Reservas confirmadas"
          value={reporte.reservas.confirmadas}
          hint={`${reporte.reservas.confirmadas} de ${reporte.reservas.total}`}
          tone="success"
          icon={<CalendarCheck weight="duotone" />}
          className={PRINT_CARD}
        />
        <StatCard
          label="Ticket promedio"
          value={formatPEN(reporte.totales.ticketPromedioSoles)}
          hint="Por asistente"
          tone="muted"
          icon={<Receipt weight="duotone" />}
          className={PRINT_CARD}
        />
      </section>

      <Card className={`overflow-hidden p-0 ${PRINT_CARD}`}>
        <CardHeader className="p-6 pb-4">
          <CardTitle>Ingresos por promotor</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Promotor</TableHead>
                <TableHead className="text-right">Códigos</TableHead>
                <TableHead className="text-right">Link</TableHead>
                <TableHead className="text-right">Paloteo</TableHead>
                <TableHead className="text-right">Ventas box</TableHead>
                <TableHead className="text-right">Comisión</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reporte.ingresosPorPromotor.map((promotor) => (
                <TableRow
                  key={promotor.promotorNombre}
                  className="even:bg-muted/30 hover:bg-accent"
                >
                  <TableCell className="font-semibold">{promotor.promotorNombre}</TableCell>
                  <TableCell className="text-right tabular-nums">{promotor.porCodigos}</TableCell>
                  <TableCell className="text-right tabular-nums">{promotor.porLink}</TableCell>
                  <TableCell className="text-right tabular-nums">{promotor.porPaloteo}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {formatPEN(promotor.ventasBoxSoles)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatPEN(promotor.comisionSoles)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className={`p-0 ${PRINT_CARD}`}>
        <CardHeader className="p-6 pb-4">
          <CardTitle>Incidencias de la semana</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {reporte.incidencias.length > 0 ? (
            <ul className="divide-y" role="list">
              {reporte.incidencias.map((incidencia) => {
                const badge = INCIDENCIA_BADGE[incidencia.tipo];
                return (
                  <li
                    key={`${incidencia.hora}-${incidencia.tipo}`}
                    className="grid gap-2 px-6 py-4 sm:grid-cols-[4rem_6rem_1fr] sm:items-start"
                  >
                    <time className="font-mono text-xs font-semibold tabular-nums text-muted-foreground print:text-black">
                      {incidencia.hora}
                    </time>
                    <div>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground print:text-black">
                      {incidencia.detalle}
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              compact
              icon={<ClipboardText weight="duotone" />}
              title="Sin incidencias registradas"
              description="El equipo no reportó novedades esta semana."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
