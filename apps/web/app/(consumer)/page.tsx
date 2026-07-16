import {
  ArrowRight,
  MicrophoneStage,
  Moon,
  MusicNotes,
  Sparkle,
  Star,
  Waveform,
} from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import { Badge, Button } from '@urnight/ui';
import { EventCard } from '@/components/catalog/event-card';
import { LocalCard } from '@/components/catalog/local-card';
import { HeroParallax } from '@/components/home/hero-parallax';
import { NightWall } from '@/components/home/night-wall';
import { Marquee } from '@/components/motion/marquee';
import { NightCamera } from '@/components/motion/night-camera';
import { ScrollReveal3d } from '@/components/motion/scroll-reveal-3d';
import { Spotlight } from '@/components/motion/spotlight';
import { Reveal } from '@/components/shared/reveal';
import { getLocals, getMusicGenres, getTrendingEvents, getUpcomingEvents } from '@/lib/api/catalog';
import { StorageImage } from '@/lib/storage/storage-context';

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

  // El muro del hero repite EXACTAMENTE los eventos que pintan las grillas de
  // abajo. Es lo que hace legítimo su aria-hidden: no esconde nada que no sea
  // alcanzable con teclado más adelante en la página. Si algún día el muro
  // muestra eventos propios, hay que quitarle el aria-hidden.
  const wallEvents = [...featured, ...moreEvents];

  return (
    <div>
      {/* ===== Hero del prototipo: gradiente amatista→midnight, glow respirando,
          titular Sora con la marca en glow y strip de stats ===== */}
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,var(--surface-3)_0%,var(--bg-root)_85%)]">
        {/* Glow de fondo con parallax lento (capa profunda) */}
        <HeroParallax>
          <div
            aria-hidden
            className="un-breathe absolute -right-52 -top-24 size-[700px] rounded-full bg-[radial-gradient(circle,var(--accent-soft-strong),transparent_60%)]"
          />
        </HeroParallax>
        {/* El muro va DETRÁS del copy, no debajo: como banda aparte medía 939px y
            empujaba "Eventos destacados" a 2,2 pantallas de scroll — carísimo en
            un marketplace donde se viene a comprar una entrada. De fondo cuesta
            0px de scroll y encima se lee mejor: el titular va sobre un muro de
            noches en movimiento. La sección lo recorta (overflow-hidden). */}
        {/* blur + opacidad baja = profundidad de campo. Una cámara real enfoca el
            titular y desenfoca lo que hay detrás; sin esto los títulos de los
            posters compiten con el copy y el hero se lee sucio. El desenfoque va
            en este envoltorio, por FUERA del .un-stage: un `filter` aplana el 3D
            del elemento que lo lleva, así que sobre el muro mataría la
            perspectiva. Aquí solo rasteriza el resultado ya compuesto. */}
        <div aria-hidden className="absolute inset-0 z-0 flex items-center opacity-50 blur-[3px]">
          <NightWall events={wallEvents} className="w-full" />
        </div>
        {/* Scrim direccional: casi opaco donde vive el texto, más limpio a la
            derecha para que el muro respire. */}
        <div
          aria-hidden
          className="absolute inset-0 z-[1] bg-[linear-gradient(90deg,var(--bg-root)_0%,rgba(5,5,10,0.96)_40%,rgba(5,5,10,0.78)_68%,rgba(5,5,10,0.6)_100%)]"
        />
        {/* Spotlight: luz de club que sigue al cursor por todo el hero. */}
        <Spotlight size={700} className="relative z-10">
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-20 sm:px-6 lg:px-8">
          <Reveal depth>
            <span className="un-eyebrow inline-flex items-center gap-2 rounded-full border border-accent-border bg-accent px-4 py-2">
              🔥 Esta temporada en Lima
            </span>
          </Reveal>
          <Reveal delay={80} depth>
            <h1 className="mt-6 max-w-3xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Tu próxima noche
              <br />
              empieza en{' '}
              <span className="text-primary [text-shadow:var(--glow-text)]">UrNight</span>
            </h1>
          </Reveal>
          <Reveal delay={160} depth>
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
        </Spotlight>
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
                <ScrollReveal3d key={event.id} delay={i * 70}>
                  <EventCard event={event} />
                </ScrollReveal3d>
              ))}
            </div>
          </section>
        ) : null}

        <section className="border-y py-3">
          <Marquee>
            <div className="flex shrink-0 items-center gap-4">
              {/* Intercalado distrito/género a propósito: leído al vuelo se
                  siente "dónde + qué", no dos listas pegadas. */}
              {[
                'Miraflores',
                'Reggaetón',
                'Barranco',
                'Techno',
                'San Isidro',
                'House',
                'Surco',
                'Electrónica',
              ].map((item) => (
                <span key={item} className="flex shrink-0 items-center gap-4">
                  <span className="un-eyebrow shrink-0">{item}</span>
                  <span aria-hidden className="shrink-0 text-muted-foreground">
                    ·
                  </span>
                </span>
              ))}
            </div>
          </Marquee>
        </section>

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
                <ScrollReveal3d key={local.id} delay={i * 70}>
                  <LocalCard local={local} />
                </ScrollReveal3d>
              ))}
            </div>
          </section>
        ) : null}

        {/* ===== Partner destacado (split card del prototipo) ===== */}
        {partner ? (
          <section className="pt-16">
            {/* NightCamera en vez de Reveal: el bloque llega desde el fondo en Z
                de forma continua con el scroll, en vez de aparecer de golpe. Se
                usa SOLO aquí — es el único bloque suficientemente grande para
                que la profundidad se lea, y repetirlo en cada sección cansaría.
                Ojo: nunca en la última sección de la página (si no llega a
                centrarse en el viewport se queda atenuada para siempre). */}
            <NightCamera>
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
                  {/* Imagen real del partner cuando existe; si no, placeholder
                      con degradado de marca (no las líneas diagonales del
                      un-img-ph, que se veían como "falta algo"). El scrim
                      izquierdo funde la foto con el panel de texto. */}
                  <div className="relative hidden min-h-[240px] overflow-hidden lg:block">
                    {partner.mainImageUrl ? (
                      <StorageImage
                        src={partner.mainImageUrl}
                        alt={partner.name}
                        fill
                        sizes="(max-width: 1024px) 0px, 40vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,var(--accent-soft-strong),transparent_60%),linear-gradient(120deg,#1a1030,#0f0a1e)]" />
                    )}
                    {/* Scrim para fundir con el panel de texto a la izquierda. */}
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,#0f0a1e_0%,rgba(15,10,30,0.35)_35%,transparent_100%)]" />
                    <span className="absolute bottom-4 right-4 rounded-full border border-accent-border bg-deep/80 px-3 py-1 text-xs font-semibold text-lavender backdrop-blur-sm">
                      {partner.name}
                    </span>
                  </div>
                </div>
              </div>
            </NightCamera>
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

        {/* El rail "Busca por categoría" y el banner de afiliación se retiraron
            del home por feedback: los chips de género ya cubren el filtrado y
            la afiliación vive en /locals. */}
        <div className="pb-16" />
      </div>
    </div>
  );
}
