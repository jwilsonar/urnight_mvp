import { MapPin } from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import { LocalCard } from '@/components/catalog/local-card';
import { SearchBar } from '@/components/catalog/search-bar';
import { ZoneFilter } from '@/components/catalog/zone-filter';
import { EmptyState } from '@/components/shared/empty-state';
import { getLocals, getZones } from '@/lib/api/catalog';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Locales',
  description: 'Descubre discotecas y bares de vida nocturna en Perú.',
};

export default async function LocalsPage({
  searchParams,
}: {
  searchParams: Promise<{ zoneId?: string; q?: string }>;
}) {
  const { zoneId, q } = await searchParams;
  // Degrada con elegancia si el API no responde (evita romper el build ISR).
  const [zones, locals] = await Promise.all([
    getZones().catch(() => []),
    getLocals({ zoneId, q }).catch(() => null),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Locales</h1>
          <p className="text-muted-foreground">Encuentra los mejores lugares de la noche.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <SearchBar placeholder="Buscar locales…" />
          <ZoneFilter zones={zones} />
        </div>
      </div>

      {locals === null ? (
        <EmptyState
          icon={<MapPin className="h-10 w-10" weight="duotone" />}
          title="No pudimos cargar los locales"
          description="Inténtalo de nuevo en unos minutos."
        />
      ) : locals.length === 0 ? (
        <EmptyState
          icon={<MapPin className="h-10 w-10" weight="duotone" />}
          title="No hay locales"
          description="No encontramos locales para esta zona. Prueba con otra."
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {locals.map((local) => (
            <LocalCard key={local.id} local={local} />
          ))}
        </div>
      )}
    </div>
  );
}
