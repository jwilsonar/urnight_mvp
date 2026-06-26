import { CalendarBlank, Clock, MapPin, TShirt } from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TicketTypeList } from '@/components/events/ticket-type-list';
import { FavoriteButton } from '@/components/favorites/favorite-button';
import { ReportDialog } from '@/components/trust/report-dialog';
import { ReviewList } from '@/components/trust/review-list';
import { StorageImage } from '@/lib/storage/storage-context';
import { resolveStorageUrl } from '@/lib/storage/resolve';
import { ApiError } from '@/lib/api/client';
import { getEventBySlug, getEventTicketTypes, getLocals } from '@/lib/api/catalog';
import { getReviews } from '@/lib/api/trust';
import { formatDate } from '@/lib/utils';

// Alineado con los fetchers de stock/reseñas (revalidate: 30) para no degradar
// la frescura del inventario de entradas en la página pública del evento.
export const revalidate = 30;

async function loadEvent(slug: string) {
  try {
    return await getEventBySlug(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const event = await loadEvent(slug);
  return {
    title: event.name,
    description: event.description ?? `Entradas para ${event.name} en UrNight.`,
    openGraph: event.flyerUrl ? { images: [resolveStorageUrl(event.flyerUrl)] } : undefined,
  };
}

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await loadEvent(slug);
  // Datos secundarios: degradan a vacío si fallan (el evento ya cargó).
  const [ticketTypes, reviews, locals] = await Promise.all([
    getEventTicketTypes(event.id).catch(() => []),
    getReviews({ eventId: event.id }).catch(() => []),
    // Deuda de contrato (D1): EventResponse no expone localName/localSlug y no
    // existe GET /locals/:id, así que el nombre del local se resuelve listando.
    // Mitigar embebiendo localName/localSlug en EventResponse en el backend.
    getLocals().catch(() => []),
  ]);
  const local = locals.find((item) => item.id === event.localId) ?? null;
  const canBuy = event.status === 'published';

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="relative mb-6 aspect-video overflow-hidden rounded-xl bg-muted">
            {event.flyerUrl ? (
              <StorageImage src={event.flyerUrl} alt={event.name} fill priority sizes="(max-width: 1024px) 100vw, 640px" className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <CalendarBlank className="h-12 w-12" weight="duotone" />
              </div>
            )}
          </div>

          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <h1 className="font-heading text-3xl font-bold tracking-tight">{event.name}</h1>
            <div className="flex items-center gap-2">
              <FavoriteButton targetType="event" targetId={event.id} />
              <ReportDialog targetType="event" targetId={event.id} />
            </div>
          </div>

          <dl className="mb-6 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" /> {formatDate(event.startsAt)}
            </div>
            {local ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <Link href={`/locals/${local.slug}`} className="text-primary hover:underline">
                  {local.name}
                </Link>
              </div>
            ) : null}
            {event.dressCode ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <TShirt className="h-4 w-4" /> {event.dressCode}
              </div>
            ) : null}
            {event.minAgeNote ? <div className="text-muted-foreground">{event.minAgeNote}</div> : null}
          </dl>

          {event.description ? <p className="whitespace-pre-line text-muted-foreground">{event.description}</p> : null}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <h2 className="font-heading text-xl font-semibold">Entradas</h2>
          <TicketTypeList ticketTypes={ticketTypes} eventSlug={event.slug} canBuy={canBuy} />
        </aside>
      </div>

      <section className="mt-10">
        <h2 className="mb-3 font-heading text-xl font-semibold">Reseñas</h2>
        <ReviewList reviews={reviews} />
      </section>
    </div>
  );
}
