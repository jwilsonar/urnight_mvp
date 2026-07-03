import {
  ArrowRight,
  Buildings,
  CalendarDots,
  MicrophoneStage,
  Moon,
  MusicNotes,
  ShieldCheck,
  Sparkle,
  Star,
  Waveform,
} from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import { Badge, Button } from '@urnight/ui';
import { EventCard } from '@/components/catalog/event-card';
import { LocalCard } from '@/components/catalog/local-card';
import { Parallax } from '@/components/motion/parallax';
import { Reveal } from '@/components/shared/reveal';
import { Hero3D } from '@/components/three/hero-3d';
import { getLocals, getMusicGenres, getTrendingEvents, getUpcomingEvents } from '@/lib/api/catalog';

export const revalidate = 60;

/* Icono Phosphor por nombre de género (el prototipo usa glifos por categoría). */
function genreIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes('techno') || n.includes('electr')) return <Waveform weight="duotone" />;
  if (n.includes('regga')) return <MicrophoneStage weight="duotone" />;
  if (n.includes('salsa') || n.includes('latin')) return <MusicNotes weight="duotone" />;
  if (n.includes('house')) return <Moon weight="duotone" />;
  if (n.includes('rock')) return <Star weight="duotone" />;
  return <Sparkle weight="duotone" />;
}

function SectionHead({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle: string;
  href: string;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <Button variant="secondary" size="sm" asChild>
        <Link href={href}>
          Ver todos <ArrowRight className="size-3.5" />
        </Link>
      </Button>
    </div>
  );
}

