import { ArrowLeft } from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@urnight/ui';
import { CreateEventDialog } from '@/components/admin/create-event-dialog';
import { EventsTable } from '@/components/admin/events-table';
import { LocalActions } from '@/components/admin/local-actions';
import { LocalImagesManager } from '@/components/admin/local-images-manager';
import { RequestVerificationButton } from '@/components/admin/request-verification-button';
import { LocalStatusBadge, VerifiedBadge } from '@/components/admin/status-badges';
import { getLocalById, getLocalStats } from '@/lib/api/admin';
import { requireAccessToken } from '@/lib/auth-helpers';
import { formatDateOnly } from '@/lib/utils';

export const metadata: Metadata = { title: 'Gestionar local — Administración' };

export default async function LocalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { token } = await requireAccessToken(`/panel/admin/locals/${id}`);

  const local = await getLocalById(token, id);
  if (!local) notFound();

  const stats = await getLocalStats(token, id).catch(() => null);

  return (
    <div className="space-y-6">
      <Link
        href="/panel/admin/locals"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a mis locales
      </Link>

      {/* Identidad del local — siempre visible sobre las pestañas. */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="font-heading text-2xl">{local.name}</CardTitle>
              <CardDescription>{local.address ?? 'Sin dirección registrada'}</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <LocalStatusBadge status={local.status} />
              <VerifiedBadge isVerified={local.isVerified} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {local.description ? (
            <p className="text-sm text-muted-foreground">{local.description}</p>
          ) : null}
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Slug</dt>
              <dd className="font-medium">{local.slug}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Creado</dt>
              <dd className="font-medium">{formatDateOnly(local.createdAt)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Tabs defaultValue="resumen">
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="eventos">Eventos</TabsTrigger>
          <TabsTrigger value="galeria">Galería</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="space-y-6 pt-4">
          {stats ? (
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-xl">Estadísticas</CardTitle>
                <CardDescription>Indicadores agregados de este local (#22).</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Kpi label="Eventos" value={stats.eventsCount} />
                  <Kpi label="Publicados" value={stats.publishedCount} />
                  <Kpi label="Entradas vendidas" value={stats.ticketsSold} />
                  <Kpi label="Check-ins" value={stats.checkins} />
                </dl>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-xl">Acciones</CardTitle>
              <CardDescription>Publica, suspende o solicita verificación del local.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <LocalActions local={local} />
              {!local.isVerified ? (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Verificación</p>
                    <RequestVerificationButton localId={local.id} />
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="eventos" className="space-y-4 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-xl font-semibold">Eventos</h2>
            <CreateEventDialog localId={local.id} />
          </div>
          <EventsTable localId={local.id} />
        </TabsContent>

        <TabsContent value="galeria" className="space-y-4 pt-4">
          <div>
            <h2 className="font-heading text-xl font-semibold">Imágenes</h2>
            <p className="text-sm text-muted-foreground">
              Arrastra para subir, reordena, elige la portada o elimina. La primera imagen es la
              portada por defecto.
            </p>
          </div>
          <LocalImagesManager localId={local.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="font-heading text-2xl font-bold">{value}</dd>
    </div>
  );
}
