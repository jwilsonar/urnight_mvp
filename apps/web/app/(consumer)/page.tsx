import {
  ArrowRight,
  MapPin,
  MicrophoneStage,
  Moon,
  MusicNotes,
  Sparkle,
  Star,
  Waveform,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@urnight/ui";
import { EventCard } from "@/components/catalog/event-card";
import { LocalCard } from "@/components/catalog/local-card";
import { WeekEventCarousel } from "@/components/home/week-event-carousel";
import { Marquee } from "@/components/motion/marquee";
import { NightCamera } from "@/components/motion/night-camera";
import { ScrollReveal3d } from "@/components/motion/scroll-reveal-3d";
import { Reveal } from "@/components/shared/reveal";
import {
  getEvents,
  getLocals,
  getMusicGenres,
  getTrendingEvents,
  getUpcomingEvents,
} from "@/lib/api/catalog";
import { getLimaWeekRange } from "@/lib/catalog-filters";
import { getEventCardPrices } from "@/lib/event-card-data";
import { StorageImage } from "@/lib/storage/storage-context";

export const revalidate = 60;

/* Icono Phosphor por nombre de género (el prototipo usa glifos por categoría). */
function genreIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes("techno") || n.includes("electr"))
    return <Waveform weight="duotone" />;
  if (n.includes("regga")) return <MicrophoneStage weight="duotone" />;
  if (n.includes("salsa") || n.includes("latin"))
    return <MusicNotes weight="duotone" />;
  if (n.includes("house")) return <Moon weight="duotone" />;
  if (n.includes("rock")) return <Star weight="duotone" />;
  return <Sparkle weight="duotone" />;
}

function SectionHead({
  title,
  subtitle,
  href,
  viewAll,
}: {
  title: string;
  subtitle: string;
  href: string;
  viewAll: string;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <Button variant="secondary" size="sm" asChild>
        <Link href={href}>
          {viewAll} <ArrowRight className="size-3.5" />
        </Link>
      </Button>
    </div>
  );
}

