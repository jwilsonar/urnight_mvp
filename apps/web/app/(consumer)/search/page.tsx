import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import { EventCard } from '@/components/catalog/event-card';
import { LocalCard } from '@/components/catalog/local-card';
import { SearchBar } from '@/components/catalog/search-bar';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { getEvents, getLocals } from '@/lib/api/catalog';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Búsqueda',
  description: 'Busca eventos y locales de vida nocturna en Perú.',
};

/**
 * Búsqueda global (#3): un único término consulta eventos y locales en paralelo.
 * Reutiliza los fetchers públicos del catálogo y las tarjetas existentes.
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const term = q?.trim() ?? '';

  // catch→null (no []) para distinguir "sin resultados" de un fallo del API: si ambas
  // fuentes caen mostramos error, no un vacío engañoso.
  const [eventsRes, localsRes] = term
    ? await Promise.all([
        getEvents({ q: term }).catch(() => null),
        getLocals({ q: term }).catch(() => null),
      ])
    : [[], []];

  const failed = Boolean(term) && eventsRes === null && localsRes === null;
  const events = eventsRes ?? [];
  const locals = localsRes ?? [];
  const hasResults = events.length > 0 || locals.length > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 space-y-4">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Búsqueda</h1>
        <SearchBar target="/search" placeholder="Buscar eventos, locales o DJs…" />
      </div>

      {!term ? (
        <EmptyState
          icon={<MagnifyingGlass className="h-10 w-10" weight="duotone" />}
          title="¿Qué quieres encontrar?"
          description="Escribe el nombre de un evento, local o DJ para empezar."
        />
      ) : failed ? (
        <ErrorState
          title="No pudimos completar la búsqueda"
          description="Inténtalo de nuevo en unos minutos."
        />
      ) : !hasResults ? (
        <EmptyState
          icon={<MagnifyingGlass className="h-10 w-10" weight="duotone" />}
          title={`Sin resultados para “${term}”`}
          description="Prueba con otro término o revisa la ortografía."
        />
      ) : (
        <div className="space-y-10">
          {events.length > 0 && (
            <section>
              <h2 className="mb-4 font-heading text-xl font-semibold">
                Eventos <span className="text-muted-foreground">({events.length})</span>
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}

          {locals.length > 0 && (
            <section>
              <h2 className="mb-4 font-heading text-xl font-semibold">
                Locales <span className="text-muted-foreground">({locals.length})</span>
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {locals.map((local) => (
                  <LocalCard key={local.id} local={local} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
