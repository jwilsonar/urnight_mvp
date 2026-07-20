import type { Metadata } from 'next';
import {
  Badge,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from '@urnight/ui';
import { PointsRedemptionGrid } from '@/components/account/points-redemption-grid';
import { Reveal } from '@/components/shared/reveal';
import { FIDELIZACION_PARAMS_DEMO, HISTORIAL_PUNTOS_DEMO, NIVEL_DEMO } from '@/lib/mock/fidelizacion';
import { formatPEN } from '@/lib/utils';

export const metadata: Metadata = { title: 'Puntos' };

/** Demo frontend: el saldo, los canjes y el historial vendrán de fidelización. */
export default function PuntosPage() {
  return (
    <div className="space-y-8">
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="font-heading text-2xl font-extrabold tracking-tight">Puntos</h1>
            <p className="text-sm text-muted-foreground">
              Revisa tu saldo, elige beneficios y consulta cómo lo acumulaste.
            </p>
          </div>
          <Badge variant="info">Demo — llega con el backend de fidelización</Badge>
        </div>
      </Reveal>

      <Reveal delay={60}>
        <Card className="border-accent-border bg-accent-soft">
          <CardContent className="p-6 sm:p-7">
            <p className="rv-eyebrow">Saldo disponible</p>
            <p className="mt-1 font-heading text-5xl font-black tracking-tight tabular-nums">
              {NIVEL_DEMO.puntos.toLocaleString('es-PE')}
              <span className="ml-2 text-lg font-bold text-muted-foreground">pts</span>
            </p>
            <p className="mt-2 text-sm font-semibold text-rose">Equivalen a {formatPEN(NIVEL_DEMO.puntos / 10)}</p>
            <p className="mt-3 text-xs text-muted-foreground">Vigencia: {FIDELIZACION_PARAMS_DEMO.vigenciaPuntos}.</p>
          </CardContent>
        </Card>
      </Reveal>

      <section id="canjear" className="scroll-mt-24">
        <Reveal delay={100}>
          <div>
            <h2 className="font-heading text-xl font-extrabold">Canjear</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              El canje es demostrativo y todavía no descuenta puntos.
            </p>
          </div>
        </Reveal>
        <PointsRedemptionGrid />
      </section>

      <section id="historial" className="scroll-mt-24">
        <Reveal delay={180}>
          <h2 className="font-heading text-xl font-extrabold">Historial</h2>
        </Reveal>
        <Reveal delay={220}>
          <Card className="mt-4 overflow-hidden p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead className="text-right">Puntos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {HISTORIAL_PUNTOS_DEMO.map((movimiento) => (
                  <TableRow key={`${movimiento.fechaLabel}-${movimiento.concepto}`}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{movimiento.fechaLabel}</TableCell>
                    <TableCell>{movimiento.concepto}</TableCell>
                    <TableCell
                      className={cn('text-right font-bold tabular-nums', movimiento.tipo === 'gana' && 'text-success')}
                    >
                      {movimiento.puntos > 0 ? '+' : ''}
                      {movimiento.puntos.toLocaleString('es-PE')} pts
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </Reveal>
      </section>
    </div>
  );
}