export default async function HomePage() {
  const t = await getTranslations("home");
  const calendarWeek = getLimaWeekRange();
  const weekRange = { from: new Date().toISOString(), to: calendarWeek.to };
  // Heurística mínima (#9/#10): tendencia por popularidad, recomendados = próximos.
  const [trending, upcoming, weekEvents, genres, locals] = await Promise.all([
    getTrendingEvents().catch(() => []),
    getUpcomingEvents().catch(() => []),
    getEvents(weekRange).catch(() => []),
    getMusicGenres().catch(() => []),
    getLocals().catch(() => []),
  ]);

  const featured = (trending.length > 0 ? trending : upcoming).slice(0, 4);
  const weekly = [...weekEvents].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );
  const moreEvents = upcoming
    .filter((e) => !featured.some((f) => f.id === e.id))
    .slice(0, 4);
  const popular = locals.slice(0, 4);
  const partner =
    locals.find((l) => l.isVerified && l.description) ?? locals[0];
  const partnerZone = partner?.address?.split(",").at(-1)?.trim();
  const localById = new Map(locals.map((local) => [local.id, local]));
  const cardPrices = await getEventCardPrices([...featured, ...moreEvents]);

  return (
    <div>
      <section
        className="rv-hero-glow relative min-h-[calc(100svh-4rem)] overflow-hidden"
        aria-labelledby="home-hero-title"
      >
        <div
          aria-hidden="true"
          className="absolute -right-24 -top-24 size-[min(42rem,90vw)] rounded-full bg-[radial-gradient(circle,var(--accent-soft-strong),transparent_64%)]"
        />
        <div className="relative mx-auto grid min-h-[calc(100svh-4rem)] w-full max-w-7xl items-center gap-[clamp(0.75rem,2svh,2rem)] px-4 py-[clamp(1rem,2.5svh,2rem)] sm:px-6 lg:grid-cols-[minmax(0,0.78fr)_minmax(32rem,1.22fr)] lg:gap-8 lg:px-8">
          <div className="order-2 min-w-0 lg:order-1">
            <span className="rv-eyebrow inline-flex items-center gap-2 rounded-full border border-accent-border bg-accent px-3 py-1.5">
              {t("hero.eyebrow")}
            </span>
            <h1
              id="home-hero-title"
              className="mt-[clamp(0.5rem,1.4svh,1rem)] max-w-xl font-display text-[clamp(2rem,4.6vw,3.5rem)] font-black leading-[0.98] tracking-tight"
            >
              {t("hero.title")}
            </h1>
            <p className="mt-[clamp(0.5rem,1.4svh,1rem)] max-w-[54ch] text-[clamp(0.875rem,1.2vw,1.05rem)] leading-relaxed text-muted-foreground">
              {t("hero.description")}
            </p>

            <div className="mt-[clamp(0.75rem,2svh,1.5rem)] grid max-w-md grid-cols-2 gap-2.5">
              <Button className="w-full px-3" asChild>
                <Link href="/events">
                  {t("hero.eventsCta")} <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button className="w-full px-3" variant="outline" asChild>
                <Link href="/locals">{t("hero.venuesCta")}</Link>
              </Button>
            </div>

            <dl className="mt-[clamp(0.875rem,2.2svh,1.75rem)] grid max-w-xl grid-cols-3 gap-3 text-xs text-muted-foreground">
              <div>
                <dd className="font-heading text-[clamp(1.25rem,3.4vw,1.75rem)] font-extrabold leading-none tabular-nums text-foreground">
                  320+
                </dd>
                <dt className="mt-1">{t("hero.stats.events")}</dt>
              </div>
              <div>
                <dd className="font-heading text-[clamp(1.25rem,3.4vw,1.75rem)] font-extrabold leading-none tabular-nums text-foreground">
                  85
                </dd>
                <dt className="mt-1">{t("hero.stats.venues")}</dt>
              </div>
              <div>
                <dd className="font-heading text-[clamp(1.25rem,3.4vw,1.75rem)] font-extrabold leading-none tabular-nums text-foreground">
                  12k
                </dd>
                <dt className="mt-1">{t("hero.stats.people")}</dt>
              </div>
            </dl>
          </div>

          <div className="order-1 min-w-0 lg:order-2">
            <WeekEventCarousel events={weekly} />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ===== Eventos destacados + chips de género ===== */}
        {featured.length > 0 ? (
          <section className="pt-16">
            <Reveal>
              <SectionHead
                title={t("featured.title")}
                subtitle={t("featured.subtitle")}
                href="/events"
                viewAll={t("viewAll")}
              />
            </Reveal>
            {genres.length > 0 ? (
              <Reveal delay={60}>
                <div className="mb-7 flex flex-wrap gap-2.5">
                  <Link
                    href="/events"
                    className="rv-chip w-[5.8125rem] justify-center"
                    data-active="true"
                  >
                    <Sparkle className="size-4" weight="duotone" /> {t("all")}
                  </Link>
                  {genres.slice(0, 7).map((g) => (
                    <Link
                      key={g.id}
                      href={`/events?genreId=${g.id}`}
                      className="rv-chip"
                    >
                      {genreIcon(g.name)} {g.name}
                    </Link>
                  ))}
                </div>
              </Reveal>
            ) : null}
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {featured.map((event, i) => (
                <ScrollReveal3d key={event.id} delay={i * 70}>
                  <EventCard
                    event={event}
                    local={localById.get(event.localId)}
                    priceFrom={cardPrices.get(event.id)}
                  />
                </ScrollReveal3d>
              ))}
            </div>
          </section>
        ) : null}

        <section className="my-10 border-y py-4 sm:my-14 sm:py-5">
          <Marquee>
            <div className="flex shrink-0 items-center gap-4">
              {/* Intercalado distrito/género a propósito: leído al vuelo se
                  siente "dónde + qué", no dos listas pegadas. */}
              {(t.raw("marquee") as string[]).map((item) => (
                <span key={item} className="flex shrink-0 items-center gap-4">
                  <span className="rv-eyebrow shrink-0">{item}</span>
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
                title={t("popular.title")}
                subtitle={t("popular.subtitle")}
                href="/locals"
                viewAll={t("viewAll")}
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

        {/* ===== El Point: recomendación editorial a ancho completo ===== */}
        {partner ? (
          <section className="pt-16">
            <NightCamera>
              <div className="relative min-h-[390px] overflow-hidden rounded-xl border border-accent-border sm:min-h-[440px]">
                {partner.mainImageUrl ? (
                  <StorageImage
                    src={partner.mainImageUrl}
                    alt=""
                    fill
                    sizes="(max-width: 1280px) 100vw, 1280px"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,var(--accent-soft-strong),transparent_55%),linear-gradient(120deg,var(--bg-elevated),var(--bg-base))]" />
                )}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-[image:var(--feature-scrim)]"
                />

                <div className="relative z-10 flex min-h-[390px] max-w-3xl flex-col justify-end p-6 sm:min-h-[440px] sm:p-10 lg:p-12">
                  <span className="inline-flex items-center gap-2 self-start text-xs font-black uppercase tracking-[0.16em] text-white/80">
                    <Star className="size-4 text-primary" weight="fill" />
                    {t("partner.badge")}
                  </span>
                  <h2 className="mt-3 font-display text-4xl font-black leading-none tracking-tight text-white sm:text-6xl">
                    {partner.name}
                  </h2>

                  <dl className="mt-6 grid max-w-2xl gap-4 border-y border-white/20 py-4 sm:grid-cols-[0.7fr_1.3fr]">
                    <div>
                      <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">
                        {t("partner.zone")}
                      </dt>
                      <dd className="mt-1 flex items-center gap-1.5 text-sm font-bold text-white">
                        <MapPin className="size-4 shrink-0" weight="duotone" />
                        {partnerZone ?? t("partner.zoneFallback")}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">
                        {t("partner.whatItOffers")}
                      </dt>
                      <dd className="mt-1 line-clamp-2 text-sm leading-relaxed text-white/85">
                        {partner.description ??
                          t("partner.fallbackDescription")}
                      </dd>
                    </div>
                  </dl>

                  <Button className="mt-6 w-40" asChild>
                    <Link href={`/locals/${partner.slug}`}>
                      {t("partner.viewVenue")}
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
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
                title={t("upcoming.title")}
                subtitle={t("upcoming.subtitle")}
                href="/events/calendar"
                viewAll={t("viewAll")}
              />
            </Reveal>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {moreEvents.map((event, i) => (
                <Reveal key={event.id} delay={i * 90}>
                  <EventCard
                    event={event}
                    local={localById.get(event.localId)}
                    priceFrom={cardPrices.get(event.id)}
                  />
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
