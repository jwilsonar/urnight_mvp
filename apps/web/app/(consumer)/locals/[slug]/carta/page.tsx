import { Clock, ForkKnife, MapPin, Ticket } from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import { Badge } from '@urnight/ui';
import { CartaExperience } from '@/components/carta/carta-experience';
import { EmptyState } from '@/components/shared/empty-state';
import { Reveal } from '@/components/shared/reveal';
import { getLocalBySlug } from '@/lib/api/catalog';
import { cartaConfigForSlug } from '@/lib/mock/carta';

/*
 * Carta in-venue (demo, idea Wilson): con la entrada validada en puerta el
 * usuario navega la carta del local, arma un pedido y lo recoge en la zona
 * indicada. Sin pagos en el MVP. Cuando exista el backend: los productos
 * salen del módulo de catálogo in-venue y el pedido del módulo de pedidos;
 * el acceso se restringe a tickets con check-in del evento en curso.
 */

async function loadLocalName(slug: string, fallback: string): Promise<string> {
  try {
    const local = await getLocalBySlug(slug);
    return local.name;
  } catch {
    // Sin backend igual se navega (demo): usamos el nombre del mock.
    return fallback;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const config = cartaConfigForSlug(slug);
  const name = await loadLocalName(slug, config.localName);
  return {
    title: `Carta · ${name}`,
    description: `Pide de la carta de ${name} y recógelo en ${config.pickupZone}.`,
  };
}

export default async function CartaPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ticket?: string }>;
}) {
  const { slug } = await params;
  const { ticket } = await searchParams;
  const config = cartaConfigForSlug(slug);
  const localName = await loadLocalName(slug, config.localName);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Reveal>
        <header className="mb-6 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">Demo — llega con el backend de carta</Badge>
            {ticket ? (
              <Badge variant="success" className="gap-1">
                <Ticket className="size-3" weight="fill" /> Entrada verificada
              </Badge>
            ) : null}
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Carta de {localName}
          </h1>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4 shrink-0" weight="duotone" /> Recojo: {config.pickupZone}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-4 shrink-0" weight="duotone" /> Pedidos: {config.schedule}
            </span>
          </div>
        </header>
      </Reveal>

      {!config.enabled ? (
        <EmptyState
          icon={<ForkKnife weight="duotone" />}
          title="Carta no disponible"
          description="Este local aún no habilitó su carta digital. Pregunta en barra por la carta física."
        />
      ) : (
        <>
          <Reveal delay={60}>
            <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
              Arma tu pedido desde el celular y recógelo sin hacer cola. En el MVP el pago es
              al recoger; el pago en línea llega con la wallet UrNight.
            </p>
          </Reveal>
          <CartaExperience localSlug={slug} pickupZone={config.pickupZone} />
        </>
      )}
    </div>
  );
}
