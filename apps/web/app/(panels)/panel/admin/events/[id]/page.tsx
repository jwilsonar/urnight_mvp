import { ArrowLeft } from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Separator } from '@urnight/ui';
import { CreateTicketTypeDialog } from '@/components/admin/create-ticket-type-dialog';
import { EventActions } from '@/components/admin/event-actions';
import { EventStatusBadge } from '@/components/admin/status-badges';
import { TicketTypesTable } from '@/components/admin/ticket-types-table';
import { getEventById } from '@/lib/api/admin';
import { requireAccessToken } from '@/lib/auth-helpers';
import { StorageImage } from '@/lib/storage/storage-context';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Gestionar evento — Administración' };

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { token } = await requireAccessToken(`/panel/admin/events/${id}`);

  const event = await getEventById(token, id);
  if (!event) notFound();

  return (
    <div className="space-y-6">
      <Link
        href={`/panel/admin/locals/${event.localId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al local
      </Link>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="font-heading text-2xl">{event.name}</CardTitle>
              <CardDescription>{formatDate(event.startsAt)}</CardDescription>
            </div>
            <EventStatusBadge status={event.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {event.flyerUrl ? (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
              <StorageImage
                src={event.flyerUrl}
                alt={event.name}
                fill
                sizes="(max-width: 768px) 100vw, 640px"
                className="object-cover"
              />
            </div>
          ) : null}
          {event.description ? (
            <p className="text-sm text-muted-foreground">{event.description}</p>
          ) : null}
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Aforo</dt>
              <dd className="font-medium">{event.totalCapacity}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Vendidas</dt>
              <dd className="font-medium">{event.ticketsSold}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Edad mínima</dt>
              <dd className="font-medium">{event.minAgeNote || '—'}</dd>
            </div>
            {event.endsAt ? (
              <div>
                <dt className="text-muted-foreground">Fin</dt>
                <dd className="font-medium">{formatDate(event.endsAt)}</dd>
              </div>
            ) : null}
            {event.dressCode ? (
              <div>
                <dt className="text-muted-foreground">Vestimenta</dt>
                <dd className="font-medium">{event.dressCode}</dd>
              </div>
            ) : null}
          </dl>
          <Separator />
          <EventActions event={event} />
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-xl font-semibold">Tipos de entrada</h2>
          <CreateTicketTypeDialog eventId={event.id} />
        </div>

        <TicketTypesTable eventId={event.id} />
      </section>
    </div>
  );
}
