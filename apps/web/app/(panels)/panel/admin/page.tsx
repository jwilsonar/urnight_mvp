import { Buildings } from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@urnight/ui';
import { CreateLocalDialog } from '@/components/admin/create-local-dialog';
import { LocalStatusBadge } from '@/components/admin/status-badges';
import { PanelPageHeader } from '@/components/panels/panel-page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { getLocalStats, listMyLocals } from '@/lib/api/admin';
import { requireAccessToken } from '@/lib/auth-helpers';

export const metadata: Metadata = { title: 'Dashboard — Administración' };

interface Totals {
  eventsCount: number;
  publishedCount: number;
  ticketsSold: number;
  checkins: number;
}

const ZERO: Totals = { eventsCount: 0, publishedCount: 0, ticketsSold: 0, checkins: 0 };

/** Dashboard del panel de local: KPIs agregados de todos los locales del actor. */
export default async function AdminDashboardPage() {
  const { token } = await requireAccessToken('/panel/admin');
  const locals = await listMyLocals(token).catch(() => []);

  // KPIs por local (getLocalStats es por local) → suma agregada para el panel.
  const statsList = await Promise.all(
    locals.map((local) => getLocalStats(token, local.id).catch(() => null)),
  );
  const totals = statsList.reduce<Totals>(
    (acc, s) =>
      s
        ? {
            eventsCount: acc.eventsCount + s.eventsCount,
            publishedCount: acc.publishedCount + s.publishedCount,
            ticketsSold: acc.ticketsSold + s.ticketsSold,
            checkins: acc.checkins + s.checkins,
          }
        : acc,
    ZERO,
  );

  return (
    <div className="space-y-6">
      <PanelPageHeader title="Dashboard" description="Resumen de tus locales y eventos.">
        <CreateLocalDialog />
      </PanelPageHeader>

      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Kpi label="Locales" value={locals.length} />
        <Kpi label="Eventos" value={totals.eventsCount} />
        <Kpi label="Publicados" value={totals.publishedCount} />
        <Kpi label="Entradas vendidas" value={totals.ticketsSold} />
        <Kpi label="Check-ins" value={totals.checkins} />
      </dl>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="font-heading text-xl">Mis locales</CardTitle>
            <CardDescription>Accede a la gestión de cada local.</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/panel/admin/locals">Ver todos</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {locals.length === 0 ? (
            <EmptyState
              icon={<Buildings className="h-10 w-10" weight="duotone" />}
              title="Aún no tienes locales"
              description="Crea tu primer local para empezar a publicar eventos."
            />
          ) : (
            <ul className="divide-y">
              {locals.slice(0, 6).map((local) => (
                <li key={local.id}>
                  <Link
                    href={`/panel/admin/locals/${local.id}`}
                    className="flex items-center justify-between gap-3 py-3 transition-colors hover:text-foreground"
                  >
                    <span className="font-medium">{local.name}</span>
                    <LocalStatusBadge status={local.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="py-4">
        <dt className="text-sm text-muted-foreground">{label}</dt>
        <dd className="font-heading text-2xl font-bold">{value}</dd>
      </CardContent>
    </Card>
  );
}
