import { Medal } from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@urnight/ui';
import {
  BADGES_DEMO,
  FIDELIZACION_PARAMS_DEMO,
  NIVELES_CONFIG_DEMO,
  PUNTOS_REGLAS_DEMO,
} from '@/lib/mock/fidelizacion';

export const metadata: Metadata = {
  title: 'Fidelización',
  description: 'Configuración del programa de niveles, puntos e insignias.',
};

/*
 * Demo frontend-only: configuración global del programa de fidelización que el
 * consumer ya muestra en /account/{wallet,niveles,referidos}. Cuando exista el
 * backend de fidelización, cada bloque se conecta a lib/api/ y las reglas se
 * versionan en la plataforma.
 */

export default function SuperAdminFidelizacionPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Fidelización</h1>
          <p className="text-muted-foreground">
            Niveles, reglas de puntos e insignias del programa UrNight.
          </p>
        </div>
        <Badge variant="info">Demo — llega con el backend de fidelización</Badge>
      </div>

      {/* Niveles */}
      <Card className="overflow-hidden p-0">
        <CardHeader className="p-5 pb-0">
          <CardTitle>Niveles</CardTitle>
          <CardDescription>
            Umbral de puntos y beneficios por nivel. El consumer los ve en «Niveles y badges».
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nivel</TableHead>
                <TableHead>Umbral</TableHead>
                <TableHead>Beneficios</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {NIVELES_CONFIG_DEMO.map((nivel) => (
                <TableRow key={nivel.nombre}>
                  <TableCell className="font-semibold">
                    <span className="flex items-center gap-2">
                      <Medal className="size-4 text-rose" weight="duotone" /> {nivel.nombre}
                    </span>
                  </TableCell>
                  <TableCell className="tabular-nums">{nivel.umbralPuntos} pts</TableCell>
                  <TableCell>
                    <ul className="list-disc space-y-0.5 pl-4 text-sm text-muted-foreground">
                      {nivel.beneficios.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </TableCell>
                  <TableCell>
                    <Badge variant={nivel.activo ? 'success' : 'outline'}>
                      {nivel.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Reglas de puntos */}
      <Card className="overflow-hidden p-0">
        <CardHeader className="p-5 pb-0">
          <CardTitle>Reglas de puntos</CardTitle>
          <CardDescription>Cuánto acumula cada acción del asistente.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Acción</TableHead>
                <TableHead>Puntos</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PUNTOS_REGLAS_DEMO.map((regla) => (
                <TableRow key={regla.accion}>
                  <TableCell className="font-semibold">{regla.accion}</TableCell>
                  <TableCell className="tabular-nums text-rose">{regla.puntos}</TableCell>
                  <TableCell>
                    <Badge variant={regla.activa ? 'success' : 'outline'}>
                      {regla.activa ? 'Activa' : 'Pausada'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Parámetros */}
      <Card>
        <CardHeader>
          <CardTitle>Parámetros del programa</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Canje de puntos', value: FIDELIZACION_PARAMS_DEMO.canje },
              { label: 'Vigencia de puntos', value: FIDELIZACION_PARAMS_DEMO.vigenciaPuntos },
              { label: 'Tope diario', value: FIDELIZACION_PARAMS_DEMO.topeDiario },
            ].map((param) => (
              <div key={param.label} className="rounded-md border bg-surface p-4">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  {param.label}
                </dt>
                <dd className="mt-1 text-sm font-semibold">{param.value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {/* Insignias */}
      <Card>
        <CardHeader>
          <CardTitle>Insignias</CardTitle>
          <CardDescription>
            Catálogo de insignias y su criterio de desbloqueo ({BADGES_DEMO.length} definidas).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {BADGES_DEMO.map((badge) => (
              <div
                key={badge.nombre}
                className="flex items-center gap-3 rounded-md border bg-surface p-3"
              >
                <span className="text-2xl" aria-hidden>
                  {badge.icono}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{badge.nombre}</p>
                  <p className="truncate text-xs text-muted-foreground">{badge.sub}</p>
                </div>
                <Badge variant={badge.unlocked ? 'success' : 'outline'} className="shrink-0">
                  {badge.unlocked ? 'En uso' : 'Definida'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
