import { CalendarBlank } from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import Link from 'next/link';
import { EventCard } from '@/components/catalog/event-card';
import { SearchBar } from '@/components/catalog/search-bar';
import { EmptyState } from '@/components/shared/empty-state';
import { getEvents } from '@/lib/api/catalog';

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
  const events = await getEvents({
    q: filters.q,
    zoneId: filters.zoneId,
    genreId: filters.genreId,
    tagId: filters.tagId,
    limit: PAGE_SIZE + 1,
    offset: (page - 1) * PAGE_SIZE,
  }).catch(() => null);

  const hasNext = (events?.length ?? 0) > PAGE_SIZE;
  const visible = events?.slice(0, PAGE_SIZE) ?? null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Eventos</h1>
          <p className="text-muted-foreground">Compra tus entradas para las próximas fiestas.</p>
        </div>
        <div className="flex items-center gap-3">
          <SearchBar placeholder="Buscar eventos o DJs…" />
          <Link href="/events/calendar" className="text-sm text-primary hover:underline">
            Calendario
          </Link>
        </div>
      </div>

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
        />
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          {page > 1 || hasNext ? (
            <nav aria-label="Paginación" className="mt-10 flex items-center justify-center gap-6">
              {page > 1 ? (
                <Link href={pageHref(filters, page - 1)} className="text-sm text-primary hover:underline">
                  ← Anterior
                </Link>
              ) : null}
              <span className="text-sm text-muted-foreground">Página {page}</span>
              {hasNext ? (
                <Link href={pageHref(filters, page + 1)} className="text-sm text-primary hover:underline">
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
