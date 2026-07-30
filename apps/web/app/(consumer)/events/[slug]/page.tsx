import {
  ArrowLeft,
  CalendarBlank,
  Clock,
  MapPin,
  ShieldCheck,
  TShirt,
} from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Badge, Button, Card, CardContent } from "@urnight/ui";
import { EventStatusPill } from "@/components/catalog/event-status-pill";
import { TicketTypeList } from "@/components/events/ticket-type-list";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { Reveal } from "@/components/shared/reveal";
import { ReportDialog } from "@/components/trust/report-dialog";
import { ReviewList } from "@/components/trust/review-list";
import { StorageImage } from "@/lib/storage/storage-context";
import { resolveStorageUrl } from "@/lib/storage/resolve";
import { ApiError } from "@/lib/api/client";
import {
  getEventBySlug,
  getEventTicketTypes,
  getLocals,
} from "@/lib/api/catalog";
import { getReviews } from "@/lib/api/trust";

// Alineado con los fetchers de stock/reseñas (revalidate: 30) para no degradar
// la frescura del inventario de entradas en la página pública del evento.
export const revalidate = 30;

async function loadEvent(slug: string) {
  try {
    return await getEventBySlug(slug);
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
  const event = await loadEvent(slug);
  const t = await getTranslations("events.detail");
  return {
    title: event.name,
    description:
      event.description ?? t("metadataDescription", { name: event.name }),
    openGraph: event.flyerUrl
      ? { images: [resolveStorageUrl(event.flyerUrl)] }
      : undefined,
  };
}

/** Fila de información del prototipo: icon-tile carmín + label/valor. */
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 rounded-md border bg-field px-4 py-3.5">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-accent text-rose [&_svg]:size-4">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="rv-eyebrow">{label}</p>
        <div className="mt-0.5 text-sm font-semibold">{value}</div>
      </div>
    </div>
  );
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [t, commonT, format] = await Promise.all([
    getTranslations("events.detail"),
    getTranslations("common"),
    getFormatter(),
  ]);
  const { slug } = await params;
  const event = await loadEvent(slug);
  // Datos secundarios: degradan a vacío si fallan (el evento ya cargó).
  const [ticketTypes, reviews, locals] = await Promise.all([
    getEventTicketTypes(event.id).catch(() => []),
    getReviews({ eventId: event.id }).catch(() => []),
    // Deuda de contrato (D1): EventResponse no expone localName/localSlug y no
    // existe GET /locals/:id, así que el nombre del local se resuelve listando.
    // Mitigar embebiendo localName/localSlug en EventResponse en el backend.
    getLocals().catch(() => []),
  ]);
  const local = locals.find((item) => item.id === event.localId) ?? null;
  const canBuy = event.status === "published";

  const soldOut =
    event.totalCapacity > 0 && event.ticketsSold >= event.totalCapacity;
  const availability =
    event.status === "cancelled"
      ? "cancelled"
      : soldOut
        ? "soldOut"
        : (event.catalogLabel ?? (canBuy ? "onSale" : null));
  const activePrices = ticketTypes
    .filter((t) => t.status !== "paused")
    .map((t) => t.price);
  const priceFrom = activePrices.length > 0 ? Math.min(...activePrices) : null;
  const starts = new Date(event.startsAt);
  const formatTime = (date: Date) =>
    format.dateTime(date, { hour: "numeric", minute: "2-digit", hour12: true });
  const schedule = event.endsAt
    ? `${formatTime(starts)} – ${formatTime(new Date(event.endsAt))}`
    : formatTime(starts);

  return (
    <div>
      {/* Hero banner del prototipo: flyer full-bleed con degradado hacia obsidian */}
      <section className="relative h-[340px] overflow-hidden sm:h-[420px]">
        {event.flyerUrl ? (
          <StorageImage
            src={event.flyerUrl}
            alt={event.name}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="rv-img-ph absolute inset-0">
            <span>{t("heroPlaceholder", { name: event.name })}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-[image:var(--detail-scrim)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Button
            variant="secondary"
            size="sm"
            className="bg-background/90 shadow-sm backdrop-blur hover:bg-background"
            asChild
          >
            <Link href="/events">
              <ArrowLeft className="size-3.5" /> {t("back")}
            </Link>
          </Button>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div>
            <Reveal>
              <div className="mb-4 flex flex-wrap gap-2">
                {availability ? (
                  <EventStatusPill status={availability} />
                ) : null}
                {event.minAgeNote ? (
                  <Badge variant="destructive">{event.minAgeNote}</Badge>
                ) : null}
                {event.customTags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
              <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
                {event.name}
              </h1>
            </Reveal>

            {/* Info rows del prototipo */}
            <Reveal delay={80}>
              <div className="mt-7 flex max-w-xl flex-col gap-2.5">
                <InfoRow
                  icon={<CalendarBlank weight="duotone" />}
                  label={t("date")}
                  value={format.dateTime(starts, {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                />
                <InfoRow
                  icon={<Clock weight="duotone" />}
                  label={t("schedule")}
                  value={schedule}
                />
                {local ? (
                  <InfoRow
                    icon={<MapPin weight="duotone" />}
                    label={t("venue")}
                    // La dirección completa vive únicamente en "Dónde es".
                    value={local.name}
                  />
                ) : null}
                {event.dressCode ? (
                  <InfoRow
                    icon={<TShirt weight="duotone" />}
                    label={t("dressCode")}
                    value={event.dressCode}
                  />
                ) : null}
              </div>
            </Reveal>

            {event.description ? (
              <Reveal>
                <section className="mt-9">
                  <h2 className="mb-3 font-heading text-xl font-extrabold">
                    {t("description")}
                  </h2>
                  <p className="max-w-2xl whitespace-pre-line leading-relaxed text-muted-foreground">
                    {event.description}
                  </p>
                </section>
              </Reveal>
            ) : null}

            {/* Card del local, como en el prototipo */}
            {local ? (
              <Reveal>
                <section className="mt-9">
                  <h2 className="mb-4 font-heading text-xl font-extrabold">
                    {t("where")}
                  </h2>
                  <Card>
                    <CardContent className="flex flex-wrap items-center gap-5 p-5">
                      <div className="relative size-[104px] shrink-0 overflow-hidden rounded-md">
                        {local.mainImageUrl ? (
                          <StorageImage
                            src={local.mainImageUrl}
                            alt={local.name}
                            fill
                            sizes="104px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="rv-img-ph absolute inset-0">
                            <span>{t("venuePlaceholder")}</span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-heading text-lg font-extrabold">
                          {local.name}
                        </p>
                        {local.address ? (
                          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin
                              className="size-3.5 shrink-0"
                              weight="duotone"
                            />
                            <span className="line-clamp-1">
                              {local.address}
                            </span>
                          </p>
                        ) : null}
                      </div>
                      <Button variant="outline" asChild>
                        <Link href={`/locals/${local.slug}`}>
                          {t("viewVenue")}
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </section>
              </Reveal>
            ) : null}

            <Reveal>
              <section className="mt-9 pb-4">
                <h2 className="mb-4 font-heading text-xl font-extrabold">
                  {t("reviews")}
                </h2>
                <ReviewList reviews={reviews} />
              </section>
            </Reveal>
          </div>

          {/* Sidebar sticky del prototipo: guardar/reportar, precio desde, entradas */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <FavoriteButton targetType="event" targetId={event.id} />
                  <ReportDialog targetType="event" targetId={event.id} />
                </div>
                {priceFrom !== null ? (
                  <div className="mt-4 border-y py-4">
                    <p className="text-xs text-muted-foreground">
                      {t("priceFrom")}
                    </p>
                    <p className="flex items-baseline gap-2">
                      <span className="font-heading text-4xl font-extrabold">
                        {format.number(priceFrom, {
                          style: "currency",
                          currency: "PEN",
                          maximumFractionDigits: 0,
                        })}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {t("perPerson")}
                      </span>
                    </p>
                  </div>
                ) : null}
                <div className="mt-5">
                  <h2 className="mb-3 font-heading text-lg font-extrabold">
                    {t("tickets")}
                  </h2>
                  <TicketTypeList
                    ticketTypes={ticketTypes}
                    eventSlug={event.slug}
                    canBuy={canBuy}
                  />
                </div>
                {/* Reserva de mesa desde el evento (feedback). Demo hasta tener
                    backend; a futuro cada local/evento decidirá si la ofrece. */}
                <Button variant="secondary" className="mt-4 w-full" asChild>
                  <Link href="/reserva">{t("bookTable")}</Link>
                </Button>
                <div className="mt-2 text-center">
                  <Badge variant="info">{commonT("demo")}</Badge>
                </div>
                <div className="mt-4 flex items-start gap-2.5 rounded-md border border-success-border bg-success-soft px-3.5 py-3 text-xs leading-relaxed text-success">
                  <ShieldCheck
                    className="mt-0.5 size-4 shrink-0"
                    weight="duotone"
                  />
                  <span>{t("securePurchase")}</span>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
