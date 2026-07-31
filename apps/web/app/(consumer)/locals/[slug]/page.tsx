import {
  BookOpenText,
  CalendarBlank,
  Compass,
  Info,
  SealCheck,
  WhatsappLogo,
} from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Badge, Button, Card, CardContent } from "@urnight/ui";
import { CrowdMeter } from "@/components/catalog/crowd-meter";
import { EventCard } from "@/components/catalog/event-card";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { LocalGallery } from "@/components/locals/local-gallery";
import { LocalMap } from "@/components/locals/local-map";
import { EmptyState } from "@/components/shared/empty-state";
import { Reveal } from "@/components/shared/reveal";
import { ReportDialog } from "@/components/trust/report-dialog";
import { ReviewList } from "@/components/trust/review-list";
import { ApiError } from "@/lib/api/client";
import { getEvents, getLocalBySlug, getLocalImages } from "@/lib/api/catalog";
import { getReviews } from "@/lib/api/trust";
import { CARTA_CONFIG_DEMO } from "@/lib/mock/carta";
import { crowdForSlug } from "@/lib/mock/crowd";
import { getEventCardPrices } from "@/lib/event-card-data";

export const revalidate = 60;

async function loadLocal(slug: string) {
  try {
    return await getLocalBySlug(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const local = await loadLocal(slug);
  const t = await getTranslations("locals.detail");
  return {
    title: local.name,
    description:
      local.description ?? t("metadataDescription", { name: local.name }),
    openGraph: local.mainImageUrl
      ? { images: [local.mainImageUrl] }
      : undefined,
  };
}

export default async function LocalDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const t = await getTranslations("locals.detail");
  const format = await getFormatter();
  const commonT = await getTranslations("common");
  const verificationT = await getTranslations("verificationDocuments.public");
  const { slug } = await params;
  const local = await loadLocal(slug);
  const verified =
    local.verificationStatus === undefined
      ? local.isVerified
      : local.verificationStatus === "approved";
  // Datos secundarios: si fallan, la página del local (ya cargada) degrada a
  // secciones vacías en vez de propagar al error boundary.
  const [events, reviews, images] = await Promise.all([
    getEvents({ localId: local.id }).catch(() => []),
    getReviews({ localId: local.id }).catch(() => []),
    getLocalImages(local.id).catch(() => []),
  ]);

  const hasCoords = local.latitude !== null && local.longitude !== null;
  const mapsUrl = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${local.latitude},${local.longitude}`
    : null;
  const crowd = crowdForSlug(slug);
  const cardPrices = await getEventCardPrices(events);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <LocalGallery
        images={images}
        localName={local.name}
        fallbackImageUrl={local.mainImageUrl}
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          {/* Cabecera del prototipo: chips + título display + zona */}
          <Reveal>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{t("venueType")}</Badge>
            </div>
            <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
              <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
                {local.name}
              </h1>
              <div className="flex items-center gap-2">
                <FavoriteButton targetType="local" targetId={local.id} />
                <ReportDialog targetType="local" targetId={local.id} />
              </div>
            </div>
          </Reveal>

          {local.description ? (
            <Reveal delay={60}>
              <p className="mt-6 max-w-2xl whitespace-pre-line leading-relaxed text-muted-foreground">
                {local.description}
              </p>
            </Reveal>
          ) : null}

          {verified ? (
            <Reveal delay={80}>
              <section className="mt-8 flex items-start gap-4 rounded-lg border border-success/30 bg-success/10 p-5">
                <SealCheck
                  className="mt-0.5 size-7 shrink-0 text-success"
                  weight="fill"
                  aria-hidden="true"
                />
                <div>
                  <h2 className="font-heading text-base font-extrabold">
                    {t("verifiedByRavenue")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {local.verificationReviewedAt
                      ? t("lastReviewed", {
                          date: format.dateTime(
                            new Date(local.verificationReviewedAt),
                            {
                              dateStyle: "long",
                            },
                          ),
                        })
                      : t("reviewDateUnavailable")}
                  </p>
                </div>
              </section>
            </Reveal>
          ) : null}

          {!verified ? (
            <Reveal delay={80}>
              <section className="mt-8 flex items-start gap-4 rounded-lg border border-border bg-muted/40 p-5">
                <Info
                  className="mt-0.5 size-6 shrink-0 text-muted-foreground"
                  weight="duotone"
                  aria-hidden="true"
                />
                <div>
                  <h2 className="font-heading text-base font-bold">
                    {verificationT("title")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {verificationT("body")}
                  </p>
                </div>
              </section>
            </Reveal>
          ) : null}

          <Reveal>
            <section className="mt-10">
              <h2 className="mb-4 font-heading text-xl font-extrabold">
                {t("upcomingEvents", { count: events.length })}
              </h2>
              {events.length === 0 ? (
                <EmptyState
                  icon={<CalendarBlank className="h-8 w-8" weight="duotone" />}
                  title={t("emptyEvents.title")}
                  description={t("emptyEvents.description")}
                />
              ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                  {events.map((event, i) => (
                    <Reveal key={event.id} delay={(i % 2) * 80}>
                      <EventCard
                        event={event}
                        local={local}
                        priceFrom={cardPrices.get(event.id)}
                      />
                    </Reveal>
                  ))}
                </div>
              )}
            </section>
          </Reveal>

          <Reveal>
            <section className="mt-10 pb-4">
              <h2 className="mb-4 font-heading text-xl font-extrabold">
                {t("reviews", { count: reviews.length })}
              </h2>
              <ReviewList reviews={reviews} />
            </section>
          </Reveal>
        </div>

        {/* Sidebar sticky del prototipo: mapa + cómo llegar + reservas */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {crowd ? <CrowdMeter crowd={crowd} /> : null}
          <Card>
            <CardContent className="p-6">
              <p className="rv-eyebrow mb-3">
                {t("directionsFor", { name: local.name })}
              </p>
              {hasCoords ? (
                <div className="mb-4 overflow-hidden rounded-md">
                  <LocalMap
                    latitude={local.latitude!}
                    longitude={local.longitude!}
                    name={local.name}
                  />
                </div>
              ) : (
                <div className="rv-img-ph mb-4 h-40 rounded-md">
                  <span>{t("mapPlaceholder")}</span>
                </div>
              )}
              {local.address ? (
                <p className="mb-4 text-sm text-muted-foreground">
                  {local.address}
                </p>
              ) : null}
              {mapsUrl ? (
                <Button className="w-full" asChild>
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                    <Compass className="size-4" weight="duotone" />{" "}
                    {t("directions")}
                  </a>
                </Button>
              ) : null}
              {/* Reservas de mesa: flujo demo del prototipo (sin backend aún). */}
              <Button variant="secondary" className="mt-2 w-full" asChild>
                <Link href="/reserva">
                  <WhatsappLogo className="size-4" weight="duotone" />{" "}
                  {t("bookTable")}
                </Link>
              </Button>
              {/* Carta in-venue (demo): visible si el local la tiene habilitada. */}
              {CARTA_CONFIG_DEMO.some(
                (c) => c.localSlug === slug && c.enabled,
              ) ? (
                <Button variant="secondary" className="mt-2 w-full" asChild>
                  <Link href={`/locals/${slug}/carta`}>
                    <BookOpenText className="size-4" weight="duotone" />{" "}
                    {t("viewMenu")}
                  </Link>
                </Button>
              ) : null}
              <div className="mt-2 text-center">
                <Badge variant="info">{commonT("demo")}</Badge>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
