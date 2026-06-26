import { CalendarBlank } from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import { EventCard } from '@/components/catalog/event-card';
import { SearchBar } from '@/components/catalog/search-bar';
import { EmptyState } from '@/components/shared/empty-state';
import { getEvents } from '@/lib/api/catalog';

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
  const events = await getEvents(filters).catch(() => null);

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
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
