import { CalendarBlank, Sparkle } from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@urnight/ui';
import { EventCard } from '@/components/catalog/event-card';
import { EmptyState } from '@/components/shared/empty-state';
import { Reveal } from '@/components/shared/reveal';
import { getEvents, getMusicGenres } from '@/lib/api/catalog';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Eventos',
  description: 'Próximas fiestas, conciertos y eventos de vida nocturna en Perú.',
};

const PAGE_SIZE = 24;

interface EventsSearchParams {
  q?: string;
  zoneId?: string;
  genreId?: string;
  tagId?: string;
  page?: string;
}

/** Href de una página conservando los filtros activos (compatible con ISR). */
function pageHref(filters: EventsSearchParams, page: number): string {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.zoneId) params.set('zoneId', filters.zoneId);
  if (filters.genreId) params.set('genreId', filters.genreId);
  if (filters.tagId) params.set('tagId', filters.tagId);
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  return qs ? `/events?${qs}` : '/events';
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<EventsSearchParams>;
}) {
  const filters = await searchParams;
  const page = Math.max(1, Number.parseInt(filters.page ?? '1', 10) || 1);
  // Pide PAGE_SIZE+1 para saber si hay página siguiente sin envelope de total.
  // Degrada con elegancia si el API no responde (evita romper el build ISR).
  const [events, genres] = await Promise.all([
    getEvents({
      q: filters.q,
      zoneId: filters.zoneId,
      genreId: filters.genreId,
      tagId: filters.tagId,
      limit: PAGE_SIZE + 1,
      offset: (page - 1) * PAGE_SIZE,
    }).catch(() => null),
    getMusicGenres().catch(() => []),
  ]);

  const hasNext = (events?.length ?? 0) > PAGE_SIZE;
  const visible = events?.slice(0, PAGE_SIZE) ?? null;

  /** Chips preservan la búsqueda activa; solo cambia el género (y resetea la página). */
  const chipHref = (genreId?: string) => {
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    if (filters.zoneId) params.set('zoneId', filters.zoneId);
    if (genreId) params.set('genreId', genreId);
    const qs = params.toString();
    return `/events${qs ? `?${qs}` : ''}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Eventos</h1>
          <p className="text-muted-foreground">Compra tus entradas para las próximas fiestas.</p>
        </div>
        {/* La búsqueda vive en el header (con sugerencias); aquí solo el modo calendario. */}
        <Button variant="secondary" size="sm" asChild>
          <Link href="/events/calendar">Calendario</Link>
        </Button>
      </div>

      {genres.length > 0 ? (
        <div className="mb-8 flex flex-wrap gap-2.5">
          <Link href={chipHref()} className="rv-chip" data-active={!filters.genreId}>
            <Sparkle className="size-4" weight="duotone" /> Todos
          </Link>
          {genres.map((g) => (
            <Link
              key={g.id}
              href={chipHref(g.id)}
              className="rv-chip"
              data-active={filters.genreId === g.id}
            >
              {g.name}
            </Link>
          ))}
        </div>
      ) : null}

      {visible === null ? (
        <EmptyState
          icon={<CalendarBlank className="h-10 w-10" weight="duotone" />}
          title="No pudimos cargar los eventos"
          description="Inténtalo de nuevo en unos minutos."
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<CalendarBlank className="h-10 w-10" weight="duotone" />}
          title="No hay eventos"
          description="Aún no hay eventos publicados. Vuelve pronto."
          action={
            <Button asChild>
              <Link href="/locals">Explorar locales</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((event, i) => (
              <Reveal key={event.id} delay={(i % 3) * 80}>
                <EventCard event={event} />
              </Reveal>
            ))}
          </div>

          {page > 1 || hasNext ? (
            <nav aria-label="Paginación" className="mt-10 flex items-center justify-center gap-6">
              {page > 1 ? (
                <Link href={pageHref(filters, page - 1)} className="text-sm text-rose hover:underline">
                  ← Anterior
                </Link>
              ) : null}
              <span className="text-sm text-muted-foreground">Página {page}</span>
              {hasNext ? (
                <Link href={pageHref(filters, page + 1)} className="text-sm text-rose hover:underline">
                  Siguiente →
                </Link>
              ) : null}
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}
