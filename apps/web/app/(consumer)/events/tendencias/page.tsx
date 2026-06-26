import { TrendUp } from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import { EventCard } from '@/components/catalog/event-card';
import { EmptyState } from '@/components/shared/empty-state';
import { getTrendingEvents } from '@/lib/api/catalog';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Tendencias',
  description: 'Los eventos más populares de la vida nocturna ahora mismo.',
};

/** Tendencias (#9): eventos más vendidos. Reusa getTrendingEvents + EventCard. */
export default async function TrendingEventsPage() {
  const events = await getTrendingEvents().catch(() => null);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Tendencias</h1>
        <p className="text-muted-foreground">Lo más caliente de la noche ahora mismo.</p>
      </div>

      {events === null ? (
        <EmptyState
          icon={<TrendUp className="h-10 w-10" weight="duotone" />}
          title="No pudimos cargar las tendencias"
          description="Inténtalo de nuevo en unos minutos."
        />
      ) : events.length === 0 ? (
        <EmptyState
          icon={<TrendUp className="h-10 w-10" weight="duotone" />}
          title="Aún no hay tendencias"
          description="Cuando los eventos empiecen a venderse aparecerán aquí."
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
