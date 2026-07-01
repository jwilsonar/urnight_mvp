import { CalendarDots, MapPin, TrendUp } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@urnight/ui';
import { EventCard } from '@/components/catalog/event-card';
import { getTrendingEvents, getUpcomingEvents } from '@/lib/api/catalog';
import type { EventResponse } from '@urnight/contracts';

export const revalidate = 60;

function EventSection({
  title,
  icon,
  events,
}: {
  title: string;
  icon: React.ReactNode;
  events: EventResponse[];
}) {
  if (events.length === 0) return null;
  return (
    <section className="pb-12">
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <h2 className="font-heading text-2xl font-bold tracking-tight">{title}</h2>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {events.slice(0, 6).map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}

export default async function HomePage() {
  // Heurística mínima (#9/#10): tendencia por popularidad, recomendados = próximos.
  const [trending, upcoming] = await Promise.all([
    getTrendingEvents().catch(() => []),
    getUpcomingEvents().catch(() => []),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Hero DS: wash amatista de atmósfera, eyebrow lavanda y titular en Sora
          (font-display, reservada a titulares hero) con glow en la palabra clave. */}
      <section className="un-hero-glow mt-6 flex flex-col items-center gap-6 rounded-2xl px-4 py-20 text-center">
        <span className="un-eyebrow rounded-full border border-accent-border bg-accent px-4 py-1.5">
          Vida nocturna en Perú
        </span>
        <h1 className="max-w-3xl font-display text-4xl font-bold tracking-tight sm:text-6xl">
          Descubre los mejores{' '}
          <span className="text-primary [text-shadow:var(--glow-text)]">locales y eventos</span> de
          la noche
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Explora discotecas y fiestas, compra tus entradas y guarda tus favoritos. Todo en un solo
          lugar.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/events">Ver eventos</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/locals">Explorar locales</Link>
          </Button>
        </div>
      </section>

      <EventSection
        title="En tendencia"
        icon={<TrendUp className="h-6 w-6 text-primary" weight="duotone" />}
        events={trending}
      />
      <EventSection
        title="Recomendados para ti"
        icon={<CalendarDots className="h-6 w-6 text-primary" weight="duotone" />}
        events={upcoming}
      />

      <section className="grid gap-6 pb-20 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <MapPin className="h-8 w-8 text-primary" weight="duotone" />
            <CardTitle className="text-xl">Locales</CardTitle>
            <CardDescription>Encuentra discotecas y bares verificados cerca de ti.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="link" className="px-0" asChild>
              <Link href="/locals">Explorar locales →</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CalendarDots className="h-8 w-8 text-primary" weight="duotone" />
            <CardTitle className="text-xl">Eventos</CardTitle>
            <CardDescription>Compra entradas para las próximas fiestas y conciertos.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="link" className="px-0" asChild>
              <Link href="/events">Ver eventos →</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
