import { MapPin, ShieldCheck } from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@urnight/ui';
import { LocalCard } from '@/components/catalog/local-card';
import { ZoneFilter } from '@/components/catalog/zone-filter';
import { EmptyState } from '@/components/shared/empty-state';
import { Reveal } from '@/components/shared/reveal';
import { getLocals, getZones } from '@/lib/api/catalog';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Locales',
  description: 'Descubre discotecas y bares de vida nocturna en Perú.',
};

export default async function LocalsPage({ searchParams }: { searchParams: Promise<{ zoneId?: string; q?: string }> }) {
  const { zoneId, q } = await searchParams;
  // Degrada con elegancia si el API no responde (evita romper el build ISR).
  const [zones, locals] = await Promise.all([getZones().catch(() => []), getLocals({ zoneId, q }).catch(() => null)]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">Locales</h1>
          <p className="text-muted-foreground">Encuentra los mejores lugares de la noche.</p>
        </div>
        {/* La búsqueda vive en el header (con sugerencias); aquí solo el filtro por zona. */}
        <ZoneFilter zones={zones} />
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
          action={
            <Button asChild variant="ghost">
              <Link href="/locals">Ver todos los locales</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {locals.map((local, i) => (
            <Reveal key={local.id} delay={(i % 3) * 80}>
              <LocalCard local={local} />
            </Reveal>
          ))}
        </div>
      )}

      {/* Bloque de afiliación del prototipo (cierra el listado de locales) */}
      <section className="pt-16">
        <Reveal>
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-accent-border bg-[linear-gradient(180deg,var(--accent-soft),transparent)] px-6 py-14 text-center">
            <span className="flex size-16 items-center justify-center rounded-xl border border-accent-border bg-accent">
              <ShieldCheck className="size-7 text-rose" weight="duotone" />
            </span>
            <h2 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">¿Tienes un local?</h2>
            <p className="max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
              Únete a RAVENUE, publica tus eventos, gestiona tu aforo y llega a miles de personas que buscan dónde ir
              esta noche.
            </p>
            <Button size="lg" className="mt-2" asChild>
              <Link href="/afiliar">Afiliar mi local</Link>
            </Button>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
