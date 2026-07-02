import { CalendarBlank, Sparkle } from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import Link from 'next/link';
import { EventCard } from '@/components/catalog/event-card';
import { SearchBar } from '@/components/catalog/search-bar';
import { EmptyState } from '@/components/shared/empty-state';
import { Reveal } from '@/components/shared/reveal';
import { getEvents, getMusicGenres } from '@/lib/api/catalog';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Eventos',
  description: 'Próximas fiestas, conciertos y eventos de vida nocturna en Perú.',
};

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; zoneId?: string; genreId?: string; tagId?: string }>;
}) {
  const filters = await searchParams;
  // Degrada con elegancia si el API no responde (evita romper el build ISR).
  const [events, genres] = await Promise.all([
    getEvents(filters).catch(() => null),
    getMusicGenres().catch(() => []),
  ]);

  /** Chips preservan la búsqueda activa; solo cambia el género. */
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
        <div className="flex items-center gap-3">
          <SearchBar placeholder="Buscar eventos o DJs…" />
          <a href="/events/calendar" className="text-sm text-primary hover:underline">
            Calendario
          </a>
        </div>
      </div>

      {genres.length > 0 ? (
        <div className="mb-8 flex flex-wrap gap-2.5">
          <Link href={chipHref()} className="un-chip" data-active={!filters.genreId}>
            <Sparkle className="size-4" weight="duotone" /> Todos
          </Link>
          {genres.map((g) => (
            <Link
              key={g.id}
              href={chipHref(g.id)}
              className="un-chip"
              data-active={filters.genreId === g.id}
            >
              {g.name}
            </Link>
          ))}
        </div>
      ) : null}

      {events === null ? (
        <EmptyState
          icon={<CalendarBlank className="h-10 w-10" weight="duotone" />}
          title="No pudimos cargar los eventos"
          description="Inténtalo de nuevo en unos minutos."
        />
      ) : events.length === 0 ? (
        <EmptyState
          icon={<CalendarBlank className="h-10 w-10" weight="duotone" />}
          title="No hay eventos"
          description="Aún no hay eventos publicados. Vuelve pronto."
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event, i) => (
            <Reveal key={event.id} delay={(i % 3) * 80}>
              <EventCard event={event} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
