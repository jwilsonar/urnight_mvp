import {
  BookOpenText,
  CalendarBlank,
  Compass,
  MapPin,
  SealCheck,
  WhatsappLogo,
} from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge, Button, Card, CardContent } from '@urnight/ui';
import { EventCard } from '@/components/catalog/event-card';
import { FavoriteButton } from '@/components/favorites/favorite-button';
import { LocalGallery } from '@/components/locals/local-gallery';
import { LocalMap } from '@/components/locals/local-map';
import { EmptyState } from '@/components/shared/empty-state';
import { Reveal } from '@/components/shared/reveal';
import { ReportDialog } from '@/components/trust/report-dialog';
import { ReviewList } from '@/components/trust/review-list';
import { ApiError } from '@/lib/api/client';
import { getEvents, getLocalBySlug, getLocalImages } from '@/lib/api/catalog';
import { getReviews } from '@/lib/api/trust';
import { CARTA_CONFIG_DEMO } from '@/lib/mock/carta';

export const revalidate = 60;

async function loadLocal(slug: string) {
  try {
    return await getLocalBySlug(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const local = await loadLocal(slug);
  return {
    title: local.name,
    description: local.description ?? `Descubre ${local.name} en UrNight.`,
    openGraph: local.mainImageUrl ? { images: [local.mainImageUrl] } : undefined,
  };
}

export default async function LocalDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const local = await loadLocal(slug);
  // Datos secundarios: si fallan, la página del local (ya cargada) degrada a
  // secciones vacías en vez de propagar al error boundary.
  const [events, reviews, images] = await Promise.all([
    getEvents({ localId: local.id }).catch(() => []),
    getReviews({ localId: local.id }).catch(() => []),
    getLocalImages(local.id).catch(() => []),
  ]);

  const hasCoords = local.latitude !== null && local.longitude !== null;
  const mapsUrl = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${local.latitude},${local.longitude}`
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <LocalGallery images={images} localName={local.name} fallbackImageUrl={local.mainImageUrl} />

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          {/* Cabecera del prototipo: chips + título display + zona */}
          <Reveal>
            <div className="flex flex-wrap items-center gap-2">
              {local.isVerified ? (
                <Badge variant="success" className="gap-1">
                  <SealCheck className="size-3" weight="fill" /> Verificado
                </Badge>
              ) : null}
              <Badge variant="secondary">Discoteca · Bar</Badge>
            </div>
            <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
              <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
                {local.name}
              </h1>
              <div className="flex items-center gap-2">
                <FavoriteButton targetType="local" targetId={local.id} />
                <ReportDialog targetType="local" targetId={local.id} />
              </div>
            </div>
            {local.address ? (
              <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="size-4 shrink-0" weight="duotone" /> {local.address}
              </p>
            ) : null}
          </Reveal>

          {local.description ? (
            <Reveal delay={60}>
              <p className="mt-6 max-w-2xl whitespace-pre-line leading-relaxed text-muted-foreground">
                {local.description}
              </p>
            </Reveal>
          ) : null}

          <Reveal>
            <section className="mt-10">
              <h2 className="mb-4 font-heading text-xl font-extrabold">
                Próximos eventos {events.length > 0 ? `(${events.length})` : ''}
              </h2>
              {events.length === 0 ? (
                <EmptyState
                  icon={<CalendarBlank className="h-8 w-8" weight="duotone" />}
                  title="Sin eventos próximos"
                  description="Este local aún no publica sus siguientes fechas."
                />
              ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                  {events.map((event, i) => (
                    <Reveal key={event.id} delay={(i % 2) * 80}>
                      <EventCard event={event} />
                    </Reveal>
                  ))}
                </div>
              )}
            </section>
          </Reveal>

          <Reveal>
            <section className="mt-10 pb-4">
              <h2 className="mb-4 font-heading text-xl font-extrabold">
                Reseñas {reviews.length > 0 ? `(${reviews.length})` : ''}
              </h2>
              <ReviewList reviews={reviews} />
            </section>
          </Reveal>
        </div>

        {/* Sidebar sticky del prototipo: mapa + cómo llegar + reservas */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardContent className="p-6">
              <p className="un-eyebrow mb-3">Para ir a {local.name}</p>
              {hasCoords ? (
                <div className="mb-4 overflow-hidden rounded-md">
                  <LocalMap latitude={local.latitude!} longitude={local.longitude!} name={local.name} />
                </div>
              ) : (
                <div className="un-img-ph mb-4 h-40 rounded-md">
                  <span>Mapa · Ubicación</span>
                </div>
              )}
              {local.address ? (
                <p className="mb-4 text-sm text-muted-foreground">{local.address}</p>
              ) : null}
              {mapsUrl ? (
                <Button className="w-full" asChild>
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                    <Compass className="size-4" weight="duotone" /> Cómo llegar
                  </a>
                </Button>
              ) : null}
              {/* Reservas de mesa: flujo demo del prototipo (sin backend aún). */}
              <Button variant="secondary" className="mt-2 w-full" asChild>
                <Link href="/reserva">
                  <WhatsappLogo className="size-4" weight="duotone" /> Reservar mesa
                </Link>
              </Button>
              {/* Carta in-venue (demo): visible si el local la tiene habilitada. */}
              {CARTA_CONFIG_DEMO.some((c) => c.localSlug === slug && c.enabled) ? (
                <Button variant="secondary" className="mt-2 w-full" asChild>
                  <Link href={`/locals/${slug}/carta`}>
                    <BookOpenText className="size-4" weight="duotone" /> Ver carta del local
                  </Link>
                </Button>
              ) : null}
              <div className="mt-2 text-center">
                <Badge variant="info">Demo</Badge>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
