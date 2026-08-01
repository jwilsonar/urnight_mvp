import {
  ArrowRight,
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
import type { VerifiedTone } from "@/components/locals/verified-tone";
import { Marquee } from "@/components/motion/marquee";
import { NightCamera } from "@/components/motion/night-camera";
import { ScrollReveal3d } from "@/components/motion/scroll-reveal-3d";
import { Reveal } from "@/components/shared/reveal";
import {
  getLocals,
  getMusicGenres,
  getUpcomingEvents,
} from "@/lib/api/catalog";
import { getEventCardPrices } from "@/lib/event-card-data";
import { StorageImage } from "@/lib/storage/storage-context";

export const revalidate = 60;

// Temporal: muestra los cuatro tonos en el home hasta elegir uno definitivo.
const HOME_VERIFIED_TONES = [
  "green",
  "blue",
  "gold",
  "crimson",
] as const satisfies readonly VerifiedTone[];

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
  const [upcoming, genres, locals] = await Promise.all([
    getUpcomingEvents().catch(() => []),
    getMusicGenres().catch(() => []),
    getLocals().catch(() => []),
  ]);

  const carouselEvents = upcoming.slice(0, 8);
  const featured = carouselEvents.slice(0, 4);
  const popular = locals.slice(0, 4);
  const partner =
    locals.find((l) => l.isVerified && l.description) ?? locals[0];
  const localById = new Map(locals.map((local) => [local.id, local]));
  const cardPrices = await getEventCardPrices(featured);

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
            <h1
              id="home-hero-title"
              className="max-w-xl font-display text-[clamp(2rem,4.6vw,3.5rem)] font-black leading-[0.98] tracking-tight"
            >
              {t("hero.title")}
            </h1>
            <p className="mt-[clamp(0.5rem,1.4svh,1rem)] max-w-[54ch] text-[clamp(0.875rem,1.2vw,1.05rem)] leading-relaxed text-muted-foreground">
              {t("hero.description")}
            </p>

            <div className="mt-[clamp(0.75rem,2svh,1.5rem)] grid max-w-sm grid-cols-2 gap-2.5 sm:flex">
              <Button className="w-full px-5 sm:w-40" asChild>
                <Link href="/events">
                  {t("hero.eventsCta")} <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                className="w-full px-5 sm:w-40"
                variant="outline"
                asChild
              >
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
            <WeekEventCarousel events={carouselEvents} />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ===== Eventos destacados + chips de género ===== */}
        {featured.length > 0 ? (
          <section className="pt-8">
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

        <section className="mb-6 mt-10 border-y py-4 sm:mb-8 sm:mt-14 sm:py-5">
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
          <section className="pt-8">
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
                  <LocalCard
                    local={local}
                    verifiedTone={HOME_VERIFIED_TONES[i] ?? "green"}
                  />
                </ScrollReveal3d>
              ))}
            </div>
          </section>
        ) : null}

        {/* ===== El Point: recomendación editorial a ancho completo ===== */}
        {partner ? (
          <section className="pt-16">
            <NightCamera>
              <div className="grid min-h-[390px] overflow-hidden rounded-xl border border-border bg-[linear-gradient(120deg,var(--bg-elevated),var(--bg-base))] lg:grid-cols-[1.05fr_0.95fr]">
                <div className="flex min-h-[390px] flex-col justify-center p-6 sm:p-10 lg:p-12">
                  <span className="inline-flex items-center gap-2 self-start text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
                    <Star className="size-4 text-primary" weight="fill" />
                    {t("partner.badge")}
                  </span>
                  <h2 className="mt-5 font-display text-4xl font-black leading-none tracking-tight sm:text-6xl">
                    {partner.name}
                  </h2>
                  <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {partner.description ?? t("partner.fallbackDescription")}
                  </p>

                  <Button className="mt-6 w-40" asChild>
                    <Link href={`/locals/${partner.slug}`}>
                      {t("partner.viewVenue")}
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
                <div className="relative min-h-[260px] overflow-hidden lg:min-h-[390px]">
                  {partner.mainImageUrl ? (
                    <StorageImage
                      src={partner.mainImageUrl}
                      alt={partner.name}
                      fill
                      sizes="(max-width: 1024px) 100vw, 48vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,var(--accent-soft-strong),transparent_55%),linear-gradient(120deg,var(--bg-elevated),var(--bg-base))]" />
                  )}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-background/45 via-transparent to-transparent lg:bg-gradient-to-r lg:from-background/35"
                  />
                </div>
              </div>
            </NightCamera>
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
