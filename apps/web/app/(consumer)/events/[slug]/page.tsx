import {
  ArrowLeft,
  CalendarBlank,
  Clock,
  MapPin,
  ShieldCheck,
  TShirt,
} from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge, Button, Card, CardContent } from '@urnight/ui';
import { TicketTypeList } from '@/components/events/ticket-type-list';
import { FavoriteButton } from '@/components/favorites/favorite-button';
import { Reveal } from '@/components/shared/reveal';
import { ReportDialog } from '@/components/trust/report-dialog';
import { ReviewList } from '@/components/trust/review-list';
import { StorageImage } from '@/lib/storage/storage-context';
import { resolveStorageUrl } from '@/lib/storage/resolve';
import { ApiError } from '@/lib/api/client';
import { getEventBySlug, getEventTicketTypes, getLocals } from '@/lib/api/catalog';
import { getReviews } from '@/lib/api/trust';

// Alineado con los fetchers de stock/reseñas (revalidate: 30) para no degradar
// la frescura del inventario de entradas en la página pública del evento.
export const revalidate = 30;

const DATE_LONG = new Intl.DateTimeFormat('es-PE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});
const TIME = new Intl.DateTimeFormat('es-PE', { hour: 'numeric', minute: '2-digit', hour12: true });

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

/** Fila de información del prototipo: icon-tile carmín + label/valor. */
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 rounded-md border bg-white/[0.03] px-4 py-3.5">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-accent text-rose [&_svg]:size-4">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="rv-eyebrow">{label}</p>
        <div className="mt-0.5 text-sm font-semibold">{value}</div>
      </div>
    </div>
  );
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

  const pct = event.totalCapacity > 0 ? event.ticketsSold / event.totalCapacity : 0;
  const soldOut = event.totalCapacity > 0 && event.ticketsSold >= event.totalCapacity;
  const activePrices = ticketTypes.filter((t) => t.status !== 'paused').map((t) => t.price);
  const priceFrom = activePrices.length > 0 ? Math.min(...activePrices) : null;
  const starts = new Date(event.startsAt);
  const schedule = event.endsAt
    ? `${TIME.format(starts)} – ${TIME.format(new Date(event.endsAt))}`
    : TIME.format(starts);

  return (
    <div>
      {/* Hero banner del prototipo: flyer full-bleed con degradado hacia obsidian */}
      <section className="relative h-[340px] overflow-hidden sm:h-[420px]">
        {event.flyerUrl ? (
          <StorageImage
            src={event.flyerUrl}
            alt={event.name}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="rv-img-ph absolute inset-0">
            <span>Hero · {event.name}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,10,0.2)_35%,var(--bg-root)_100%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Button variant="secondary" size="sm" asChild>
            <Link href="/events">
              <ArrowLeft className="size-3.5" /> Volver
            </Link>
          </Button>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div>
            <Reveal>
              <div className="mb-4 flex flex-wrap gap-2">
                {canBuy ? <Badge variant="success">En venta</Badge> : null}
                {event.minAgeNote ? <Badge variant="destructive">{event.minAgeNote}</Badge> : null}
                {event.customTags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
                {soldOut ? (
                  <Badge variant="destructive">Agotado</Badge>
                ) : pct >= 0.8 ? (
                  <Badge variant="warning">🔥 Casi lleno</Badge>
                ) : null}
              </div>
              <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
                {event.name}
              </h1>
            </Reveal>

            {/* Info rows del prototipo */}
            <Reveal delay={80}>
              <div className="mt-7 flex max-w-xl flex-col gap-2.5">
                <InfoRow
                  icon={<CalendarBlank weight="duotone" />}
                  label="Fecha"
                  value={DATE_LONG.format(starts)}
                />
                <InfoRow icon={<Clock weight="duotone" />} label="Horario" value={schedule} />
                {local ? (
                  <InfoRow
                    icon={<MapPin weight="duotone" />}
                    label="Lugar"
                    // Texto plano: el acceso al local vive en la tarjeta "Dónde
                    // es" de abajo (con foto), así que aquí un link morado más
                    // era redundante. Se muestra nombre + dirección, sin estilo
                    // de enlace.
                    value={`${local.name}${local.address ? ` — ${local.address}` : ''}`}
                  />
                ) : null}
                {event.dressCode ? (
                  <InfoRow icon={<TShirt weight="duotone" />} label="Dress code" value={event.dressCode} />
                ) : null}
              </div>
            </Reveal>

            {event.description ? (
              <Reveal>
                <section className="mt-9">
                  <h2 className="mb-3 font-heading text-xl font-extrabold">Descripción</h2>
                  <p className="max-w-2xl whitespace-pre-line leading-relaxed text-muted-foreground">
                    {event.description}
                  </p>
                </section>
              </Reveal>
            ) : null}

            {/* Card del local, como en el prototipo */}
            {local ? (
              <Reveal>
                <section className="mt-9">
                  <h2 className="mb-4 font-heading text-xl font-extrabold">Dónde es</h2>
                  <Card>
                    <CardContent className="flex flex-wrap items-center gap-5 p-5">
                      <div className="relative size-[104px] shrink-0 overflow-hidden rounded-md">
                        {local.mainImageUrl ? (
                          <StorageImage
                            src={local.mainImageUrl}
                            alt={local.name}
                            fill
                            sizes="104px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="rv-img-ph absolute inset-0">
                            <span>Local</span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-heading text-lg font-extrabold">{local.name}</p>
                        {local.address ? (
                          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="size-3.5 shrink-0" weight="duotone" />
                            <span className="line-clamp-1">{local.address}</span>
                          </p>
                        ) : null}
                      </div>
                      <Button variant="outline" asChild>
                        <Link href={`/locals/${local.slug}`}>Ver local</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </section>
              </Reveal>
            ) : null}

            <Reveal>
              <section className="mt-9 pb-4">
                <h2 className="mb-4 font-heading text-xl font-extrabold">Reseñas</h2>
                <ReviewList reviews={reviews} />
              </section>
            </Reveal>
          </div>

          {/* Sidebar sticky del prototipo: guardar/reportar, precio desde, entradas */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <FavoriteButton targetType="event" targetId={event.id} />
                  <ReportDialog targetType="event" targetId={event.id} />
                </div>
                {priceFrom !== null ? (
                  <div className="mt-4 border-y py-4">
                    <p className="text-xs text-muted-foreground">Precio desde</p>
                    <p className="flex items-baseline gap-2">
                      <span className="font-heading text-4xl font-extrabold">
                        S/ {priceFrom.toFixed(0)}
                      </span>
                      <span className="text-sm text-muted-foreground">por persona</span>
                    </p>
                  </div>
                ) : null}
                <div className="mt-5">
                  <h2 className="mb-3 font-heading text-lg font-extrabold">Entradas</h2>
                  <TicketTypeList ticketTypes={ticketTypes} eventSlug={event.slug} canBuy={canBuy} />
                </div>
                {/* Reserva de mesa desde el evento (feedback). Demo hasta tener
                    backend; a futuro cada local/evento decidirá si la ofrece. */}
                <Button variant="secondary" className="mt-4 w-full" asChild>
                  <Link href="/reserva">Reservar mesa</Link>
                </Button>
                <div className="mt-2 text-center">
                  <Badge variant="info">Demo</Badge>
                </div>
                <div className="mt-4 flex items-start gap-2.5 rounded-md border border-success-border bg-success-soft px-3.5 py-3 text-xs leading-relaxed text-success">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0" weight="duotone" />
                  <span>Compra segura · Verificado por UrNight.</span>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