export default async function HomePage() {
  // Heurística mínima (#9/#10): tendencia por popularidad, recomendados = próximos.
  const [trending, upcoming, genres, locals] = await Promise.all([
    getTrendingEvents().catch(() => []),
    getUpcomingEvents().catch(() => []),
    getMusicGenres().catch(() => []),
    getLocals().catch(() => []),
  ]);

  const featured = (trending.length > 0 ? trending : upcoming).slice(0, 4);
  const moreEvents = upcoming.filter((e) => !featured.some((f) => f.id === e.id)).slice(0, 4);
  const popular = locals.slice(0, 4);
  const partner = locals.find((l) => l.isVerified && l.description) ?? locals[0];

  return (
    <div>
      {/* ===== Hero del prototipo: gradiente amatista→midnight, glow respirando,
          titular Sora con la marca en glow y strip de stats ===== */}
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,var(--surface-3)_0%,var(--bg-root)_85%)]">
        {/* Glow de fondo con parallax lento (capa profunda) */}
        <Parallax
          speed={0.4}
          className="pointer-events-none absolute -right-52 -top-24"
        >
          <div
            aria-hidden
            className="un-breathe size-[700px] rounded-full bg-[radial-gradient(circle,var(--accent-soft-strong),transparent_60%)]"
          />
        </Parallax>
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 pb-16 pt-20 sm:px-6 lg:grid-cols-[1fr_420px] lg:items-center lg:px-8">
          <div>
          <Reveal>
            <span className="un-eyebrow inline-flex items-center gap-2 rounded-full border border-accent-border bg-accent px-4 py-2">
              🔥 Esta temporada en Lima
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-6 max-w-3xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Tu próxima noche
              <br />
              empieza en{' '}
              <span className="text-primary [text-shadow:var(--glow-text)]">UrNight</span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Cientos de eventos y locales verificados. Encuentra dónde ir esta noche, compra tu
              entrada y arma el plan con tus amigos.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/events">
                  Ver eventos de esta semana <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/locals">Explorar locales</Link>
              </Button>
            </div>
          </Reveal>
          <Reveal delay={320}>
            <dl className="mt-14 flex flex-wrap gap-x-12 gap-y-6 text-sm text-muted-foreground">
              <div>
                <dd className="font-heading text-3xl font-extrabold text-foreground">320+</dd>
                <dt>Eventos este mes</dt>
              </div>
              <div>
                <dd className="font-heading text-3xl font-extrabold text-foreground">85</dd>
                <dt>Locales verificados</dt>
              </div>
              <div>
                <dd className="font-heading text-3xl font-extrabold text-foreground">12k</dd>
                <dt>Noctámbulos felices</dt>
              </div>
            </dl>
          </Reveal>
          </div>

          {/* Centerpiece 3D: copa amatista (lazy; solo lg+ para cuidar GPU en móvil).
              Parallax en frente para dar profundidad respecto al texto al hacer scroll. */}
          <Parallax speed={-0.22} className="hidden lg:block">
            <Hero3D className="h-[420px] w-full" />
          </Parallax>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ===== Eventos destacados + chips de género ===== */}
        {featured.length > 0 ? (
          <section className="pt-16">
            <Reveal>
              <SectionHead
                title="Eventos destacados"
                subtitle="Lo más hot para esta semana, elegido por nuestro equipo."
                href="/events"
              />
            </Reveal>
            {genres.length > 0 ? (
              <Reveal delay={60}>
                <div className="mb-7 flex flex-wrap gap-2.5">
                  <Link href="/events" className="un-chip" data-active="true">
                    <Sparkle className="size-4" weight="duotone" /> Todos
                  </Link>
                  {genres.slice(0, 7).map((g) => (
                    <Link key={g.id} href={`/events?genreId=${g.id}`} className="un-chip">
                      {genreIcon(g.name)} {g.name}
                    </Link>
                  ))}
                </div>
              </Reveal>
            ) : null}
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {featured.map((event, i) => (
                <Reveal key={event.id} delay={i * 90}>
                  <EventCard event={event} />
                </Reveal>
              ))}
            </div>
          </section>
        ) : null}

        {/* ===== Locales populares ===== */}
        {popular.length > 0 ? (
          <section className="pt-16">
            <Reveal>
              <SectionHead
                title="Los más populares"
                subtitle="Locales que están rompiéndola este mes."
                href="/locals"
              />
            </Reveal>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {popular.map((local, i) => (
                <Reveal key={local.id} delay={i * 90}>
                  <LocalCard local={local} />
                </Reveal>
              ))}
            </div>
          </section>
        ) : null}

        {/* ===== Partner destacado (split card del prototipo) ===== */}
        {partner ? (
          <section className="pt-16">
            <Reveal>
              <div className="overflow-hidden rounded-2xl border border-accent-border bg-[linear-gradient(110deg,#16102a_0%,#0f0a1e_100%)]">
                <div className="grid min-h-[340px] lg:grid-cols-[1.2fr_1fr]">
                  <div className="flex flex-col justify-center p-8 sm:p-12">
                    <span className="inline-flex items-center gap-2 self-start rounded-full border border-warning-border bg-[linear-gradient(90deg,var(--warning-soft),var(--accent-soft-strong))] px-4 py-1.5 text-xs font-bold tracking-wide text-warning">
                      <Star className="size-3.5" weight="fill" /> PARTNER DESTACADO
                    </span>
                    <h2 className="mt-5 font-display text-5xl font-black leading-[0.95] tracking-tight text-primary sm:text-6xl">
                      {partner.name}
                    </h2>
                    <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
                      {partner.description ??
                        'La mejor música de Lima cada fin de semana. Vive una noche que no vas a olvidar.'}
                    </p>
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <Button asChild>
                        <Link href={`/locals/${partner.slug}`}>Ver local</Link>
                      </Button>
                      {/* Reserva de mesa: flujo demo del prototipo (sin backend aún). */}
                      <Button variant="ghost" asChild>
                        <Link href="/reserva">Reservar mesa</Link>
                      </Button>
                      <Badge variant="info">Demo</Badge>
                    </div>
                  </div>
                  <div className="un-img-ph relative hidden min-h-[240px] lg:block">
                    <span>Partner · {partner.name}</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </section>
        ) : null}

        {/* ===== Más fechas próximas ===== */}
        {moreEvents.length > 0 ? (
          <section className="pt-16">
            <Reveal>
              <SectionHead
                title="Próximas fechas"
                subtitle="Lo que se viene en las siguientes semanas."
                href="/events/calendar"
              />
            </Reveal>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {moreEvents.map((event, i) => (
                <Reveal key={event.id} delay={i * 90}>
                  <EventCard event={event} />
                </Reveal>
              ))}
            </div>
          </section>
        ) : null}

        {/* ===== Busca por categoría (rail horizontal con snap) ===== */}
        {genres.length > 0 ? (
          <section className="pt-16">
            <Reveal>
              <h2 className="mb-6 font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
                Busca por categoría
              </h2>
            </Reveal>
            <Reveal delay={80}>
              <div className="un-hscroll">
                {genres.map((g) => (
                  <Link
                    key={g.id}
                    href={`/events?genreId=${g.id}`}
                    className="flex w-[200px] flex-col items-center gap-3 rounded-lg border bg-card px-4 py-6 text-center transition-[border-color,transform,box-shadow] hover:-translate-y-0.5 hover:border-accent-border hover:shadow-float"
                  >
                    <span className="flex size-[52px] items-center justify-center rounded-md border border-accent-border bg-accent text-lavender [&_svg]:size-6">
                      {genreIcon(g.name)}
                    </span>
                    <span className="text-[13px] font-bold">{g.name}</span>
                  </Link>
                ))}
                <Link
                  href="/categorias"
                  className="flex w-[200px] flex-col items-center gap-3 rounded-lg border bg-card px-4 py-6 text-center transition-[border-color,transform,box-shadow] hover:-translate-y-0.5 hover:border-accent-border hover:shadow-float"
                >
                  <span className="flex size-[52px] items-center justify-center rounded-md border border-accent-border bg-accent text-lavender [&_svg]:size-6">
                    <CalendarDots weight="duotone" />
                  </span>
                  <span className="text-[13px] font-bold">Ver todas</span>
                </Link>
              </div>
            </Reveal>
          </section>
        ) : null}

        {/* ===== CTA afiliación (banner del prototipo) ===== */}
        <section className="py-16">
          <Reveal>
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-accent-border bg-[linear-gradient(180deg,var(--accent-soft),transparent)] px-6 py-14 text-center">
              <span className="flex size-16 items-center justify-center rounded-xl border border-accent-border bg-accent">
                <ShieldCheck className="size-7 text-lavender" weight="duotone" />
              </span>
              <h2 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
                ¿Tienes un local?
              </h2>
              <p className="max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
                Únete a UrNight, publica tus eventos, gestiona tu aforo y llega a miles de personas
                que buscan dónde ir esta noche.
              </p>
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                <Button size="lg" asChild>
                  <Link href="/afiliar">Afiliar mi local</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/promotor/postular">
                    <Buildings className="size-4" weight="duotone" /> Quiero ser promotor
                  </Link>
                </Button>
              </div>
            </div>
          </Reveal>
        </section>
      </div>
    </div>
  );
}
