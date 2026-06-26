import { CalendarBlank, MapPin, SealCheck } from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EventCard } from '@/components/catalog/event-card';
import { FavoriteButton } from '@/components/favorites/favorite-button';
import { LocalGallery } from '@/components/locals/local-gallery';
import { LocalMap } from '@/components/locals/local-map';
import { EmptyState } from '@/components/shared/empty-state';
import { ReportDialog } from '@/components/trust/report-dialog';
import { ReviewList } from '@/components/trust/review-list';
import { ApiError } from '@/lib/api/client';
import { getEvents, getLocalBySlug, getLocalImages } from '@/lib/api/catalog';
import { getReviews } from '@/lib/api/trust';

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

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <LocalGallery images={images} localName={local.name} fallbackImageUrl={local.mainImageUrl} />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-3xl font-bold tracking-tight">{local.name}</h1>
            {local.isVerified ? <SealCheck className="h-6 w-6 text-primary" weight="fill" /> : null}
          </div>
          {local.address ? (
            <p className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-4 w-4" /> {local.address}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <FavoriteButton targetType="local" targetId={local.id} />
          <ReportDialog targetType="local" targetId={local.id} />
        </div>
      </div>

      {local.description ? <p className="mb-8 whitespace-pre-line text-muted-foreground">{local.description}</p> : null}

      {local.latitude !== null && local.longitude !== null ? (
        <section className="mb-8">
          <h2 className="mb-3 font-heading text-xl font-semibold">Ubicación</h2>
          <LocalMap latitude={local.latitude} longitude={local.longitude} name={local.name} />
        </section>
      ) : null}

      <section className="mb-8">
        <h2 className="mb-3 font-heading text-xl font-semibold">Próximos eventos</h2>
        {events.length === 0 ? (
          <EmptyState icon={<CalendarBlank className="h-8 w-8" weight="duotone" />} title="Sin eventos próximos" />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-heading text-xl font-semibold">Reseñas</h2>
        <ReviewList reviews={reviews} />
      </section>
    </div>
  );
}
